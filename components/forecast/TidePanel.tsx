'use client'

import { useEffect, useRef, useState } from 'react'
import { formatTime } from '@/lib/utils/format'
import type { TideExtreme } from '@/lib/weather/worldtides'

interface Props {
  tides:    TideExtreme[]
  timezone: string
  date:     string           // YYYY-MM-DD — used to compute the day window
}

// ── Chart geometry ───────────────────────────────────────────────────────────

const W = 600
const H = 100
const PAD_TOP    = 10
const PAD_BOTTOM = 10
const CHART_H    = H - PAD_TOP - PAD_BOTTOM

// ── Cosine interpolation between adjacent tidal extremes ─────────────────────

function heightAt(extremes: TideExtreme[], tSec: number): number {
  const sorted = extremes
  if (sorted.length === 0) return 0

  // Before the first extreme — flat at first extreme's height
  if (tSec <= sorted[0].timestamp) return sorted[0].height
  // After the last extreme — flat at last extreme's height
  if (tSec >= sorted[sorted.length - 1].timestamp) return sorted[sorted.length - 1].height

  // Find bounding pair
  let prev = sorted[0]
  let next = sorted[1]
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].timestamp >= tSec) {
      prev = sorted[i - 1]
      next = sorted[i]
      break
    }
  }

  const span = next.timestamp - prev.timestamp
  const frac = span > 0 ? (tSec - prev.timestamp) / span : 0
  return (prev.height + next.height) / 2 + ((prev.height - next.height) / 2) * Math.cos(Math.PI * frac)
}

function buildPath(
  sorted:       TideExtreme[],
  dayStartSec:  number,
  dayEndSec:    number,
  minH:         number,
  maxH:         number,
): { linePath: string; fillPath: string } {
  const SAMPLES = 240
  const hRange  = maxH - minH

  const toX = (tSec: number) =>
    ((tSec - dayStartSec) / (dayEndSec - dayStartSec)) * W

  const toY = (h: number) =>
    PAD_TOP + CHART_H - ((h - minH) / hRange) * CHART_H

  const pts: string[] = []

  for (let i = 0; i <= SAMPLES; i++) {
    const tSec = dayStartSec + (i / SAMPLES) * (dayEndSec - dayStartSec)
    const h    = heightAt(sorted, tSec)
    const x    = toX(tSec)
    const y    = toY(h)
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`)
  }

  const linePath = pts.join(' ')
  const lastX    = W
  const fillPath = `${linePath} L${lastX} ${H} L0 ${H} Z`

  return { linePath, fillPath }
}

// ── Component ─────────────────────────────────────────────────────────────────

export function TidePanel({ tides, timezone, date }: Props) {
  const [nowFrac, setNowFrac] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Day window in UTC seconds (midnight to midnight of the forecast date)
  const dayStartSec = Date.UTC(
    Number(date.slice(0, 4)),
    Number(date.slice(5, 7)) - 1,
    Number(date.slice(8, 10)),
  ) / 1000
  const dayEndSec = dayStartSec + 86400

  useEffect(() => {
    const update = () => {
      const nowSec = Date.now() / 1000
      const frac   = (nowSec - dayStartSec) / (dayEndSec - dayStartSec)
      setNowFrac(frac >= 0 && frac <= 1 ? frac : null)
    }
    update()
    timerRef.current = setInterval(update, 60_000)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [dayStartSec, dayEndSec])

  if (tides.length < 2) return null

  const sorted  = [...tides].sort((a, b) => a.timestamp - b.timestamp)
  const heights = sorted.map(e => e.height)
  const minH    = Math.min(...heights) - 0.3
  const maxH    = Math.max(...heights) + 0.3

  const { linePath, fillPath } = buildPath(sorted, dayStartSec, dayEndSec, minH, maxH)

  const nowX = nowFrac != null ? nowFrac * W : null

  const hRange  = maxH - minH
  const toY = (h: number) => PAD_TOP + CHART_H - ((h - minH) / hRange) * CHART_H
  const toX = (tSec: number) =>
    ((tSec - dayStartSec) / (dayEndSec - dayStartSec)) * W

  return (
    <div>
      <div style={{
        fontSize:      '0.56rem',
        fontWeight:    700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase' as const,
        color:         'rgba(237,224,192,0.22)',
        marginBottom:  '14px',
      }}>
        Tides
      </div>

      {/* Chart */}
      <div style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          style={{ width: '100%', display: 'block', overflow: 'visible' }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="tideFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#F0B830" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#F0B830" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Hour grid lines: 6h, 12h, 18h */}
          {[0.25, 0.5, 0.75].map(f => (
            <line
              key={f}
              x1={f * W} y1={0} x2={f * W} y2={H}
              stroke="rgba(200,140,60,0.06)"
              strokeWidth="1"
            />
          ))}

          {/* Tide fill */}
          <path d={fillPath} fill="url(#tideFill)" />

          {/* Tide line */}
          <path
            d={linePath}
            fill="none"
            stroke="#F0B830"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.70"
          />

          {/* High/Low markers */}
          {sorted.map((e, i) => {
            const x = toX(e.timestamp)
            const y = toY(e.height)
            if (x < 0 || x > W) return null
            const isHigh = e.type === 'High'
            const color  = isHigh ? '#F0B830' : '#8890B8'
            return (
              <g key={i}>
                <circle cx={x} cy={y} r="3.5" fill={color} opacity="0.90" />
                <circle cx={x} cy={y} r="5.5" fill={color} opacity="0.14" />
              </g>
            )
          })}

          {/* Current time indicator */}
          {nowX != null && (
            <g>
              <line
                x1={nowX} y1={0} x2={nowX} y2={H}
                stroke="rgba(237,224,192,0.28)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle cx={nowX} cy={heightAt(sorted, Date.now() / 1000) > 0 ? toY(heightAt(sorted, Date.now() / 1000)) : H / 2} r="3" fill="rgba(237,224,192,0.55)" />
            </g>
          )}
        </svg>
      </div>

      {/* X-axis labels */}
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        marginTop:      '5px',
        padding:        '0 2px',
        fontSize:       '0.54rem',
        color:          'rgba(237,224,192,0.18)',
        fontFamily:     'var(--font-mono, ui-monospace, monospace)',
        letterSpacing:  '0.04em',
      }}>
        {['00:00', '06:00', '12:00', '18:00', '24:00'].map(t => (
          <span key={t}>{t}</span>
        ))}
      </div>

      {/* Extreme tiles */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: `repeat(${Math.min(sorted.length, 4)}, 1fr)`,
        gap:                 '8px',
        marginTop:           '14px',
      }}>
        {sorted.slice(0, 4).map((e, i) => {
          const isHigh = e.type === 'High'
          const color  = isHigh ? '#F0B830' : '#8890B8'
          return (
            <div key={i} style={{
              padding:      '10px 12px',
              background:   `${color}08`,
              border:       `1px solid ${color}18`,
              borderRadius: '8px',
            }}>
              <div style={{
                fontSize:      '0.52rem',
                fontWeight:    700,
                letterSpacing: '0.12em',
                textTransform: 'uppercase' as const,
                color:         `${color}80`,
                marginBottom:  '5px',
              }}>
                {isHigh ? 'High' : 'Low'}
              </div>
              <div style={{
                fontSize:   '0.84rem',
                fontWeight: 600,
                fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                color:      `${color}CC`,
                lineHeight: 1.1,
              }}>
                {formatTime(new Date(e.timestamp * 1000).toISOString(), timezone)}
              </div>
              <div style={{
                fontSize:   '0.70rem',
                fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                color:      'rgba(237,224,192,0.30)',
                marginTop:  '3px',
              }}>
                {e.height.toFixed(1)} m
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

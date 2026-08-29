'use client'

import { useState, useEffect } from 'react'
import type { SunsetForecast, SunsetQuality } from '@/types'

const Q_COLOR: Record<SunsetQuality, string> = {
  excellent: '#F5A828',
  great:     '#E07540',
  good:      '#5FAA88',
  fair:      '#7A8DB8',
  poor:      '#6A7888',
}

// Catmull-Rom → cubic bezier.
// t = 0.38 is the smoothness sweet-spot: curves flow without harsh kinks.
function smoothPath(pts: Array<{ x: number; y: number }>): string {
  if (pts.length < 2) return ''
  const t = 0.38
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const cp1x = p1.x + (p2.x - p0.x) * t
    const cp1y = p1.y + (p2.y - p0.y) * t
    const cp2x = p2.x - (p3.x - p1.x) * t
    const cp2y = p2.y - (p3.y - p1.y) * t
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

function fillPath(linePath: string, W: number, H: number, PX: number): string {
  return `${linePath} L ${W - PX} ${H} L ${PX} ${H} Z`
}

function dayLabel(ds: string): string {
  const [y, m, d] = ds.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'short' })
}

interface Props {
  forecasts: SunsetForecast[]
}

export function WeekScoreChart({ forecasts }: Props) {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 720)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Mobile: today + tomorrow only; desktop: full week
  const data = forecasts.slice(0, isMobile ? 2 : forecasts.length)
  if (data.length === 0) return null

  const n = data.length

  // ── Responsive canvas dimensions ──────────────────────────────────────────
  // Mobile viewBox 400×240 renders at ~390×234px on a 390px screen — legible.
  // Desktop viewBox 1000×140 is the original compact strip behind the panels.
  const W   = isMobile ? 400  : 1000
  const H   = isMobile ? 240  : 140
  const PX  = isMobile ? 40   : 110    // inner x padding
  const yHi = isMobile ? 54   : 26     // top of score range (y-coord)
  const yLo = isMobile ? 166  : 96     // bottom of score range (y-coord)

  // Font & node sizes — all in SVG units so they scale with the viewBox
  const labelFontSize  = isMobile ? 16   : 10.5
  const scoreFsToday   = isMobile ? 30   : 17
  const scoreFsOther   = isMobile ? 21   : 12.5
  const rTodayBloom    = isMobile ? 26   : 18
  const rTodayHalo     = isMobile ? 14   : 10
  const rTodayDisc     = isMobile ? 9    : 6.5
  const rTodayCap      = isMobile ? 3.2  : 2.4
  const rOtherBloom    = isMobile ? 16   : 11
  const rOtherHalo     = isMobile ? 9    : 6
  const rOtherDisc     = isMobile ? 5.5  : 4
  const rOtherCap      = isMobile ? 2    : 1.4
  const strokeW        = isMobile ? 2.4  : 1.8

  // Dynamic y range: zoom into the actual score band so variation is always visible
  const rawScores = data.map(f => f.score ?? 50)
  const dataMin   = Math.max(0,   Math.min(...rawScores) - 15)
  const dataMax   = Math.min(100, Math.max(...rawScores) + 15)

  const pts = data.map((f, i) => {
    const score = f.score ?? (dataMin + dataMax) / 2
    const yFrac = (score - dataMin) / (dataMax - dataMin)
    return {
      x:       n === 1 ? W / 2 : PX + (i / (n - 1)) * (W - PX * 2),
      y:       yLo - yFrac * (yLo - yHi),
      score:   f.score,
      quality: f.quality,
      date:    f.forecastDate,
      today:   i === 0,
    }
  })

  const linePath = smoothPath(pts)
  const areaPath = n > 1 ? fillPath(linePath, W, H, PX) : ''
  const gradId   = 'chart-area-fill'

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`${n}-day sunset score chart`}
      style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.10)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.00)" />
        </linearGradient>
        <filter id="dot-glow" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation={isMobile ? 5 : 4} result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Soft fill under the spline */}
      {n > 1 && (
        <path d={areaPath} fill={`url(#${gradId})`} opacity="0.55" />
      )}

      {/* Day labels */}
      {pts.map((p, i) => (
        <text
          key={`dl-${i}`}
          x={p.x}
          y={labelFontSize + 2}
          textAnchor="middle"
          fontSize={labelFontSize}
          fontWeight={p.today ? '600' : '400'}
          letterSpacing="0.09em"
          fill={p.today ? 'rgba(232,226,212,0.88)' : 'rgba(232,226,212,0.35)'}
          style={{ textTransform: 'uppercase', fontFamily: 'var(--font-sans, system-ui, sans-serif)' }}
        >
          {dayLabel(p.date)}
        </text>
      ))}

      {/* Spline — drawn in with CSS animation */}
      {n > 1 && (
        <path
          d={linePath}
          fill="none"
          stroke="rgba(255,255,255,0.65)"
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset="1"
          className="score-chart-line"
        />
      )}

      {/* Nodes */}
      {pts.map((p, i) => {
        const col = p.quality ? Q_COLOR[p.quality] : 'rgba(255,255,255,0.5)'
        const bloom = p.today ? rTodayBloom : rOtherBloom
        const halo  = p.today ? rTodayHalo  : rOtherHalo
        const disc  = p.today ? rTodayDisc  : rOtherDisc
        const cap   = p.today ? rTodayCap   : rOtherCap
        const capOff = p.today ? disc * 0.28 : disc * 0.30
        return (
          <g
            key={`dot-${i}`}
            filter="url(#dot-glow)"
            style={{
              opacity:   0,
              animation: `score-dot-in 0.3s ease-out ${0.5 + i * 0.08}s forwards`,
            }}
          >
            <circle cx={p.x} cy={p.y} r={bloom} fill={col} opacity="0.12" />
            <circle cx={p.x} cy={p.y} r={halo}  fill={col} opacity="0.22" />
            <circle cx={p.x} cy={p.y} r={disc}  fill={col} opacity={p.today ? 1 : 0.82} />
            <circle cx={p.x - capOff} cy={p.y - capOff} r={cap} fill="rgba(255,255,255,0.50)" />
          </g>
        )
      })}

      {/* Score numerals */}
      {pts.map((p, i) => {
        const col = p.quality ? Q_COLOR[p.quality] : 'rgba(232,226,212,0.28)'
        return (
          <text
            key={`sv-${i}`}
            x={p.x}
            y={H - (isMobile ? 8 : 4)}
            textAnchor="middle"
            fontSize={p.today ? scoreFsToday : scoreFsOther}
            fontWeight={p.today ? '700' : '400'}
            letterSpacing="-0.03em"
            fill={p.today ? col : 'rgba(232,226,212,0.40)'}
            style={{
              fontFamily:         'var(--font-sans, system-ui, sans-serif)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {p.score ?? '—'}
          </text>
        )
      })}
    </svg>
  )
}

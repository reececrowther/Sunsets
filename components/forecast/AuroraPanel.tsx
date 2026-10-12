'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@/lib/database/client'
import { formatTime } from '@/lib/utils/format'
import type { AuroraForecast, AuroraQuality } from '@/types'

// ─── Constants ────────────────────────────────────────────────────────────────

const QUALITY_COLOR: Record<AuroraQuality, string> = {
  high_activity: '#F0B830',
  moderate:      '#5FAA88',
  low:           '#8890B8',
  marginal:      '#504840',
  unlikely:      '#3A2418',
}

const QUALITY_LABEL: Record<AuroraQuality, string> = {
  high_activity: 'High activity',
  moderate:      'Possible tonight',
  low:           'Slight chance',
  marginal:      'Marginal',
  unlikely:      'Unlikely',
}

const QUALITY_COPY: Record<AuroraQuality, string> = {
  high_activity: 'Strong geomagnetic storm — high chance of a visible display.',
  moderate:      'Elevated activity — aurora may be visible from dark locations.',
  low:           'Low activity — worth keeping an eye on if skies are clear.',
  marginal:      'Borderline conditions — only visible under ideal circumstances.',
  unlikely:      'Geomagnetic activity too low to produce a visible display tonight.',
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  locationId: string
  timezone:   string
  latitude:   number
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AuroraPanel({ locationId, timezone, latitude }: Props) {
  const [forecast, setForecast] = useState<AuroraForecast | null | undefined>(undefined)

  useEffect(() => {
    const supabase = createBrowserClient()
    const today    = new Date().toISOString().slice(0, 10)
    supabase
      .from('aurora_forecasts')
      .select('*')
      .eq('location_id', locationId)
      .eq('forecast_date', today)
      .single()
      .then(({ data }) => setForecast(data ? mapRow(data) : null))
  }, [locationId])

  if (forecast === undefined) return null  // loading — render nothing rather than skeleton

  if (forecast === null) {
    return (
      <p style={{ margin: 0, fontSize: '0.80rem', color: 'rgba(237,224,192,0.28)', fontStyle: 'italic' }}>
        Aurora forecast not yet available — check back after the next refresh.
      </p>
    )
  }

  const color       = QUALITY_COLOR[forecast.quality]
  const label       = QUALITY_LABEL[forecast.quality]
  const copy        = QUALITY_COPY[forecast.quality]
  const cloudPct    = Math.round(forecast.cloudPenalty * 100)
  const isUnlikely  = forecast.quality === 'unlikely'
  const belowThresh = forecast.kpPeak < forecast.minKpNeeded

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Score row ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>

        {/* Kp + quality */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <span style={{
              fontFamily:    'var(--font-mono, ui-monospace, monospace)',
              fontSize:      'clamp(2.4rem, 5vw, 3.2rem)',
              fontWeight:    700,
              color,
              lineHeight:    0.88,
              letterSpacing: '-0.03em',
              opacity:       isUnlikely ? 0.40 : 1,
            }}>
              {forecast.kpPeak.toFixed(1)}
            </span>
            <span style={{
              fontSize:      '0.62rem',
              fontWeight:    700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              color:         'rgba(237,224,192,0.28)',
            }}>
              Kp
            </span>
          </div>

          {/* Quality badge */}
          <span style={{
            display:       'inline-flex',
            alignItems:    'center',
            alignSelf:     'flex-start',
            padding:       '3px 10px',
            borderRadius:  '20px',
            background:    `${color}18`,
            border:        `1px solid ${color}38`,
            fontSize:      '0.62rem',
            fontWeight:    700,
            letterSpacing: '0.09em',
            textTransform: 'uppercase' as const,
            color,
          }}>
            {label}
          </span>
        </div>

        {/* Score ring / bar */}
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize:      '0.56rem',
            fontWeight:    700,
            letterSpacing: '0.13em',
            textTransform: 'uppercase' as const,
            color:         'rgba(237,224,192,0.22)',
            marginBottom:  '6px',
          }}>
            Likelihood
          </div>
          <div style={{
            fontSize:      'clamp(1.8rem, 3.5vw, 2.4rem)',
            fontFamily:    'var(--font-display, Georgia, serif)',
            fontStyle:     'italic',
            fontWeight:    700,
            color,
            lineHeight:    0.9,
            opacity:       isUnlikely ? 0.35 : 1,
          }}>
            {forecast.auroraScore}
          </div>
          <div style={{ fontSize: '0.60rem', color: 'rgba(237,224,192,0.20)', marginTop: '2px' }}>
            / 100
          </div>
        </div>
      </div>

      {/* ── Score bar ── */}
      <div style={{
        height:       '4px',
        background:   'rgba(200,140,60,0.07)',
        borderRadius: '3px',
        overflow:     'hidden',
      }}>
        <div style={{
          height:          '100%',
          background:      color,
          borderRadius:    '3px',
          transformOrigin: 'left',
          transform:       `scaleX(${forecast.auroraScore / 100})`,
          transition:      'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          opacity:         isUnlikely ? 0.30 : 0.75,
        }} />
      </div>

      {/* ── Description ── */}
      <p style={{ margin: 0, fontSize: '0.80rem', color: 'rgba(237,224,192,0.50)', lineHeight: 1.60 }}>
        {copy}
      </p>

      {/* ── Threshold note (when below latitude minimum) ── */}
      {belowThresh && (
        <div style={{
          padding:      '12px 14px',
          background:   'rgba(88,80,64,0.15)',
          border:       '1px solid rgba(200,140,60,0.08)',
          borderRadius: '8px',
          fontSize:     '0.74rem',
          color:        'rgba(237,224,192,0.35)',
          lineHeight:   1.55,
        }}>
          This location needs <span style={{ color: 'rgba(237,224,192,0.55)', fontWeight: 600 }}>
            Kp {forecast.minKpNeeded}+
          </span> for a visible aurora.{' '}
          Tonight's peak is <span style={{ fontFamily: 'var(--font-mono)', color: 'rgba(237,224,192,0.55)' }}>
            Kp {forecast.kpPeak.toFixed(1)}
          </span>.
          {latitude < 54 && ' Scotland has a much lower threshold — worth the trip during high-activity events.'}
        </div>
      )}

      {/* ── Conditions grid ── */}
      <div style={{
        display:             'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
        gap:                 '12px',
      }}>
        <Stat label="Cloud cover" value={`${cloudPct}%`} note={cloudPct > 70 ? 'Likely obscured' : cloudPct > 40 ? 'Partially obscured' : 'Clear skies'} warn={cloudPct > 70} />
        <Stat label="Min. Kp needed" value={`Kp ${forecast.minKpNeeded}`} note={`For ${Math.round(latitude)}°N`} />
        {forecast.darkStart && (
          <Stat
            label="Dark from"
            value={formatTime(forecast.darkStart, timezone)}
            note="Nautical dusk"
          />
        )}
        {forecast.darkEnd && (
          <Stat
            label="Dark until"
            value={formatTime(forecast.darkEnd, timezone)}
            note="Nautical dawn"
          />
        )}
      </div>

      {/* ── NOAA credit ── */}
      <p style={{ margin: 0, fontSize: '0.64rem', color: 'rgba(237,224,192,0.14)' }}>
        Geomagnetic data: NOAA Space Weather Prediction Centre
      </p>
    </div>
  )
}

// ─── Stat cell ────────────────────────────────────────────────────────────────

function Stat({ label, value, note, warn }: { label: string; value: string; note?: string; warn?: boolean }) {
  return (
    <div style={{
      padding:      '12px 14px',
      background:   'rgba(200,140,60,0.04)',
      border:       `1px solid ${warn ? 'rgba(136,144,184,0.18)' : 'rgba(200,140,60,0.07)'}`,
      borderRadius: '8px',
    }}>
      <div style={{
        fontSize:      '0.56rem',
        fontWeight:    700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase' as const,
        color:         'rgba(237,224,192,0.22)',
        marginBottom:  '5px',
      }}>
        {label}
      </div>
      <div style={{
        fontSize:   '0.88rem',
        fontWeight: 600,
        fontFamily: 'var(--font-mono, ui-monospace, monospace)',
        color:      warn ? '#8890B8' : 'rgba(237,224,192,0.65)',
        lineHeight: 1.1,
      }}>
        {value}
      </div>
      {note && (
        <div style={{ fontSize: '0.64rem', color: 'rgba(237,224,192,0.25)', marginTop: '3px' }}>
          {note}
        </div>
      )}
    </div>
  )
}

// ─── Row mapper ───────────────────────────────────────────────────────────────

function mapRow(row: Record<string, unknown>): AuroraForecast {
  return {
    id:           row.id as string,
    locationId:   row.location_id as string,
    forecastDate: row.forecast_date as string,
    kpPeak:       Number(row.kp_peak),
    auroraScore:  row.aurora_score as number,
    quality:      row.quality as AuroraQuality,
    cloudPenalty: Number(row.cloud_penalty),
    minKpNeeded:  Number(row.min_kp_needed),
    darkStart:    row.dark_start as string | null,
    darkEnd:      row.dark_end as string | null,
    createdAt:    row.created_at as string,
    updatedAt:    row.updated_at as string,
  }
}

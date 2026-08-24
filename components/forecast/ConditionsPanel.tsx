import type { SunsetForecast } from '@/types'
import { formatVisibility } from '@/lib/utils/format'

interface ConditionRow {
  label: string
  value: string
  barPct: number
  quality: 'good' | 'neutral' | 'bad'
  note: string
}

function highCloudNote(pct: number | null): { note: string; quality: 'good' | 'neutral' | 'bad' } {
  if (pct == null) return { note: '—', quality: 'neutral' }
  if (pct >= 35 && pct <= 70) return { note: 'Ideal for catching colour', quality: 'good' }
  if (pct > 70)               return { note: 'Getting thick — may reduce colour', quality: 'neutral' }
  if (pct < 8)                return { note: 'Clear sky — colours may be muted', quality: 'neutral' }
  return { note: 'Some high cloud present', quality: 'neutral' }
}

function lowCloudNote(pct: number | null): { note: string; quality: 'good' | 'neutral' | 'bad' } {
  if (pct == null) return { note: '—', quality: 'neutral' }
  if (pct <= 8)   return { note: 'Clear horizon', quality: 'good' }
  if (pct <= 25)  return { note: 'Mostly clear', quality: 'good' }
  if (pct <= 50)  return { note: 'Some patches near the horizon', quality: 'neutral' }
  if (pct <= 75)  return { note: 'Likely to obstruct the view', quality: 'bad' }
  return { note: 'Will block the horizon', quality: 'bad' }
}

function rainNote(pct: number | null): { note: string; quality: 'good' | 'neutral' | 'bad' } {
  if (pct == null) return { note: '—', quality: 'neutral' }
  if (pct <= 8)  return { note: 'Minimal risk', quality: 'good' }
  if (pct <= 25) return { note: 'Low chance', quality: 'good' }
  if (pct <= 50) return { note: 'Some risk — check before heading out', quality: 'neutral' }
  return { note: 'Significant chance of rain', quality: 'bad' }
}

function visibilityNote(m: number | null): { note: string; quality: 'good' | 'neutral' | 'bad' } {
  if (m == null)   return { note: '—', quality: 'neutral' }
  if (m >= 20000)  return { note: 'Excellent', quality: 'good' }
  if (m >= 10000)  return { note: 'Good', quality: 'good' }
  if (m >= 5000)   return { note: 'Moderate', quality: 'neutral' }
  if (m >= 2000)   return { note: 'Reduced — haze likely', quality: 'bad' }
  return { note: 'Poor — fog or heavy haze', quality: 'bad' }
}

const BAR_COLORS = {
  good:    '#5FAA88',
  neutral: '#7A8DB8',
  bad:     '#C44848',
}

interface Props {
  forecast: SunsetForecast
}

export function ConditionsPanel({ forecast }: Props) {
  const highCloud = highCloudNote(forecast.cloudHigh)
  const lowCloud  = lowCloudNote(forecast.cloudLow)
  const rain      = rainNote(forecast.rainProbability)
  const vis       = visibilityNote(forecast.visibility)

  const rows: ConditionRow[] = [
    {
      label:   'High cloud',
      value:   forecast.cloudHigh != null ? `${Math.round(forecast.cloudHigh)}%` : '—',
      barPct:  forecast.cloudHigh ?? 0,
      quality: highCloud.quality,
      note:    highCloud.note,
    },
    {
      label:   'Low cloud',
      value:   forecast.cloudLow != null ? `${Math.round(forecast.cloudLow)}%` : '—',
      barPct:  forecast.cloudLow ?? 0,
      quality: lowCloud.quality,
      note:    lowCloud.note,
    },
    {
      label:   'Rain chance',
      value:   forecast.rainProbability != null ? `${Math.round(forecast.rainProbability)}%` : '—',
      barPct:  forecast.rainProbability ?? 0,
      quality: rain.quality,
      note:    rain.note,
    },
    {
      label:   'Visibility',
      value:   forecast.visibility != null ? formatVisibility(forecast.visibility) : '—',
      barPct:  Math.min((forecast.visibility ?? 0) / 250, 100),
      quality: vis.quality,
      note:    vis.note,
    },
    ...(forecast.humidity != null ? [{
      label:   'Humidity',
      value:   `${Math.round(forecast.humidity)}%`,
      barPct:  forecast.humidity,
      quality: (forecast.humidity >= 40 && forecast.humidity <= 65 ? 'good' : 'neutral') as 'good' | 'neutral' | 'bad',
      note:    forecast.humidity >= 40 && forecast.humidity <= 65
                 ? 'Ideal range for colour scattering'
                 : forecast.humidity > 80
                   ? 'High humidity may create haze'
                   : 'Within acceptable range',
    }] : []),
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {rows.map((row, i) => (
        <div
          key={row.label}
          style={{
            padding: '16px 0',
            borderBottom: i < rows.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '7px',
          }}>
            {/* Label */}
            <span style={{
              fontSize: '0.82rem',
              color: '#8A96B4',
              width: '90px',
              flexShrink: 0,
            }}>
              {row.label}
            </span>

            {/* Bar track */}
            <div style={{
              flex: 1,
              height: '4px',
              background: 'rgba(255,255,255,0.06)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${row.barPct}%`,
                background: BAR_COLORS[row.quality],
                borderRadius: '2px',
                transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
              }} />
            </div>

            {/* Value */}
            <span style={{
              fontSize: '0.85rem',
              fontWeight: 600,
              color: BAR_COLORS[row.quality],
              fontFamily: 'var(--font-mono, ui-monospace, monospace)',
              width: '52px',
              textAlign: 'right',
              flexShrink: 0,
            }}>
              {row.value}
            </span>
          </div>

          {/* Context note */}
          <div style={{
            paddingLeft: '102px',
            fontSize: '0.72rem',
            color: '#3D4E6A',
            lineHeight: 1.4,
          }}>
            {row.note}
          </div>
        </div>
      ))}
    </div>
  )
}

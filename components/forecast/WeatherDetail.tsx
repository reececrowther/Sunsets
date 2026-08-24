import type { SunsetForecast } from '@/types'
import { formatVisibility } from '@/lib/utils/format'

interface Props {
  forecast: SunsetForecast
}

export function WeatherDetail({ forecast }: Props) {
  const items = [
    { label: 'High cloud',  value: pct(forecast.cloudHigh),  note: 'Ideal 35–65%' },
    { label: 'Mid cloud',   value: pct(forecast.cloudMid),   note: 'Ideal 20–50%' },
    { label: 'Low cloud',   value: pct(forecast.cloudLow),   note: 'Ideal below 15%' },
    { label: 'Rain chance', value: pct(forecast.rainProbability), note: '' },
    { label: 'Visibility',  value: forecast.visibility != null ? formatVisibility(forecast.visibility) : '—', note: '' },
    { label: 'Humidity',    value: pct(forecast.humidity),   note: 'Ideal 40–65%' },
  ]

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
      gap: '8px',
    }}>
      {items.map(item => (
        <div key={item.label} style={{
          background: '#111D38',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '10px',
          padding: '14px 16px',
        }}>
          <div style={{
            fontSize: '0.65rem',
            color: '#4A5872',
            textTransform: 'uppercase',
            letterSpacing: '0.09em',
            marginBottom: '6px',
          }}>
            {item.label}
          </div>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#E8E4DC',
            fontFamily: 'var(--font-mono, ui-monospace, monospace)',
            lineHeight: 1,
          }}>
            {item.value}
          </div>
          {item.note && (
            <div style={{ fontSize: '0.6rem', color: '#3D4E6A', marginTop: '5px' }}>
              {item.note}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function pct(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${Math.round(value)}%`
}

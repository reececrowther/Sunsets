import type { SunsetForecast } from '@/types'
import { formatTime } from '@/lib/utils/format'

interface Props {
  forecast: SunsetForecast
  timezone: string
}

function isEveningTime(isoTime: string | null, sunsetIso: string | null): boolean {
  if (!isoTime || !sunsetIso) return false
  const t = new Date(isoTime).getTime()
  const s = new Date(sunsetIso).getTime()
  // Only include times within 4 hours before sunset, or after sunset
  return t >= s - 4 * 60 * 60 * 1000
}

export function ViewingWindow({ forecast, timezone }: Props) {
  const goldenStart = isEveningTime(forecast.goldenHourStart, forecast.sunsetTime)
    ? forecast.goldenHourStart
    : null

  const events = [
    {
      key: 'golden',
      label: 'Golden hour begins',
      sublabel: 'Warm, soft light — ideal for photography',
      time: goldenStart,
      dotColor: '#E07540',
      lineColor: '#E07540',
    },
    {
      key: 'sunset',
      label: 'Sunset',
      sublabel: 'Sun crosses the horizon',
      time: forecast.sunsetTime,
      dotColor: '#F5A828',
      lineColor: '#F5A828',
      featured: true,
    },
    {
      key: 'blue',
      label: 'Blue hour',
      sublabel: 'Sky turns deep blue — last 20–30 minutes of colour',
      time: forecast.blueHourEnd,
      dotColor: '#7A8DB8',
      lineColor: '#7A8DB8',
    },
  ]

  const visible = events.filter(e => e.time != null)
  if (visible.length === 0) return null

  return (
    <div style={{ position: 'relative', paddingLeft: '28px' }}>
      {/* Vertical timeline spine */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        left: '8px',
        top: '10px',
        bottom: '10px',
        width: '1px',
        background: 'linear-gradient(to bottom, rgba(224,117,64,0.4), rgba(122,141,184,0.2))',
      }} />

      {visible.map((event, i) => (
        <div
          key={event.key}
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '16px',
            paddingBottom: i < visible.length - 1 ? '24px' : '0',
            position: 'relative',
          }}
        >
          {/* Timeline dot */}
          <div aria-hidden="true" style={{
            position: 'absolute',
            left: '-23px',
            top: event.featured ? '3px' : '4px',
            width: event.featured ? '14px' : '10px',
            height: event.featured ? '14px' : '10px',
            borderRadius: '50%',
            background: event.dotColor,
            boxShadow: event.featured ? `0 0 10px ${event.dotColor}70` : 'none',
            transform: event.featured ? 'translateX(-2px)' : 'none',
            flexShrink: 0,
          }} />

          {/* Time */}
          <div style={{
            fontFamily: 'var(--font-mono, ui-monospace, monospace)',
            fontSize: event.featured ? '1.25rem' : '1rem',
            fontWeight: event.featured ? 700 : 500,
            color: event.dotColor,
            lineHeight: 1,
            minWidth: '60px',
            paddingTop: event.featured ? '0' : '1px',
          }}>
            {event.time ? formatTime(event.time, timezone) : '—'}
          </div>

          {/* Label + sublabel */}
          <div>
            <div style={{
              fontSize: event.featured ? '0.95rem' : '0.85rem',
              fontWeight: event.featured ? 600 : 400,
              color: event.featured ? '#E8E2D4' : '#8A96B4',
              lineHeight: 1.2,
              marginBottom: '3px',
            }}>
              {event.label}
            </div>
            <div style={{
              fontSize: '0.72rem',
              color: '#3D4E6A',
              lineHeight: 1.4,
            }}>
              {event.sublabel}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

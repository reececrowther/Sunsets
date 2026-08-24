import type { SunsetForecast, SunsetQuality } from '@/types'
import { formatTime, formatStripDate } from '@/lib/utils/format'

const Q_COLORS: Record<SunsetQuality, string> = {
  excellent: '#F5A828',
  great:     '#E07540',
  good:      '#5FAA88',
  fair:      '#7A8DB8',
  poor:      '#4A5872',
}

function scoreColor(score: number): string {
  if (score >= 80) return '#F5A828'
  if (score >= 60) return '#E07540'
  if (score >= 40) return '#5FAA88'
  return '#7A8DB8'
}

interface Props {
  forecasts: SunsetForecast[]
  timezone: string
  todayDate: string
}

export function ForecastStrip({ forecasts, timezone, todayDate }: Props) {
  return (
    <div className="scrollbar-hide" style={{ overflowX: 'auto', marginLeft: '-4px', marginRight: '-4px' }}>
      <div style={{ display: 'flex', gap: '8px', minWidth: 'max-content', padding: '4px 4px 8px' }}>
        {forecasts.map((f, i) => {
          const score = f.score ?? 0
          const color = f.quality ? Q_COLORS[f.quality] : scoreColor(score)
          const isToday = f.forecastDate === todayDate

          return (
            <div
              key={f.id}
              style={{
                width: isToday ? '96px' : '82px',
                padding: isToday ? '14px 10px 12px' : '12px 8px 10px',
                textAlign: 'center',
                background: isToday ? 'rgba(224,117,64,0.09)' : '#0e1424',
                border: isToday
                  ? '1px solid rgba(224,117,64,0.32)'
                  : '1px solid rgba(255,255,255,0.05)',
                borderRadius: '12px',
                flexShrink: 0,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              {/* Top ambient glow for high scores */}
              {score >= 75 && (
                <div aria-hidden="true" style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '60px',
                  height: '30px',
                  borderRadius: '50%',
                  background: `radial-gradient(ellipse, ${color}30, transparent)`,
                  pointerEvents: 'none',
                }} />
              )}

              {/* Day label */}
              <div style={{
                fontSize: '0.64rem',
                fontWeight: isToday ? 700 : 400,
                color: isToday ? '#E07540' : '#3D4E6A',
                marginBottom: '9px',
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
              }}>
                {i === 0 ? 'Today' : formatStripDate(f.forecastDate, timezone)}
              </div>

              {/* Score */}
              <div style={{
                fontSize: isToday ? '1.7rem' : '1.45rem',
                fontWeight: 800,
                color,
                fontFamily: 'var(--font-sans, system-ui, sans-serif)',
                lineHeight: 1,
                marginBottom: '5px',
                letterSpacing: '-0.03em',
              }}>
                {score > 0 ? score : '—'}
              </div>

              {/* Quality */}
              {f.quality && (
                <div style={{
                  fontSize: '0.58rem',
                  fontWeight: 700,
                  color,
                  opacity: 0.75,
                  letterSpacing: '0.06em',
                  textTransform: 'capitalize',
                  marginBottom: '6px',
                }}>
                  {f.quality}
                </div>
              )}

              {/* Sunset time */}
              {f.sunsetTime && (
                <div style={{ fontSize: '0.6rem', color: '#3D4E6A' }}>
                  {formatTime(f.sunsetTime, timezone)}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

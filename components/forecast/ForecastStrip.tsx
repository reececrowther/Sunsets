import type { SunsetForecast, SunsetQuality } from '@/types'
import { formatTime, formatStripDate } from '@/lib/utils/format'

const Q_COLORS: Record<SunsetQuality, string> = {
  excellent: '#F0B830',
  great:     '#C8701A',
  good:      '#5FAA88',
  fair:      '#8890B8',
  poor:      '#504840',
}

function scoreColor(score: number): string {
  if (score >= 80) return '#F0B830'
  if (score >= 60) return '#C8701A'
  if (score >= 40) return '#5FAA88'
  return '#8890B8'
}

// Turner sky thumbnail gradients per quality — mirrors LocationCard
const SKY_STRIP: Record<SunsetQuality, string> = {
  excellent: 'linear-gradient(160deg, #1A0808 0%, #5C1010 35%, #A83010 65%, #D06018 100%)',
  great:     'linear-gradient(160deg, #140808 0%, #3C1010 35%, #7A2810 65%, #AA4818 100%)',
  good:      'linear-gradient(160deg, #080E0C 0%, #163A26 60%, #3E7848 100%)',
  fair:      'linear-gradient(160deg, #080A10 0%, #181C30 60%, #2A3450 100%)',
  poor:      'linear-gradient(160deg, #080608 0%, #120E10 60%, #181618 100%)',
}

interface Props {
  forecasts: SunsetForecast[]
  timezone:  string
  todayDate: string
}

export function ForecastStrip({ forecasts, timezone, todayDate }: Props) {
  return (
    <div className="scrollbar-hide" style={{ overflowX: 'auto', marginLeft: '-4px', marginRight: '-4px' }}>
      <div style={{ display: 'flex', gap: '8px', minWidth: 'max-content', padding: '4px 4px 8px' }}>
        {forecasts.map((f, i) => {
          const score   = f.score ?? 0
          const color   = f.quality ? Q_COLORS[f.quality] : scoreColor(score)
          const isToday = f.forecastDate === todayDate
          const skyBg   = f.quality ? SKY_STRIP[f.quality] : 'linear-gradient(160deg, #0C0808 0%, #120A08 100%)'

          return (
            <div
              key={f.id}
              style={{
                width:        isToday ? '96px' : '82px',
                borderRadius: '12px',
                flexShrink:   0,
                position:     'relative',
                overflow:     'hidden',
                border:       isToday
                  ? '1px solid rgba(200,112,26,0.32)'
                  : '1px solid rgba(200,140,60,0.08)',
              }}
            >
              {/* Sky thumbnail top */}
              <div style={{
                height:     '28px',
                background: skyBg,
                position:   'relative',
              }}>
                <div style={{
                  position:   'absolute',
                  inset:      0,
                  background: 'linear-gradient(to bottom, transparent 30%, #18100A 100%)',
                }} />
              </div>

              {/* Card content */}
              <div style={{
                padding:    isToday ? '10px 10px 12px' : '8px 8px 10px',
                textAlign:  'center',
                background: isToday ? 'rgba(200,112,26,0.07)' : '#18100A',
              }}>
                {/* Day label */}
                <div style={{
                  fontSize:        '0.64rem',
                  fontWeight:      isToday ? 700 : 400,
                  color:           isToday ? '#C8701A' : '#5A4030',
                  marginBottom:    '7px',
                  letterSpacing:   '0.05em',
                  textTransform:   'uppercase',
                }}>
                  {i === 0 ? 'Today' : formatStripDate(f.forecastDate, timezone)}
                </div>

                {/* Score */}
                <div style={{
                  fontSize:      isToday ? '1.65rem' : '1.4rem',
                  fontFamily:    'var(--font-display, Georgia, serif)',
                  fontStyle:     'italic',
                  fontWeight:    700,
                  color,
                  lineHeight:    1,
                  marginBottom:  '4px',
                  letterSpacing: '-0.03em',
                }}>
                  {score > 0 ? score : '—'}
                </div>

                {/* Quality */}
                {f.quality && (
                  <div style={{
                    fontSize:      '0.56rem',
                    fontWeight:    600,
                    color,
                    opacity:       0.7,
                    letterSpacing: '0.08em',
                    textTransform: 'capitalize',
                    marginBottom:  '5px',
                  }}>
                    {f.quality}
                  </div>
                )}

                {/* Sunset time */}
                {f.sunsetTime && (
                  <div style={{
                    fontSize:   '0.6rem',
                    color:      '#5A4030',
                    fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                  }}>
                    {formatTime(f.sunsetTime, timezone)}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

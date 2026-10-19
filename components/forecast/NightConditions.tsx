import { TidePanel } from './TidePanel'
import { formatTime } from '@/lib/utils/format'
import { moonLitPath } from '@/lib/astronomy/moon'
import type { MoonData } from '@/lib/astronomy/moon'
import type { SunsetForecast } from '@/types'
import type { TideExtreme } from '@/lib/weather/worldtides'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  moon:     MoonData
  forecast: SunsetForecast
  tides:    TideExtreme[] | null
  timezone: string
  date:     string       // YYYY-MM-DD
}

// ─── Fog / visibility helpers ─────────────────────────────────────────────────

function fogRisk(
  visibilityM: number | null,
  humidity:    number | null,
  temp:        number | null,
): { label: string; color: string } {
  const dewDepression = (temp != null && humidity != null)
    ? (100 - humidity) / 5
    : null

  const fogProne = dewDepression != null && dewDepression < 3

  if (visibilityM != null && visibilityM < 1000) {
    return { label: 'Foggy',         color: '#8890B8' }
  }
  if (fogProne && (visibilityM == null || visibilityM < 4000)) {
    return { label: 'Elevated risk', color: '#9A8060' }
  }
  if (humidity != null && humidity > 88) {
    return { label: 'Possible',      color: '#9A8060' }
  }
  return { label: 'Low',             color: '#5FAA88' }
}

function visibilityLabel(m: number): { text: string; color: string } {
  if (m < 1000)  return { text: 'Fog',       color: '#8890B8' }
  if (m < 2000)  return { text: 'Mist',      color: '#9A8060' }
  if (m < 5000)  return { text: 'Hazy',      color: '#9A8060' }
  if (m < 10000) return { text: 'Moderate',  color: '#C8701A' }
  if (m < 20000) return { text: 'Good',      color: '#5FAA88' }
  return           { text: 'Excellent',       color: '#F0B830' }
}

// ─── Moon SVG ─────────────────────────────────────────────────────────────────

function MoonSvg({ phase }: { phase: number }) {
  const R    = 44
  const litP = moonLitPath(phase, R)
  const isFull = phase >= 0.97 || phase <= 0.03

  const glowIntensity = phase >= 0.42 && phase <= 0.58 ? 0.28 : 0.14

  return (
    <svg
      viewBox="-50 -50 100 100"
      width="92"
      height="92"
      aria-hidden="true"
      style={{ filter: `drop-shadow(0 0 14px rgba(237,224,192,${glowIntensity}))`, flexShrink: 0 }}
    >
      <defs>
        <radialGradient id="mnDark" cx="46%" cy="40%" r="60%">
          <stop offset="0%"   stopColor="#2A1E14" />
          <stop offset="100%" stopColor="#0D0A08" />
        </radialGradient>
        <radialGradient id="mnLit" cx="42%" cy="38%" r="58%">
          <stop offset="0%"   stopColor="#F6EEDC" />
          <stop offset="52%"  stopColor="#EDE0C0" />
          <stop offset="100%" stopColor="#B88840" />
        </radialGradient>
        <clipPath id="mnClip">
          <circle cx="0" cy="0" r={R} />
        </clipPath>
      </defs>

      {/* Dark disc */}
      <circle cx="0" cy="0" r={R} fill="url(#mnDark)" />

      {/* Lit area */}
      <g clipPath="url(#mnClip)">
        {isFull && phase > 0.5 ? (
          <circle cx="0" cy="0" r={R} fill="url(#mnLit)" />
        ) : litP ? (
          <path d={litP} fill="url(#mnLit)" />
        ) : null}
      </g>

      {/* Limb ring */}
      <circle cx="0" cy="0" r={R} fill="none" stroke="rgba(237,224,192,0.07)" strokeWidth="1.5" />
    </svg>
  )
}

// ─── Stat bar ─────────────────────────────────────────────────────────────────

function Bar({ fraction, color }: { fraction: number; color: string }) {
  return (
    <div style={{
      height:       '3px',
      background:   'rgba(200,140,60,0.07)',
      borderRadius: '2px',
      overflow:     'hidden',
      flex:         '1 1 auto',
    }}>
      <div style={{
        height:          '100%',
        background:      color,
        borderRadius:    '2px',
        transformOrigin: 'left',
        transform:       `scaleX(${Math.min(1, Math.max(0, fraction))})`,
        opacity:         0.72,
      }} />
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function NightConditions({ moon, forecast, tides, timezone, date }: Props) {
  const visM   = forecast.visibility
  const hum    = forecast.humidity
  const temp   = forecast.temperature
  const fog    = fogRisk(visM, hum, temp)
  const visLbl = visM != null ? visibilityLabel(visM) : null
  const visKm  = visM != null ? (visM >= 10000 ? Math.round(visM / 1000) : (visM / 1000).toFixed(1)) : null

  const hasTides = tides != null && tides.length >= 2

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Moon row ── */}
      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        <MoonSvg phase={moon.phase} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '4px', minWidth: 0 }}>

          {/* Phase + illumination */}
          <div>
            <div style={{
              fontSize:   'clamp(1.0rem, 2.2vw, 1.16rem)',
              fontFamily: 'var(--font-display, Georgia, serif)',
              fontStyle:  'italic',
              fontWeight: 700,
              color:      'rgba(237,224,192,0.80)',
              lineHeight: 1.1,
              marginBottom: '4px',
            }}>
              {moon.phaseName}
            </div>
            <div style={{
              fontSize:      '0.64rem',
              fontWeight:    600,
              fontFamily:    'var(--font-mono, ui-monospace, monospace)',
              color:         'rgba(237,224,192,0.30)',
              letterSpacing: '0.04em',
            }}>
              {Math.round(moon.fraction * 100)}% illuminated
            </div>
          </div>

          {/* Rise / set */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
            {[
              { label: 'Rises', time: moon.moonrise },
              { label: 'Sets',  time: moon.moonset  },
            ].map(({ label, time }) => (
              time ? (
                <div key={label}>
                  <div style={{
                    fontSize:      '0.52rem',
                    fontWeight:    700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase' as const,
                    color:         'rgba(237,224,192,0.20)',
                    marginBottom:  '2px',
                  }}>
                    {label}
                  </div>
                  <div style={{
                    fontSize:   '0.80rem',
                    fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                    fontWeight: 500,
                    color:      'rgba(237,224,192,0.55)',
                  }}>
                    {formatTime(time.toISOString(), timezone)}
                  </div>
                </div>
              ) : null
            ))}
            {moon.alwaysUp && (
              <div style={{ fontSize: '0.70rem', color: 'rgba(237,224,192,0.28)', fontStyle: 'italic' }}>
                Up all night
              </div>
            )}
            {moon.alwaysDown && (
              <div style={{ fontSize: '0.70rem', color: 'rgba(237,224,192,0.20)', fontStyle: 'italic' }}>
                Below the horizon
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Divider ── */}
      <div style={{ height: '1px', background: 'rgba(200,140,60,0.07)' }} />

      {/* ── Atmosphere ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

        <div style={{
          fontSize:      '0.52rem',
          fontWeight:    700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase' as const,
          color:         'rgba(237,224,192,0.18)',
          marginBottom:  '2px',
        }}>
          Atmosphere
        </div>

        {/* Visibility */}
        {visM != null && visLbl && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontSize:      '0.58rem',
              fontWeight:    600,
              letterSpacing: '0.08em',
              color:         'rgba(237,224,192,0.30)',
              width:         '72px',
              flexShrink:    0,
            }}>
              Visibility
            </span>
            <Bar fraction={Math.min(visM / 30000, 1)} color={visLbl.color} />
            <span style={{
              fontSize:   '0.72rem',
              fontFamily: 'var(--font-mono, ui-monospace, monospace)',
              fontWeight: 500,
              color:      visLbl.color,
              width:      '52px',
              textAlign:  'right',
              flexShrink: 0,
            }}>
              {visKm} km
            </span>
            <span style={{
              fontSize:   '0.60rem',
              color:      visLbl.color,
              opacity:    0.70,
              width:      '62px',
              flexShrink: 0,
            }}>
              {visLbl.text}
            </span>
          </div>
        )}

        {/* Fog risk */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{
            fontSize:      '0.58rem',
            fontWeight:    600,
            letterSpacing: '0.08em',
            color:         'rgba(237,224,192,0.30)',
            width:         '72px',
            flexShrink:    0,
          }}>
            Fog risk
          </span>
          <div style={{ flex: '1 1 auto' }}>
            <span style={{
              display:       'inline-flex',
              alignItems:    'center',
              gap:           '5px',
              padding:       '2px 9px',
              borderRadius:  '20px',
              background:    `${fog.color}12`,
              border:        `1px solid ${fog.color}28`,
              fontSize:      '0.58rem',
              fontWeight:    700,
              letterSpacing: '0.08em',
              color:         fog.color,
            }}>
              <span style={{
                width: '4px', height: '4px', borderRadius: '50%',
                background: fog.color, flexShrink: 0,
              }} />
              {fog.label}
            </span>
          </div>
        </div>

        {/* Humidity */}
        {hum != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontSize:      '0.58rem',
              fontWeight:    600,
              letterSpacing: '0.08em',
              color:         'rgba(237,224,192,0.30)',
              width:         '72px',
              flexShrink:    0,
            }}>
              Humidity
            </span>
            <Bar
              fraction={hum / 100}
              color={hum > 85 ? '#8890B8' : hum > 65 ? '#9A8060' : '#5FAA88'}
            />
            <span style={{
              fontSize:   '0.72rem',
              fontFamily: 'var(--font-mono, ui-monospace, monospace)',
              fontWeight: 500,
              color:      hum > 85 ? '#8890B8' : hum > 65 ? '#9A8060' : 'rgba(237,224,192,0.50)',
              width:      '52px',
              textAlign:  'right',
              flexShrink: 0,
            }}>
              {Math.round(hum)}%
            </span>
            <span style={{ width: '62px', flexShrink: 0 }} />
          </div>
        )}
      </div>

      {/* ── Tides ── */}
      {hasTides && (
        <>
          <div style={{ height: '1px', background: 'rgba(200,140,60,0.07)' }} />
          <TidePanel tides={tides!} timezone={timezone} date={date} />
        </>
      )}
    </div>
  )
}

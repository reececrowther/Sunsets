import type { ScoreBreakdown } from '@/types'

const FACTOR_LABELS: Record<keyof ScoreBreakdown, string> = {
  highCloud:    'High cloud',
  midCloud:     'Mid cloud',
  lowCloud:     'Low cloud',
  rain:         'Rain',
  visibility:   'Visibility',
  atmosphere:   'Atmosphere',
  forecastConf: 'Forecast confidence',
}

function barColor(pct: number): string {
  if (pct >= 75) return '#D4854A'
  if (pct >= 50) return '#4A9B6F'
  return '#2A3A56'
}

interface Props {
  breakdown: ScoreBreakdown
  isPro?: boolean
}

export function BreakdownPanel({ breakdown, isPro = false }: Props) {
  const entries = Object.entries(breakdown) as [keyof ScoreBreakdown, number][]

  const bars = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '11px' }}>
      {entries.map(([key, raw]) => {
        const pct = Math.round(raw * 100)
        return (
          <div key={key}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: '5px',
            }}>
              <span style={{ fontSize: '0.8rem', color: '#6B7A9E' }}>
                {FACTOR_LABELS[key]}
              </span>
              <span style={{
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                color: pct >= 70 ? '#D4854A' : '#3D4E6E',
              }}>
                {pct}%
              </span>
            </div>
            <div style={{
              height: '4px',
              background: '#1A2845',
              borderRadius: '2px',
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: barColor(pct),
                borderRadius: '2px',
                transition: 'width 0.6s ease',
              }} />
            </div>
          </div>
        )
      })}
    </div>
  )

  if (!isPro) {
    return (
      <div style={{ position: 'relative' }}>
        <div style={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.6 }}>
          {bars}
        </div>
        <div style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: 'rgba(10,16,30,0.92)',
            border: '1px solid rgba(212,133,74,0.30)',
            borderRadius: '10px',
            padding: '14px 22px',
            textAlign: 'center',
            backdropFilter: 'blur(6px)',
          }}>
            <div style={{
              fontSize: '0.58rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#E07540',
              marginBottom: '5px',
            }}>
              Pro
            </div>
            <div style={{ fontSize: '0.82rem', color: '#C0BAB0', fontWeight: 500 }}>
              Unlock the full breakdown
            </div>
          </div>
        </div>
      </div>
    )
  }

  return bars
}

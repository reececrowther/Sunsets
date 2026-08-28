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
  if (pct >= 75) return '#C8701A'
  if (pct >= 50) return '#5FAA88'
  return '#504840'
}

interface Props {
  breakdown: ScoreBreakdown
  isPro?:    boolean
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
              display:        'flex',
              justifyContent: 'space-between',
              alignItems:     'baseline',
              marginBottom:   '5px',
            }}>
              <span style={{ fontSize: '0.8rem', color: '#9A8060' }}>
                {FACTOR_LABELS[key]}
              </span>
              <span style={{
                fontSize:   '0.75rem',
                fontFamily: 'var(--font-mono, ui-monospace, monospace)',
                color:      pct >= 70 ? '#C8701A' : '#5A4030',
              }}>
                {pct}%
              </span>
            </div>
            <div style={{
              height:          '3px',
              background:      'rgba(200,140,60,0.10)',
              borderRadius:    '2px',
              overflow:        'hidden',
              position:        'relative',
            }}>
              <div style={{
                position:        'absolute',
                inset:           0,
                background:      barColor(pct),
                borderRadius:    '2px',
                transformOrigin: 'left',
                transform:       `scaleX(${pct / 100})`,
                transition:      'transform 0.6s ease',
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
        <div style={{ filter: 'blur(4px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.5 }}>
          {bars}
        </div>
        <div style={{
          position:       'absolute',
          inset:          0,
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background:     'rgba(12,9,8,0.90)',
            border:         '1px solid rgba(200,112,26,0.28)',
            borderRadius:   '10px',
            padding:        '14px 22px',
            textAlign:      'center',
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{
              fontSize:      '0.58rem',
              fontWeight:    700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color:         '#C8701A',
              marginBottom:  '5px',
            }}>
              Pro
            </div>
            <div style={{ fontSize: '0.82rem', color: '#9A8060', fontWeight: 500 }}>
              Unlock the full breakdown
            </div>
          </div>
        </div>
      </div>
    )
  }

  return bars
}

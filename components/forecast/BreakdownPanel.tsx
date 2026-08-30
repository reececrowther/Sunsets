import type { ScoreBreakdown } from '@/types'
import { WEIGHTS } from '@/config/weights'

// ─── Types ───────────────────────────────────────────────────────────────────

type FactorKey    = keyof ScoreBreakdown
type VerdictLevel = 'ideal' | 'good' | 'fair' | 'poor' | 'blocking'

// ─── Verdict derivation ───────────────────────────────────────────────────────

function getVerdict(ratio: number): VerdictLevel {
  if (ratio >= 0.82) return 'ideal'
  if (ratio >= 0.62) return 'good'
  if (ratio >= 0.38) return 'fair'
  if (ratio >= 0.18) return 'poor'
  return 'blocking'
}

const VERDICT_LABEL: Record<VerdictLevel, string> = {
  ideal:    'Ideal',
  good:     'Good',
  fair:     'Fair',
  poor:     'Poor',
  blocking: 'Blocking',
}

const VERDICT_COLOR: Record<VerdictLevel, string> = {
  ideal:    '#F0B830',
  good:     '#5FAA88',
  fair:     '#9A8060',
  poor:     '#8890B8',
  blocking: '#504840',
}

// ─── Factor metadata ──────────────────────────────────────────────────────────

const FACTOR_LABEL: Record<FactorKey, string> = {
  highCloud:  'High cloud',
  midCloud:   'Mid cloud',
  lowCloud:   'Low cloud',
  rain:       'Rain',
  visibility: 'Visibility',
  atmosphere: 'Atmosphere',
  wind:       'Wind',
}

const FACTOR_COPY: Record<FactorKey, Record<VerdictLevel, string>> = {
  highCloud: {
    ideal:    'Scattered cirrus — ideal for colour diffusion',
    good:     'Good high cloud coverage for colour',
    fair:     'Moderate high cloud — limited drama',
    poor:     'Thickening aloft — colours may be muted',
    blocking: 'Overcast above — light suppressed',
  },
  midCloud: {
    ideal:    'Mid-level cloud adds depth and drama',
    good:     'Some mid cloud for texture',
    fair:     'Moderate mid cloud — partial diffusion',
    poor:     'Heavy mid cloud — light partially blocked',
    blocking: 'Dense mid cloud — sky likely grey',
  },
  lowCloud: {
    ideal:    'Clear horizon — nothing blocking the show',
    good:     'Minimal cloud near the horizon',
    fair:     'Some low cloud — horizon partially obscured',
    poor:     'Low cloud building — horizon at risk',
    blocking: 'Dense low cloud — horizon blocked',
  },
  rain: {
    ideal:    'No rain expected during golden hour',
    good:     'Very low rain chance',
    fair:     'Some rain risk — conditions mixed',
    poor:     'Significant rain chance',
    blocking: 'Rain likely — washes out colour',
  },
  visibility: {
    ideal:    'Excellent clarity — vivid, sharp colours',
    good:     'Good visibility',
    fair:     'Some haze — colours slightly muted',
    poor:     'Reduced visibility — misty conditions',
    blocking: 'Poor visibility — fog or thick haze',
  },
  atmosphere: {
    ideal:    'Stable pressure, ideal dew point for scattering',
    good:     'Good atmospheric conditions',
    fair:     'Neutral pressure and humidity',
    poor:     'Unstable — moisture or pressure concern',
    blocking: 'Poor atmospheric stability',
  },
  wind: {
    ideal:    'Light breeze — clear air, cloud formations intact',
    good:     'Good wind conditions',
    fair:     'Moderate wind — minor impact on colour',
    poor:     'Strong wind — cloud formations disrupted',
    blocking: 'Very strong wind — difficult conditions',
  },
}

// Render cloud factors first (biggest drivers of score), then atmospheric conditions.
// Within cloud: low cloud first because it's the strongest sunset killer.
const GROUPS: { label: string; keys: FactorKey[] }[] = [
  { label: 'Cloud layers', keys: ['lowCloud', 'highCloud', 'midCloud'] },
  { label: 'Conditions',   keys: ['rain', 'visibility', 'atmosphere', 'wind'] },
]

// ─── Factor row ───────────────────────────────────────────────────────────────

function FactorRow({ factorKey, raw }: { factorKey: FactorKey; raw: number }) {
  const max     = WEIGHTS[factorKey]
  const ratio   = max > 0 ? Math.min(1, raw / max) : 0
  const verdict = getVerdict(ratio)
  const color   = VERDICT_COLOR[verdict]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>

      {/* Name + verdict */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <span style={{
          fontSize:      '0.80rem',
          fontWeight:    600,
          color:         'rgba(237,224,192,0.72)',
          letterSpacing: '0.005em',
          fontFamily:    'var(--font-sans, system-ui)',
        }}>
          {FACTOR_LABEL[factorKey]}
        </span>
        <span style={{
          display:       'inline-flex',
          alignItems:    'center',
          padding:       '2px 9px',
          borderRadius:  '20px',
          background:    `${color}18`,
          border:        `1px solid ${color}38`,
          fontSize:      '0.60rem',
          fontWeight:    700,
          letterSpacing: '0.10em',
          textTransform: 'uppercase' as const,
          color,
          flexShrink:    0,
          lineHeight:    1.6,
        }}>
          {VERDICT_LABEL[verdict]}
        </span>
      </div>

      {/* Bar + points */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{
          flex:         1,
          height:       '5px',
          background:   'rgba(200,140,60,0.07)',
          borderRadius: '3px',
          overflow:     'hidden',
          position:     'relative',
        }}>
          <div style={{
            position:        'absolute',
            inset:           0,
            background:      color,
            borderRadius:    '3px',
            transformOrigin: 'left',
            transform:       `scaleX(${ratio})`,
            transition:      'transform 0.60s cubic-bezier(0.16, 1, 0.3, 1)',
            opacity:         verdict === 'blocking' ? 0.40 : 0.80,
          }} />
        </div>

        {/* Points: "X / Y" in monospace */}
        <div style={{
          display:     'flex',
          gap:         '2px',
          flexShrink:  0,
          fontFamily:  'var(--font-mono, ui-monospace, monospace)',
          fontSize:    '0.68rem',
          lineHeight:  1,
        }}>
          <span style={{ color: 'rgba(237,224,192,0.50)', fontWeight: 500 }}>
            {raw}
          </span>
          <span style={{ color: 'rgba(237,224,192,0.18)' }}>/</span>
          <span style={{ color: 'rgba(237,224,192,0.22)' }}>
            {max}
          </span>
        </div>
      </div>

      {/* Plain-English context */}
      <p style={{
        margin:      0,
        fontSize:    '0.70rem',
        color:       'rgba(237,224,192,0.30)',
        lineHeight:  1.45,
        fontFamily:  'var(--font-sans, system-ui)',
        fontStyle:   'italic',
      }}>
        {FACTOR_COPY[factorKey][verdict]}
      </p>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

interface Props {
  breakdown: ScoreBreakdown
  isPro?:    boolean
}

export function BreakdownPanel({ breakdown, isPro = false }: Props) {
  const content = (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {GROUPS.map(group => (
        <div key={group.label}>
          {/* Group header */}
          <div style={{
            display:        'flex',
            alignItems:     'center',
            gap:            '10px',
            marginBottom:   '16px',
          }}>
            <span style={{
              fontSize:      '0.56rem',
              fontWeight:    700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase' as const,
              color:         'rgba(237,224,192,0.22)',
              fontFamily:    'var(--font-sans, system-ui)',
            }}>
              {group.label}
            </span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(200,140,60,0.07)' }} />
          </div>

          {/* Factors */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {group.keys.map(key => (
              <FactorRow key={key} factorKey={key} raw={breakdown[key]} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )

  if (!isPro) {
    return (
      <div style={{ position: 'relative' }}>
        <div style={{ filter: 'blur(5px)', pointerEvents: 'none', userSelect: 'none', opacity: 0.35 }}>
          {content}
        </div>
        <div style={{
          position:       'absolute',
          inset:          0,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background:     'rgba(12,9,8,0.92)',
            border:         '1px solid rgba(200,112,26,0.24)',
            borderRadius:   '12px',
            padding:        '16px 24px',
            textAlign:      'center',
            backdropFilter: 'blur(16px)',
          }}>
            <div style={{
              fontSize:      '0.56rem',
              fontWeight:    700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase' as const,
              color:         '#C8701A',
              marginBottom:  '6px',
            }}>
              Pro
            </div>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#9A8060', fontWeight: 500 }}>
              Unlock the full breakdown
            </p>
          </div>
        </div>
      </div>
    )
  }

  return content
}

import type { SunsetForecast, SunsetQuality } from '@/types'

const Q_COLOR: Record<SunsetQuality, string> = {
  excellent: '#F5A828',
  great:     '#E07540',
  good:      '#5FAA88',
  fair:      '#7A8DB8',
  poor:      '#6A7888',
}

// Catmull-Rom → cubic bezier.
// t = 0.38 is the smoothness sweet-spot: curves flow without harsh kinks.
function smoothPath(pts: Array<{ x: number; y: number }>): string {
  if (pts.length < 2) return ''
  const t = 0.38
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[Math.min(pts.length - 1, i + 2)]
    const cp1x = p1.x + (p2.x - p0.x) * t
    const cp1y = p1.y + (p2.y - p0.y) * t
    const cp2x = p2.x - (p3.x - p1.x) * t
    const cp2y = p2.y - (p3.y - p1.y) * t
    d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)}, ${cp2x.toFixed(1)} ${cp2y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`
  }
  return d
}

function fillPath(linePath: string, W: number, H: number): string {
  return `${linePath} L ${W - 110} ${H} L 110 ${H} Z`
}

function dayLabel(ds: string): string {
  const [y, m, d] = ds.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-GB', { weekday: 'short' })
}

interface Props {
  forecasts: SunsetForecast[]
}

export function WeekScoreChart({ forecasts }: Props) {
  if (forecasts.length === 0) return null

  const n  = forecasts.length
  const W  = 1000
  const H  = 140
  const PX = 110       // inner x padding — keeps labels clear of sidebar panels

  // Dynamic y range: zoom into the actual score band so variation is always visible
  const rawScores = forecasts.map(f => f.score ?? 50)
  const dataMin   = Math.max(0,   Math.min(...rawScores) - 15)
  const dataMax   = Math.min(100, Math.max(...rawScores) + 15)
  const yHi = 26       // y-coordinate for the top of the score range
  const yLo = 96       // y-coordinate for the bottom

  const pts = forecasts.map((f, i) => {
    const score = f.score ?? (dataMin + dataMax) / 2
    const yFrac = (score - dataMin) / (dataMax - dataMin)
    return {
      x:       n === 1 ? W / 2 : PX + (i / (n - 1)) * (W - PX * 2),
      y:       yLo - yFrac * (yLo - yHi),
      score:   f.score,
      quality: f.quality,
      date:    f.forecastDate,
      today:   i === 0,
    }
  })

  const linePath  = smoothPath(pts)
  const areaPath  = n > 1 ? fillPath(linePath, W, H) : ''
  const gradId    = 'chart-area-fill'

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="7-day sunset score chart"
      style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor="rgba(255,255,255,0.10)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0.00)" />
        </linearGradient>
        <filter id="dot-glow" x="-150%" y="-150%" width="400%" height="400%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Soft fill under the spline */}
      {n > 1 && (
        <path
          d={areaPath}
          fill={`url(#${gradId})`}
          opacity="0.55"
        />
      )}

      {/* Day labels */}
      {pts.map((p, i) => (
        <text
          key={`dl-${i}`}
          x={p.x}
          y={14}
          textAnchor="middle"
          fontSize="10.5"
          fontWeight={p.today ? '600' : '400'}
          letterSpacing="0.09em"
          fill={p.today ? 'rgba(232,226,212,0.88)' : 'rgba(232,226,212,0.28)'}
          style={{ textTransform: 'uppercase', fontFamily: 'var(--font-sans, system-ui, sans-serif)' }}
        >
          {dayLabel(p.date)}
        </text>
      ))}

      {/* Spline — drawn in with CSS animation */}
      {n > 1 && (
        <path
          d={linePath}
          fill="none"
          stroke="rgba(255,255,255,0.65)"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength="1"
          strokeDasharray="1"
          strokeDashoffset="1"
          className="score-chart-line"
        />
      )}

      {/* Nodes */}
      {pts.map((p, i) => {
        const col = p.quality ? Q_COLOR[p.quality] : 'rgba(255,255,255,0.5)'
        return (
          <g
            key={`dot-${i}`}
            filter="url(#dot-glow)"
            style={{
              opacity:   0,
              animation: `score-dot-in 0.3s ease-out ${0.5 + i * 0.08}s forwards`,
            }}
          >
            {/* Outer bloom */}
            <circle cx={p.x} cy={p.y} r={p.today ? 18 : 11} fill={col} opacity="0.12" />
            {/* Inner halo */}
            <circle cx={p.x} cy={p.y} r={p.today ? 10 : 6}  fill={col} opacity="0.22" />
            {/* Main disc */}
            <circle cx={p.x} cy={p.y} r={p.today ? 6.5 : 4} fill={col} opacity={p.today ? 1 : 0.82} />
            {/* Specular cap */}
            <circle
              cx={p.x - (p.today ? 1.8 : 1.2)}
              cy={p.y - (p.today ? 1.8 : 1.2)}
              r={p.today ? 2.4 : 1.4}
              fill="rgba(255,255,255,0.50)"
            />
          </g>
        )
      })}

      {/* Score numerals */}
      {pts.map((p, i) => {
        const col = p.quality ? Q_COLOR[p.quality] : 'rgba(232,226,212,0.28)'
        return (
          <text
            key={`sv-${i}`}
            x={p.x}
            y={H - 4}
            textAnchor="middle"
            fontSize={p.today ? '17' : '12.5'}
            fontWeight={p.today ? '700' : '400'}
            letterSpacing="-0.03em"
            fill={p.today ? col : 'rgba(232,226,212,0.30)'}
            style={{
              fontFamily:         'var(--font-sans, system-ui, sans-serif)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {p.score ?? '—'}
          </text>
        )
      })}
    </svg>
  )
}

import type { SunsetQuality } from '@/types'

interface Props {
  azimuth:  number
  quality?: SunsetQuality | null
  size?:    number
}

const QUALITY_COLOR: Record<SunsetQuality, string> = {
  excellent: '#F0B830',
  great:     '#C8701A',
  good:      '#5FAA88',
  fair:      '#8890B8',
  poor:      '#504840',
}

function compassPoint(degrees: number): string {
  const pts = ['N','NNE','NE','ENE','E','ESE','SE','SSE',
               'S','SSW','SW','WSW','W','WNW','NW','NNW']
  return pts[Math.round(degrees / 22.5) % 16]
}

function bearing(az: number, r: number, cx = 100, cy = 100) {
  const rad = (az * Math.PI) / 180
  return { x: cx + r * Math.sin(rad), y: cy - r * Math.cos(rad) }
}

export function SunCompass({ azimuth, quality, size = 160 }: Props) {
  const cx = 100, cy = 100
  const ringR    = 78
  const sunR     = 78
  const lineEndR = 64
  const labelR   = 57
  const color    = quality ? QUALITY_COLOR[quality] : '#C8701A'

  const sun     = bearing(azimuth, sunR,     cx, cy)
  const lineEnd = bearing(azimuth, lineEndR, cx, cy)

  const circumference = 2 * Math.PI * ringR
  const zoneDeg   = 140
  const zoneLen   = circumference * (zoneDeg / 360)
  const gapLen    = circumference - zoneLen
  const zoneRotate = 110

  const ticks = Array.from({ length: 16 }, (_, i) => {
    const az     = i * 22.5
    const isCard = i % 4 === 0
    const isMaj  = i % 2 === 0
    const outer  = ringR
    const inner  = isCard ? ringR - 14 : isMaj ? ringR - 9 : ringR - 5
    return { outer: bearing(az, outer, cx, cy), inner: bearing(az, inner, cx, cy), isCard, isMaj }
  })

  const cardinals = [
    { label: 'N', az: 0   },
    { label: 'E', az: 90  },
    { label: 'S', az: 180 },
    { label: 'W', az: 270 },
  ].map(({ label, az }) => ({ label, ...bearing(az, labelR, cx, cy) }))

  const point = compassPoint(azimuth)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 200 200"
        role="img"
        aria-label={`Sunset compass — faces ${point} at ${Math.round(azimuth)}°`}
      >
        <defs>
          <radialGradient id={`sg-${Math.round(azimuth)}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor={color} stopOpacity="0.50" />
            <stop offset="100%" stopColor={color} stopOpacity="0"    />
          </radialGradient>
        </defs>

        {/* Sunset zone arc */}
        <circle
          cx={cx} cy={cy} r={ringR}
          fill="none"
          stroke="rgba(200,112,26,0.18)"
          strokeWidth="3"
          strokeDasharray={`${zoneLen.toFixed(1)} ${gapLen.toFixed(1)}`}
          strokeLinecap="round"
          transform={`rotate(${zoneRotate}, ${cx}, ${cy})`}
        />

        {/* Compass ring */}
        <circle
          cx={cx} cy={cy} r={ringR}
          fill="none"
          stroke="rgba(200,140,60,0.12)"
          strokeWidth="1"
        />

        {/* Tick marks */}
        {ticks.map((t, i) => (
          <line
            key={i}
            x1={t.outer.x} y1={t.outer.y}
            x2={t.inner.x} y2={t.inner.y}
            stroke={
              t.isCard ? 'rgba(237,224,192,0.28)' :
              t.isMaj  ? 'rgba(237,224,192,0.12)' :
                         'rgba(237,224,192,0.06)'
            }
            strokeWidth={t.isCard ? 1.5 : 1}
            strokeLinecap="round"
          />
        ))}

        {/* Cardinal labels */}
        {cardinals.map(({ label, x, y }) => (
          <text
            key={label}
            x={x} y={y}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="9.5"
            fontWeight="700"
            letterSpacing="0.5"
            fill={label === 'N' ? 'rgba(237,224,192,0.36)' : 'rgba(237,224,192,0.16)'}
            style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
          >
            {label}
          </text>
        ))}

        {/* Direction line */}
        <line
          x1={cx}        y1={cy}
          x2={lineEnd.x} y2={lineEnd.y}
          stroke={color}
          strokeWidth="1"
          strokeOpacity="0.28"
          strokeLinecap="round"
        />

        {/* Centre dot */}
        <circle cx={cx} cy={cy} r="2" fill="rgba(237,224,192,0.22)" />

        {/* Sun glow */}
        <circle
          cx={sun.x} cy={sun.y}
          r="18"
          fill={`url(#sg-${Math.round(azimuth)})`}
        />

        {/* Sun disc */}
        <circle cx={sun.x} cy={sun.y} r="5.5" fill={color} opacity="0.92" />

        {/* Degree readout */}
        <text
          x={cx} y={cy}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="14"
          fontWeight="600"
          fill="rgba(237,224,192,0.44)"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          {Math.round(azimuth)}°
        </text>
      </svg>

      <div style={{ fontSize: '0.72rem', color: '#5A4030', letterSpacing: '0.03em', textAlign: 'center' }}>
        Faces <strong style={{ color: '#9A8060', fontWeight: 600 }}>{point}</strong>
      </div>
    </div>
  )
}

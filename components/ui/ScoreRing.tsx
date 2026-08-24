import type { SunsetQuality } from '@/types'

const QUALITY_COLORS: Record<SunsetQuality, string> = {
  excellent: '#F59E0B',
  great:     '#D4854A',
  good:      '#4A9B6F',
  fair:      '#8A95B8',
  poor:      '#6B7A9E',
}

function scoreColor(score: number): string {
  if (score >= 80) return '#F59E0B'
  if (score >= 60) return '#D4854A'
  if (score >= 40) return '#4A9B6F'
  if (score >= 20) return '#8A95B8'
  return '#6B7A9E'
}

interface Props {
  score: number
  quality?: SunsetQuality | null
  size?: number
  strokeWidth?: number
}

export function ScoreRing({ score, quality, size = 160, strokeWidth = 12 }: Props) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const fill = (score / 100) * circumference
  const gap = circumference - fill
  const color = quality ? QUALITY_COLORS[quality] : scoreColor(score)

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label={`Score: ${score} out of 100`}
      style={{ flexShrink: 0 }}
    >
      {/* Track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#1A2845"
        strokeWidth={strokeWidth}
      />
      {/* Fill */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeDasharray={`${fill} ${gap}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ filter: `drop-shadow(0 0 6px ${color}88)` }}
      />
      {/* Score number */}
      <text
        x="50%"
        y="46%"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#E8E4DC"
        fontSize={size * 0.28}
        fontWeight="700"
        fontFamily="var(--font-mono, ui-monospace, monospace)"
      >
        {score}
      </text>
      <text
        x="50%"
        y="67%"
        textAnchor="middle"
        dominantBaseline="middle"
        fill="#3D4E6E"
        fontSize={size * 0.13}
        fontFamily="var(--font-sans, system-ui, sans-serif)"
      >
        /100
      </text>
    </svg>
  )
}

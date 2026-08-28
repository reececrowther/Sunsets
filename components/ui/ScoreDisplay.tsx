'use client'

import { useEffect, useState } from 'react'
import type { SunsetQuality } from '@/types'

const QUALITY_COLORS: Record<SunsetQuality, { from: string; to: string; glow: string }> = {
  excellent: { from: '#F0B830', to: '#FFDA60', glow: 'rgba(240,184,48,0.28)' },
  great:     { from: '#C8701A', to: '#E89040', glow: 'rgba(200,112,26,0.24)' },
  good:      { from: '#5FAA88', to: '#82CCA8', glow: 'rgba(95,170,136,0.22)' },
  fair:      { from: '#8890B8', to: '#A4ACCE', glow: 'rgba(136,144,184,0.18)' },
  poor:      { from: '#504840', to: '#6A5E54', glow: 'rgba(80,72,64,0.16)' },
}

interface Props {
  score: number
  quality: SunsetQuality | null
  size?: number
}

export function ScoreDisplay({ score, quality, size = 200 }: Props) {
  const [count, setCount]           = useState(0)
  const [ringProgress, setProgress] = useState(0)

  useEffect(() => {
    let frame: number
    const start    = performance.now()
    const duration = 1300

    function tick(now: number) {
      const t     = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setCount(Math.round(eased * score))
      setProgress(eased)
      if (t < 1) { frame = requestAnimationFrame(tick) }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [score])

  const strokeWidth  = 10
  const radius       = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const fill         = ringProgress * (score / 100) * circumference
  const gap          = circumference - fill
  const gradientId   = `score-grad-${size}`

  const colors = quality ? QUALITY_COLORS[quality] : QUALITY_COLORS.great

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: `${size}px`, height: `${size}px` }}>
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: `${size * 1.6}px`,
          height: `${size * 1.6}px`,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${colors.glow} 0%, transparent 65%)`,
          pointerEvents: 'none',
        }}
      />

      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        role="img"
        aria-label={`Sunset score: ${score} out of 100`}
        style={{ position: 'relative', zIndex: 1 }}
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.from} />
            <stop offset="100%" stopColor={colors.to} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke="rgba(200,140,60,0.10)"
          strokeWidth={strokeWidth}
        />
        {/* Animated arc */}
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeDasharray={`${fill} ${gap}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>

      {/* Score number centred inside ring */}
      <div style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '1px',
      }}>
        <span
          suppressHydrationWarning
          style={{
            fontSize: `${Math.round(size * 0.32)}px`,
            fontFamily: 'var(--font-display, Georgia, serif)',
            fontStyle: 'italic',
            fontWeight: 700,
            color: colors.from,
            lineHeight: 1,
            letterSpacing: '-0.04em',
          }}
        >
          {count}
        </span>
        <span style={{
          fontSize: `${Math.round(size * 0.10)}px`,
          color: 'rgba(237,224,192,0.30)',
          fontWeight: 400,
          letterSpacing: '0.04em',
          fontFamily: 'var(--font-mono, ui-monospace, monospace)',
        }}>
          / 100
        </span>
      </div>
    </div>
  )
}

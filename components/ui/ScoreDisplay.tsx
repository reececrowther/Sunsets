'use client'

import { useEffect, useState } from 'react'
import type { SunsetQuality } from '@/types'

const QUALITY_COLORS: Record<SunsetQuality, { from: string; to: string; glow: string }> = {
  excellent: { from: '#F5A828', to: '#FFCE60', glow: 'rgba(245,168,40,0.30)' },
  great:     { from: '#E07540', to: '#F59A60', glow: 'rgba(224,117,64,0.28)' },
  good:      { from: '#5FAA88', to: '#82CCA8', glow: 'rgba(95,170,136,0.25)' },
  fair:      { from: '#7A8DB8', to: '#9AADD8', glow: 'rgba(122,141,184,0.20)' },
  poor:      { from: '#4A5872', to: '#6A788C', glow: 'rgba(74,88,114,0.18)' },
}

const PHRASES: Record<SunsetQuality, string> = {
  excellent: 'Tonight could be something special.',
  great:     'Looks like a good one tonight.',
  good:      'Decent conditions — worth a look.',
  fair:      'Mixed bag tonight.',
  poor:      'Not the best evening for a sunset.',
}

interface Props {
  score: number
  quality: SunsetQuality | null
  size?: number
}

export function ScoreDisplay({ score, quality, size = 200 }: Props) {
  const [count, setCount] = useState(0)
  const [ringProgress, setRingProgress] = useState(0)

  useEffect(() => {
    let frame: number
    const start = performance.now()
    const duration = 1300

    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      setCount(Math.round(eased * score))
      setRingProgress(eased)
      if (t < 1) { frame = requestAnimationFrame(tick) }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [score])

  const strokeWidth = 13
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const fill = ringProgress * (score / 100) * circumference
  const gap = circumference - fill
  const gradientId = `score-grad-${size}`

  const colors = quality ? QUALITY_COLORS[quality] : QUALITY_COLORS.great
  const phrase = quality ? PHRASES[quality] : ''

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '20px',
    }}>
      {/* Ring */}
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: `${size}px`, height: `${size}px` }}>
        {/* Ambient glow behind ring */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: `${size * 1.5}px`,
            height: `${size * 1.5}px`,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${colors.glow} 0%, transparent 68%)`,
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
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={strokeWidth}
          />
          {/* Animated arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth={strokeWidth}
            strokeDasharray={`${fill} ${gap}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        {/* Number centred inside ring */}
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
              fontSize: `${Math.round(size * 0.30)}px`,
              fontWeight: 800,
              color: colors.from,
              fontFamily: 'var(--font-sans, system-ui, sans-serif)',
              lineHeight: 1,
              letterSpacing: '-0.04em',
              transition: 'color 0.3s',
            }}
          >
            {count}
          </span>
          <span style={{
            fontSize: `${Math.round(size * 0.11)}px`,
            color: 'rgba(255,255,255,0.38)',
            fontWeight: 400,
            letterSpacing: '0.02em',
          }}>
            / 100
          </span>
        </div>
      </div>

      {/* Quality label + phrase */}
      {quality && (
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: colors.from,
          }}>
            {quality}
          </span>
          <p style={{
            fontSize: '0.95rem',
            color: 'rgba(232,226,212,0.45)',
            lineHeight: 1.55,
            fontStyle: 'italic',
            margin: 0,
          }}>
            {phrase}
          </p>
        </div>
      )}
    </div>
  )
}

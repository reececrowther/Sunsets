'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'

interface Props {
  goldenHourStart: Date | null
  sunsetTime:      Date
  blueHourEnd:     Date | null
  timezone:        string
  overrideDate:    Date | null
  onScrub:         (date: Date | null) => void
}

function phaseLabel(t: number, gh: number | null, ss: number, bh: number | null): string {
  if (bh && t > bh) return 'Blue Hour'
  if (t > ss + 18 * 60_000) return 'Afterglow'
  if (t > ss - 6 * 60_000)  return 'Sunset'
  if (gh && t >= gh)         return 'Golden Hour'
  return 'Afternoon'
}

function fmtTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit', timeZone: timezone,
  }).format(date)
}

export function SunsetTimeline({
  goldenHourStart,
  sunsetTime,
  blueHourEnd,
  timezone,
  overrideDate,
  onScrub,
}: Props) {
  const trackRef  = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)

  const ssMs = sunsetTime.getTime()
  const ghMs = goldenHourStart?.getTime() ?? null
  const bhMs = blueHourEnd?.getTime() ?? null

  const rangeStart    = ghMs != null ? ghMs - 15 * 60_000 : ssMs - 80 * 60_000
  const rangeEnd      = bhMs != null ? bhMs + 15 * 60_000 : ssMs + 80 * 60_000
  const rangeDuration = rangeEnd - rangeStart

  const displayDate = overrideDate ?? new Date()
  const displayMs   = displayDate.getTime()
  const displayFrac = Math.max(0, Math.min(1, (displayMs - rangeStart) / rangeDuration))

  const label   = phaseLabel(displayMs, ghMs, ssMs, bhMs)
  const timeStr = fmtTime(displayDate, timezone)

  const ghFrac = ghMs != null ? (ghMs - rangeStart) / rangeDuration : null
  const ssFrac = (ssMs - rangeStart) / rangeDuration
  const bhFrac = bhMs != null ? (bhMs - rangeStart) / rangeDuration : null

  function frac(clientX: number): number {
    const rect = trackRef.current?.getBoundingClientRect()
    if (!rect) return 0
    return Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
  }

  function scrubTo(clientX: number) {
    const f = frac(clientX)
    onScrub(new Date(rangeStart + f * rangeDuration))
  }

  return (
    <div
      aria-label="Sunset timeline scrubber"
      style={{
        position: 'absolute',
        bottom: '70px',
        left: 0, right: 0,
        padding: '0 clamp(28px, 8vw, 80px)',
        zIndex: 65,
        userSelect: 'none',
      }}
    >
      {/* Time + phase label */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '7px',
        marginBottom: '10px',
      }}>
        <span style={{
          fontSize: '0.74rem',
          color: 'rgba(245,237,216,0.58)',
          letterSpacing: '0.03em',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {timeStr}
        </span>
        <span aria-hidden="true" style={{ color: 'rgba(245,237,216,0.20)', fontSize: '0.7rem' }}>·</span>
        <span style={{
          fontSize: '0.60rem',
          color: 'rgba(245,237,216,0.38)',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          {label}
        </span>
        {overrideDate && (
          <button
            onClick={() => onScrub(null)}
            aria-label="Return to live time"
            style={{
              fontSize: '0.52rem',
              color: 'rgba(245,237,216,0.30)',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.11)',
              borderRadius: '99px',
              padding: '2px 8px',
              cursor: 'pointer',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              lineHeight: 1.8,
            }}
          >
            Live
          </button>
        )}
      </div>

      {/* Track */}
      <div
        ref={trackRef}
        role="slider"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(displayFrac * 100)}
        aria-label="Timeline position"
        tabIndex={0}
        onPointerDown={(e) => {
          setDragging(true)
          scrubTo(e.clientX)
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerMove={(e) => { if (dragging) scrubTo(e.clientX) }}
        onPointerUp={() => setDragging(false)}
        onPointerCancel={() => setDragging(false)}
        onKeyDown={(e) => {
          const step = 0.02
          if (e.key === 'ArrowRight') onScrub(new Date(rangeStart + Math.min(1, displayFrac + step) * rangeDuration))
          if (e.key === 'ArrowLeft')  onScrub(new Date(rangeStart + Math.max(0, displayFrac - step) * rangeDuration))
          if (e.key === 'Escape')     onScrub(null)
        }}
        style={{
          position: 'relative',
          height: '44px',
          cursor: dragging ? 'grabbing' : 'ew-resize',
          display: 'flex',
          alignItems: 'center',
          WebkitTapHighlightColor: 'transparent',
          touchAction: 'none',
          outline: 'none',
        }}
      >
        {/* Track line */}
        <div style={{
          position: 'absolute',
          top: '13px',
          left: 0, right: 0,
          height: '1px',
          background: 'rgba(255,255,255,0.13)',
          pointerEvents: 'none',
        }} />

        {/* Golden Hour tick */}
        {ghFrac != null && <Tick frac={ghFrac} label="GH" color="rgba(245,168,40,0.55)" />}

        {/* Sunset tick */}
        <Tick frac={ssFrac} label="Sunset" color="rgba(255,255,255,0.42)" primary />

        {/* Blue Hour tick */}
        {bhFrac != null && <Tick frac={bhFrac} label="BH" color="rgba(122,141,184,0.55)" />}

        {/* Draggable handle */}
        <motion.div
          aria-hidden="true"
          animate={{ scale: dragging ? 1.28 : 1 }}
          transition={{ type: 'spring', stiffness: 420, damping: 26 }}
          style={{
            position: 'absolute',
            top: '13px',
            left: `${displayFrac * 100}%`,
            width: '18px',
            height: '18px',
            borderRadius: '50%',
            background: 'rgba(245,237,216,0.92)',
            boxShadow: dragging
              ? '0 0 0 5px rgba(245,237,216,0.12), 0 2px 12px rgba(0,0,0,0.55)'
              : '0 0 0 2px rgba(245,237,216,0.10), 0 1px 6px rgba(0,0,0,0.42)',
            pointerEvents: 'none',
            transform: 'translateX(-50%) translateY(-50%)',
            transition: dragging ? 'none' : 'left 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
      </div>

      {/* Drag hint */}
      {!overrideDate && (
        <div aria-hidden="true" style={{ textAlign: 'center', marginTop: '4px' }}>
          <span style={{
            fontSize: '0.50rem',
            color: 'rgba(245,237,216,0.16)',
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
          }}>
            Drag to explore the evening
          </span>
        </div>
      )}
    </div>
  )
}

// ── Tick mark with label ───────────────────────────────────────────────────
function Tick({ frac, label, color, primary = false }: {
  frac: number; label: string; color: string; primary?: boolean
}) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: '13px',
        left: `${frac * 100}%`,
        transform: 'translateX(-50%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        pointerEvents: 'none',
      }}
    >
      <div style={{
        width:  primary ? '1.5px' : '1px',
        height: primary ? '9px' : '6px',
        background: color,
      }} />
      <span style={{
        fontSize: '0.45rem',
        color,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        lineHeight: 1,
      }}>
        {label}
      </span>
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import * as SunCalc from 'suncalc'

// ── Central UK coordinates ─────────────────────────────────────────────────
const LAT = 53.8
const LNG = -2.4

// ── Phase definitions ──────────────────────────────────────────────────────
type Phase = 'day' | 'afternoon' | 'golden' | 'twilight' | 'night'

interface PhaseLook {
  sunColor:     string
  innerColor:   string
  glowR:        string  // r,g,b for rgba()
  coronaR:      string
  sizevh:       number
  rayLen:       number  // SVG units beyond disc edge (0 = no rays)
  gradient:     string  // full sky gradient
  bloomOpacity: number  // radial atmospheric bloom intensity (0–1)
}

const LOOK: Record<Phase, PhaseLook> = {
  day: {
    sunColor:     '#FFE060',
    innerColor:   '#FFFFC0',
    glowR:        '255,224,80',
    coronaR:      '255,216,60',
    sizevh:       3.2,
    rayLen:       13,
    gradient:     'linear-gradient(to bottom, #020810 0%, #050e1e 18%, #0a1830 34%, #0e1e3a 52%, #101e3c 72%, #121e3c 88%, #141e3e 100%)',
    bloomOpacity: 0.18,
  },
  afternoon: {
    sunColor:     '#FFB030',
    innerColor:   '#FFE060',
    glowR:        '255,160,30',
    coronaR:      '255,130,20',
    sizevh:       3.2,
    rayLen:       11,
    gradient:     'linear-gradient(to bottom, #06091e 0%, #0c0c2c 16%, #1c1040 28%, #481030 38%, #882418 48%, #c04012 58%, #d86010 68%, #e07c10 78%, #e88c14 88%, #ec9818 100%)',
    bloomOpacity: 0.36,
  },
  golden: {
    sunColor:     '#FF7828',
    innerColor:   '#FFCC40',
    glowR:        '255,108,20',
    coronaR:      '240,88,10',
    sizevh:       3.6,
    rayLen:       17,
    gradient:     'linear-gradient(to bottom, #030610 0%, #070a1e 16%, #160830 26%, #3a0828 36%, #8c1818 44%, #c83e0a 54%, #e06008 63%, #ea7c0a 73%, #f09014 83%, #f4a020 92%, #f8b030 100%)',
    bloomOpacity: 0.45,
  },
  twilight: {
    sunColor:     '#D03820',
    innerColor:   '#FF6030',
    glowR:        '200,48,14',
    coronaR:      '175,32,10',
    sizevh:       3.8,
    rayLen:       0,
    gradient:     'linear-gradient(to bottom, #020408 0%, #050810 14%, #0e0820 26%, #300818 36%, #600c10 48%, #800e0a 60%, #900e08 72%, #960e08 84%, #981008 100%)',
    bloomOpacity: 0.38,
  },
  night: {
    sunColor:     '#902010',
    innerColor:   '#B82818',
    glowR:        '130,24,8',
    coronaR:      '100,16,5',
    sizevh:       4.0,
    rayLen:       0,
    gradient:     'linear-gradient(to bottom, #010306 0%, #040912 28%, #050b16 60%, #07091e 100%)',
    bloomOpacity: 0.08,
  },
}

// ── Sun state ──────────────────────────────────────────────────────────────
interface SunState {
  xPct:      number
  yPct:      number
  altDeg:    number
  phase:     Phase
  visible:   boolean  // true if sun or its glow is worth rendering
  nextEvent: string   // "Sunset in 2h 14m"
  soonAlert: boolean  // ≤20 min to next sunset
}

function getPhase(altDeg: number): Phase {
  if (altDeg > 22) return 'day'
  if (altDeg > 6)  return 'afternoon'
  if (altDeg > 0)  return 'golden'
  if (altDeg > -9) return 'twilight'
  return 'night'
}

function computeSun(now: Date): SunState {
  const pos        = SunCalc.getPosition(now, LAT, LNG)
  const altDegRaw  = pos.altitude * (180 / Math.PI)
  // Guard against NaN — SunCalc can return invalid values at polar extremes
  const altDeg     = isFinite(altDegRaw) ? altDegRaw : 0

  // SunCalc azimuth: radians from south, positive=west, negative=east
  // → compass bearing 0°=N, 90°=E, 180°=S, 270°=W
  const compassDeg = ((pos.azimuth * (180 / Math.PI)) + 180 + 360) % 360

  // Map compass 60°→300° to screen 4%→96%
  const xPct = Math.max(2, Math.min(98, ((compassDeg - 60) / (300 - 60)) * 92 + 4))

  // Arch: 0° → 78% (horizon), noon UK (~47°) → ~27%, below horizon → up to 84%
  // Wider vertical range than the old formula gives the arc its shape.
  const yPct = Math.max(12, Math.min(84, 78 - (altDeg / 55) * 60))

  const phase   = getPhase(altDeg)
  const visible = altDeg > -10

  // Next event label
  const times     = SunCalc.getTimes(now, LAT, LNG)
  const sunsetMs  = times.sunset  ? times.sunset.getTime()  - now.getTime() : -1
  const sunriseMs = times.sunrise ? times.sunrise.getTime() - now.getTime() : -1
  let nextEvent = ''
  let soonAlert = false

  if (altDeg > -2 && sunsetMs > 0) {
    const h = Math.floor(sunsetMs / 3_600_000)
    const m = Math.floor((sunsetMs % 3_600_000) / 60_000)
    nextEvent = h > 0 ? `Sunset in ${h}h ${m}m` : m > 0 ? `Sunset in ${m}m` : 'Sunset now'
    soonAlert = sunsetMs < 20 * 60_000
  } else if (sunriseMs > 0) {
    const h = Math.floor(sunriseMs / 3_600_000)
    const m = Math.floor((sunriseMs % 3_600_000) / 60_000)
    nextEvent = h > 0 ? `Sunrise in ${h}h ${m}m` : `Sunrise in ${m}m`
  } else {
    const tTimes  = SunCalc.getTimes(new Date(now.getTime() + 86_400_000), LAT, LNG)
    const tSunMs  = tTimes.sunrise ? tTimes.sunrise.getTime() - now.getTime() : 0
    const h = Math.floor(tSunMs / 3_600_000)
    const m = Math.floor((tSunMs % 3_600_000) / 60_000)
    nextEvent = h > 0 ? `Sunrise in ${h}h ${m}m` : `Sunrise in ${m}m`
  }

  return { xPct, yPct, altDeg, phase, visible, nextEvent, soonAlert }
}

// ── Dev phase override ────────────────────────────────────────────────────────
// Set to a Phase to preview that look without relying on real-time SunCalc.
// Set to null before deploying to production.
const DEV_PHASE: Phase | null = null // afternoon | golden | twilight | night | day

// ── Star data (generated once) ─────────────────────────────────────────────
interface Star { x: number; y: number; size: number; opacity: number; delay: number }

// ── Component ─────────────────────────────────────────────────────────────
export function SunScene() {
  const [sun,     setSun]     = useState<SunState | null>(null)
  const [hovered, setHovered] = useState(false)
  const [stars, setStars] = useState<Star[]>([])

  const heroRef  = useRef<HTMLDivElement>(null)
  const groupRef = useRef<HTMLDivElement>(null)

  // Two-layer sky cross-fade state
  const [bgBase, setBgBase]             = useState<Phase>('golden')
  const [bgTop,  setBgTop]              = useState<Phase>('golden')
  const [bgTopVisible, setBgTopVisible] = useState(true)
  const bgTopRef  = useRef<Phase>('golden')
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Update sun position every 60 seconds
  useEffect(() => {
    const update = () => setSun(computeSun(new Date()))
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [])

  // Stars — generated client-only so Math.random() doesn't cause a hydration mismatch
  useEffect(() => {
    setStars(Array.from({ length: 72 }, () => ({
      x:       Math.random() * 100,
      y:       Math.random() * 58,
      size:    Math.random() * 1.5 + 0.4,
      opacity: Math.random() * 0.45 + 0.18,
      delay:   Math.random() * 4,
    })))
  }, [])

  // Sky cross-fade: keep base solid while new gradient fades in on top
  useEffect(() => {
    const next = DEV_PHASE ?? sun?.phase ?? 'golden'
    if (next === bgTopRef.current) return
    setBgBase(bgTopRef.current)
    bgTopRef.current = next
    setBgTop(next)
    setBgTopVisible(false)
    // Double RAF: let React flush opacity:0, then trigger the CSS transition
    requestAnimationFrame(() => requestAnimationFrame(() => setBgTopVisible(true)))
    if (fadeTimer.current) clearTimeout(fadeTimer.current)
    fadeTimer.current = setTimeout(() => setBgBase(next), 5100)
    return () => { if (fadeTimer.current) clearTimeout(fadeTimer.current) }
  }, [sun?.phase]) // eslint-disable-line react-hooks/exhaustive-deps

  // Mouse parallax — direct DOM, no React state to keep it smooth
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const rect = heroRef.current?.getBoundingClientRect()
      if (!rect || e.clientY < rect.top || e.clientY > rect.bottom) return
      const mx = (e.clientX - rect.left) / rect.width  - 0.5
      const my = (e.clientY - rect.top)  / rect.height - 0.5
      if (groupRef.current) {
        groupRef.current.style.transform =
          `translate(calc(-50% + ${-mx * 28}px), calc(-50% + ${-my * 16}px))`
      }
    }
    const onLeave = () => {
      if (groupRef.current) {
        groupRef.current.style.transform = 'translate(-50%, -50%)'
      }
    }
    window.addEventListener('mousemove', onMove, { passive: true })
    document.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  const phase = DEV_PHASE ?? sun?.phase ?? 'golden'
  const look  = LOOK[phase]
  const starsVisible = phase === 'night' || phase === 'twilight'

  return (
    <div
      ref={heroRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
    >
      {/* ── Sky gradient — base stays opaque; top layer fades in ── */}
      <div style={{ position: 'absolute', inset: 0, background: LOOK[bgBase].gradient }} />
      <div style={{
        position: 'absolute',
        inset: 0,
        background: LOOK[bgTop].gradient,
        opacity: bgTopVisible ? 1 : 0,
        transition: 'opacity 5s ease',
      }} />

      {/* ── Atmospheric bloom — sits above the bottom fade (z=62) so the warm
          glow is visible throughout the hero, not just below the content. ── */}
      {sun && (
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(ellipse 110% 80% at ${sun.xPct}% ${sun.yPct}%, rgba(${look.glowR},${look.bloomOpacity}) 0%, rgba(${look.glowR},${(look.bloomOpacity * 0.18).toFixed(2)}) 50%, transparent 72%)`,
            pointerEvents: 'none',
            zIndex: 62,
            transition: 'background 60s linear',
          }}
        />
      )}

      {/* ── Stars ── */}
      <div style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        opacity: starsVisible ? (phase === 'night' ? 1 : 0.45) : 0,
        transition: 'opacity 4s ease',
      }}>
        {stars.map((star, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: `${star.x}%`,
              top:  `${star.y}%`,
              width:  `${star.size}px`,
              height: `${star.size}px`,
              borderRadius: '50%',
              background: 'white',
              opacity: star.opacity,
              animation: `star-twinkle ${2.5 + star.delay}s ease-in-out ${star.delay}s infinite`,
              // CSS variable for the keyframe to reference
              ['--star-base-opacity' as string]: star.opacity,
            }}
          />
        ))}
      </div>

      {sun?.visible && (
        <>
          {/* ── Horizon warmth — follows sun azimuth ── */}
          <div style={{
            position: 'absolute',
            bottom: '-2%',
            left:   `${sun.xPct}%`,
            transform: 'translateX(-50%)',
            width:  '65%',
            height: '55%',
            background: `radial-gradient(ellipse 60% 78% at 50% 100%, rgba(${look.glowR},0.38) 0%, rgba(${look.glowR},0.12) 42%, transparent 70%)`,
            pointerEvents: 'none',
            transition: 'left 60s linear',
          }} />

          {/* ── Sun outer position wrapper ── */}
          {/* z=55: above the fixed nav (z=50) so the glow bleeds through it.
              z=55 is below the bottom fade (z=60) so the sun fades into the
              horizon naturally as it sets. pointerEvents none lets nav and
              content clicks pass through; the disc re-enables its own events. */}
          <div style={{
            position: 'absolute',
            left: `${sun.xPct}%`,
            top:  `${sun.yPct}%`,
            transition: 'left 60s linear, top 60s linear',
            zIndex: 55,
            pointerEvents: 'none',
          }}>
            {/* Parallax group — transform controlled by mouse handler */}
            <div
              ref={groupRef}
              style={{
                position: 'relative',
                transform: 'translate(-50%, -50%)',
                transition: 'transform 0.6s ease',
                willChange: 'transform',
              }}
            >
              {/* Corona — large soft ambient glow */}
              <div style={{
                position: 'absolute',
                left: '50%', top: '50%',
                transform: 'translate(-50%, -50%)',
                width:  `${look.sizevh * 9}vh`,
                height: `${look.sizevh * 9}vh`,
                borderRadius: '50%',
                background: `radial-gradient(circle, rgba(${look.coronaR},0.20) 0%, rgba(${look.coronaR},0.06) 45%, transparent 68%)`,
                pointerEvents: 'none',
              }} />

              {/* Expanding rings ×3 */}
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="sun-ring"
                  style={{
                    position: 'absolute',
                    left: '50%', top: '50%',
                    width:  `${look.sizevh}vh`,
                    height: `${look.sizevh}vh`,
                    borderRadius: '50%',
                    border: `1px solid rgba(${look.glowR},0.55)`,
                    animation: `sun-ring-expand 2.8s ease-out ${i * 0.93}s infinite`,
                    pointerEvents: 'none',
                  }}
                />
              ))}

              {/* Rotating rays — only for day/afternoon/golden */}
              {look.rayLen > 0 && (
                <svg
                  className="sun-rays"
                  width={`${look.sizevh * 5}vh`}
                  height={`${look.sizevh * 5}vh`}
                  viewBox="-50 -50 100 100"
                  style={{
                    position: 'absolute',
                    left: '50%', top: '50%',
                    animation: 'sun-rays-spin 24s linear infinite',
                    pointerEvents: 'none',
                  }}
                >
                  {Array.from({ length: 8 }, (_, i) => {
                    const a  = (i / 8) * Math.PI * 2
                    const r1 = 27, r2 = 27 + look.rayLen
                    return (
                      <line
                        key={i}
                        x1={Math.cos(a) * r1} y1={Math.sin(a) * r1}
                        x2={Math.cos(a) * r2} y2={Math.sin(a) * r2}
                        stroke={look.sunColor}
                        strokeWidth={phase === 'golden' ? 2 : 1.5}
                        strokeLinecap="round"
                        strokeOpacity={0.55}
                      />
                    )
                  })}
                </svg>
              )}

              {/* ── Sun disc ── */}
              <div
                className="sun-disc"
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
                aria-hidden="false"
                role="img"
                aria-label={sun.nextEvent ? `The sun. ${sun.nextEvent}` : 'The sun'}
                style={{
                  position: 'relative',
                  pointerEvents: 'auto',
                  width:  `${look.sizevh}vh`,
                  height: `${look.sizevh}vh`,
                  borderRadius: '50%',
                  background: `radial-gradient(circle at 38% 36%, ${look.innerColor} 0%, ${look.sunColor} 55%, ${look.sunColor} 100%)`,
                  boxShadow: [
                    `0 0 ${look.sizevh * 2.5}vh ${look.sizevh * 1.2}vh rgba(${look.glowR},0.60)`,
                    `0 0 ${look.sizevh * 5}vh   ${look.sizevh * 2.5}vh rgba(${look.glowR},0.25)`,
                    `0 0 ${look.sizevh * 9}vh   ${look.sizevh * 4}vh   rgba(${look.glowR},0.10)`,
                  ].join(', '),
                  cursor: 'default',
                  animation: sun.soonAlert
                    ? 'sun-disc-alert 1.4s ease-in-out infinite'
                    : 'sun-disc-pulse 4.5s ease-in-out infinite',
                }}
              />

              {/* Hover tooltip — time to next event */}
              {hovered && sun.nextEvent && (
                <div style={{
                  position: 'absolute',
                  bottom: `calc(100% + ${look.sizevh * 0.8}vh + 8px)`,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(5,7,16,0.90)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: '20px',
                  padding: '7px 16px',
                  fontSize: '0.78rem',
                  fontWeight: 500,
                  color: sun.soonAlert ? '#FF9040' : '#E8E2D4',
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  zIndex: 10,
                  letterSpacing: '0.01em',
                }}>
                  {sun.soonAlert && <span style={{ marginRight: '5px' }}>✦</span>}
                  {sun.nextEvent}
                </div>
              )}

              {/* "Golden hour" label below — when setting soon */}
              {sun.soonAlert && (
                <div style={{
                  position: 'absolute',
                  top: `calc(100% + ${look.sizevh * 0.8}vh + 6px)`,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: `rgba(${look.glowR},0.9)`,
                  whiteSpace: 'nowrap',
                  pointerEvents: 'none',
                  animation: 'sun-gentle-pulse 1.8s ease-in-out infinite',
                }}>
                  Golden hour
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

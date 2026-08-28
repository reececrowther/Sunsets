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
  glowR:        string
  sizevh:       number
  gradient:     string
  bloomOpacity: number
}

const LOOK: Record<Phase, PhaseLook> = {
  day: {
    sunColor:     '#FFE060',
    innerColor:   '#FFFFC0',
    glowR:        '255,224,80',
    sizevh:       3.2,
    gradient:     'linear-gradient(to bottom, #020810 0%, #051428 38%, #0e1e3c 100%)',
    bloomOpacity: 0.18,
  },
  afternoon: {
    sunColor:     '#FFB030',
    innerColor:   '#FFE060',
    glowR:        '255,160,30',
    sizevh:       3.2,
    gradient:     'linear-gradient(to bottom, #06091e 0%, #2c1040 22%, #7e1e18 46%, #cc5c10 74%, #ec9818 100%)',
    bloomOpacity: 0.36,
  },
  golden: {
    sunColor:     '#FF7828',
    innerColor:   '#FFCC40',
    glowR:        '255,108,20',
    sizevh:       3.6,
    gradient:     'linear-gradient(to bottom, #030610 0%, #1e0826 20%, #7c1212 40%, #dc5806 65%, #f4a01e 100%)',
    bloomOpacity: 0.45,
  },
  twilight: {
    sunColor:     '#D03820',
    innerColor:   '#FF6030',
    glowR:        '200,48,14',
    sizevh:       3.8,
    gradient:     'linear-gradient(to bottom, #020408 0%, #220816 28%, #640c0c 60%, #980e08 100%)',
    bloomOpacity: 0.38,
  },
  night: {
    sunColor:     '#902010',
    innerColor:   '#B82818',
    glowR:        '130,24,8',
    sizevh:       4.0,
    gradient:     'linear-gradient(to bottom, #010306 0%, #040a14 55%, #07091e 100%)',
    bloomOpacity: 0.08,
  },
}


// ── Sun state ──────────────────────────────────────────────────────────────
interface SunState {
  xPct:      number
  yPct:      number
  altDeg:    number
  phase:     Phase
  visible:   boolean
  nextEvent: string
  soonAlert: boolean
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
  const altDeg     = isFinite(altDegRaw) ? altDegRaw : 0
  const compassDeg = ((pos.azimuth * (180 / Math.PI)) + 180 + 360) % 360
  const xPct = Math.max(2, Math.min(98, ((compassDeg - 60) / (300 - 60)) * 92 + 4))
  // Mapped so altDeg=0 (horizon) lands at yPct=70 — just above the foreground mountain peaks (~76%)
  const yPct = Math.max(12, Math.min(80, 70 - (altDeg / 55) * 58))
  const phase   = getPhase(altDeg)
  const visible = altDeg > -10

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
    const tTimes = SunCalc.getTimes(new Date(now.getTime() + 86_400_000), LAT, LNG)
    const tSunMs = tTimes.sunrise ? tTimes.sunrise.getTime() - now.getTime() : 0
    const h = Math.floor(tSunMs / 3_600_000)
    const m = Math.floor((tSunMs % 3_600_000) / 60_000)
    nextEvent = h > 0 ? `Sunrise in ${h}h ${m}m` : `Sunrise in ${m}m`
  }

  return { xPct, yPct, altDeg, phase, visible, nextEvent, soonAlert }
}

// ── Dev phase override ────────────────────────────────────────────────────
const DEV_PHASE: Phase | null = null

interface Star { x: number; y: number; size: number; opacity: number; delay: number }

// ── Moon ──────────────────────────────────────────────────────────────────

interface MoonState {
  xPct:    number
  yPct:    number
  fraction: number  // 0 = new moon, 1 = full moon
  phase:   number   // suncalc 0–1 cycle (0=new, 0.5=full, 1=new); waxing < 0.5
  visible: boolean
}

function computeMoon(now: Date): MoonState {
  const pos    = SunCalc.getMoonPosition(now, LAT, LNG)
  const altDeg = pos.altitude * (180 / Math.PI)
  if (!isFinite(altDeg) || altDeg < -10) {
    return { xPct: 50, yPct: 20, fraction: 0, phase: 0, visible: false }
  }
  const compassDeg = ((pos.azimuth * (180 / Math.PI)) + 180 + 360) % 360
  const xPct = Math.max(3, Math.min(97, ((compassDeg - 60) / (300 - 60)) * 92 + 4))
  const yPct = Math.max(8, Math.min(82, 78 - (altDeg / 55) * 60))
  const { fraction, phase } = SunCalc.getMoonIllumination(now)
  return { xPct, yPct, fraction, phase, visible: altDeg > -3 }
}


// Shadow-circle technique: one lit disc + one dark disc that slides left (waxing)
// or right (waning) to expose the correct crescent/gibbous shape.
// viewBox 0 0 112 112 — disc centre (56,56), radius 50, diameter 100.
function MoonDisc({ fraction, moonPhase }: { fraction: number; moonPhase: number }) {
  const isWaxing = moonPhase <= 0.5
  const shadowCx = isWaxing ? 56 - fraction * 100 : 56 + fraction * 100
  return (
    <svg width="2.8vh" height="2.8vh" viewBox="0 0 112 112">
      {/* Lit disc */}
      <circle cx={56} cy={56} r={50} fill="rgba(228,222,196,0.92)" />
      {/* Shadow disc creates the phase shape */}
      {fraction < 0.93 && (
        <circle cx={shadowCx} cy={56} r={50} fill="rgba(5,7,18,0.97)" />
      )}
      {/* Lunar maria — visible when disc is mostly lit */}
      {fraction > 0.55 && (
        <>
          <ellipse cx={44} cy={40} rx={14} ry={9}  fill="rgba(5,7,18,0.07)" transform="rotate(-15 44 40)" />
          <ellipse cx={62} cy={64} rx={11} ry={7.5} fill="rgba(5,7,18,0.06)" />
          <circle  cx={36} cy={58} r={5}            fill="rgba(5,7,18,0.05)" />
        </>
      )}
    </svg>
  )
}

// ── Phase-based moon opacity — moon washes out in bright sky ──────────────
const MOON_OPACITY: Record<Phase, number> = {
  day:       0,
  afternoon: 0,
  golden:    0,
  twilight:  0.72,
  night:     0.92,
}

// ── SunScene props ─────────────────────────────────────────────────────────
interface SunSceneProps {
  score?:             number | null
  cloudHigh?:         number | null
  cloudMid?:          number | null
  cloudLow?:          number | null
  windSpeed?:         number | null
  windDirection?:     number | null
  colourProbability?: number | null
  overrideDate?:      Date | null
}

// ── Component ─────────────────────────────────────────────────────────────
export function SunScene({
  score             = null,
  cloudHigh         = null,
  cloudMid          = null,
  cloudLow          = null,
  windSpeed         = null,
  windDirection     = null,
  colourProbability = null,
  overrideDate      = null,
}: SunSceneProps) {
  const [sun,     setSun]     = useState<SunState | null>(null)
  const [hovered, setHovered] = useState(false)
  const [stars,   setStars]   = useState<Star[]>([])
  const [moon,    setMoon]    = useState<MoonState | null>(null)

  const heroRef    = useRef<HTMLDivElement>(null)
  const groupRef   = useRef<HTMLDivElement>(null)
  const fgRef      = useRef<HTMLDivElement>(null)
  const bgHillsRef = useRef<HTMLDivElement>(null)  // mid mountain layer
  const farHillsRef = useRef<HTMLDivElement>(null) // distant mountain layer

  const [bgBase, setBgBase]             = useState<Phase>('golden')
  const [bgTop,  setBgTop]              = useState<Phase>('golden')
  const [bgTopVisible, setBgTopVisible] = useState(true)
  const bgTopRef  = useRef<Phase>('golden')
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const update = () => {
      const now = overrideDate ?? new Date()
      setSun(computeSun(now))
      setMoon(computeMoon(now))
    }
    update()
    if (overrideDate) return
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [overrideDate])

  useEffect(() => {
    setStars(Array.from({ length: 72 }, () => ({
      x:       Math.random() * 100,
      y:       Math.random() * 58,
      size:    Math.random() * 1.5 + 0.4,
      opacity: Math.random() * 0.45 + 0.18,
      delay:   Math.random() * 4,
    })))
  }, [])

  const fadeDuration = overrideDate ? 0.8 : 5  // faster when timeline is scrubbing

  useEffect(() => {
    const next = DEV_PHASE ?? sun?.phase ?? 'golden'
    if (next === bgTopRef.current) return
    setBgBase(bgTopRef.current)
    bgTopRef.current = next
    setBgTop(next)
    setBgTopVisible(false)
    requestAnimationFrame(() => requestAnimationFrame(() => setBgTopVisible(true)))
    if (fadeTimer.current) clearTimeout(fadeTimer.current)
    fadeTimer.current = setTimeout(() => setBgBase(next), (fadeDuration + 0.1) * 1000)
    return () => { if (fadeTimer.current) clearTimeout(fadeTimer.current) }
  }, [sun?.phase, fadeDuration]) // eslint-disable-line react-hooks/exhaustive-deps

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
      // Three-layer depth parallax: bg hills slowest, sun mid, fg hills fastest
      if (farHillsRef.current) {
        farHillsRef.current.style.transform = `translateX(${-mx * 10}px)`
      }
      if (bgHillsRef.current) {
        bgHillsRef.current.style.transform = `translateX(${-mx * 22}px)`
      }
      if (fgRef.current) {
        fgRef.current.style.transform = `translateX(${-mx * 58}px)`
      }
    }
    const onLeave = () => {
      if (groupRef.current) {
        groupRef.current.style.transform = 'translate(-50%, -50%)'
      }
      if (farHillsRef.current) {
        farHillsRef.current.style.transform = 'translateX(0px)'
      }
      if (bgHillsRef.current) {
        bgHillsRef.current.style.transform = 'translateX(0px)'
      }
      if (fgRef.current) {
        fgRef.current.style.transform = 'translateX(0px)'
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

  // ── Score → atmospheric warmth/coolness ───────────────────────────────
  const scoreBoost = score !== null ? (score - 50) / 50 : 0  // -1 to +1

  return (
    <div
      ref={heroRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
    >
      {/* ── Sky gradient — phase tint over the photo base layer ── */}
      <div style={{ position: 'absolute', inset: 0, background: LOOK[bgBase].gradient, opacity: 0.55 }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: LOOK[bgTop].gradient,
        opacity: bgTopVisible ? 0.55 : 0,
        transition: `opacity ${fadeDuration}s ease`,
      }} />

      {/* ── Score overlay — warms high-score skies, cools low-score skies ── */}
      {score !== null && Math.abs(scoreBoost) > 0.15 && (
        <div aria-hidden="true" style={{
          position: 'absolute',
          inset: 0,
          background: scoreBoost > 0
            ? `radial-gradient(ellipse 130% 72% at 50% 108%, rgba(195,58,6,${(scoreBoost * 0.28).toFixed(2)}) 0%, rgba(155,38,4,${(scoreBoost * 0.14).toFixed(2)}) 44%, transparent 70%)`
            : `radial-gradient(ellipse 130% 72% at 50% 108%, rgba(12,38,110,${(Math.abs(scoreBoost) * 0.20).toFixed(2)}) 0%, transparent 65%)`,
          pointerEvents: 'none',
          zIndex: 5,
          transition: 'background 4s ease',
        }} />
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
          <div key={i} style={{
            position: 'absolute',
            left: `${star.x}%`,
            top:  `${star.y}%`,
            width:  `${star.size}px`,
            height: `${star.size}px`,
            borderRadius: '50%',
            background: 'white',
            opacity: star.opacity,
            animation: `star-twinkle ${2.5 + star.delay}s ease-in-out ${star.delay}s infinite`,
            ['--star-base-opacity' as string]: star.opacity,
          }} />
        ))}
      </div>

      {/* ── Moon — correct phase shape and sky position from suncalc ── */}
      {moon?.visible && MOON_OPACITY[phase] > 0 && (
        <>
          {/* Moonlight atmospheric scatter — soft blue-white bloom when > half lit */}
          {moon.fraction > 0.5 && phase === 'night' && (
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: `${moon.xPct}%`,
                top:  `${moon.yPct}%`,
                transform: 'translate(-50%, -50%)',
                width: '55%', height: '35%',
                background: `radial-gradient(ellipse at center, rgba(170,185,215,${(0.07 * moon.fraction).toFixed(3)}) 0%, transparent 68%)`,
                pointerEvents: 'none',
                zIndex: 44,
                transition: 'left 120s linear, top 120s linear',
              }}
            />
          )}
          {/* Moon disc */}
          <div
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: `${moon.xPct}%`,
              top:  `${moon.yPct}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 45,
              pointerEvents: 'none',
              opacity: MOON_OPACITY[phase],
              transition: 'left 120s linear, top 120s linear, opacity 4s ease',
            }}
          >
            <MoonDisc fraction={moon.fraction} moonPhase={moon.phase} />
          </div>
        </>
      )}

      {/* ── Far mountains — most distant, atmospheric haze (±10px parallax) ── */}
      <div
        ref={farHillsRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 0,
          left: '-6%', right: '-6%',
          height: '16%',
          zIndex: 48,
          pointerEvents: 'none',
          transition: 'transform 1.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          willChange: 'transform',
        }}
      >
        <svg viewBox="0 0 1600 130" preserveAspectRatio="xMidYMax slice"
          style={{ width: '100%', height: '100%', display: 'block' }}>
          <path
            d="M0,130 L0,108 L62,94 L108,108 L172,80 L236,104 L298,72 L360,96 L426,64
               L490,90 L556,56 L618,82 L682,48 L748,76 L812,44 L876,72 L940,40
               L1004,68 L1068,42 L1132,70 L1196,46 L1260,74 L1324,50 L1388,78
               L1448,58 L1510,84 L1560,70 L1600,90 L1600,130 Z"
            fill="#0b0f22"
          />
        </svg>
      </div>

      {/* ── Mid mountains — second parallax layer (±22px) ── */}
      <div
        ref={bgHillsRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 0,
          left: '-6%', right: '-6%',
          height: '26%',
          zIndex: 50,
          pointerEvents: 'none',
          transition: 'transform 1.0s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          willChange: 'transform',
        }}
      >
        <svg viewBox="0 0 1600 200" preserveAspectRatio="xMidYMax slice"
          style={{ width: '100%', height: '100%', display: 'block' }}>
          <path
            d="M0,200 L0,168 L55,148 L110,162 L178,122 L244,150 L316,108 L384,138
               L458,94 L526,128 L600,82 L668,118 L740,66 L810,104 L886,56 L956,92
               L1028,60 L1098,98 L1166,68 L1238,106 L1310,76 L1382,112 L1452,84
               L1524,120 L1600,146 L1600,200 Z"
            fill="#090c1c"
          />
        </svg>
      </div>

      {/* ── Foreground mountains — sharpest peaks, fastest parallax (±58px) ── */}
      <div
        ref={fgRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 0,
          left: '-5%',
          right: '-5%',
          height: '34%',
          zIndex: 58,
          pointerEvents: 'none',
          transition: 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          willChange: 'transform',
        }}
      >
        <svg viewBox="0 0 1600 260" preserveAspectRatio="xMidYMax slice"
          style={{ width: '100%', height: '100%', display: 'block' }}>
          <path
            d="M0,260 L0,212 L48,196 L94,210 L158,174 L224,204 L298,156 L368,186
               L444,136 L512,168 L584,108 L652,148 L728,88 L798,130 L870,76 L940,118
               L1012,82 L1082,126 L1152,92 L1224,138 L1296,104 L1368,148 L1436,116
               L1508,158 L1558,180 L1600,196 L1600,260 Z"
            fill="#07091a"
          />
        </svg>
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
            transition: overrideDate ? 'left 0.3s ease' : 'none',
          }} />

          {/* ── Sun outer position wrapper ── */}
          <div style={{
            position: 'absolute',
            left: `${sun.xPct}%`,
            top:  `${sun.yPct}%`,
            transition: overrideDate ? 'left 0.3s ease, top 0.3s ease' : 'none',
            zIndex: 55,
            pointerEvents: 'none',
          }}>
            {/* Parallax group — moves with mouse parallax, contains the CSS sun */}
            <div
              ref={groupRef}
              style={{
                position: 'relative',
                transform: 'translate(-50%, -50%)',
                transition: 'transform 0.6s ease',
                willChange: 'transform',
              }}
            >
              <>
                <div
                  onMouseEnter={() => setHovered(true)}
                  onMouseLeave={() => setHovered(false)}
                    role="img"
                    aria-label={sun.nextEvent ? `The sun. ${sun.nextEvent}` : 'The sun'}
                    style={{
                      position: 'absolute',
                      left: '50%', top: '50%',
                      width:  `${look.sizevh * 8}vh`,
                      height: `${look.sizevh * 8}vh`,
                      pointerEvents: 'auto',
                      cursor: 'default',
                      animation: sun.soonAlert
                        ? 'sun-cartoon-alert 1.4s ease-in-out infinite'
                        : 'sun-cartoon-pulse 5s ease-in-out infinite',
                    }}
                  >
                    <svg
                      viewBox="-72 -72 144 144"
                      style={{ width: '100%', height: '100%', overflow: 'visible', display: 'block' }}
                    >
                      <defs>
                        <radialGradient id={`sg-${phase}`} cx="38%" cy="32%" r="68%">
                          <stop offset="0%"   stopColor={look.innerColor} />
                          <stop offset="55%"  stopColor={look.sunColor} />
                          <stop offset="100%" stopColor={look.sunColor} />
                        </radialGradient>
                        <radialGradient id={`gg-${phase}`} cx="50%" cy="50%" r="50%">
                          <stop offset="0%"   stopColor={`rgb(${look.glowR})`} stopOpacity="0.45" />
                          <stop offset="55%"  stopColor={`rgb(${look.glowR})`} stopOpacity="0.12" />
                          <stop offset="100%" stopColor={`rgb(${look.glowR})`} stopOpacity="0" />
                        </radialGradient>
                      </defs>
                      <circle r={68} fill={`url(#gg-${phase})`} />
                      {Array.from({ length: 12 }, (_, i) => {
                        const angle  = (i / 12) * 360
                        const isLong = i % 2 === 0
                        return (
                          <rect
                            key={i}
                            x={-4.5} y={-(37 + (isLong ? 20 : 12))}
                            width={9} height={isLong ? 20 : 12}
                            rx={4.5}
                            fill={look.sunColor}
                            opacity={isLong ? 0.92 : 0.65}
                            transform={`rotate(${angle})`}
                          />
                        )
                      })}
                      <circle r={38} fill={`rgb(${look.glowR})`} opacity={0.22} />
                      <circle r={32} fill={`url(#sg-${phase})`} />
                      <ellipse cx={-10} cy={-11} rx={9} ry={6} fill="rgba(255,255,255,0.30)" />
                    </svg>
                  </div>

                  {/* Hover tooltip */}
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

                  {/* Golden hour label */}
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
              </>
            </div>
          </div>
        </>
      )}

    </div>
  )
}

// ── Persistent sunset countdown — rendered in hero content ─────────────────
export function SunCountdown() {
  const [state, setState] = useState<SunState | null>(null)

  useEffect(() => {
    const update = () => setState(computeSun(new Date()))
    update()
    const id = setInterval(update, 30_000)
    return () => clearInterval(id)
  }, [])

  if (!state?.nextEvent) return null

  return (
    <div
      suppressHydrationWarning
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '7px',
        fontSize: '0.78rem',
        fontWeight: 500,
        letterSpacing: '0.025em',
        color: state.soonAlert ? '#FF9040' : 'rgba(245,237,216,0.48)',
        animation: state.soonAlert ? 'sun-gentle-pulse 1.8s ease-in-out infinite' : 'none',
      }}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" aria-hidden="true" style={{ opacity: 0.65, flexShrink: 0 }}>
        <circle cx="12" cy="12" r="4" fill="currentColor"/>
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.93 4.93l2.12 2.12M16.95 16.95l2.12 2.12M4.93 19.07l2.12-2.12M16.95 7.05l2.12-2.12"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
      </svg>
      {state.nextEvent}
    </div>
  )
}

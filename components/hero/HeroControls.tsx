'use client'

import { useState, useRef, useCallback } from 'react'
import { SunScene } from './SunScene'
import { SunsetTimeline } from './SunsetTimeline'

interface Props {
  score?:             number | null
  cloudHigh?:         number | null
  cloudMid?:          number | null
  cloudLow?:          number | null
  windSpeed?:         number | null
  windDirection?:     number | null
  colourProbability?: number | null
  goldenHourStart?:   string | null
  sunsetTime?:        string | null
  blueHourEnd?:       string | null
  timezone:           string
}

export function HeroControls({
  score, cloudHigh, cloudMid, cloudLow, windSpeed, windDirection, colourProbability,
  goldenHourStart, sunsetTime, blueHourEnd, timezone,
}: Props) {
  // Default to 15 min before sunset so golden hour is shown on initial load
  const [overrideDate, setOverrideDate] = useState<Date | null>(() => {
    if (!sunsetTime) return null
    return new Date(new Date(sunsetTime).getTime() - 5 * 60_000)
  })

  const ghDate = goldenHourStart ? new Date(goldenHourStart) : null
  const ssDate = sunsetTime      ? new Date(sunsetTime)      : null
  const bhDate = blueHourEnd     ? new Date(blueHourEnd)     : null

  // Timeline range (mirrors SunsetTimeline logic, needed for swipe mapping)
  const ssMs          = ssDate?.getTime() ?? 0
  const ghMs          = ghDate?.getTime() ?? null
  const bhMs          = bhDate?.getTime() ?? null
  const rangeStart    = ghMs != null ? ghMs - 15 * 60_000 : ssMs - 80 * 60_000
  const rangeEnd      = bhMs != null ? bhMs + 15 * 60_000 : ssMs + 80 * 60_000
  const rangeDuration = rangeEnd - rangeStart

  const touchStartX   = useRef<number | null>(null)
  const touchBaseDate = useRef<Date>(new Date())

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current   = e.touches[0].clientX
    touchBaseDate.current = overrideDate ?? new Date()
  }, [overrideDate])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || !ssDate) return
    const dx        = e.touches[0].clientX - touchStartX.current
    // 60% of screen width covers the full timeline range
    const swipeFrac = -dx / (window.innerWidth * 0.6)
    const baseMs    = touchBaseDate.current.getTime()
    const newMs     = Math.max(rangeStart, Math.min(rangeEnd, baseMs + swipeFrac * rangeDuration))
    setOverrideDate(new Date(newMs))
  }, [ssDate, rangeStart, rangeEnd, rangeDuration])

  const handleTouchEnd = useCallback(() => {
    touchStartX.current = null
  }, [])

  return (
    <>
      <SunScene
        score={score}
        cloudHigh={cloudHigh}
        cloudMid={cloudMid}
        cloudLow={cloudLow}
        windSpeed={windSpeed}
        windDirection={windDirection}
        colourProbability={colourProbability}
        overrideDate={overrideDate}
      />
      {ssDate && (
        <>
          {/* Transparent sky swipe surface — touch only, allows vertical scroll */}
          <div
            aria-hidden="true"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            style={{
              position: 'absolute',
              top: '60px', // below the fixed nav bar
              left: 0, right: 0,
              bottom: '170px',
              zIndex: 64,
              touchAction: 'pan-y',
            }}
          />
          <SunsetTimeline
            goldenHourStart={ghDate}
            sunsetTime={ssDate}
            blueHourEnd={bhDate}
            timezone={timezone}
            overrideDate={overrideDate}
            onScrub={setOverrideDate}
          />
        </>
      )}
    </>
  )
}

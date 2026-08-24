// Batch forecast refresh — called by the Vercel Cron job every 2 hours.
// Fetches weather for all locations, runs the scoring engine, and upserts
// results to the database. One Open-Meteo request covers 8 days of hourly
// data, so each location costs exactly one API call.

import { createAdminClient } from '@/lib/database/client'
import { upsertForecast, isForecastStale, getForecastsForLocation } from '@/lib/database/forecasts'
import { fetchWeatherForecast, getWeatherAtTime } from './open-meteo'
import { getAstronomicalData, getViewingWindow } from '@/lib/astronomy/calculations'
import { calculateSunsetScore } from '@/lib/sunset-score/engine'
import type { SunsetScoreInput } from '@/lib/sunset-score/types'

export interface RefreshResult {
  locationId: string
  locationName: string
  daysRefreshed: number
  error?: string
}

export async function refreshLocation(
  locationId: string,
  locationName: string,
  latitude: number,
  longitude: number,
  timezone: string,
): Promise<RefreshResult> {
  try {
    const weather = await fetchWeatherForecast(latitude, longitude, timezone)

    const results: RefreshResult = { locationId, locationName, daysRefreshed: 0 }

    // Process today + 6 days ahead
    for (let daysAhead = 0; daysAhead <= 6; daysAhead++) {
      const targetDate = new Date()
      targetDate.setDate(targetDate.getDate() + daysAhead)
      targetDate.setHours(12, 0, 0, 0) // noon for date calculation

      const dateStr = targetDate.toISOString().slice(0, 10)
      const astronomical = getAstronomicalData(targetDate, latitude, longitude)
      const { start: viewStart, end: viewEnd } = getViewingWindow(astronomical)

      // Get weather at the actual sunset hour
      const atSunset = getWeatherAtTime(weather.hourly, astronomical.sunsetTime)
      if (!atSunset) continue

      const scoreInput: SunsetScoreInput = {
        cloudHigh: atSunset.cloudHigh,
        cloudMid: atSunset.cloudMid,
        cloudLow: atSunset.cloudLow,
        rainProbability: atSunset.precipitationProb,
        visibility: atSunset.visibility,
        humidity: atSunset.humidity,
        pressure: atSunset.pressure,
        forecastDaysAhead: daysAhead,
      }

      const scoreResult = calculateSunsetScore(scoreInput)

      await upsertForecast({
        locationId,
        forecastDate: dateStr,
        sunsetTime: astronomical.sunsetTime.toISOString(),
        sunriseTime: astronomical.sunriseTime.toISOString(),
        solarNoon: astronomical.solarNoon.toISOString(),
        goldenHourStart: astronomical.goldenHourStart.toISOString(),
        goldenHourEnd: astronomical.goldenHourEnd.toISOString(),
        blueHourStart: viewStart.toISOString(),
        blueHourEnd: viewEnd.toISOString(),
        sunsetAzimuth: astronomical.sunsetAzimuth,
        score: scoreResult.score,
        quality: scoreResult.quality,
        colourProbability: scoreResult.colourProbability,
        confidence: scoreResult.confidence,
        cloudLow: atSunset.cloudLow,
        cloudMid: atSunset.cloudMid,
        cloudHigh: atSunset.cloudHigh,
        totalCloud: atSunset.cloudCover,
        rainProbability: atSunset.precipitationProb,
        humidity: atSunset.humidity,
        visibility: atSunset.visibility,
        windSpeed: atSunset.windSpeed,
        windDirection: atSunset.windDirection,
        pressure: atSunset.pressure,
        temperature: atSunset.temperature,
        scoreBreakdown: scoreResult.breakdown,
        reasons: scoreResult.reasons,
        warnings: scoreResult.warnings,
        weatherSource: 'open-meteo',
        fetchedAt: weather.fetchedAt.toISOString(),
        expiresAt: null,  // set by upsertForecast
      })

      results.daysRefreshed++
    }

    return results
  } catch (err) {
    return {
      locationId,
      locationName,
      daysRefreshed: 0,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }
}

export async function refreshAllLocations(): Promise<RefreshResult[]> {
  const supabase = createAdminClient()
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, latitude, longitude, timezone')

  if (!locations?.length) return []

  // Process locations sequentially to avoid hammering Open-Meteo
  const results: RefreshResult[] = []
  for (const location of locations) {
    const result = await refreshLocation(
      location.id,
      location.name,
      location.latitude,
      location.longitude,
      location.timezone,
    )
    results.push(result)
    // Respectful rate limiting — 200ms between requests
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  return results
}

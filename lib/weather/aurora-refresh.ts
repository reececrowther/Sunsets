// Aurora forecast refresh — called from the daily cron job.
// One NOAA Kp API call covers all locations; cloud data is read from
// the already-refreshed sunset_forecasts table for the same day.

import * as SunCalc from 'suncalc'
import { createAdminClient } from '@/lib/database/client'
import { fetchKpForecast, peakKpInWindow } from './noaa-kp'
import { calculateAuroraScore, minKpForLatitude } from '@/lib/aurora/score'
import { upsertAuroraForecast } from '@/lib/database/aurora'
import type { AuroraQuality } from '@/types'

export interface AuroraRefreshResult {
  locationId:   string
  locationName: string
  auroraScore:  number
  kpPeak:       number
  error?:       string
}

function validDate(d: unknown): Date | null {
  if (!(d instanceof Date)) return null
  return isNaN(d.getTime()) ? null : d
}

// Returns the dark window for tonight using astronomical dusk/dawn.
// Falls back through nautical dusk/dawn, then a ±5h midnight window.
function getDarkWindow(date: Date, lat: number, lon: number): { start: Date; end: Date } {
  const times   = SunCalc.getTimes(date, lat, lon)
  const nextDay = new Date(date)
  nextDay.setDate(nextDay.getDate() + 1)
  const nextTimes = SunCalc.getTimes(nextDay, lat, lon)

  const start =
    validDate(times.night)        ??
    validDate(times.nauticalDusk) ??
    null

  const end =
    validDate(nextTimes.nightEnd)     ??
    validDate(nextTimes.nauticalDawn) ??
    null

  if (!start || !end) {
    // Extreme latitude / midsummer fallback: ±5 h around midnight UTC
    const midnight = new Date(date)
    midnight.setUTCHours(24, 0, 0, 0)
    return {
      start: new Date(midnight.getTime() - 5 * 3_600_000),
      end:   new Date(midnight.getTime() + 5 * 3_600_000),
    }
  }

  return { start, end }
}

export async function refreshAuroraForecasts(): Promise<AuroraRefreshResult[]> {
  const supabase = createAdminClient()

  // Fetch Kp forecast once — applies to all locations globally
  const kpReadings = await fetchKpForecast()

  const today = new Date().toISOString().slice(0, 10)

  // Get all locations with their coordinates
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, latitude, longitude')

  if (!locations?.length) return []

  // Get today's cloud data for all locations in one query
  const locationIds = locations.map(l => l.id)
  const { data: forecasts } = await supabase
    .from('sunset_forecasts')
    .select('location_id, cloud_low, cloud_mid')
    .in('location_id', locationIds)
    .eq('forecast_date', today)

  const cloudByLocation = new Map(
    (forecasts ?? []).map(f => [f.location_id as string, {
      cloudLow:  Number(f.cloud_low  ?? 50),
      cloudMid:  Number(f.cloud_mid  ?? 30),
    }])
  )

  const results: AuroraRefreshResult[] = []

  for (const location of locations) {
    try {
      const clouds  = cloudByLocation.get(location.id) ?? { cloudLow: 50, cloudMid: 30 }
      const tonight = new Date()
      const window  = getDarkWindow(tonight, location.latitude, location.longitude)
      const kpPeak  = peakKpInWindow(kpReadings, window.start, window.end)

      const scoreResult = calculateAuroraScore({
        kpPeak,
        latitude: location.latitude,
        cloudLow: clouds.cloudLow,
        cloudMid: clouds.cloudMid,
      })

      await upsertAuroraForecast({
        locationId:   location.id,
        forecastDate: today,
        kpPeak,
        auroraScore:  scoreResult.score,
        quality:      scoreResult.quality as AuroraQuality,
        cloudPenalty: scoreResult.cloudPenalty,
        minKpNeeded:  scoreResult.minKpNeeded,
        darkStart:    window.start.toISOString(),
        darkEnd:      window.end.toISOString(),
      })

      results.push({
        locationId:   location.id,
        locationName: location.name,
        auroraScore:  scoreResult.score,
        kpPeak,
      })
    } catch (err) {
      results.push({
        locationId:   location.id,
        locationName: location.name,
        auroraScore:  0,
        kpPeak:       0,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return results
}

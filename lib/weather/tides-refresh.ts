// Refresh tidal extremes for all locations using offline harmonic prediction.
// No API key required — uses the Slackwater engine + TICON-4 station database.

import { createAdminClient } from '@/lib/database/client'
import { fetchTideExtremes } from './slackwater'
import { upsertTideExtremes } from '@/lib/database/tides'

export interface TideRefreshResult {
  locationId:   string
  locationName: string
  stationName:  string
  distanceKm:   number
  extremes:     number
  error?:       string
}

export async function refreshTideForecasts(): Promise<TideRefreshResult[]> {
  const supabase = createAdminClient()
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, latitude, longitude')

  if (!locations?.length) return []

  const today   = new Date().toISOString().slice(0, 10)
  const results: TideRefreshResult[] = []

  for (const loc of locations) {
    try {
      const result = await fetchTideExtremes(loc.latitude, loc.longitude, today)
      const extremes = result?.extremes ?? []
      await upsertTideExtremes(loc.id, today, extremes)
      results.push({
        locationId:   loc.id,
        locationName: loc.name,
        stationName:  result?.stationName ?? 'unknown',
        distanceKm:   result?.distanceKm  ?? 0,
        extremes:     extremes.length,
      })
    } catch (err) {
      results.push({
        locationId:   loc.id,
        locationName: loc.name,
        stationName:  'error',
        distanceKm:   0,
        extremes:     0,
        error:        err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return results
}

// Refresh tidal extremes for all locations via WorldTides API.
// Silently skips if WORLDTIDES_API_KEY is not configured.

import { createAdminClient } from '@/lib/database/client'
import { fetchTideExtremes } from './worldtides'
import { upsertTideExtremes } from '@/lib/database/tides'

export interface TideRefreshResult {
  locationId:   string
  locationName: string
  extremes:     number
  error?:       string
}

export async function refreshTideForecasts(): Promise<TideRefreshResult[]> {
  if (!process.env.WORLDTIDES_API_KEY) return []

  const supabase = createAdminClient()
  const { data: locations } = await supabase
    .from('locations')
    .select('id, name, latitude, longitude')

  if (!locations?.length) return []

  const today   = new Date().toISOString().slice(0, 10)
  const results: TideRefreshResult[] = []

  for (const loc of locations) {
    try {
      const extremes = await fetchTideExtremes(loc.latitude, loc.longitude, today)
      await upsertTideExtremes(loc.id, today, extremes)
      results.push({ locationId: loc.id, locationName: loc.name, extremes: extremes.length })
    } catch (err) {
      results.push({
        locationId:   loc.id,
        locationName: loc.name,
        extremes:     0,
        error:        err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }

  return results
}

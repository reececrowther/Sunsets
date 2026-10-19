import { createAdminClient } from './client'
import type { TideExtreme } from '@/lib/weather/worldtides'

export async function getTideExtremes(
  locationId: string,
  date:       string,  // YYYY-MM-DD
): Promise<TideExtreme[] | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('tide_forecasts')
    .select('extremes')
    .eq('location_id', locationId)
    .eq('forecast_date', date)
    .single()

  if (!data) return null
  return data.extremes as TideExtreme[]
}

export async function upsertTideExtremes(
  locationId: string,
  date:       string,
  extremes:   TideExtreme[],
): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('tide_forecasts')
    .upsert(
      { location_id: locationId, forecast_date: date, extremes, updated_at: new Date().toISOString() },
      { onConflict: 'location_id,forecast_date' },
    )
}

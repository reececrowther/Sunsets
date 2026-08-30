import { createAdminClient } from './client'

export interface RatingAggregate {
  count: number
  average: number   // 1–5 scale
}

export async function getAggregateRating(
  locationId: string,
  forecastDate: string,   // YYYY-MM-DD
): Promise<RatingAggregate> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('sunset_ratings')
    .select('rating')
    .eq('location_id', locationId)
    .eq('forecast_date', forecastDate)

  const rows = data ?? []
  if (rows.length === 0) return { count: 0, average: 0 }

  const total = rows.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0)
  return {
    count:   rows.length,
    average: Math.round((total / rows.length) * 10) / 10,
  }
}

export async function submitRating(
  locationId: string,
  forecastDate: string,  // YYYY-MM-DD
  rating: number,        // 1–5
  notes?: string,
): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('sunset_ratings').insert({
    location_id:   locationId,
    forecast_date: forecastDate,
    rating,
    notes: notes?.trim() || null,
  })
}

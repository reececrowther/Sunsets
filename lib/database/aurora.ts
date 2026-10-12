import { createAdminClient } from './client'
import type { AuroraForecast, AuroraQuality } from '@/types'

function mapRow(row: Record<string, unknown>): AuroraForecast {
  return {
    id:           row.id as string,
    locationId:   row.location_id as string,
    forecastDate: row.forecast_date as string,
    kpPeak:       Number(row.kp_peak),
    auroraScore:  row.aurora_score as number,
    quality:      row.quality as AuroraQuality,
    cloudPenalty: Number(row.cloud_penalty),
    minKpNeeded:  Number(row.min_kp_needed),
    darkStart:    row.dark_start as string | null,
    darkEnd:      row.dark_end as string | null,
    createdAt:    row.created_at as string,
    updatedAt:    row.updated_at as string,
  }
}

export async function getAuroraForecast(
  locationId: string,
  date: string,
): Promise<AuroraForecast | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('aurora_forecasts')
    .select('*')
    .eq('location_id', locationId)
    .eq('forecast_date', date)
    .single()

  if (!data) return null
  return mapRow(data as Record<string, unknown>)
}

export async function upsertAuroraForecast(params: {
  locationId:   string
  forecastDate: string
  kpPeak:       number
  auroraScore:  number
  quality:      AuroraQuality
  cloudPenalty: number
  minKpNeeded:  number
  darkStart:    string | null
  darkEnd:      string | null
}): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('aurora_forecasts').upsert(
    {
      location_id:   params.locationId,
      forecast_date: params.forecastDate,
      kp_peak:       params.kpPeak,
      aurora_score:  params.auroraScore,
      quality:       params.quality,
      cloud_penalty: params.cloudPenalty,
      min_kp_needed: params.minKpNeeded,
      dark_start:    params.darkStart,
      dark_end:      params.darkEnd,
      updated_at:    new Date().toISOString(),
    },
    { onConflict: 'location_id,forecast_date' },
  )
}

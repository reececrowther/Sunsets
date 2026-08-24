import { createAdminClient } from './client'
import type { SunsetForecast, ScoreBreakdown, SunsetQuality } from '@/types'

// Forecast data is considered fresh for 2 hours
const FORECAST_TTL_MS = 2 * 60 * 60 * 1000

function mapRow(row: Record<string, unknown>): SunsetForecast {
  return {
    id: row.id as string,
    locationId: row.location_id as string,
    forecastDate: row.forecast_date as string,
    sunsetTime: row.sunset_time as string | null,
    sunriseTime: row.sunrise_time as string | null,
    solarNoon: row.solar_noon as string | null,
    goldenHourStart: row.golden_hour_start as string | null,
    goldenHourEnd: row.golden_hour_end as string | null,
    blueHourStart: row.blue_hour_start as string | null,
    blueHourEnd: row.blue_hour_end as string | null,
    sunsetAzimuth: row.sunset_azimuth as number | null,
    score: row.score as number | null,
    quality: row.quality as SunsetQuality | null,
    colourProbability: row.colour_probability as number | null,
    confidence: row.confidence as number | null,
    cloudLow: row.cloud_low as number | null,
    cloudMid: row.cloud_mid as number | null,
    cloudHigh: row.cloud_high as number | null,
    totalCloud: row.total_cloud as number | null,
    rainProbability: row.rain_probability as number | null,
    humidity: row.humidity as number | null,
    visibility: row.visibility as number | null,
    windSpeed: row.wind_speed as number | null,
    windDirection: row.wind_direction as number | null,
    pressure: row.pressure as number | null,
    temperature: row.temperature as number | null,
    scoreBreakdown: row.score_breakdown as ScoreBreakdown | null,
    reasons: row.reasons as string[] | null,
    warnings: row.warnings as string[] | null,
    weatherSource: row.weather_source as string,
    fetchedAt: row.fetched_at as string | null,
    expiresAt: row.expires_at as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function getForecastForDate(
  locationId: string,
  date: string,  // YYYY-MM-DD
): Promise<SunsetForecast | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('sunset_forecasts')
    .select('*')
    .eq('location_id', locationId)
    .eq('forecast_date', date)
    .single()

  if (!data) return null
  return mapRow(data)
}

export async function getForecastsForLocation(
  locationId: string,
  days: number = 7,
): Promise<SunsetForecast[]> {
  const supabase = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from('sunset_forecasts')
    .select('*')
    .eq('location_id', locationId)
    .gte('forecast_date', today)
    .order('forecast_date')
    .limit(days)

  return (data ?? []).map(mapRow)
}

export function isForecastStale(forecast: SunsetForecast): boolean {
  if (!forecast.fetchedAt) return true
  const age = Date.now() - new Date(forecast.fetchedAt).getTime()
  return age > FORECAST_TTL_MS
}

export async function getTodayForecastsForLocations(
  locationIds: string[],
): Promise<Map<string, SunsetForecast>> {
  if (locationIds.length === 0) return new Map()
  const supabase = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)
  const { data } = await supabase
    .from('sunset_forecasts')
    .select('*')
    .in('location_id', locationIds)
    .eq('forecast_date', today)

  const result = new Map<string, SunsetForecast>()
  for (const row of data ?? []) {
    result.set(row.location_id as string, mapRow(row))
  }
  return result
}

export async function upsertForecast(
  forecast: Omit<SunsetForecast, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<void> {
  const supabase = createAdminClient()

  const expiresAt = new Date(Date.now() + FORECAST_TTL_MS).toISOString()

  await supabase
    .from('sunset_forecasts')
    .upsert(
      {
        location_id: forecast.locationId,
        forecast_date: forecast.forecastDate,
        sunset_time: forecast.sunsetTime,
        sunrise_time: forecast.sunriseTime,
        solar_noon: forecast.solarNoon,
        golden_hour_start: forecast.goldenHourStart,
        golden_hour_end: forecast.goldenHourEnd,
        blue_hour_start: forecast.blueHourStart,
        blue_hour_end: forecast.blueHourEnd,
        sunset_azimuth: forecast.sunsetAzimuth,
        score: forecast.score,
        quality: forecast.quality,
        colour_probability: forecast.colourProbability,
        confidence: forecast.confidence,
        cloud_low: forecast.cloudLow,
        cloud_mid: forecast.cloudMid,
        cloud_high: forecast.cloudHigh,
        total_cloud: forecast.totalCloud,
        rain_probability: forecast.rainProbability,
        humidity: forecast.humidity,
        visibility: forecast.visibility,
        wind_speed: forecast.windSpeed,
        wind_direction: forecast.windDirection,
        pressure: forecast.pressure,
        temperature: forecast.temperature,
        score_breakdown: forecast.scoreBreakdown,
        reasons: forecast.reasons,
        warnings: forecast.warnings,
        weather_source: forecast.weatherSource,
        fetched_at: forecast.fetchedAt,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'location_id,forecast_date' },
    )
}

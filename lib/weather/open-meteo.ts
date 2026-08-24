// Open-Meteo API client
// Commercial tier (€10/month) required for production.
// Docs: https://open-meteo.com/en/docs

const BASE_URL = 'https://api.open-meteo.com/v1'

// Hourly variables we need for sunset scoring
const HOURLY_VARS = [
  'cloud_cover',
  'cloud_cover_low',
  'cloud_cover_mid',
  'cloud_cover_high',
  'precipitation_probability',
  'visibility',
  'relative_humidity_2m',
  'surface_pressure',
  'wind_speed_10m',
  'wind_direction_10m',
  'temperature_2m',
].join(',')

export interface HourlyWeatherPoint {
  time: string            // ISO timestamp
  cloudCover: number      // 0–100 %
  cloudLow: number        // 0–100 %
  cloudMid: number        // 0–100 %
  cloudHigh: number       // 0–100 %
  precipitationProb: number // 0–100 %
  visibility: number      // metres
  humidity: number        // 0–100 %
  pressure: number        // hPa
  windSpeed: number       // km/h
  windDirection: number   // degrees
  temperature: number     // °C
}

export interface OpenMeteoResponse {
  latitude: number
  longitude: number
  timezone: string
  hourly: HourlyWeatherPoint[]
  fetchedAt: Date
}

interface RawHourly {
  time: string[]
  cloud_cover: number[]
  cloud_cover_low: number[]
  cloud_cover_mid: number[]
  cloud_cover_high: number[]
  precipitation_probability: number[]
  visibility: number[]
  relative_humidity_2m: number[]
  surface_pressure: number[]
  wind_speed_10m: number[]
  wind_direction_10m: number[]
  temperature_2m: number[]
}

export async function fetchWeatherForecast(
  latitude: number,
  longitude: number,
  timezone: string,
): Promise<OpenMeteoResponse> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    hourly: HOURLY_VARS,
    timezone,
    forecast_days: '8',  // today + 7 days
    wind_speed_unit: 'kmh',
  })

  const url = `${BASE_URL}/forecast?${params}`

  const res = await fetch(url, {
    next: { revalidate: 0 },  // never cache in Next.js — we cache in the DB
  })

  if (!res.ok) {
    throw new Error(`Open-Meteo error ${res.status}: ${await res.text()}`)
  }

  const data = await res.json()
  const raw: RawHourly = data.hourly

  const hourly: HourlyWeatherPoint[] = raw.time.map((time, i) => ({
    time,
    cloudCover: raw.cloud_cover[i] ?? 0,
    cloudLow: raw.cloud_cover_low[i] ?? 0,
    cloudMid: raw.cloud_cover_mid[i] ?? 0,
    cloudHigh: raw.cloud_cover_high[i] ?? 0,
    precipitationProb: raw.precipitation_probability[i] ?? 0,
    visibility: raw.visibility[i] ?? 10000,
    humidity: raw.relative_humidity_2m[i] ?? 50,
    pressure: raw.surface_pressure[i] ?? 1013,
    windSpeed: raw.wind_speed_10m[i] ?? 0,
    windDirection: raw.wind_direction_10m[i] ?? 0,
    temperature: raw.temperature_2m[i] ?? 15,
  }))

  return {
    latitude: data.latitude,
    longitude: data.longitude,
    timezone: data.timezone,
    hourly,
    fetchedAt: new Date(),
  }
}

// Extract the weather at a given hour (or nearest available)
export function getWeatherAtTime(
  hourly: HourlyWeatherPoint[],
  targetTime: Date,
): HourlyWeatherPoint | null {
  const targetISO = targetTime.toISOString().slice(0, 13) // 'YYYY-MM-DDTHH'

  const match = hourly.find(h => h.time.startsWith(targetISO))
  if (match) return match

  // Fall back to the nearest hour
  const targetMs = targetTime.getTime()
  let closest: HourlyWeatherPoint | null = null
  let closestDiff = Infinity

  for (const point of hourly) {
    const diff = Math.abs(new Date(point.time).getTime() - targetMs)
    if (diff < closestDiff) {
      closestDiff = diff
      closest = point
    }
  }

  return closest
}

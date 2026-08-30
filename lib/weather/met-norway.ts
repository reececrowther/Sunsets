// MET Norway Locationforecast 2.0 API client
// Completely free — no API key, no rate limit (reasonable use).
// Requires a descriptive User-Agent header per their terms of service.
// Docs: https://api.met.no/weatherapi/locationforecast/2.0/documentation
// All times in the response are UTC.

const BASE_URL = 'https://api.met.no/weatherapi/locationforecast/2.0/complete'
const USER_AGENT = 'Afterglow/1.0 reece.crowther@platform81.com'

export interface HourlyWeatherPoint {
  time: string            // ISO timestamp (UTC)
  cloudCover: number      // 0–100 %
  cloudLow: number        // 0–100 %
  cloudMid: number        // 0–100 %
  cloudHigh: number       // 0–100 %
  precipitationProb: number  // 0–100 %
  visibility: number      // metres (estimated from fog fraction + dew point depression)
  humidity: number        // 0–100 %
  pressure: number        // hPa
  windSpeed: number       // km/h (converted from m/s)
  windDirection: number   // degrees
  temperature: number     // °C
  dewPoint: number        // °C
}

export interface MetNorwayResponse {
  latitude: number
  longitude: number
  hourly: HourlyWeatherPoint[]
  fetchedAt: Date
}

// ── Raw response shapes ───────────────────────────────────────────────────────

interface RawInstantDetails {
  air_pressure_at_sea_level?: number
  air_temperature?: number
  cloud_area_fraction?: number
  cloud_area_fraction_high?: number
  cloud_area_fraction_low?: number
  cloud_area_fraction_medium?: number
  dew_point_temperature?: number
  fog_area_fraction?: number
  relative_humidity?: number
  wind_from_direction?: number
  wind_speed?: number
}

interface RawNextHourDetails {
  precipitation_probability?: number
}

interface RawTimeseries {
  time: string
  data: {
    instant: { details: RawInstantDetails }
    next_1_hours?: { details: RawNextHourDetails }
    next_6_hours?: { details: RawNextHourDetails }
  }
}

// ── Visibility estimation ─────────────────────────────────────────────────────
// MET Norway does not provide visibility directly. Fog fraction and dew point
// depression (temp - dew point) are the best available proxies.
// Smaller dew point depression = air closer to saturation = more fog/haze risk.

function estimateVisibility(
  fogFraction: number,   // 0–100 %
  humidity: number,      // 0–100 %
  temperature: number,   // °C
  dewPoint: number,      // °C
): number {
  const depression = temperature - dewPoint

  if (fogFraction > 15) return 200     // dense fog
  if (fogFraction > 5)  return 600     // patchy fog
  if (depression < 1.5 || humidity > 95) return 800   // near-saturation
  if (depression < 3   || humidity > 90) return 2000  // misty
  if (humidity > 82) return 5000       // hazy
  if (humidity > 72) return 10000      // light haze
  return 25000                          // good clarity
}

// ── Main fetch ────────────────────────────────────────────────────────────────

export async function fetchWeatherForecast(
  latitude: number,
  longitude: number,
  _timezone: string,  // unused — MET Norway always returns UTC
): Promise<MetNorwayResponse> {
  const params = new URLSearchParams({
    lat: latitude.toFixed(4),
    lon: longitude.toFixed(4),
  })

  const url = `${BASE_URL}?${params}`

  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    next: { revalidate: 0 },  // never cache in Next.js — we cache in the DB
  })

  if (!res.ok) {
    throw new Error(`MET Norway error ${res.status}: ${await res.text()}`)
  }

  const data = await res.json()
  const timeseries: RawTimeseries[] = data.properties?.timeseries ?? []

  const hourly: HourlyWeatherPoint[] = timeseries.map(entry => {
    const d = entry.data.instant.details

    const temperature = d.air_temperature ?? 15
    const dewPoint    = d.dew_point_temperature ?? (temperature - 10)
    const humidity    = d.relative_humidity ?? 60
    const fogFraction = d.fog_area_fraction ?? 0

    // Prefer 1-hour precipitation probability; fall back to 6-hour
    const precipProb =
      entry.data.next_1_hours?.details?.precipitation_probability ??
      entry.data.next_6_hours?.details?.precipitation_probability ??
      0

    return {
      time:              entry.time,
      cloudCover:        d.cloud_area_fraction         ?? 0,
      cloudLow:          d.cloud_area_fraction_low     ?? 0,
      cloudMid:          d.cloud_area_fraction_medium  ?? 0,
      cloudHigh:         d.cloud_area_fraction_high    ?? 0,
      precipitationProb: precipProb,
      visibility:        estimateVisibility(fogFraction, humidity, temperature, dewPoint),
      humidity,
      pressure:          d.air_pressure_at_sea_level   ?? 1013,
      windSpeed:         (d.wind_speed ?? 0) * 3.6,   // m/s → km/h
      windDirection:     d.wind_from_direction         ?? 0,
      temperature,
      dewPoint,
    }
  })

  const coords = data.geometry?.coordinates ?? [longitude, latitude]

  return {
    latitude:  coords[1],
    longitude: coords[0],
    hourly,
    fetchedAt: new Date(),
  }
}

// ── Time lookup ───────────────────────────────────────────────────────────────
// Both the target time (from suncalc) and MET Norway times are UTC, so slicing
// to 'YYYY-MM-DDTHH' gives a consistent comparison.

export function getWeatherAtTime(
  hourly: HourlyWeatherPoint[],
  targetTime: Date,
): HourlyWeatherPoint | null {
  const targetPrefix = targetTime.toISOString().slice(0, 13) // 'YYYY-MM-DDTHH'

  const exact = hourly.find(h => h.time.startsWith(targetPrefix))
  if (exact) return exact

  // Fall back to the nearest available point (handles 6-hourly resolution for days 4–7)
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

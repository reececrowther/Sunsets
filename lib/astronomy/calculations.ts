import * as SunCalc from 'suncalc'

export interface AstronomicalData {
  sunriseTime: Date
  sunsetTime: Date
  solarNoon: Date
  goldenHourStart: Date  // morning
  goldenHourEnd: Date    // evening golden hour end = after sunset
  blueHourStart: Date    // civil twilight end (morning)
  blueHourEnd: Date      // civil twilight start (evening)
  sunsetAzimuth: number  // degrees 0–360, clockwise from north
  sunriseAzimuth: number
}

export function getAstronomicalData(
  date: Date,
  latitude: number,
  longitude: number,
): AstronomicalData {
  const times = SunCalc.getTimes(date, latitude, longitude)

  // SunCalc returns null for events that don't occur (polar regions).
  // For UK latitudes these never happen, but we guard defensively.
  const sunset = times.sunset ?? new Date(date.getTime() + 20 * 3600 * 1000)
  const sunrise = times.sunrise ?? new Date(date.getTime() + 6 * 3600 * 1000)

  // Compute azimuth analytically from sun declination.
  // SunCalc.getPosition produces linearly drifting values for future dates
  // due to a date/time representation issue, so we derive declination from
  // the day-of-year instead — accurate to ±1° which is sufficient for display.
  const sunsetAzimuth = computeAzimuth(date, latitude, 'set')
  const sunriseAzimuth = computeAzimuth(date, latitude, 'rise')

  return {
    sunriseTime: sunrise,
    sunsetTime: sunset,
    solarNoon: times.solarNoon ?? new Date(date.getTime() + 13 * 3600 * 1000),
    goldenHourStart: times.goldenHourEnd ?? new Date(sunrise.getTime() - 3600 * 1000),
    goldenHourEnd: times.goldenHour ?? new Date(sunset.getTime() + 3600 * 1000),
    blueHourStart: times.dawn ?? new Date(sunrise.getTime() - 30 * 60 * 1000),
    blueHourEnd: times.dusk ?? new Date(sunset.getTime() + 30 * 60 * 1000),
    sunsetAzimuth,
    sunriseAzimuth,
  }
}

// Compute sunrise/sunset compass bearing (0=N, 90=E, 180=S, 270=W) analytically.
// Uses the standard spherical astronomy formula:
//   cos(Az_from_north) = sin(dec) / cos(lat)
// where dec is the sun's declination for the given date.
function computeAzimuth(date: Date, latitude: number, event: 'rise' | 'set'): number {
  const lat = (latitude * Math.PI) / 180

  // Day of year (1-indexed)
  const yearStart = new Date(Date.UTC(date.getFullYear(), 0, 0))
  const dayOfYear = Math.floor((date.getTime() - yearStart.getTime()) / 86_400_000)

  // Sun's declination in radians (Spencer's approximation, accurate to ~0.01°)
  const declDeg = 23.45 * Math.sin(((360 * (284 + dayOfYear)) / 365) * (Math.PI / 180))
  const decl = declDeg * (Math.PI / 180)

  const cosAz = Math.sin(decl) / Math.cos(lat)
  // Clamp to [-1, 1] — outside this range means polar day or polar night
  if (Math.abs(cosAz) >= 1) return 270

  const azFromNorth = (Math.acos(Math.max(-1, Math.min(1, cosAz))) * 180) / Math.PI

  // Sunset: western sky → compass = 360 − azFromNorth
  // Sunrise: eastern sky → compass = azFromNorth
  const compass = event === 'set' ? 360 - azFromNorth : azFromNorth
  return Math.round(compass * 10) / 10
}

// Convert azimuth degrees to a compass direction label
export function azimuthToCompass(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const index = Math.round(degrees / 22.5) % 16
  return directions[index]
}

// Best viewing window — starts ~40 minutes before sunset, ends at blue hour end
export function getViewingWindow(astronomical: AstronomicalData): { start: Date; end: Date } {
  const start = new Date(astronomical.sunsetTime.getTime() - 40 * 60 * 1000)
  const end = astronomical.blueHourEnd
  return { start, end }
}

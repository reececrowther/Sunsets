// NOAA Space Weather Prediction Centre — Planetary K-index forecast.
// Free, no API key. Returns 3-hourly Kp predictions for the next 3 days.
// https://www.swpc.noaa.gov/products/planetary-k-index

export interface KpReading {
  time: Date    // UTC, start of the 3-hour window
  kp:   number
}

const KP_URL = 'https://services.swpc.noaa.gov/products/noaa-planetary-k-index-forecast.json'

export async function fetchKpForecast(): Promise<KpReading[]> {
  const res = await fetch(KP_URL, {
    headers: { 'User-Agent': 'SunsetScore/1.0 (afterglow.app; contact@afterglow.app)' },
    next: { revalidate: 0 },
  })

  if (!res.ok) throw new Error(`NOAA Kp fetch failed: ${res.status}`)

  const raw: (string | null)[][] = await res.json()

  // First row is column headers — skip it
  const rows = raw.slice(1)

  return rows
    .map(row => {
      const timeStr = row[0]
      const kpStr   = row[1]
      if (!timeStr || !kpStr) return null

      const time = new Date(timeStr.replace(' ', 'T') + 'Z')
      const kp   = parseFloat(kpStr)
      if (isNaN(time.getTime()) || isNaN(kp)) return null

      return { time, kp }
    })
    .filter((r): r is KpReading => r !== null)
}

// Find the peak Kp value within a time window
export function peakKpInWindow(readings: KpReading[], start: Date, end: Date): number {
  const inWindow = readings.filter(r => r.time >= start && r.time <= end)
  if (inWindow.length === 0) {
    // Fall back to the next 12 hours of readings if window is empty
    const fallbackEnd = new Date(start.getTime() + 12 * 60 * 60 * 1000)
    const fallback = readings.filter(r => r.time >= start && r.time <= fallbackEnd)
    return fallback.length > 0 ? Math.max(...fallback.map(r => r.kp)) : 0
  }
  return Math.max(...inWindow.map(r => r.kp))
}

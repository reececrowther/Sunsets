// Offline tidal prediction using the Slackwater harmonic engine.
// Finds the nearest tide gauge station to a lat/lon and computes
// high/low extremes for any date — zero external API calls, zero cost.
//
// Packages: @slackwater/engine  @slackwater/database
// Station data: TICON-4 worldwide dataset, UK coverage confirmed.

import { nearest } from '@slackwater/database'
import { useStation } from '@slackwater/engine'

export type TideType = 'High' | 'Low'

export interface TideExtreme {
  timestamp: number    // Unix seconds UTC
  isoDate:   string    // ISO 8601
  height:    number    // metres above chart datum
  type:      TideType
}

export interface TideResult {
  stationName: string
  distanceKm:  number
  extremes:    TideExtreme[]
}

export async function fetchTideExtremes(
  latitude:  number,
  longitude: number,
  date:      string,   // YYYY-MM-DD
): Promise<TideResult | null> {
  const hit = nearest({ lat: latitude, lon: longitude })
  if (!hit) return null

  const [station, distanceKm] = hit
  const predictor = useStation(station)

  const [year, month, day] = date.split('-').map(Number)
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0))
  const end   = new Date(Date.UTC(year, month - 1, day, 23, 59, 59))

  const prediction = predictor.getExtremesPrediction({ start, end })

  const extremes: TideExtreme[] = prediction.extremes.map(e => ({
    timestamp: Math.floor(e.time.getTime() / 1000),
    isoDate:   e.time.toISOString(),
    height:    Number(e.level.toFixed(2)),
    type:      e.high ? 'High' : 'Low',
  }))

  return {
    stationName: station.name,
    distanceKm:  Math.round(distanceKm * 10) / 10,
    extremes,
  }
}

import type { ScoreBreakdown, SunsetQuality } from '@/types'

export interface SunsetScoreInput {
  cloudHigh: number          // 0–100 percent
  cloudMid: number           // 0–100 percent
  cloudLow: number           // 0–100 percent
  rainProbability: number    // 0–100 percent
  visibility: number         // metres
  humidity: number           // 0–100 percent
  pressure: number           // hPa
  forecastDaysAhead: number  // 0 = today, 1 = tomorrow, etc.
}

export interface SunsetScoreResult {
  score: number
  quality: SunsetQuality
  colourProbability: number  // 0–1
  confidence: number         // 0–1
  breakdown: ScoreBreakdown
  reasons: string[]
  warnings: string[]
}

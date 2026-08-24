import { WEIGHTS } from '@/config/weights'
import { clamp, lerp } from './utils'
import { generateExplanations } from './explanations'
import { calculateConfidence } from './confidence'
import type { SunsetScoreInput, SunsetScoreResult } from './types'
import type { SunsetQuality, ScoreBreakdown } from '@/types'

// ─── Individual scoring functions ──────────────────────────────────────────
// Each returns a value in [0, 1] — multiplied by the weight in the caller.
// The scoring curves encode meteorological knowledge: high cirrus is ideal at
// 30–65% coverage; low stratus is almost always a penalty.

function scoreHighCloud(pct: number): number {
  if (pct <= 0) return 0.40          // clear sky — flat colour, no drama
  if (pct <= 10) return lerp(0.40, 0.65, pct / 10)
  if (pct <= 35) return lerp(0.65, 0.88, (pct - 10) / 25)
  if (pct <= 65) return lerp(0.88, 1.00, (pct - 35) / 30)  // sweet spot
  if (pct <= 80) return lerp(1.00, 0.70, (pct - 65) / 15)  // getting thick
  if (pct <= 92) return lerp(0.70, 0.30, (pct - 80) / 12)
  return lerp(0.30, 0.12, (pct - 92) / 8)
}

function scoreMidCloud(pct: number): number {
  if (pct <= 0) return 0.38
  if (pct <= 20) return lerp(0.38, 0.70, pct / 20)
  if (pct <= 50) return lerp(0.70, 1.00, (pct - 20) / 30)  // adds depth
  if (pct <= 70) return lerp(1.00, 0.65, (pct - 50) / 20)
  if (pct <= 90) return lerp(0.65, 0.20, (pct - 70) / 20)
  return lerp(0.20, 0.05, (pct - 90) / 10)
}

function scoreLowCloud(pct: number): number {
  // Low cloud is the enemy — blocks the horizon and kills colour
  if (pct <= 5) return 1.00
  if (pct <= 20) return lerp(1.00, 0.80, (pct - 5) / 15)
  if (pct <= 40) return lerp(0.80, 0.50, (pct - 20) / 20)
  if (pct <= 60) return lerp(0.50, 0.20, (pct - 40) / 20)
  if (pct <= 80) return lerp(0.20, 0.05, (pct - 60) / 20)
  return lerp(0.05, 0.00, (pct - 80) / 20)
}

function scoreRain(pct: number): number {
  if (pct <= 5) return 1.00
  if (pct <= 15) return lerp(1.00, 0.73, (pct - 5) / 10)
  if (pct <= 30) return lerp(0.73, 0.40, (pct - 15) / 15)
  if (pct <= 50) return lerp(0.40, 0.13, (pct - 30) / 20)
  if (pct <= 70) return lerp(0.13, 0.03, (pct - 50) / 20)
  return lerp(0.03, 0.00, (pct - 70) / 30)
}

function scoreVisibility(metres: number): number {
  if (metres >= 20000) return 1.00
  if (metres >= 10000) return lerp(0.73, 1.00, (metres - 10000) / 10000)
  if (metres >= 5000)  return lerp(0.47, 0.73, (metres - 5000) / 5000)
  if (metres >= 2000)  return lerp(0.20, 0.47, (metres - 2000) / 3000)
  if (metres >= 500)   return lerp(0.07, 0.20, (metres - 500) / 1500)
  return 0
}

function scoreAtmosphere(humidity: number, pressure: number): number {
  let score = 0.50

  // Some humidity enhances scattering; too much causes haze
  if (humidity >= 40 && humidity <= 65) score += 0.25
  else if (humidity >= 30 && humidity <= 78) score += 0.12
  else if (humidity > 85) score -= 0.10

  // High pressure = stable, clear; low = unsettled
  if (pressure >= 1015 && pressure <= 1030) score += 0.25
  else if (pressure >= 1007 && pressure <= 1038) score += 0.12
  else if (pressure < 1000) score -= 0.15

  return clamp(score, 0, 1)
}

// ─── Quality label ──────────────────────────────────────────────────────────

function qualityFromScore(score: number): SunsetQuality {
  if (score >= 81) return 'excellent'
  if (score >= 61) return 'great'
  if (score >= 41) return 'good'
  if (score >= 21) return 'fair'
  return 'poor'
}

// ─── Colour probability ─────────────────────────────────────────────────────

function colourProbability(input: SunsetScoreInput, score: number): number {
  let prob = score / 100

  // Bonus when high cloud is in the ideal range
  if (input.cloudHigh >= 25 && input.cloudHigh <= 70) prob *= 1.12
  else if (input.cloudHigh < 8) prob *= 0.72   // clear sky = muted colours

  // Heavy low cloud kills colour even if score is moderate
  if (input.cloudLow > 65) prob *= 0.55
  else if (input.cloudLow > 40) prob *= 0.78

  // Rain essentially eliminates colour
  if (input.rainProbability > 50) prob *= 0.40

  return clamp(prob, 0.03, 0.95)
}

// ─── Main engine ─────────────────────────────────────────────────────────────

export function calculateSunsetScore(input: SunsetScoreInput): SunsetScoreResult {
  const breakdown: ScoreBreakdown = {
    highCloud:    Math.round(scoreHighCloud(input.cloudHigh) * WEIGHTS.highCloud),
    midCloud:     Math.round(scoreMidCloud(input.cloudMid) * WEIGHTS.midCloud),
    lowCloud:     Math.round(scoreLowCloud(input.cloudLow) * WEIGHTS.lowCloud),
    rain:         Math.round(scoreRain(input.rainProbability) * WEIGHTS.rain),
    visibility:   Math.round(scoreVisibility(input.visibility) * WEIGHTS.visibility),
    atmosphere:   Math.round(scoreAtmosphere(input.humidity, input.pressure) * WEIGHTS.atmosphere),
    forecastConf: Math.round(calculateConfidence(input.forecastDaysAhead).modifier * WEIGHTS.forecastConf),
  }

  const rawScore = Object.values(breakdown).reduce((a, b) => a + b, 0)
  const score = clamp(rawScore, 0, 100)
  const quality = qualityFromScore(score)
  const confidence = calculateConfidence(input.forecastDaysAhead).value
  const { reasons, warnings } = generateExplanations(input, breakdown, input.forecastDaysAhead)

  return {
    score,
    quality,
    colourProbability: colourProbability(input, score),
    confidence,
    breakdown,
    reasons,
    warnings,
  }
}

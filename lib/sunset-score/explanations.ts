import type { ScoreBreakdown } from '@/types'
import type { SunsetScoreInput } from './types'

interface Explanations {
  reasons: string[]
  warnings: string[]
}

export function generateExplanations(
  input: SunsetScoreInput,
  breakdown: ScoreBreakdown,
  daysAhead: number,
): Explanations {
  const reasons: string[] = []
  const warnings: string[] = []

  // Positive factors
  if (breakdown.highCloud >= Math.round(0.80 * 20)) {
    reasons.push('High-level cloud is ideal for catching sunlight')
  } else if (breakdown.highCloud >= Math.round(0.60 * 20)) {
    reasons.push('Some high-level cloud to add colour')
  }

  if (breakdown.midCloud >= Math.round(0.75 * 13)) {
    reasons.push('Mid-level cloud adds dramatic texture')
  }

  if (breakdown.lowCloud >= Math.round(0.85 * 20)) {
    reasons.push('Clear western horizon for an unobstructed view')
  } else if (breakdown.lowCloud >= Math.round(0.65 * 20)) {
    reasons.push('Mostly clear horizon with minor cloud patches')
  }

  if (breakdown.rain >= Math.round(0.85 * 15)) {
    reasons.push('Very low chance of rain')
  }

  if (breakdown.visibility >= Math.round(0.85 * 15)) {
    reasons.push('Excellent visibility')
  } else if (breakdown.visibility >= Math.round(0.60 * 15)) {
    reasons.push('Good visibility')
  }

  if (breakdown.atmosphere >= Math.round(0.80 * 10)) {
    reasons.push('Favourable atmospheric conditions')
  }

  if (input.windSpeed >= 10 && input.windSpeed <= 30) {
    reasons.push('Light breeze will keep the air clear')
  }

  // Negative factors
  if (input.cloudLow > 65) {
    warnings.push('Low cloud is likely to obstruct the horizon')
  } else if (input.cloudLow > 40) {
    warnings.push('Low cloud may partially obscure the horizon')
  }

  if (input.rainProbability > 45) {
    warnings.push('Significant risk of rain')
  } else if (input.rainProbability > 20) {
    warnings.push('Some chance of rain')
  }

  if (input.visibility < 3000) {
    warnings.push('Poor visibility — haze or fog likely')
  } else if (input.visibility < 8000) {
    warnings.push('Reduced visibility due to haze')
  }

  if (input.cloudHigh < 8 && input.cloudMid < 10) {
    warnings.push('Very little cloud to catch the light — colours may be muted')
  }

  if (input.windSpeed > 50) {
    warnings.push('Strong winds may disrupt cloud formations')
  }

  if (daysAhead >= 4) {
    warnings.push('Forecast confidence is low this far ahead — check again closer to the day')
  } else if (daysAhead >= 2) {
    warnings.push('Forecast may change — worth rechecking closer to sunset')
  }

  // Always have at least one entry in each array to avoid empty states
  if (reasons.length === 0) {
    reasons.push('Conditions are unlikely to produce a colourful sunset')
  }

  return { reasons, warnings }
}

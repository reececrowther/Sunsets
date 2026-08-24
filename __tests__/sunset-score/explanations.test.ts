import { generateExplanations } from '@/lib/sunset-score/explanations'
import type { SunsetScoreInput } from '@/lib/sunset-score/types'
import type { ScoreBreakdown } from '@/types'

const GOOD_INPUT: SunsetScoreInput = {
  cloudHigh: 55,
  cloudMid: 40,
  cloudLow: 5,
  rainProbability: 2,
  visibility: 25000,
  humidity: 55,
  pressure: 1020,
  forecastDaysAhead: 0,
}

// Breakdown values that fire all positive reasons
const GOOD_BREAKDOWN: ScoreBreakdown = {
  highCloud:    16,  // >= Math.round(0.80 * 20) = 16
  midCloud:     10,  // >= Math.round(0.75 * 13) = 10
  lowCloud:     17,  // >= Math.round(0.85 * 20) = 17
  rain:         13,  // >= Math.round(0.85 * 15) = 13
  visibility:   13,  // >= Math.round(0.85 * 15) = 13
  atmosphere:    8,  // >= Math.round(0.80 * 10) = 8
  forecastConf:  7,
}

const ZERO_BREAKDOWN: ScoreBreakdown = {
  highCloud: 0, midCloud: 0, lowCloud: 0, rain: 0, visibility: 0, atmosphere: 0, forecastConf: 0,
}

describe('generateExplanations — reasons', () => {
  it('always returns at least one reason', () => {
    const { reasons } = generateExplanations(GOOD_INPUT, GOOD_BREAKDOWN, 0)
    expect(reasons.length).toBeGreaterThan(0)
  })

  it('mentions ideal high cloud when breakdown.highCloud is strong', () => {
    const { reasons } = generateExplanations(GOOD_INPUT, GOOD_BREAKDOWN, 0)
    expect(reasons.some(r => r.includes('High-level cloud'))).toBe(true)
  })

  it('mentions mid cloud texture when breakdown.midCloud is strong', () => {
    const { reasons } = generateExplanations(GOOD_INPUT, GOOD_BREAKDOWN, 0)
    expect(reasons.some(r => r.includes('texture'))).toBe(true)
  })

  it('mentions clear horizon when breakdown.lowCloud is strong', () => {
    const { reasons } = generateExplanations(GOOD_INPUT, GOOD_BREAKDOWN, 0)
    expect(reasons.some(r => r.toLowerCase().includes('horizon'))).toBe(true)
  })

  it('falls back to a negative reason when no positive factors fire', () => {
    const flatInput: SunsetScoreInput = { ...GOOD_INPUT, cloudHigh: 0, cloudMid: 0 }
    const { reasons } = generateExplanations(flatInput, ZERO_BREAKDOWN, 0)
    expect(reasons[0]).toBe('Conditions are unlikely to produce a colourful sunset')
  })
})

describe('generateExplanations — warnings', () => {
  it('warns about obstructed horizon when cloudLow > 65', () => {
    const input = { ...GOOD_INPUT, cloudLow: 80 }
    const { warnings } = generateExplanations(input, GOOD_BREAKDOWN, 0)
    expect(warnings.some(w => w.includes('obstruct the horizon'))).toBe(true)
  })

  it('warns about partial low cloud when cloudLow is 41–65', () => {
    const input = { ...GOOD_INPUT, cloudLow: 50 }
    const { warnings } = generateExplanations(input, GOOD_BREAKDOWN, 0)
    expect(warnings.some(w => w.includes('partially obscure'))).toBe(true)
  })

  it('warns about significant rain when probability > 45', () => {
    const input = { ...GOOD_INPUT, rainProbability: 60 }
    const { warnings } = generateExplanations(input, GOOD_BREAKDOWN, 0)
    expect(warnings.some(w => w.includes('Significant risk'))).toBe(true)
  })

  it('warns about some rain when probability is 21–45', () => {
    const input = { ...GOOD_INPUT, rainProbability: 30 }
    const { warnings } = generateExplanations(input, GOOD_BREAKDOWN, 0)
    expect(warnings.some(w => w.includes('Some chance of rain'))).toBe(true)
  })

  it('warns about fog when visibility < 3000m', () => {
    const input = { ...GOOD_INPUT, visibility: 1000 }
    const { warnings } = generateExplanations(input, GOOD_BREAKDOWN, 0)
    expect(warnings.some(w => w.includes('haze or fog'))).toBe(true)
  })

  it('warns about reduced visibility at 3000–8000m', () => {
    const input = { ...GOOD_INPUT, visibility: 5000 }
    const { warnings } = generateExplanations(input, GOOD_BREAKDOWN, 0)
    expect(warnings.some(w => w.includes('Reduced visibility'))).toBe(true)
  })

  it('warns about low confidence for 4-day+ forecasts', () => {
    const { warnings } = generateExplanations(GOOD_INPUT, GOOD_BREAKDOWN, 4)
    expect(warnings.some(w => w.includes('confidence is low'))).toBe(true)
  })

  it('warns to recheck for 2–3 day forecasts', () => {
    const { warnings } = generateExplanations(GOOD_INPUT, GOOD_BREAKDOWN, 2)
    expect(warnings.some(w => w.includes('Forecast may change'))).toBe(true)
  })

  it('warns about clear sky with no cloud to catch the light', () => {
    const input = { ...GOOD_INPUT, cloudHigh: 3, cloudMid: 5 }
    const { warnings } = generateExplanations(input, GOOD_BREAKDOWN, 0)
    expect(warnings.some(w => w.includes('muted'))).toBe(true)
  })

  it('produces no warnings for ideal same-day conditions', () => {
    const { warnings } = generateExplanations(GOOD_INPUT, GOOD_BREAKDOWN, 0)
    expect(warnings).toHaveLength(0)
  })
})

import { calculateSunsetScore } from '@/lib/sunset-score/engine'
import type { SunsetScoreInput } from '@/lib/sunset-score/types'

const PERFECT: SunsetScoreInput = {
  cloudHigh: 55,
  cloudMid: 40,
  cloudLow: 5,
  rainProbability: 2,
  visibility: 25000,
  dewPoint: 10,       // temperature=20, dewPoint=10 → depression=10°C (ideal range 6–14)
  temperature: 20,
  pressure: 1020,
  windSpeed: 18,      // light breeze — ideal
  forecastDaysAhead: 0,
}

const TERRIBLE: SunsetScoreInput = {
  cloudHigh: 0,
  cloudMid: 0,
  cloudLow: 95,
  rainProbability: 85,
  visibility: 800,
  dewPoint: 13,       // temperature=14, dewPoint=13 → depression=1°C (near-saturation)
  temperature: 14,
  pressure: 992,
  windSpeed: 75,      // gale force
  forecastDaysAhead: 0,
}

describe('calculateSunsetScore', () => {
  describe('ideal conditions', () => {
    it('scores 80+ for perfect conditions', () => {
      const result = calculateSunsetScore(PERFECT)
      expect(result.score).toBeGreaterThanOrEqual(80)
    })

    it('returns excellent quality for a high score', () => {
      const result = calculateSunsetScore(PERFECT)
      expect(result.quality).toBe('excellent')
    })

    it('returns high colour probability for ideal conditions', () => {
      const result = calculateSunsetScore(PERFECT)
      expect(result.colourProbability).toBeGreaterThan(0.70)
    })

    it('returns high confidence for same-day forecast', () => {
      const result = calculateSunsetScore(PERFECT)
      expect(result.confidence).toBeGreaterThan(0.88)
    })

    it('includes at least one positive reason', () => {
      const result = calculateSunsetScore(PERFECT)
      expect(result.reasons.length).toBeGreaterThan(0)
    })
  })

  describe('terrible conditions', () => {
    it('scores well below a good sunset (≤30) for terrible conditions', () => {
      // Dense low cloud (0.35×) and heavy rain (0.40×) multipliers collapse the score
      const result = calculateSunsetScore(TERRIBLE)
      expect(result.score).toBeLessThanOrEqual(30)
    })

    it('returns poor or fair quality for terrible conditions', () => {
      const result = calculateSunsetScore(TERRIBLE)
      expect(['poor', 'fair']).toContain(result.quality)
    })

    it('returns low colour probability when conditions are bad', () => {
      const result = calculateSunsetScore(TERRIBLE)
      expect(result.colourProbability).toBeLessThan(0.20)
    })

    it('includes at least one warning', () => {
      const result = calculateSunsetScore(TERRIBLE)
      expect(result.warnings.length).toBeGreaterThan(0)
    })
  })

  describe('scoring breakdown', () => {
    it('breakdown values are non-negative', () => {
      const result = calculateSunsetScore(PERFECT)
      for (const val of Object.values(result.breakdown)) {
        expect(val).toBeGreaterThanOrEqual(0)
      }
    })

    it('breakdown sum approximately equals score for conditions without multiplier penalties', () => {
      // PERFECT has cloudLow=5 and rain=2, so both multipliers are 1.0 — sum ≈ score
      const result = calculateSunsetScore(PERFECT)
      const sum = Object.values(result.breakdown).reduce((a, b) => a + b, 0)
      expect(Math.abs(sum - result.score)).toBeLessThanOrEqual(2)  // rounding tolerance
    })
  })

  describe('low cloud penalty', () => {
    it('reduces score significantly when low cloud is 100%', () => {
      const highLowCloud: SunsetScoreInput = { ...PERFECT, cloudLow: 100 }
      const clear   = calculateSunsetScore(PERFECT)
      const blocked = calculateSunsetScore(highLowCloud)
      expect(blocked.score).toBeLessThan(clear.score)
      expect(blocked.breakdown.lowCloud).toBe(0)
    })

    it('awards full low cloud points when sky is clear below', () => {
      const clearHorizon: SunsetScoreInput = { ...PERFECT, cloudLow: 0 }
      const result = calculateSunsetScore(clearHorizon)
      expect(result.breakdown.lowCloud).toBe(20)
    })

    it('applies horizon kill-switch multiplier when low cloud exceeds 75%', () => {
      const blocked = calculateSunsetScore({ ...PERFECT, cloudLow: 80 })
      const clear   = calculateSunsetScore(PERFECT)
      // Horizon multiplier (0.35×) should pull the score down significantly
      expect(blocked.score).toBeLessThan(clear.score * 0.50)
    })
  })

  describe('rain penalty', () => {
    it('scores near zero for rain factor when rain probability is 90%', () => {
      const rainy: SunsetScoreInput = { ...PERFECT, rainProbability: 90 }
      const result = calculateSunsetScore(rainy)
      expect(result.breakdown.rain).toBeLessThanOrEqual(1)
    })

    it('applies rain kill-switch multiplier when rain exceeds 60%', () => {
      const rainy = calculateSunsetScore({ ...PERFECT, rainProbability: 75 })
      const dry   = calculateSunsetScore(PERFECT)
      expect(rainy.score).toBeLessThan(dry.score * 0.55)
    })
  })

  describe('forecast confidence', () => {
    it('returns high confidence for same-day forecast', () => {
      const result = calculateSunsetScore({ ...PERFECT, forecastDaysAhead: 0 })
      expect(result.confidence).toBeGreaterThan(0.88)
    })

    it('returns lower confidence for a 5-day forecast', () => {
      const result = calculateSunsetScore({ ...PERFECT, forecastDaysAhead: 5 })
      expect(result.confidence).toBeLessThan(0.40)
    })

    it('confidence decreases for longer-range forecasts', () => {
      const near = calculateSunsetScore({ ...PERFECT, forecastDaysAhead: 0 })
      const far  = calculateSunsetScore({ ...PERFECT, forecastDaysAhead: 6 })
      expect(near.confidence).toBeGreaterThan(far.confidence)
    })
  })

  describe('score boundaries', () => {
    it('score is always between 0 and 100', () => {
      const inputs: SunsetScoreInput[] = [
        PERFECT,
        TERRIBLE,
        { ...PERFECT, cloudHigh: 100, cloudMid: 100, cloudLow: 100 },
        { ...PERFECT, cloudHigh: 0, cloudMid: 0, cloudLow: 0, rainProbability: 0 },
      ]
      for (const input of inputs) {
        const { score } = calculateSunsetScore(input)
        expect(score).toBeGreaterThanOrEqual(0)
        expect(score).toBeLessThanOrEqual(100)
      }
    })

    it('colour probability is always between 0.03 and 0.95', () => {
      const { colourProbability: p1 } = calculateSunsetScore(PERFECT)
      const { colourProbability: p2 } = calculateSunsetScore(TERRIBLE)
      expect(p1).toBeLessThanOrEqual(0.95)
      expect(p2).toBeGreaterThanOrEqual(0.03)
    })
  })

  describe('high cloud scoring curve', () => {
    // scoreHighCloud: 0% → 0.40 (base); 65% → 1.00 (sweet spot); 100% → 0.12 (overcast)
    it('awards 8 points for a completely clear high sky (cloudHigh = 0)', () => {
      const result = calculateSunsetScore({ ...PERFECT, cloudHigh: 0 })
      expect(result.breakdown.highCloud).toBe(8)  // Math.round(0.40 * 20)
    })

    it('awards maximum 20 points at the sweet spot (cloudHigh = 65)', () => {
      const result = calculateSunsetScore({ ...PERFECT, cloudHigh: 65 })
      expect(result.breakdown.highCloud).toBe(20)  // Math.round(1.00 * 20)
    })

    it('awards near-zero points for total high overcast (cloudHigh = 100)', () => {
      const result = calculateSunsetScore({ ...PERFECT, cloudHigh: 100 })
      expect(result.breakdown.highCloud).toBeLessThanOrEqual(3)  // Math.round(0.12 * 20) = 2
    })

    it('scores higher at 65% than at 0% high cloud', () => {
      const clear = calculateSunsetScore({ ...PERFECT, cloudHigh: 0 })
      const sweet = calculateSunsetScore({ ...PERFECT, cloudHigh: 65 })
      expect(sweet.breakdown.highCloud).toBeGreaterThan(clear.breakdown.highCloud)
    })
  })

  describe('mid cloud scoring curve', () => {
    // scoreMidCloud: 0% → 0.38 (base); 50% → 1.00 (peak); 100% → 0.05 (overcast)
    it('awards 5 points for a clear mid-level sky (cloudMid = 0)', () => {
      const result = calculateSunsetScore({ ...PERFECT, cloudMid: 0 })
      expect(result.breakdown.midCloud).toBe(5)  // Math.round(0.38 * 13)
    })

    it('awards maximum 13 points at the peak (cloudMid = 50)', () => {
      const result = calculateSunsetScore({ ...PERFECT, cloudMid: 50 })
      expect(result.breakdown.midCloud).toBe(13)  // Math.round(1.00 * 13)
    })

    it('awards near-zero points for total mid overcast (cloudMid = 100)', () => {
      const result = calculateSunsetScore({ ...PERFECT, cloudMid: 100 })
      expect(result.breakdown.midCloud).toBeLessThanOrEqual(1)  // Math.round(0.05 * 13) = 1
    })
  })

  describe('visibility tiers', () => {
    // scoreVisibility: ≥20km → 1.00; 10km → 0.73; <500m → 0
    it('awards full 15 points at 20km+', () => {
      const result = calculateSunsetScore({ ...PERFECT, visibility: 25000 })
      expect(result.breakdown.visibility).toBe(15)
    })

    it('awards 11 points at 10km (lerp boundary)', () => {
      const result = calculateSunsetScore({ ...PERFECT, visibility: 10000 })
      expect(result.breakdown.visibility).toBe(11)  // Math.round(0.73 * 15)
    })

    it('awards 0 points below 500m', () => {
      const result = calculateSunsetScore({ ...PERFECT, visibility: 0 })
      expect(result.breakdown.visibility).toBe(0)
    })
  })

  describe('atmosphere scoring', () => {
    // scoreAtmosphere uses dew point depression (temp − dew point) + pressure
    // Ideal depression (6–14°C) + ideal pressure (1015–1030) = 1.00
    it('awards maximum 10 points for ideal dew point depression and pressure', () => {
      // PERFECT: temperature=20, dewPoint=10 → depression=10°C (ideal); pressure=1020 (ideal)
      const result = calculateSunsetScore(PERFECT)
      expect(result.breakdown.atmosphere).toBe(10)  // Math.round(1.00 * 10)
    })

    it('awards reduced points when air is near-saturated and pressure is low', () => {
      const ideal = calculateSunsetScore(PERFECT)
      // TERRIBLE: temperature=14, dewPoint=13 → depression=1°C (near-saturation); pressure=992
      const poor  = calculateSunsetScore(TERRIBLE)
      expect(poor.breakdown.atmosphere).toBeLessThan(ideal.breakdown.atmosphere)
    })
  })

  describe('wind scoring', () => {
    // scoreWind: 0–5 km/h → 0.40–0.60 (stagnant); 10–20 → peak ≈ 1.00; >60 → 0.25–0.10
    it('awards maximum 7 points for an ideal light breeze (20 km/h)', () => {
      const result = calculateSunsetScore({ ...PERFECT, windSpeed: 20 })
      expect(result.breakdown.wind).toBe(7)  // Math.round(1.00 * 7)
    })

    it('awards fewer points for very calm conditions (0 km/h)', () => {
      const calm  = calculateSunsetScore({ ...PERFECT, windSpeed: 0 })
      const ideal = calculateSunsetScore({ ...PERFECT, windSpeed: 20 })
      expect(calm.breakdown.wind).toBeLessThan(ideal.breakdown.wind)
    })

    it('awards fewer points for gale-force winds (70 km/h)', () => {
      const gale  = calculateSunsetScore({ ...PERFECT, windSpeed: 70 })
      const ideal = calculateSunsetScore({ ...PERFECT, windSpeed: 20 })
      expect(gale.breakdown.wind).toBeLessThan(ideal.breakdown.wind)
    })
  })

  describe('colour probability modifiers', () => {
    it('is boosted when high cloud is in the ideal range (25–70%)', () => {
      // cloudHigh=10 sits outside both the bonus and penalty range — use as a neutral baseline
      const neutral = calculateSunsetScore({ ...PERFECT, cloudHigh: 10 })
      const ideal   = calculateSunsetScore({ ...PERFECT, cloudHigh: 45 })
      expect(ideal.colourProbability).toBeGreaterThan(neutral.colourProbability)
    })

    it('is reduced by heavy low cloud (cloudLow > 65%)', () => {
      const light = calculateSunsetScore({ ...PERFECT, cloudLow: 10 })
      const heavy = calculateSunsetScore({ ...PERFECT, cloudLow: 80 })
      expect(heavy.colourProbability).toBeLessThan(light.colourProbability)
    })

    it('is severely reduced by high rain probability (> 50%)', () => {
      const dry   = calculateSunsetScore({ ...PERFECT, rainProbability: 5 })
      const rainy = calculateSunsetScore({ ...PERFECT, rainProbability: 75 })
      // ×0.40 rain penalty means rainy should be less than half of dry
      expect(rainy.colourProbability).toBeLessThan(dry.colourProbability * 0.55)
    })
  })

  describe('clear sky scenario', () => {
    const CLEAR_SKY: SunsetScoreInput = {
      cloudHigh: 0,
      cloudMid: 0,
      cloudLow: 0,
      rainProbability: 0,
      visibility: 30000,
      dewPoint: 10,
      temperature: 20,
      pressure: 1025,
      windSpeed: 15,
      forecastDaysAhead: 0,
    }

    it('scores lower than PERFECT conditions (ideal cloud adds more points)', () => {
      const { score: clearScore }   = calculateSunsetScore(CLEAR_SKY)
      const { score: perfectScore } = calculateSunsetScore(PERFECT)
      expect(clearScore).toBeLessThan(perfectScore)
    })

    it('has lower colour probability than conditions with ideal high cloud', () => {
      const { colourProbability: clearProb }   = calculateSunsetScore(CLEAR_SKY)
      const { colourProbability: perfectProb } = calculateSunsetScore(PERFECT)
      expect(clearProb).toBeLessThan(perfectProb)
    })

    it('warns that colours may be muted', () => {
      const { warnings } = calculateSunsetScore({ ...CLEAR_SKY, cloudHigh: 3, cloudMid: 5 })
      expect(warnings.some(w => w.includes('muted'))).toBe(true)
    })
  })
})

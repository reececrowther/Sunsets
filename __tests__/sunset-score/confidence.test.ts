import { calculateConfidence } from '@/lib/sunset-score/confidence'

describe('calculateConfidence', () => {
  it.each([
    [0,  1.00, 0.92],
    [-1, 1.00, 0.92],  // negative treated as today
    [1,  0.86, 0.82],
    [2,  0.71, 0.70],
    [3,  0.43, 0.56],
    [4,  0.21, 0.42],
    [5,  0.14, 0.34],
    [6,  0.07, 0.25],
    [10, 0.07, 0.25],  // beyond day 6 stays at floor
  ])('day %i → modifier %f, value %f', (days, modifier, value) => {
    const result = calculateConfidence(days)
    expect(result.modifier).toBe(modifier)
    expect(result.value).toBe(value)
  })

  it('modifier strictly decreases day-over-day', () => {
    const modifiers = [0, 1, 2, 3, 4, 5, 6].map(d => calculateConfidence(d).modifier)
    for (let i = 1; i < modifiers.length; i++) {
      expect(modifiers[i]).toBeLessThan(modifiers[i - 1])
    }
  })

  it('display value strictly decreases day-over-day', () => {
    const values = [0, 1, 2, 3, 4, 5, 6].map(d => calculateConfidence(d).value)
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeLessThan(values[i - 1])
    }
  })
})

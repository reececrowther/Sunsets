import { calculateConfidence } from '@/lib/sunset-score/confidence'

describe('calculateConfidence', () => {
  it.each([
    [0,  0.92],
    [-1, 0.92],  // negative treated as today
    [1,  0.82],
    [2,  0.70],
    [3,  0.56],
    [4,  0.42],
    [5,  0.34],
    [6,  0.25],
    [10, 0.25],  // beyond day 6 stays at floor
  ])('day %i → value %f', (days, value) => {
    const result = calculateConfidence(days)
    expect(result.value).toBe(value)
  })

  it('display value strictly decreases day-over-day', () => {
    const values = [0, 1, 2, 3, 4, 5, 6].map(d => calculateConfidence(d).value)
    for (let i = 1; i < values.length; i++) {
      expect(values[i]).toBeLessThan(values[i - 1])
    }
  })
})

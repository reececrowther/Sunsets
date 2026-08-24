import { clamp, lerp } from '@/lib/sunset-score/utils'

describe('clamp', () => {
  it('returns the value when within range', () => expect(clamp(5, 0, 10)).toBe(5))
  it('clamps to min when below', ()           => expect(clamp(-1, 0, 10)).toBe(0))
  it('clamps to max when above', ()           => expect(clamp(11, 0, 10)).toBe(10))
  it('accepts a value equal to min', ()       => expect(clamp(0, 0, 10)).toBe(0))
  it('accepts a value equal to max', ()       => expect(clamp(10, 0, 10)).toBe(10))
})

describe('lerp', () => {
  it('returns a when t = 0',     () => expect(lerp(0, 10, 0)).toBe(0))
  it('returns b when t = 1',     () => expect(lerp(0, 10, 1)).toBe(10))
  it('returns midpoint at t = 0.5', () => expect(lerp(0, 10, 0.5)).toBe(5))
  it('clamps t — above 1 returns b', () => expect(lerp(0, 10, 2)).toBe(10))
  it('clamps t — below 0 returns a', () => expect(lerp(0, 10, -1)).toBe(0))
})

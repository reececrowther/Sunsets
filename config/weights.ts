// Scoring weight configuration — total must sum to 100.
// Adjust these values to tune the algorithm without touching engine logic.

export const WEIGHTS = {
  highCloud: 20,
  midCloud: 13,
  lowCloud: 20,
  rain: 15,
  visibility: 15,
  atmosphere: 10,
  forecastConf: 7,
} as const

// Sanity check (evaluated at module load, not runtime)
const total = Object.values(WEIGHTS).reduce((a, b) => a + b, 0)
if (total !== 100) {
  throw new Error(`Scoring weights must sum to 100, got ${total}`)
}

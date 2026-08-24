// Cloud cover forecasting becomes unreliable beyond 48 hours.
// This module tracks two separate values:
//   modifier — the fraction of the confidence weight actually awarded (0–1)
//   value    — the overall forecast confidence to display to the user (0–1)

interface ConfidenceResult {
  modifier: number  // applied to the forecastConf weight in the breakdown
  value: number     // displayed to the user as a percentage
}

export function calculateConfidence(daysAhead: number): ConfidenceResult {
  if (daysAhead <= 0) return { modifier: 1.00, value: 0.92 }
  if (daysAhead <= 1) return { modifier: 0.86, value: 0.82 }
  if (daysAhead <= 2) return { modifier: 0.71, value: 0.70 }
  if (daysAhead <= 3) return { modifier: 0.43, value: 0.56 }
  if (daysAhead <= 4) return { modifier: 0.21, value: 0.42 }
  if (daysAhead <= 5) return { modifier: 0.14, value: 0.34 }
  return { modifier: 0.07, value: 0.25 }
}

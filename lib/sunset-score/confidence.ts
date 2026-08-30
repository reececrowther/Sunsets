// Cloud cover forecasting becomes unreliable beyond 48 hours.
// Returns a display value (0–1) shown to the user as a confidence percentage.
// Previously this also produced a score modifier baked into the breakdown;
// confidence is now output-only metadata, separate from the weighted score.

export function calculateConfidence(daysAhead: number): { value: number } {
  if (daysAhead <= 0) return { value: 0.92 }
  if (daysAhead <= 1) return { value: 0.82 }
  if (daysAhead <= 2) return { value: 0.70 }
  if (daysAhead <= 3) return { value: 0.56 }
  if (daysAhead <= 4) return { value: 0.42 }
  if (daysAhead <= 5) return { value: 0.34 }
  return { value: 0.25 }
}

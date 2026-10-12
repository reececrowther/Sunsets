// Aurora scoring engine — pure TypeScript, no framework imports.
//
// The key variable is the Kp index (0–9): a geomagnetic activity measure.
// Higher latitude = lower Kp threshold needed for a visible aurora.
// Cloud cover (low + mid layers) is the primary visibility blocker.

export type AuroraQuality = 'high_activity' | 'moderate' | 'low' | 'marginal' | 'unlikely'

export interface AuroraScoreInput {
  kpPeak:    number   // peak Kp during tonight's dark window
  latitude:  number   // degrees N
  cloudLow:  number   // 0–100 %
  cloudMid:  number   // 0–100 %
}

export interface AuroraScoreResult {
  score:       number         // 0–100
  quality:     AuroraQuality
  cloudPenalty: number        // 0–1 obstruction fraction
  minKpNeeded: number         // minimum Kp for visibility at this latitude
  visible:     boolean        // Kp meets or exceeds threshold
}

// Latitude → minimum Kp index for a visible aurora overhead.
// Based on NOAA Kp–latitude visibility tables for the UK.
export function minKpForLatitude(lat: number): number {
  if (lat >= 60) return 1   // Shetland — even quiet periods can show aurora
  if (lat >= 58) return 2   // Orkney, far NW Scotland
  if (lat >= 56) return 3   // Edinburgh, Glasgow
  if (lat >= 54) return 4   // Newcastle, Belfast
  if (lat >= 52) return 5   // Birmingham, Wales
  if (lat >= 50) return 7   // London, south coast
  return 8                  // Extreme events only
}

function qualityFromScore(score: number): AuroraQuality {
  if (score >= 75) return 'high_activity'
  if (score >= 50) return 'moderate'
  if (score >= 30) return 'low'
  if (score >= 12) return 'marginal'
  return 'unlikely'
}

export function calculateAuroraScore(input: AuroraScoreInput): AuroraScoreResult {
  const minKp        = minKpForLatitude(input.latitude)
  const cloudPenalty = Math.min(1, (input.cloudLow * 0.65 + input.cloudMid * 0.30) / 100)
  const cloudFactor  = 1 - cloudPenalty

  // Kp must meet the latitude threshold for any chance of visibility
  if (input.kpPeak < minKp) {
    return { score: 0, quality: 'unlikely', cloudPenalty, minKpNeeded: minKp, visible: false }
  }

  // How far above the threshold? Scale: 0 at threshold, 1 when Kp fills remaining range to 9
  const surplus   = input.kpPeak - minKp
  const range     = Math.max(1, 9 - minKp)
  // Non-linear: quick gain just above threshold, diminishing near Kp 9
  const kpFactor  = Math.min(1, 0.15 + (surplus / range) * 0.85)

  const score   = Math.round(Math.max(0, kpFactor * cloudFactor * 100))
  const quality = qualityFromScore(score)

  return { score, quality, cloudPenalty, minKpNeeded: minKp, visible: true }
}

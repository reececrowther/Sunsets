import type { SubscriptionTier } from '@/types'

// Feature gates — the single source of truth for what free vs Pro can access.
// Gate checks happen in API routes and Server Components, never in client components.

export const TIER_FEATURES = {
  forecastDays:          { free: 3,     pro: 7     },
  savedLocations:        { free: 0,     pro: 999   },
  alerts:                { free: false, pro: true   },
  colourProbability:     { free: false, pro: true   },
  fullScoreBreakdown:    { free: false, pro: true   },
  forecastConfidence:    { free: false, pro: true   },
  azimuthDirection:      { free: false, pro: true   },
  advancedCloudDetail:   { free: false, pro: true   },
} as const

type FeatureKey = keyof typeof TIER_FEATURES
type FeatureValue<K extends FeatureKey> = typeof TIER_FEATURES[K]['free']

export function canAccess<K extends FeatureKey>(
  tier: SubscriptionTier,
  feature: K,
): boolean {
  const gate = TIER_FEATURES[feature][tier]
  if (typeof gate === 'boolean') return gate
  return true  // numeric limits are checked separately
}

export function getLimit<K extends FeatureKey>(
  tier: SubscriptionTier,
  feature: K,
): FeatureValue<K> {
  return TIER_FEATURES[feature][tier] as FeatureValue<K>
}

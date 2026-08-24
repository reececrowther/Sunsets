// Typed PostHog event wrappers.
// Import and call these instead of posthog.capture() directly so event names
// and property shapes stay consistent across the codebase.

type EventProperties = Record<string, string | number | boolean | null | undefined>

// Dynamic import keeps PostHog out of the server bundle
async function capture(event: string, properties?: EventProperties) {
  if (typeof window === 'undefined') return  // server-side — skip
  const { default: posthog } = await import('posthog-js')
  posthog.capture(event, properties)
}

export const analytics = {
  locationSearch: (query: string) =>
    capture('location_search', { query }),

  forecastView: (locationSlug: string, score: number | null) =>
    capture('forecast_view', { location_slug: locationSlug, score }),

  forecastShare: (locationSlug: string) =>
    capture('forecast_share', { location_slug: locationSlug }),

  signup: (source: string) =>
    capture('signup', { source }),

  emailSubscribe: (source: string) =>
    capture('email_subscribe', { source }),

  locationSaved: (locationSlug: string) =>
    capture('location_saved', { location_slug: locationSlug }),

  alertCreated: (locationSlug: string, minScore: number) =>
    capture('alert_created', { location_slug: locationSlug, min_score: minScore }),

  pricingView: () =>
    capture('pricing_view'),

  checkoutStarted: (tier: string) =>
    capture('checkout_started', { tier }),

  subscriptionStarted: (tier: string) =>
    capture('subscription_started', { tier }),
}

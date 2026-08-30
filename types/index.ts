export type SubscriptionTier = 'free' | 'pro'

export type SunsetQuality = 'poor' | 'fair' | 'good' | 'great' | 'excellent'

export type AlertChannel = 'email' | 'push'

export interface Location {
  id: string
  name: string
  slug: string
  country: string
  countryCode: string
  region: string | null
  latitude: number
  longitude: number
  timezone: string
  isFeatured: boolean
  population: number | null
  createdAt: string
  updatedAt: string
}

export interface SunsetForecast {
  id: string
  locationId: string
  forecastDate: string

  sunsetTime: string | null
  sunriseTime: string | null
  solarNoon: string | null
  goldenHourStart: string | null
  goldenHourEnd: string | null
  blueHourStart: string | null
  blueHourEnd: string | null
  sunsetAzimuth: number | null

  score: number | null
  quality: SunsetQuality | null
  colourProbability: number | null
  confidence: number | null

  cloudLow: number | null
  cloudMid: number | null
  cloudHigh: number | null
  totalCloud: number | null
  rainProbability: number | null
  humidity: number | null
  visibility: number | null
  windSpeed: number | null
  windDirection: number | null
  pressure: number | null
  temperature: number | null

  scoreBreakdown: ScoreBreakdown | null
  reasons: string[] | null
  warnings: string[] | null

  weatherSource: string
  fetchedAt: string | null
  expiresAt: string | null

  createdAt: string
  updatedAt: string
}

export interface ScoreBreakdown {
  highCloud: number
  midCloud: number
  lowCloud: number
  rain: number
  visibility: number
  atmosphere: number
  wind: number
}

export interface LocationWithForecast extends Location {
  forecast: SunsetForecast | null
}

export interface User {
  id: string
  email: string
  displayName: string | null
  subscriptionTier: SubscriptionTier
  stripeCustomerId: string | null
  createdAt: string
  updatedAt: string
}

export interface SavedLocation {
  id: string
  userId: string
  locationId: string
  displayOrder: number
  createdAt: string
  location?: Location
  forecast?: SunsetForecast | null
}

export interface AlertPreference {
  id: string
  userId: string
  locationId: string
  minScore: number
  minColourProbability: number
  hoursBeforeSunset: number
  channel: AlertChannel
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface EmailSubscriber {
  id: string
  email: string
  locationInterest: string | null
  source: string | null
  confirmed: boolean
  subscribedAt: string
  unsubscribedAt: string | null
}

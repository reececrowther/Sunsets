// Mapbox Geocoding API
// Free tier: 100,000 requests/month
// Docs: https://docs.mapbox.com/api/search/geocoding/
// Results are cached permanently in the locations table — this is called
// only when a new location is first searched.

const BASE_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places'

export interface GeocodingResult {
  name: string
  slug: string
  country: string
  countryCode: string
  region: string | null
  latitude: number
  longitude: number
  timezone: string  // requires a separate timezone lookup
  mapboxId: string
  fullName: string  // e.g. "Liverpool, England, United Kingdom"
}

interface MapboxFeature {
  id: string
  place_name: string
  text: string
  center: [number, number]  // [longitude, latitude]
  context?: Array<{
    id: string
    text: string
    short_code?: string
  }>
}

export async function geocodeLocation(query: string): Promise<GeocodingResult[]> {
  const token = process.env.MAPBOX_ACCESS_TOKEN
  if (!token) throw new Error('MAPBOX_ACCESS_TOKEN is not set')

  const params = new URLSearchParams({
    access_token: token,
    types: 'place,locality,neighborhood',
    country: 'gb',  // UK-first for MVP
    limit: '5',
    language: 'en',
  })

  const url = `${BASE_URL}/${encodeURIComponent(query)}.json?${params}`

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Mapbox geocoding error ${res.status}`)

  const data = await res.json()
  const features: MapboxFeature[] = data.features ?? []

  return features.map(feature => {
    const [longitude, latitude] = feature.center

    const countryCtx = feature.context?.find(c => c.id.startsWith('country.'))
    const regionCtx = feature.context?.find(c => c.id.startsWith('region.'))

    const countryCode = countryCtx?.short_code?.toUpperCase() ?? 'GB'
    const country = countryCtx?.text ?? 'United Kingdom'
    const region = regionCtx?.text ?? null

    return {
      name: feature.text,
      slug: slugify(feature.text),
      country,
      countryCode,
      region,
      latitude,
      longitude,
      timezone: 'Europe/London',  // default for UK MVP; augment with timezone API if expanding
      mapboxId: feature.id,
      fullName: feature.place_name,
    }
  })
}

export async function reverseGeocode(
  latitude: number,
  longitude: number,
): Promise<GeocodingResult | null> {
  const token = process.env.MAPBOX_ACCESS_TOKEN
  if (!token) throw new Error('MAPBOX_ACCESS_TOKEN is not set')

  const params = new URLSearchParams({
    access_token: token,
    types: 'place,locality',
    language: 'en',
  })

  const url = `${BASE_URL}/${longitude},${latitude}.json?${params}`

  const res = await fetch(url)
  if (!res.ok) return null

  const data = await res.json()
  const features: MapboxFeature[] = data.features ?? []
  if (features.length === 0) return null

  const feature = features[0]
  const [lon, lat] = feature.center
  const countryCtx = feature.context?.find(c => c.id.startsWith('country.'))
  const regionCtx = feature.context?.find(c => c.id.startsWith('region.'))

  return {
    name: feature.text,
    slug: slugify(feature.text),
    country: countryCtx?.text ?? 'United Kingdom',
    countryCode: countryCtx?.short_code?.toUpperCase() ?? 'GB',
    region: regionCtx?.text ?? null,
    latitude: lat,
    longitude: lon,
    timezone: 'Europe/London',
    mapboxId: feature.id,
    fullName: feature.place_name,
  }
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

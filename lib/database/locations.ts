import { createAdminClient } from './client'
import type { Location } from '@/types'

function mapRow(row: Record<string, unknown>): Location {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    country: row.country as string,
    countryCode: row.country_code as string,
    region: row.region as string | null,
    latitude: row.latitude as number,
    longitude: row.longitude as number,
    timezone: row.timezone as string,
    isFeatured: row.is_featured as boolean,
    population: row.population as number | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

export async function getLocationBySlug(slug: string): Promise<Location | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error || !data) return null
  return mapRow(data)
}

export async function getFeaturedLocations(): Promise<Location[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('is_featured', true)
    .order('name')

  if (error || !data) return []
  return data.map(mapRow)
}

export async function getAllLocationSlugs(): Promise<string[]> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('locations').select('slug')
  return (data ?? []).map(r => r.slug as string)
}

export async function findOrCreateLocation(params: {
  name: string
  slug: string
  country: string
  countryCode: string
  region: string | null
  latitude: number
  longitude: number
  timezone: string
}): Promise<Location> {
  const supabase = createAdminClient()

  const { data: existing } = await supabase
    .from('locations')
    .select('*')
    .eq('slug', params.slug)
    .single()

  if (existing) return mapRow(existing)

  const { data, error } = await supabase
    .from('locations')
    .insert({
      name: params.name,
      slug: params.slug,
      country: params.country,
      country_code: params.countryCode,
      region: params.region,
      latitude: params.latitude,
      longitude: params.longitude,
      timezone: params.timezone,
    })
    .select('*')
    .single()

  if (error || !data) throw new Error(`Failed to create location: ${error?.message}`)
  return mapRow(data)
}

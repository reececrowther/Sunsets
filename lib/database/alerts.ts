import { createAdminClient } from './client'
import type { AlertPreference } from '@/types'

function mapRow(row: Record<string, unknown>): AlertPreference {
  return {
    id:                   row.id as string,
    userId:               row.user_id as string,
    locationId:           row.location_id as string,
    minScore:             row.min_score as number,
    minColourProbability: 0,  // not used in UI — kept for type compat
    hoursBeforeSunset:    0,
    channel:              row.channel as 'email' | 'push',
    isActive:             row.is_active as boolean,
    createdAt:            row.created_at as string,
    updatedAt:            row.updated_at as string,
  }
}

export async function getAlertForUserLocation(
  userId: string,
  locationId: string,
): Promise<AlertPreference | null> {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from('alert_preferences')
    .select('*')
    .eq('user_id', userId)
    .eq('location_id', locationId)
    .single()

  if (!data) return null
  return mapRow(data)
}

export async function upsertAlert(
  userId: string,
  locationId: string,
  minScore: number,
): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('alert_preferences')
    .upsert(
      {
        user_id:     userId,
        location_id: locationId,
        min_score:   minScore,
        is_active:   true,
        updated_at:  new Date().toISOString(),
      },
      { onConflict: 'user_id,location_id' },
    )
}

export async function deleteAlert(userId: string, locationId: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('alert_preferences')
    .delete()
    .eq('user_id', userId)
    .eq('location_id', locationId)
}

// Used by the cron job — returns all active alerts not yet triggered today
export interface AlertWithUserEmail {
  userId:     string
  email:      string
  locationId: string
  minScore:   number
}

export async function getUnsentAlertPreferences(
  today: string,  // YYYY-MM-DD
): Promise<AlertWithUserEmail[]> {
  const supabase = createAdminClient()

  // Join against public.users for the email address
  const { data } = await supabase
    .from('alert_preferences')
    .select('user_id, location_id, min_score, users!inner(email)')
    .eq('is_active', true)
    .or(`last_triggered_date.is.null,last_triggered_date.lt.${today}`)

  if (!data) return []

  type Row = { user_id: string; location_id: string; min_score: number; users: { email: string } }
  return (data as unknown as Row[]).map(row => ({
    userId:     row.user_id,
    email:      row.users.email,
    locationId: row.location_id,
    minScore:   row.min_score,
  }))
}

export async function markAlertTriggered(
  userId: string,
  locationId: string,
  date: string,
): Promise<void> {
  const supabase = createAdminClient()
  await supabase
    .from('alert_preferences')
    .update({ last_triggered_date: date, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('location_id', locationId)
}

// Saved locations for Pro daily digest
export interface SavedLocationRow {
  userId:     string
  email:      string
  locationId: string
}

export async function getProUserSavedLocations(today: string): Promise<SavedLocationRow[]> {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('saved_locations')
    .select('user_id, location_id, users!inner(email, subscription_tier)')
    .eq('users.subscription_tier', 'pro')

  if (!data) return []

  type Row = { user_id: string; location_id: string; users: { email: string; subscription_tier: string } }
  return (data as unknown as Row[]).map(row => ({
    userId:     row.user_id,
    email:      row.users.email,
    locationId: row.location_id,
  }))
}

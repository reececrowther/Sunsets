// Runs after each daily forecast refresh.
// For every active alert preference, if today's score meets the threshold
// and no alert has already been sent today, send the email and mark it sent.

import { getUnsentAlertPreferences, markAlertTriggered } from '@/lib/database/alerts'
import { getForecastForDate } from '@/lib/database/forecasts'
import { getLocationBySlug } from '@/lib/database/locations'
import { createAdminClient } from '@/lib/database/client'
import { sendAlertEmail } from '@/lib/email/alert-email'
import { formatTime } from '@/lib/utils/format'
import type { SunsetQuality } from '@/types'

interface LocationCache {
  name:     string
  slug:     string
  timezone: string
}

export async function checkAndSendAlerts(): Promise<{ sent: number; errors: number }> {
  const today    = new Date().toISOString().slice(0, 10)
  const prefs    = await getUnsentAlertPreferences(today)

  if (prefs.length === 0) return { sent: 0, errors: 0 }

  // Cache location lookups — many users may watch the same location
  const locationCache = new Map<string, LocationCache>()
  const supabase = createAdminClient()

  async function getLocation(locationId: string): Promise<LocationCache | null> {
    if (locationCache.has(locationId)) return locationCache.get(locationId)!
    const { data } = await supabase
      .from('locations')
      .select('name, slug, timezone')
      .eq('id', locationId)
      .single()
    if (!data) return null
    const loc: LocationCache = { name: data.name, slug: data.slug, timezone: data.timezone }
    locationCache.set(locationId, loc)
    return loc
  }

  let sent = 0, errors = 0

  for (const pref of prefs) {
    try {
      const [forecast, location] = await Promise.all([
        getForecastForDate(pref.locationId, today),
        getLocation(pref.locationId),
      ])

      if (!forecast || !location || forecast.score === null) continue
      if (forecast.score < pref.minScore) continue

      await sendAlertEmail({
        to:           pref.email,
        locationName: location.name,
        locationSlug: location.slug,
        score:        forecast.score,
        quality:      (forecast.quality ?? 'good') as SunsetQuality,
        sunsetTime:   forecast.sunsetTime
          ? formatTime(forecast.sunsetTime, location.timezone)
          : null,
        goldenHour:   forecast.goldenHourStart
          ? formatTime(forecast.goldenHourStart, location.timezone)
          : null,
        minScore:     pref.minScore,
      })

      await markAlertTriggered(pref.userId, pref.locationId, today)
      sent++
    } catch (err) {
      console.error(`[alerts] Failed for user ${pref.userId} location ${pref.locationId}:`, err)
      errors++
    }
  }

  return { sent, errors }
}

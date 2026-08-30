import { NextRequest, NextResponse } from 'next/server'
import { getProUserSavedLocations } from '@/lib/database/alerts'
import { getForecastForDate } from '@/lib/database/forecasts'
import { sendDailyDigestEmail, type DigestLocationRow } from '@/lib/email/alert-email'
import { createAdminClient } from '@/lib/database/client'
import { formatDate } from '@/lib/utils/format'
import type { SunsetQuality } from '@/types'

export const runtime    = 'nodejs'
export const maxDuration = 120

export async function GET(request: NextRequest) {
  const auth   = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const today = new Date().toISOString().slice(0, 10)

  try {
    const saved = await getProUserSavedLocations(today)
    if (saved.length === 0) return NextResponse.json({ ok: true, sent: 0 })

    // Fetch location names and forecasts; group by user
    const supabase = createAdminClient()
    const locationIds = [...new Set(saved.map(r => r.locationId))]

    const { data: locRows } = await supabase
      .from('locations')
      .select('id, name, slug, timezone')
      .in('id', locationIds)

    const locMap = new Map((locRows ?? []).map(l => [l.id as string, l as { name: string; slug: string; timezone: string }]))

    // Group rows by user
    const byUser = new Map<string, { email: string; locationIds: string[] }>()
    for (const row of saved) {
      if (!byUser.has(row.userId)) byUser.set(row.userId, { email: row.email, locationIds: [] })
      byUser.get(row.userId)!.locationIds.push(row.locationId)
    }

    let sent = 0
    for (const [, { email, locationIds: ids }] of byUser) {
      const rows: DigestLocationRow[] = []
      for (const locId of ids) {
        const loc      = locMap.get(locId)
        const forecast = await getForecastForDate(locId, today)
        if (!loc) continue
        rows.push({
          name:       loc.name,
          slug:       loc.slug,
          score:      forecast?.score ?? null,
          quality:    (forecast?.quality ?? null) as SunsetQuality | null,
          sunsetTime: null,  // not shown in digest table
        })
      }
      if (rows.length === 0) continue
      await sendDailyDigestEmail(email, rows, formatDate(today, 'UTC'))
      sent++
    }

    return NextResponse.json({ ok: true, sent })
  } catch (err) {
    console.error('[cron/daily-digest]', err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}

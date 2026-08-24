import { NextRequest, NextResponse } from 'next/server'
import { refreshAllLocations } from '@/lib/weather/refresh'

// Called by Vercel Cron every 2 hours (see vercel.json).
// Secured with a shared secret to prevent unauthenticated triggers.

export const runtime = 'nodejs'
export const maxDuration = 300  // 5 minutes — enough for 50+ locations

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  const secret = process.env.CRON_SECRET

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  }

  const started = Date.now()

  try {
    const results = await refreshAllLocations()
    const errors = results.filter(r => r.error)
    const succeeded = results.filter(r => !r.error)

    return NextResponse.json({
      ok: true,
      durationMs: Date.now() - started,
      locations: results.length,
      succeeded: succeeded.length,
      errors: errors.length,
      errorDetails: errors.map(e => ({ location: e.locationName, error: e.error })),
    })
  } catch (err) {
    console.error('[cron/refresh-forecasts]', err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 },
    )
  }
}

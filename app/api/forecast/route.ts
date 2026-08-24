import { NextRequest, NextResponse } from 'next/server'
import { getLocationBySlug } from '@/lib/database/locations'
import { getForecastsForLocation, isForecastStale } from '@/lib/database/forecasts'
import { refreshLocation } from '@/lib/weather/refresh'
import { z } from 'zod'

const QuerySchema = z.object({
  slug: z.string().min(1).max(100),
})

export async function GET(request: NextRequest) {
  const parsed = QuerySchema.safeParse({
    slug: request.nextUrl.searchParams.get('slug'),
  })

  if (!parsed.success) {
    return NextResponse.json({ error: 'slug parameter is required' }, { status: 400 })
  }

  const location = await getLocationBySlug(parsed.data.slug)
  if (!location) {
    return NextResponse.json({ error: 'Location not found' }, { status: 404 })
  }

  const forecasts = await getForecastsForLocation(location.id, 7)

  // Trigger a background refresh if data is stale (fire and forget — don't await)
  if (forecasts.length === 0 || (forecasts[0] && isForecastStale(forecasts[0]))) {
    refreshLocation(
      location.id,
      location.name,
      location.latitude,
      location.longitude,
      location.timezone,
    ).catch(err => console.error(`[api/forecast] background refresh failed: ${err}`))
  }

  return NextResponse.json(
    { location, forecasts },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
      },
    },
  )
}

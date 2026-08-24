import { NextRequest, NextResponse } from 'next/server'
import { geocodeLocation } from '@/lib/geocoding/mapbox'
import { findOrCreateLocation } from '@/lib/database/locations'
import { z } from 'zod'

const QuerySchema = z.object({
  q: z.string().min(2).max(100),
})

export async function GET(request: NextRequest) {
  const parsed = QuerySchema.safeParse({
    q: request.nextUrl.searchParams.get('q'),
  })

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Query parameter q must be between 2 and 100 characters' },
      { status: 400 },
    )
  }

  try {
    const results = await geocodeLocation(parsed.data.q)
    return NextResponse.json({ results })
  } catch (err) {
    console.error('[api/locations]', err)
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getAggregateRating, submitRating } from '@/lib/database/ratings'

const QuerySchema = z.object({
  locationId:   z.string().uuid(),
  forecastDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

const BodySchema = z.object({
  locationId:   z.string().uuid(),
  forecastDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  rating:       z.number().int().min(1).max(5),
  notes:        z.string().max(500).optional(),
})

// Only allow rating today and past dates — never future forecasts
function isFuture(dateStr: string): boolean {
  const today = new Date().toISOString().slice(0, 10)
  return dateStr > today
}

export async function GET(request: NextRequest) {
  const parsed = QuerySchema.safeParse({
    locationId:   request.nextUrl.searchParams.get('locationId'),
    forecastDate: request.nextUrl.searchParams.get('forecastDate'),
  })

  if (!parsed.success) {
    return NextResponse.json({ error: 'locationId and forecastDate are required' }, { status: 400 })
  }

  const aggregate = await getAggregateRating(
    parsed.data.locationId,
    parsed.data.forecastDate,
  )

  return NextResponse.json(aggregate, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' },
  })
}

export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = BodySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  if (isFuture(parsed.data.forecastDate)) {
    return NextResponse.json({ error: 'Cannot rate a future sunset' }, { status: 422 })
  }

  try {
    await submitRating(
      parsed.data.locationId,
      parsed.data.forecastDate,
      parsed.data.rating,
      parsed.data.notes,
    )
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to save rating' }, { status: 500 })
  }
}

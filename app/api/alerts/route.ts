import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { z } from 'zod'
import { createServerSupabaseClient } from '@/lib/database/client'
import { getAlertForUserLocation, upsertAlert, deleteAlert } from '@/lib/database/alerts'

async function getAuthenticatedUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const supabase = createServerSupabaseClient({
    getAll() { return cookieStore.getAll() },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
    },
  })
  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

const QuerySchema = z.object({
  locationId: z.string().uuid(),
})

const UpsertSchema = z.object({
  locationId: z.string().uuid(),
  minScore:   z.number().int().min(1).max(100),
})

export async function GET(request: NextRequest) {
  const userId = await getAuthenticatedUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const parsed = QuerySchema.safeParse({
    locationId: request.nextUrl.searchParams.get('locationId'),
  })
  if (!parsed.success) return NextResponse.json({ error: 'locationId required' }, { status: 400 })

  const pref = await getAlertForUserLocation(userId, parsed.data.locationId)
  return NextResponse.json({ preference: pref })
}

export async function POST(request: NextRequest) {
  const userId = await getAuthenticatedUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = UpsertSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'locationId and minScore required' }, { status: 400 })

  await upsertAlert(userId, parsed.data.locationId, parsed.data.minScore)
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: NextRequest) {
  const userId = await getAuthenticatedUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const parsed = QuerySchema.safeParse({
    locationId: request.nextUrl.searchParams.get('locationId'),
  })
  if (!parsed.success) return NextResponse.json({ error: 'locationId required' }, { status: 400 })

  await deleteAlert(userId, parsed.data.locationId)
  return NextResponse.json({ ok: true })
}

import { NextRequest, NextResponse } from 'next/server'
import { subscribeEmail } from '@/lib/email/resend'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    await subscribeEmail(email.trim().toLowerCase(), 'homepage_footer')
    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 })
  }
}

import { Resend } from 'resend'

let _resend: Resend | null = null
function getResend(): Resend {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY)
  return _resend
}

export const FROM_ADDRESS = 'SunsetScore <alerts@sunsetscore.com>'

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string
  subject: string
  html: string
  text: string
}) {
  const { data, error } = await getResend().emails.send({
    from: FROM_ADDRESS,
    to,
    subject,
    html,
    text,
  })

  if (error) throw new Error(`Resend error: ${error.message}`)
  return data
}

export async function subscribeEmail(email: string, source: string): Promise<void> {
  const supabase = (await import('@/lib/database/client')).createAdminClient()

  await supabase
    .from('email_subscribers')
    .upsert(
      { email, source, confirmed: true },
      { onConflict: 'email', ignoreDuplicates: true },
    )
}

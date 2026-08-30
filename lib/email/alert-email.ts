import { sendEmail } from './resend'
import type { SunsetQuality } from '@/types'

const Q_LABEL: Record<SunsetQuality, string> = {
  excellent: 'Excellent',
  great:     'Great',
  good:      'Good',
  fair:      'Fair',
  poor:      'Poor',
}

const Q_COLOR: Record<SunsetQuality, string> = {
  excellent: '#F0B830',
  great:     '#C8701A',
  good:      '#5FAA88',
  fair:      '#8890B8',
  poor:      '#6A7888',
}

export interface AlertEmailParams {
  to:           string
  locationName: string
  locationSlug: string
  score:        number
  quality:      SunsetQuality
  sunsetTime:   string | null   // formatted local time e.g. "8:02 PM"
  goldenHour:   string | null
  minScore:     number
}

export async function sendAlertEmail(params: AlertEmailParams): Promise<void> {
  const { to, locationName, locationSlug, score, quality, sunsetTime, goldenHour, minScore } = params
  const col   = Q_COLOR[quality]
  const label = Q_LABEL[quality]
  const url   = `https://sunsetscore.com/sunset/${locationSlug}`

  const subject = `Tonight at ${locationName} looks ${label} — ${score}/100`

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0C0908;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0C0908;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;">

          <!-- Logo -->
          <tr>
            <td style="padding-bottom:32px;text-align:center;">
              <span style="font-family:Georgia,serif;font-style:italic;font-weight:700;font-size:22px;letter-spacing:-0.02em;">
                <span style="color:#EDE0C0;">After</span><span style="color:#F0B830;">glow</span>
              </span>
            </td>
          </tr>

          <!-- Card -->
          <tr>
            <td style="background:rgba(255,255,255,0.03);border:1px solid rgba(200,140,60,0.18);border-radius:16px;padding:36px 32px;">

              <p style="margin:0 0 6px;font-size:13px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(237,224,192,0.40);">
                Alert — ${locationName}
              </p>

              <p style="margin:0 0 24px;font-size:28px;font-weight:700;font-family:Georgia,serif;font-style:italic;color:#EDE0C0;line-height:1.2;">
                Tonight's sunset looks ${label.toLowerCase()}.
              </p>

              <!-- Score badge -->
              <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;">
                <tr>
                  <td style="background:${col}18;border:1px solid ${col}44;border-radius:12px;padding:16px 24px;text-align:center;">
                    <span style="display:block;font-size:52px;font-weight:700;font-family:Georgia,serif;font-style:italic;color:${col};line-height:1;">${score}</span>
                    <span style="display:block;font-size:11px;font-weight:600;letter-spacing:0.18em;text-transform:uppercase;color:${col};opacity:0.72;margin-top:4px;">${label}</span>
                  </td>
                </tr>
              </table>

              <!-- Times -->
              ${goldenHour || sunsetTime ? `
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px;border-top:1px solid rgba(200,140,60,0.10);padding-top:20px;">
                <tr>
                  ${goldenHour ? `
                  <td style="text-align:center;">
                    <p style="margin:0 0 4px;font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:rgba(237,224,192,0.35);">Golden Hour</p>
                    <p style="margin:0;font-size:15px;font-weight:500;color:#EDE0C0;font-family:ui-monospace,monospace;">${goldenHour}</p>
                  </td>
                  ` : ''}
                  ${sunsetTime ? `
                  <td style="text-align:center;">
                    <p style="margin:0 0 4px;font-size:10px;font-weight:600;letter-spacing:0.14em;text-transform:uppercase;color:rgba(237,224,192,0.35);">Sunset</p>
                    <p style="margin:0;font-size:15px;font-weight:500;color:#EDE0C0;font-family:ui-monospace,monospace;">${sunsetTime}</p>
                  </td>
                  ` : ''}
                </tr>
              </table>
              ` : ''}

              <!-- CTA -->
              <a href="${url}" style="display:block;width:100%;box-sizing:border-box;background:linear-gradient(135deg,#C8701A 0%,#E8902A 100%);border-radius:10px;padding:14px 20px;text-align:center;font-size:15px;font-weight:700;color:#fff;text-decoration:none;letter-spacing:0.01em;">
                View full forecast →
              </a>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 0 0;text-align:center;">
              <p style="margin:0;font-size:11px;color:rgba(237,224,192,0.20);">
                You're receiving this because you set an alert for ${locationName} when the score reaches ${minScore}+.<br />
                <a href="${url}" style="color:rgba(237,224,192,0.30);">Manage alerts</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = `
${locationName} sunset alert — ${score}/100 (${label})

Tonight at ${locationName} the sunset is forecast to be ${label.toLowerCase()}, scoring ${score}/100.

${goldenHour ? `Golden Hour: ${goldenHour}\n` : ''}${sunsetTime ? `Sunset: ${sunsetTime}` : ''}

View the full forecast: ${url}

---
You set an alert for ${locationName} when the score reaches ${minScore}+.
`.trim()

  await sendEmail({ to, subject, html, text })
}

export interface DigestLocationRow {
  name:       string
  slug:       string
  score:      number | null
  quality:    SunsetQuality | null
  sunsetTime: string | null
}

export async function sendDailyDigestEmail(
  to: string,
  locations: DigestLocationRow[],
  today: string,
): Promise<void> {
  const subject = `Your sunset forecast for today — ${today}`

  const rows = locations.map(loc => {
    const col   = loc.quality ? Q_COLOR[loc.quality] : '#5A4030'
    const label = loc.quality ? Q_LABEL[loc.quality] : '—'
    const score = loc.score ?? '—'
    return `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid rgba(200,140,60,0.08);">
          <a href="https://sunsetscore.com/sunset/${loc.slug}" style="font-size:14px;font-weight:600;color:#EDE0C0;text-decoration:none;">${loc.name}</a>
        </td>
        <td style="padding:12px 8px;border-bottom:1px solid rgba(200,140,60,0.08);text-align:center;">
          <span style="font-size:20px;font-weight:700;font-family:Georgia,serif;font-style:italic;color:${col};">${score}</span>
        </td>
        <td style="padding:12px 0;border-bottom:1px solid rgba(200,140,60,0.08);text-align:right;">
          <span style="font-size:11px;font-weight:600;letter-spacing:0.10em;text-transform:uppercase;color:${col};">${label}</span>
        </td>
      </tr>`
  }).join('')

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
</head>
<body style="margin:0;padding:0;background:#0C0908;font-family:system-ui,-apple-system,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#0C0908;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:520px;">

          <tr>
            <td style="padding-bottom:28px;text-align:center;">
              <span style="font-family:Georgia,serif;font-style:italic;font-weight:700;font-size:22px;">
                <span style="color:#EDE0C0;">After</span><span style="color:#F0B830;">glow</span>
              </span>
            </td>
          </tr>

          <tr>
            <td style="background:rgba(255,255,255,0.03);border:1px solid rgba(200,140,60,0.18);border-radius:16px;padding:32px;">
              <p style="margin:0 0 4px;font-size:12px;font-weight:600;letter-spacing:0.12em;text-transform:uppercase;color:rgba(237,224,192,0.35);">Daily forecast</p>
              <p style="margin:0 0 24px;font-size:22px;font-weight:700;font-family:Georgia,serif;font-style:italic;color:#EDE0C0;">${today}</p>

              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                ${rows}
              </table>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 0 0;text-align:center;">
              <p style="margin:0;font-size:11px;color:rgba(237,224,192,0.20);">
                Your daily Afterglow digest — <a href="https://sunsetscore.com" style="color:rgba(237,224,192,0.30);">manage locations</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`

  const text = locations.map(l => `${l.name}: ${l.score ?? '—'}/100 (${l.quality ?? '—'})`).join('\n')

  await sendEmail({ to, subject, html, text })
}

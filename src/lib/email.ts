import { Resend } from 'resend'

const FROM = 'The Bullock Farm <noreply@thebullockfarm.com>'
const BASE_URL = 'https://thebullockfarm.com'

function resend() {
  return new Resend(process.env.RESEND_API_KEY!)
}

function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function nightCount(start: string, end: string) {
  const [y1, m1, d1] = start.split('-').map(Number)
  const [y2, m2, d2] = end.split('-').map(Number)
  const n = Math.round((new Date(y2, m2 - 1, d2).getTime() - new Date(y1, m1 - 1, d1).getTime()) / 86400000)
  return `${n} night${n !== 1 ? 's' : ''}`
}

function base(body: string) {
  return `
    <html x-apple-data-detectors="false">
    <head>
      <meta name="x-apple-disable-message-reformatting">
      <style>
        a[x-apple-data-detectors] {
          color: inherit !important;
          text-decoration: none !important;
        }
        * { -webkit-text-size-adjust: none; }
      </style>
    </head>
    <body>
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
      ${body}
      <p style="margin-top: 32px; font-size: 13px; color: #aaa;">The Bullock Farm · thebullockfarm.com</p>
    </div>
    </body>
    </html>
  `
}

function btn(text: string, href: string) {
  return `<a href="${href}" style="display:inline-block;margin-top:20px;background:#111;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-size:15px;font-weight:600;">${text}</a>`
}

// ── 1. New signup → notify all admins ─────────────────────────────────────────
export async function sendNewSignupAlert(adminEmails: string[], name: string, email: string) {
  if (!process.env.RESEND_API_KEY || adminEmails.length === 0) return
  await resend().emails.send({
    from: FROM,
    to: adminEmails,
    subject: `New access request from ${name || email}`,
    html: base(`
      <h2 style="font-size:22px;margin-bottom:8px;">New access request 🏡</h2>
      <p style="color:#555;font-size:15px;line-height:1.6;">
        <strong>${name || '(No name)'}</strong> (<span style="color:#555;">${email}</span>) just signed up and is waiting to be let in.
      </p>
      ${btn('Review request →', `${BASE_URL}/dashboard/family`)}
    `),
  })
}

// ── 2. New booking request → notify all admins ────────────────────────────────
export async function sendNewBookingAlert(
  adminEmails: string[],
  requesterName: string,
  start: string,
  end: string,
) {
  if (!process.env.RESEND_API_KEY || adminEmails.length === 0) return
  await resend().emails.send({
    from: FROM,
    to: adminEmails,
    subject: `New stay request from ${requesterName}`,
    html: base(`
      <h2 style="font-size:22px;margin-bottom:8px;">New stay request 📅</h2>
      <p style="color:#555;font-size:15px;line-height:1.6;">
        <strong>${requesterName}</strong> has requested a stay:<br/>
        <strong>${formatDate(start)} – ${formatDate(end)}</strong> · ${nightCount(start, end)}
      </p>
      ${btn('Review trips →', `${BASE_URL}/dashboard/trips`)}
    `),
  })
}


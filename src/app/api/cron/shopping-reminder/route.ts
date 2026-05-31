import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sendShoppingListReminder } from '@/lib/email'

export const runtime = 'nodejs'

export async function GET(request: Request) {
  // Verify the request is from Vercel Cron
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()

  // Today's date string YYYY-MM-DD
  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)

  // Fetch all active approved bookings that span today or are upcoming
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('id, start_date, end_date, user_id, guest_name')
    .eq('status', 'approved')
    .lte('start_date', todayStr)
    .gte('end_date', todayStr)

  if (error) {
    console.error('Cron: failed to fetch bookings', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const sent: string[] = []

  for (const booking of bookings ?? []) {
    // Calculate midpoint day
    const start = new Date(booking.start_date)
    const end = new Date(booking.end_date)
    const totalNights = Math.round((end.getTime() - start.getTime()) / 86400000) + 1
    if (totalNights < 2) continue // No reminder for single-night stays

    const midOffset = Math.floor(totalNights / 2)
    const midDate = new Date(start)
    midDate.setDate(midDate.getDate() + midOffset)
    const midStr = midDate.toISOString().slice(0, 10)

    if (midStr !== todayStr) continue

    // Skip guest bookings (no email to send)
    if (booking.guest_name) continue

    // Look up the user's email and name
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name')
      .eq('id', booking.user_id)
      .single()

    if (!profile?.email) continue

    const firstName = (profile.full_name || '').split(' ')[0] || 'there'

    await sendShoppingListReminder(profile.email, firstName)
    sent.push(profile.email)
  }

  return NextResponse.json({ ok: true, sent })
}

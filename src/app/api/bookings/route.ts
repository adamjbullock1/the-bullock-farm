import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import { sendNewBookingAlert } from '@/lib/email'

export async function POST(request: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

  const formData = await request.formData()
  const start_date = formData.get('start_date') as string
  const end_date = formData.get('end_date') as string

  if (!start_date || !end_date) {
    return NextResponse.json({ error: 'Missing dates' }, { status: 400 })
  }

  if (new Date(start_date) >= new Date(end_date)) {
    return NextResponse.json({ error: 'End date must be after start date' }, { status: 400 })
  }

  // Check for conflicts with approved or pending bookings
  const { data: conflicts } = await supabase
    .from('bookings')
    .select('id, status')
    .in('status', ['approved', 'pending'])
    .lt('start_date', end_date)
    .gt('end_date', start_date)

  if (conflicts && conflicts.length > 0) {
    const hasPending = conflicts.some(c => c.status === 'pending')
    return NextResponse.json({
      error: hasPending
        ? 'Those dates overlap with a pending request. Please choose different dates.'
        : 'Those dates overlap with an existing booking.',
    }, { status: 409 })
  }

  const { data: profile } = await supabase
    .from('profiles').select('is_admin, full_name, email').eq('id', user.id).single()

  const status = profile?.is_admin ? 'approved' : 'pending'

  // Admins can book on behalf of another user
  const requestedUserId = formData.get('user_id') as string | null
  const bookingUserId = (profile?.is_admin && requestedUserId) ? requestedUserId : user.id

  const { error } = await supabase.from('bookings').insert({
    user_id: bookingUserId,
    start_date,
    end_date,
    status,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify admins of new pending request (non-admin bookings only)
  if (status === 'pending') {
    const { data: admins } = await supabase
      .from('profiles').select('email').eq('is_admin', true).eq('is_active', true)
    const adminEmails = (admins ?? []).map(a => a.email).filter(Boolean) as string[]
    const requesterName = profile?.full_name || profile?.email || 'Someone'
    await sendNewBookingAlert(adminEmails, requesterName, start_date, end_date)
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/trips')

  return NextResponse.json({ ok: true })
}

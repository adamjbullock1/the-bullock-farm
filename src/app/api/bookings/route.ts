import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'

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

  // Check for conflicts with approved bookings
  const { data: conflicts } = await supabase
    .from('bookings')
    .select('id')
    .eq('status', 'approved')
    .lte('start_date', end_date)
    .gte('end_date', start_date)

  if (conflicts && conflicts.length > 0) {
    return NextResponse.json({
      error: 'Those dates overlap with an existing booking.',
    }, { status: 409 })
  }

  const { data: profile } = await supabase
    .from('profiles').select('is_admin, full_name, email').eq('id', user.id).single()

  // Admins can book on behalf of another user or a guest
  const requestedUserId = formData.get('user_id') as string | null
  const guestName = (formData.get('guest_name') as string | null)?.trim() || null
  const noteVal = (formData.get('note') as string | null)?.trim() || null
  const bookingUserId = (profile?.is_admin && requestedUserId) ? requestedUserId : user.id

  const { error } = await supabase.from('bookings').insert({
    user_id: bookingUserId,
    start_date,
    end_date,
    status: 'approved',
    ...(guestName ? { guest_name: guestName } : {}),
    ...(noteVal ? { note: noteVal } : {}),
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidatePath('/dashboard')

  return NextResponse.json({ ok: true })
}

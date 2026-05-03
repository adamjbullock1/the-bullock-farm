'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendBookingApproved, sendBookingDenied } from '@/lib/email'

export async function createBooking(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const startDate = formData.get('start_date') as string
  const endDate = formData.get('end_date') as string

  if (!startDate || !endDate) return

  // Check for conflicts with approved bookings
  const { data: conflicts } = await supabase
    .from('bookings')
    .select('id')
    .eq('status', 'approved')
    .or(`start_date.lte.${endDate},end_date.gte.${startDate}`)
    .limit(1)

  if (conflicts && conflicts.length > 0) {
    redirect('/dashboard?error=conflict')
  }

  await supabase.from('bookings').insert({
    user_id: user.id,
    start_date: startDate,
    end_date: endDate,
    status: 'pending',
  })

  redirect('/dashboard?success=requested')
}

export async function approveBooking(bookingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: booking } = await supabase
    .from('bookings')
    .select('start_date, end_date, user_id')
    .eq('id', bookingId)
    .single()

  await supabase
    .from('bookings')
    .update({ status: 'approved', processed_by: user.id })
    .eq('id', bookingId)

  // Email the booker
  if (booking) {
    const { data: profile } = await supabase
      .from('profiles').select('email, full_name').eq('id', booking.user_id).single()
    if (profile?.email) {
      const firstName = profile.full_name?.split(' ')[0] || 'there'
      await sendBookingApproved(profile.email, firstName, booking.start_date, booking.end_date)
    }
  }

  redirect('/dashboard/trips')
}

export async function deleteBooking(bookingId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Only the owner or an admin can delete
  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()

  const { data: booking } = await supabase
    .from('bookings').select('user_id').eq('id', bookingId).single()

  if (!booking) return { error: 'Booking not found' }
  if (booking.user_id !== user.id && !profile?.is_admin) return { error: 'Not authorized' }

  const { error } = await supabase.from('bookings').delete().eq('id', bookingId)
  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return {}
}

export async function denyBooking(bookingId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: booking } = await supabase
    .from('bookings')
    .select('start_date, end_date, user_id')
    .eq('id', bookingId)
    .single()

  await supabase
    .from('bookings')
    .update({ status: 'denied', processed_by: user.id })
    .eq('id', bookingId)

  // Email the booker
  if (booking) {
    const { data: profile } = await supabase
      .from('profiles').select('email, full_name').eq('id', booking.user_id).single()
    if (profile?.email) {
      const firstName = profile.full_name?.split(' ')[0] || 'there'
      await sendBookingDenied(profile.email, firstName, booking.start_date, booking.end_date)
    }
  }

  redirect('/dashboard/trips')
}

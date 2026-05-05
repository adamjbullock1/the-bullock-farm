'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function updateBooking(
  bookingId: string,
  fields: { start_date: string; end_date: string; note: string }
): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('is_admin').eq('id', user.id).single()

  const { data: booking } = await supabase
    .from('bookings').select('user_id').eq('id', bookingId).single()

  if (!booking) return { error: 'Booking not found' }
  if (booking.user_id !== user.id && !profile?.is_admin) return { error: 'Not authorized' }

  if (new Date(fields.start_date) >= new Date(fields.end_date))
    return { error: 'End date must be after start date' }

  // Check for conflicts with other bookings (excluding this one)
  const { data: conflicts } = await supabase
    .from('bookings')
    .select('id')
    .eq('status', 'approved')
    .neq('id', bookingId)
    .lt('start_date', fields.end_date)
    .gt('end_date', fields.start_date)

  if (conflicts && conflicts.length > 0)
    return { error: 'Those dates overlap with another booking.' }

  const { error } = await supabase
    .from('bookings')
    .update({ start_date: fields.start_date, end_date: fields.end_date, note: fields.note || null })
    .eq('id', bookingId)

  if (error) return { error: error.message }

  revalidatePath('/dashboard')
  return {}
}

export async function deleteBooking(bookingId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

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

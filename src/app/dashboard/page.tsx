export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import BookingCalendar from '@/components/BookingCalendar'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: bookings }, { data: profile }, { data: members }] = await Promise.all([
    supabase
      .from('bookings')
      .select('id, start_date, end_date, status, user_id, guest_name, note, profiles!bookings_user_id_fkey(full_name, email, phone)')
      .eq('status', 'approved')
      .order('start_date', { ascending: true }),
    supabase.from('profiles').select('is_admin').eq('id', user.id).single(),
    supabase.from('profiles').select('id, full_name').eq('is_active', true).order('full_name'),
  ])

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">🏡 Calendar</h2>
      <p className="text-gray-500 text-sm mb-6">See who's coming and request your own stay.</p>
      <BookingCalendar
        bookings={bookings ?? []}
        currentUserId={user.id}
        isAdmin={profile?.is_admin ?? false}
        members={profile?.is_admin ? (members ?? []) : []}
      />
    </div>
  )
}

export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { approveBooking, denyBooking } from '@/app/actions/bookings'

export default async function TripsPage() {
  const supabase = await createClient()

  const { data: pendingBookings, error } = await supabase
    .from('bookings')
    .select('id, start_date, end_date, status, created_at, user_id, guest_name, note, profiles!bookings_user_id_fkey(full_name, email)')
    .eq('status', 'pending')
    .order('start_date', { ascending: true })

  if (error) console.error('trips query error:', error)

  if (!pendingBookings || pendingBookings.length === 0) {
    return (
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">📅 Stay Requests</h2>
        <p className="text-sm text-gray-500 mb-6">Say yes or no to upcoming visits.</p>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
          <p className="text-3xl mb-3">✅</p>
          <p className="font-medium text-gray-700">All caught up!</p>
          <p className="text-sm text-gray-400 mt-1">No stay requests waiting for a response.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">📅 Stay Requests</h2>
      <p className="text-sm text-gray-500 mb-6">Say yes or no to upcoming visits.</p>

      <div className="space-y-4">
        {pendingBookings.map(b => {
          const profile = Array.isArray(b.profiles) ? b.profiles[0] : b.profiles
          const displayName = b.guest_name || profile?.full_name || 'A family member'
          const start = new Date(b.start_date + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric',
          })
          const end = new Date(b.end_date + 'T00:00:00').toLocaleDateString('en-US', {
            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
          })
          const nights = Math.round(
            (new Date(b.end_date).getTime() - new Date(b.start_date).getTime()) / (1000 * 60 * 60 * 24)
          )

          return (
            <div key={b.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="font-semibold text-gray-900 text-base">
                    {displayName} wants to visit
                  </p>
                  <div className="mt-2 space-y-0.5">
                    <p className="text-gray-600 text-sm">🗓 {start}</p>
                    <p className="text-gray-600 text-sm">🏁 {end}</p>
                    <p className="text-gray-400 text-xs mt-1">{nights} night{nights !== 1 ? 's' : ''}</p>
                    {b.note && (
                      <p className="text-xs text-gray-400 mt-1.5">{b.note}</p>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2 min-w-[140px]">
                  <form action={approveBooking.bind(null, b.id)}>
                    <button type="submit" className="w-full bg-green-600 text-white font-medium px-5 py-2.5 rounded-xl hover:bg-green-700 transition text-sm">
                      ✓ Approve visit
                    </button>
                  </form>
                  <form action={denyBooking.bind(null, b.id)}>
                    <button type="submit" className="w-full bg-white border border-gray-200 text-gray-600 font-medium px-5 py-2.5 rounded-xl hover:bg-gray-50 transition text-sm">
                      ✕ Decline
                    </button>
                  </form>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

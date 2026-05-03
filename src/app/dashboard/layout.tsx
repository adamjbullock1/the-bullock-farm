export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardNav from '@/components/DashboardNav'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [{ data: profile }, { count: tripCount }, { count: memberCount }] = await Promise.all([
    supabase.from('profiles').select('full_name, is_admin').eq('id', user.id).single(),
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', false).neq('id', user.id),
  ])

  const firstName = profile?.full_name?.split(' ')[0] ?? ''

  return (
    <div className="min-h-screen bg-white">
      {/* Top bar — mirrors sidebar layout so title/signout align with tabs/content */}
      <nav className="bg-white border-b border-gray-100 py-4">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex items-center gap-10">
          {/* Title aligned with sidebar */}
          <div className="w-56 shrink-0 flex items-center gap-2">
            <div className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-900 shrink-0">
              <span className="text-white text-xs font-bold tracking-tight">BF</span>
            </div>
            <span className="text-lg font-semibold text-gray-900">The Bullock Farm</span>
          </div>
          {/* Welcome + sign out aligned with content */}
          <div className="flex-1 flex items-center justify-end min-w-0 gap-3">
            {firstName && (
              <span className="text-gray-400 text-sm hidden sm:inline">Hi, {firstName}</span>
            )}
            {firstName && <span className="text-gray-200 text-sm hidden sm:inline">|</span>}
            <form action={signOut}>
              <button type="submit" className="text-sm text-gray-500 hover:text-gray-900 transition">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>

      {/* Sidebar + content */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-10 flex flex-col md:flex-row gap-10">
        <DashboardNav
          isAdmin={profile?.is_admin ?? false}
          tripCount={tripCount ?? 0}
          memberCount={profile?.is_admin ? (memberCount ?? 0) : 0}
        />
        <main className="flex-1 min-w-0 max-w-3xl">
          {children}
        </main>
      </div>
    </div>
  )
}

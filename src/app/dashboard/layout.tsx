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
      {/* Top bar */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold text-gray-900">The Bullock Farm</span>
            {firstName && (
              <span className="text-gray-400 text-sm hidden sm:inline">· Welcome back, {firstName}</span>
            )}
          </div>
          <form action={signOut}>
            <button type="submit" className="text-sm text-gray-500 hover:text-gray-900 transition">
              Sign out
            </button>
          </form>
        </div>
      </nav>

      {/* Sidebar + content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 flex flex-col md:flex-row gap-6">
        <DashboardNav
          isAdmin={profile?.is_admin ?? false}
          tripCount={tripCount ?? 0}
          memberCount={memberCount ?? 0}
        />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}

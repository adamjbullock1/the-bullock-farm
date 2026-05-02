import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import AdminNav from '@/components/AdminNav'

async function signOut() {
  'use server'
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin, full_name')
    .eq('id', user.id)
    .single()

  if (profile !== null && profile.is_admin === false) redirect('/dashboard')

  // Fetch counts for nav badges
  const [{ count: tripCount }, { count: memberCount }] = await Promise.all([
    supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('is_active', false).neq('id', user.id),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-gray-700 transition">
              ← Back to calendar
            </Link>
            <span className="text-gray-200">|</span>
            <span className="text-lg font-semibold text-gray-900">Manage The Farm</span>
          </div>
          <form action={signOut}>
            <button type="submit" className="text-sm text-gray-500 hover:text-gray-900 transition">
              Sign out
            </button>
          </form>
        </div>
      </nav>

      {/* Body */}
      <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col md:flex-row gap-8">
        <AdminNav tripCount={tripCount ?? 0} memberCount={memberCount ?? 0} />
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
    </div>
  )
}

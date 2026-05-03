export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'

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
    <DashboardShell
      firstName={firstName}
      isAdmin={profile?.is_admin ?? false}
      tripCount={tripCount ?? 0}
      memberCount={profile?.is_admin ? (memberCount ?? 0) : 0}
      signOut={signOut}
    >
      {children}
    </DashboardShell>
  )
}

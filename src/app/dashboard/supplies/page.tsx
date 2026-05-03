export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import SuppliesList from '@/components/SuppliesList'

export default async function SuppliesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: items }, { data: profile }] = await Promise.all([
    supabase
      .from('supply_items')
      .select('id, name, note, purchased_at, added_by, purchased_by, profiles!supply_items_added_by_fkey(full_name), purchaser:profiles!supply_items_purchased_by_fkey(full_name)')
      .order('created_at', { ascending: true }),
    supabase.from('profiles').select('is_admin').eq('id', user.id).single(),
  ])

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-1">🛒 Supply List</h2>
      <p className="text-sm text-gray-500 mb-6">Grab a few things before your visit!</p>
      <SuppliesList
        items={items ?? []}
        currentUserId={user.id}
        isAdmin={profile?.is_admin ?? false}
      />
    </div>
  )
}

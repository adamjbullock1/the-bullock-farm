'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function addSupplyItem(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = (formData.get('name') as string).trim()
  const note = (formData.get('note') as string | null)?.trim() || null
  if (!name) return

  await supabase.from('supply_items').insert({ name, note, added_by: user.id })
  revalidatePath('/dashboard/supplies')
}

export async function markPurchased(itemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('supply_items')
    .update({ purchased_by: user.id, purchased_at: new Date().toISOString() })
    .eq('id', itemId)

  revalidatePath('/dashboard/supplies')
}

export async function unmarkPurchased(itemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase
    .from('supply_items')
    .update({ purchased_by: null, purchased_at: null })
    .eq('id', itemId)

  revalidatePath('/dashboard/supplies')
}

export async function updateSupplyItem(itemId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const name = (formData.get('name') as string).trim()
  const note = (formData.get('note') as string | null)?.trim() || null
  if (!name) return

  await supabase.from('supply_items').update({ name, note }).eq('id', itemId)
  revalidatePath('/dashboard/supplies')
}

export async function deleteSupplyItem(itemId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  await supabase.from('supply_items').delete().eq('id', itemId)
  revalidatePath('/dashboard/supplies')
}

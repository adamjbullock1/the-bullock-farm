'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function activateUser(userId: string) {
  const supabase = await createClient()
  await supabase.from('profiles').update({ is_active: true }).eq('id', userId)
  redirect('/dashboard/family')
}

export async function deactivateUser(userId: string) {
  const supabase = await createClient()
  await supabase.from('profiles').update({ is_active: false }).eq('id', userId)
  redirect('/dashboard/family')
}

export async function toggleAdmin(userId: string, currentValue: boolean) {
  const supabase = await createClient()
  await supabase.from('profiles').update({ is_admin: !currentValue }).eq('id', userId)
  redirect('/dashboard/family')
}

export async function updateMember(userId: string, formData: FormData) {
  const supabase = await createClient()
  const full_name = (formData.get('full_name') as string).trim()
  const email = (formData.get('email') as string).trim()
  const phone = (formData.get('phone') as string).trim()
  await supabase.from('profiles').update({ full_name, email, phone }).eq('id', userId)
  revalidatePath('/dashboard/family')
}

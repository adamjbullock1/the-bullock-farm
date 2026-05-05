'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { sendNewSignupAlert, sendWelcomeEmail } from '@/lib/email'

export async function notifyAdminsOfSignup(name: string, email: string) {
  const supabase = createAdminClient()
  const { data: admins } = await supabase
    .from('profiles')
    .select('email')
    .eq('is_admin', true)
    .eq('is_active', true)
  const adminEmails = (admins ?? []).map(a => a.email).filter(Boolean) as string[]
  await sendNewSignupAlert(adminEmails, name, email)
}

export async function activateUser(userId: string) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single()

  await supabase.from('profiles').update({ is_active: true }).eq('id', userId)

  if (profile?.email) {
    const firstName = profile.full_name?.split(' ')[0] || 'there'
    await sendWelcomeEmail(profile.email, firstName)
  }

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

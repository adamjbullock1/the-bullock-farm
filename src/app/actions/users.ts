'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { Resend } from 'resend'

export async function activateUser(userId: string) {
  const supabase = await createClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name')
    .eq('id', userId)
    .single()

  await supabase.from('profiles').update({ is_active: true }).eq('id', userId)

  // Send welcome email
  if (profile?.email && process.env.RESEND_API_KEY) {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const firstName = profile.full_name?.split(' ')[0] || 'there'
    await resend.emails.send({
      from: 'The Bullock Farm <noreply@thebullockfarm.com>',
      to: profile.email,
      subject: "You're in! Welcome to The Bullock Farm",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color: #111;">
          <h2 style="font-size: 22px; margin-bottom: 8px;">Hey ${firstName}, you're approved! 🏡</h2>
          <p style="color: #555; font-size: 15px; line-height: 1.6;">
            You've been given access to The Bullock Farm portal. You can now view the calendar,
            request stays, and see who else is visiting.
          </p>
          <a href="https://thebullockfarm.com/login"
             style="display: inline-block; margin-top: 20px; background: #111; color: #fff;
                    padding: 12px 24px; border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: 600;">
            Go to The Bullock Farm →
          </a>
          <p style="margin-top: 32px; font-size: 13px; color: #aaa;">
            The Bullock Farm · thebullockfarm.com
          </p>
        </div>
      `,
    })
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

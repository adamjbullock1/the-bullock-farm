'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function addSection(formData: FormData) {
  const supabase = await createClient()
  const title = (formData.get('title') as string).trim()
  const emoji = (formData.get('emoji') as string).trim() || '📌'
  if (!title) return

  const { count } = await supabase
    .from('guide_sections')
    .select('*', { count: 'exact', head: true })

  await supabase.from('guide_sections').insert({
    title,
    emoji,
    order_index: count ?? 0,
  })
  revalidatePath('/dashboard/guide')
}

export async function updateSection(id: string, formData: FormData) {
  const supabase = await createClient()
  const title = (formData.get('title') as string).trim()
  const emoji = (formData.get('emoji') as string).trim() || '📌'
  const body = (formData.get('body') as string | null) ?? ''
  const video_url = (formData.get('video_url') as string | null)?.trim() || null
  if (!title) return

  await supabase.from('guide_sections').update({ title, emoji, body, video_url }).eq('id', id)
  revalidatePath('/dashboard/guide')
}

export async function deleteSection(id: string) {
  const supabase = await createClient()
  await supabase.from('guide_sections').delete().eq('id', id)
  revalidatePath('/dashboard/guide')
}

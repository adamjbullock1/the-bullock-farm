'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ── Sections ──────────────────────────────────────────────

export async function addSection(formData: FormData) {
  const supabase = await createClient()
  const title = (formData.get('title') as string).trim()
  const emoji = (formData.get('emoji') as string).trim() || '📌'
  if (!title) return

  // Place at end
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
  if (!title) return

  await supabase.from('guide_sections').update({ title, emoji }).eq('id', id)
  revalidatePath('/dashboard/guide')
}

export async function deleteSection(id: string) {
  const supabase = await createClient()
  await supabase.from('guide_sections').delete().eq('id', id)
  revalidatePath('/dashboard/guide')
}

// ── Items ─────────────────────────────────────────────────

export async function addItem(sectionId: string, formData: FormData) {
  const supabase = await createClient()
  const content = (formData.get('content') as string).trim()
  if (!content) return

  const { count } = await supabase
    .from('guide_items')
    .select('*', { count: 'exact', head: true })
    .eq('section_id', sectionId)

  await supabase.from('guide_items').insert({
    section_id: sectionId,
    content,
    order_index: count ?? 0,
  })
  revalidatePath('/dashboard/guide')
}

export async function updateItem(id: string, formData: FormData) {
  const supabase = await createClient()
  const content = (formData.get('content') as string).trim()
  if (!content) return

  await supabase.from('guide_items').update({ content }).eq('id', id)
  revalidatePath('/dashboard/guide')
}

export async function deleteItem(id: string) {
  const supabase = await createClient()
  await supabase.from('guide_items').delete().eq('id', id)
  revalidatePath('/dashboard/guide')
}

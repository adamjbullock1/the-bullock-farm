import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import GuideEditor from '@/components/GuideEditor'
import GuideViewer from '@/components/GuideViewer'

export default async function GuidePage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, { data: sections }] = await Promise.all([
    supabase.from('profiles').select('is_admin').eq('id', user.id).single(),
    supabase.from('guide_sections').select('*, guide_items(*)').order('order_index'),
  ])

  if (profile?.is_admin) {
    return (
      <div className="max-w-2xl">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">📖 Farm Guide</h2>
          <p className="text-sm text-gray-500 mt-1">
            Add tips and instructions for guests.
          </p>
        </div>
        <GuideEditor sections={sections ?? []} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900">📖 Farm Guide</h2>
        <p className="text-sm text-gray-500 mt-1">
          Everything you need to know for your stay at the farm.
        </p>
      </div>
      <GuideViewer sections={sections ?? []} />
    </div>
  )
}

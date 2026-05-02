export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { activateUser } from '@/app/actions/users'
import MemberActions from '@/components/MemberActions'

export default async function FamilyMembersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: members }, { data: pending }, { data: profile }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, full_name, is_admin, phone, created_at')
      .eq('is_active', true)
      .order('full_name', { ascending: true }),
    supabase
      .from('profiles')
      .select('id, email, full_name, created_at')
      .eq('is_active', false)
      .neq('id', user.id)
      .order('created_at', { ascending: false }),
    supabase.from('profiles').select('is_admin').eq('id', user.id).single(),
  ])

  const isAdmin = profile?.is_admin ?? false

  return (
    <div className="space-y-10">

      {/* ── Waiting for access (admins only) ── */}
      {isAdmin && pending && pending.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-1">Waiting for Access</h2>
          <p className="text-sm text-gray-500 mb-4">These people signed up and are waiting to be let in.</p>
          <div className="space-y-3">
            {pending.map(u => (
              <div
                key={u.id}
                className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 flex items-center justify-between gap-4 flex-wrap"
              >
                <div>
                  <p className="font-semibold text-gray-900">{u.full_name || '(No name given)'}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{u.email}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Signed up {new Date(u.created_at).toLocaleDateString('en-US', {
                      month: 'long', day: 'numeric', year: 'numeric',
                    })}
                  </p>
                </div>
                <form action={activateUser.bind(null, u.id)}>
                  <button
                    type="submit"
                    className="bg-green-600 text-white font-medium px-5 py-2.5 rounded-xl hover:bg-green-700 transition text-sm whitespace-nowrap"
                  >
                    ✓ Let them in
                  </button>
                </form>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Active members ── */}
      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">Family Members</h2>
        {!isAdmin && (
          <p className="text-sm text-gray-500 mb-4">Everyone who has access to the farm portal.</p>
        )}

        {!members || members.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
            <p className="text-3xl mb-3">🏡</p>
            <p className="font-medium text-gray-700">Just you so far!</p>
            <p className="text-sm text-gray-400 mt-1">Invite family members to sign up.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map(u => {
              const isMe = u.id === user!.id
              return (
                <div
                  key={u.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4 flex-wrap"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">{u.full_name || '(No name)'}</p>
                      {isMe && (
                        <span className="bg-gray-100 text-gray-500 text-xs font-medium px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                      {u.is_admin && (
                        <span className="bg-blue-50 text-blue-600 text-xs font-medium px-2 py-0.5 rounded-full border border-blue-100">
                          Admin
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-0.5">{u.email}</p>
                    {u.phone && (
                      <p className="text-sm text-gray-400 mt-0.5">{u.phone}</p>
                    )}
                  </div>
                  {isMe ? (
                    <MemberActions
                      member={{ id: u.id, full_name: u.full_name, email: u.email, phone: u.phone ?? null, is_admin: u.is_admin }}
                      selfOnly
                    />
                  ) : isAdmin ? (
                    <MemberActions
                      member={{ id: u.id, full_name: u.full_name, email: u.email, phone: u.phone ?? null, is_admin: u.is_admin }}
                    />
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
      </section>

    </div>
  )
}

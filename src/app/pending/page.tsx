import { createClient } from '@/lib/supabase/server'

export default async function PendingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  async function signOut() {
    'use server'
    const supabase = await createClient()
    await supabase.auth.signOut()
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <svg className="w-8 h-8 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Waiting for Approval</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-1">
            Your account has been created.
          </p>
          <p className="text-gray-500 text-sm leading-relaxed mb-6">
            A family admin will activate your account shortly. You&apos;ll be able to log in once approved.
          </p>
          {user && (
            <p className="text-xs text-gray-400 mb-6">Signed in as {user.email}</p>
          )}
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm text-gray-500 hover:text-gray-900 underline underline-offset-4 transition"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

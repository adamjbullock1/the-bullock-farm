'use client'

import { useState, useRef, useEffect } from 'react'
import { deactivateUser, toggleAdmin, updateMember } from '@/app/actions/users'

type Member = {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  is_admin: boolean
}

export default function MemberActions({ member }: { member: Member }) {
  const [open, setOpen] = useState(false)
  const [modal, setModal] = useState<'edit' | 'remove' | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <>
      {/* Three-dot button + dropdown */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setOpen(o => !o)}
          className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
          aria-label="Member actions"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="5" r="2"/><circle cx="12" cy="12" r="2"/><circle cx="12" cy="19" r="2"/>
          </svg>
        </button>

        {open && (
          <div className="absolute right-0 top-10 z-20 w-52 bg-white rounded-2xl shadow-lg border border-gray-100 py-1.5 text-sm">
            <button
              onClick={() => { setModal('edit'); setOpen(false) }}
              className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-700 transition"
            >
              ✏️ Edit details
            </button>
            <form action={toggleAdmin.bind(null, member.id, member.is_admin)}>
              <button
                type="submit"
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-gray-700 transition"
              >
                {member.is_admin ? '🔽 Remove admin' : '⭐ Make admin'}
              </button>
            </form>
            <div className="border-t border-gray-100 my-1" />
            <button
              onClick={() => { setModal('remove'); setOpen(false) }}
              className="w-full text-left px-4 py-2.5 hover:bg-red-50 text-red-500 transition"
            >
              🚫 Remove access
            </button>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {modal === 'edit' && (
        <Modal onClose={() => setModal(null)}>
          <h3 className="text-base font-semibold text-gray-900 mb-4">Edit member details</h3>
          <form
            action={async (fd) => { await updateMember(member.id, fd); setModal(null) }}
            className="space-y-3"
          >
            <Field label="Full name" name="full_name" defaultValue={member.full_name ?? ''} placeholder="Jane Bullock" />
            <Field label="Email" name="email" type="email" defaultValue={member.email} placeholder="jane@example.com" />
            <Field label="Phone" name="phone" type="tel" defaultValue={member.phone ?? ''} placeholder="+1 555 000 0000" />
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 bg-gray-900 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-gray-700 transition"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => setModal(null)}
                className="flex-1 border border-gray-200 text-gray-600 text-sm py-2.5 rounded-xl hover:bg-gray-50 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Confirm remove modal */}
      {modal === 'remove' && (
        <Modal onClose={() => setModal(null)}>
          <h3 className="text-base font-semibold text-gray-900 mb-2">Remove access?</h3>
          <p className="text-sm text-gray-500 mb-5">
            <span className="font-medium text-gray-700">{member.full_name || member.email}</span> won't be able to log in anymore. You can always let them back in later.
          </p>
          <div className="flex gap-2">
            <form action={deactivateUser.bind(null, member.id)} className="flex-1">
              <button
                type="submit"
                className="w-full bg-red-500 text-white text-sm font-medium py-2.5 rounded-xl hover:bg-red-600 transition"
              >
                Yes, remove
              </button>
            </form>
            <button
              type="button"
              onClick={() => setModal(null)}
              className="flex-1 border border-gray-200 text-gray-600 text-sm py-2.5 rounded-xl hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}

function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4">
        {children}
      </div>
    </div>
  )
}

function Field({
  label, name, defaultValue, placeholder, type = 'text',
}: {
  label: string; name: string; defaultValue: string; placeholder: string; type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <input
        name={name}
        type={type}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
    </div>
  )
}

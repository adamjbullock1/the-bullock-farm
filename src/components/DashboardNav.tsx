'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

type Props = {
  isAdmin: boolean
  tripCount: number
  memberCount: number
}

export default function DashboardNav({ isAdmin, tripCount, memberCount }: Props) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const links = [
    { href: '/dashboard',        label: 'Calendar',        icon: '🏡', badge: 0,          adminOnly: false },
    { href: '/dashboard/trips',  label: 'Stay Requests',   icon: '📅', badge: tripCount,  adminOnly: true  },
    { href: '/dashboard/family', label: 'Family Members',  icon: '👨‍👩‍👧‍👦', badge: memberCount, adminOnly: false },
    { href: '/dashboard/guide',  label: 'Farm Guide',      icon: '📖', badge: 0,          adminOnly: false },
  ]

  const visible = links.filter(l => !l.adminOnly || isAdmin)

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <ul className="space-y-1">
      {visible.map(link => {
        const isActive = pathname === link.href
        return (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onClick}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition ${
                isActive ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-lg leading-none">{link.icon}</span>
                <p className={`text-sm font-medium leading-tight ${isActive ? 'text-white' : 'text-gray-900'}`}>
                  {link.label}
                </p>
              </div>
              {link.badge > 0 && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-white text-gray-900' : 'bg-amber-100 text-amber-700'
                }`}>
                  {link.badge}
                </span>
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )

  const totalBadge = tripCount + memberCount

  return (
    <>
      {/* ── Mobile hamburger ── */}
      <div className="md:hidden relative">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
          Menu
          {totalBadge > 0 && (
            <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
              {totalBadge}
            </span>
          )}
        </button>

        {open && (
          <div className="absolute left-6 right-6 mt-2 bg-white rounded-2xl border border-gray-100 shadow-xl p-2 z-50">
            <NavLinks onClick={() => setOpen(false)} />
          </div>
        )}
      </div>

      {/* ── Desktop sidebar ── */}
      <nav className="hidden md:block w-56 shrink-0">
        <NavLinks />
      </nav>
    </>
  )
}

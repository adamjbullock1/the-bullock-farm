'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Props = {
  firstName: string
  isAdmin: boolean
  memberCount: number
  children: React.ReactNode
  signOut: () => Promise<void>
}

const links = [
  { href: '/dashboard',          label: 'Calendar',       icon: '🏡', adminOnly: false },
  { href: '/dashboard/supplies', label: 'Shopping List',  icon: '🛒', adminOnly: false },
  { href: '/dashboard/guide',    label: 'Farm Guide',     icon: '📖', adminOnly: false },
  { href: '/dashboard/family',   label: 'Family Members', icon: '👨‍👩‍👧‍👦', adminOnly: false },
]

export default function DashboardShell({ firstName, isAdmin, memberCount, children, signOut }: Props) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

  const visible = links.filter(l => !l.adminOnly || isAdmin)
  const totalBadge = memberCount

  function badge(href: string) {
    if (href === '/dashboard/family') return memberCount
    return 0
  }

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <ul className="space-y-1">
      {visible.map(link => {
        const isActive = pathname === link.href
        const b = badge(link.href)
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
              {b > 0 && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isActive ? 'bg-white text-gray-900' : 'bg-amber-100 text-amber-700'
                }`}>
                  {b}
                </span>
              )}
            </Link>
          </li>
        )
      })}
    </ul>
  )

  return (
    <div className="min-h-screen bg-white">
      {/* Top nav */}
      <nav className="bg-white border-b border-gray-100 py-4 relative">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex items-center justify-between gap-4">

          {/* Left: BF logo (desktop only) + title + hamburger (mobile only) */}
          <div className="flex items-center gap-2">
            {/* BF logo — hidden on mobile */}
            <div className="hidden md:inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gray-900 shrink-0">
              <span className="text-white text-xs font-bold tracking-tight">BF</span>
            </div>

            {/* Hamburger — mobile only */}
            <button
              onClick={() => setMenuOpen(o => !o)}
              className="md:hidden p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition relative"
              aria-label="Open menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6"/>
                <line x1="3" y1="12" x2="21" y2="12"/>
                <line x1="3" y1="18" x2="21" y2="18"/>
              </svg>
              {totalBadge > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-400 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalBadge}
                </span>
              )}
            </button>

            <span className="text-lg font-semibold text-gray-900">The Bullock Farm</span>
          </div>

          {/* Right: Hi name | Sign out */}
          <div className="flex items-center gap-3">
            {firstName && <span className="text-gray-400 text-sm hidden sm:inline">Hi, {firstName}</span>}
            {firstName && <span className="text-gray-200 text-sm hidden sm:inline">|</span>}
            <form action={signOut}>
              <button type="submit" className="text-sm text-gray-500 hover:text-gray-900 transition">
                Sign out
              </button>
            </form>
          </div>
        </div>

        {/* Mobile dropdown — overlays content */}
        {menuOpen && (
          <div className="md:hidden absolute left-6 right-6 top-full mt-2 bg-white rounded-2xl border border-gray-100 shadow-xl p-2 z-50">
            <NavLinks onClick={() => setMenuOpen(false)} />
          </div>
        )}
      </nav>

      {/* Page body */}
      <div className="max-w-7xl mx-auto px-6 sm:px-8 py-5 md:py-10 flex flex-col md:flex-row gap-6 md:gap-10">
        {/* Desktop sidebar */}
        <nav className="hidden md:block w-56 shrink-0">
          <NavLinks />
        </nav>

        <main className="flex-1 min-w-0 max-w-3xl">
          {children}
        </main>
      </div>
    </div>
  )
}

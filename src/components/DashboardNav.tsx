'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Props = {
  isAdmin: boolean
  tripCount: number
  memberCount: number
}

export default function DashboardNav({ isAdmin, tripCount, memberCount }: Props) {
  const pathname = usePathname()

  const links = [
    {
      href: '/dashboard',
      label: 'Calendar',
      icon: '🏡',
      badge: 0,
      description: 'View and request dates',
      adminOnly: false,
    },
    {
      href: '/dashboard/trips',
      label: 'Trip Requests',
      icon: '📅',
      badge: tripCount,
      description: 'Approve or decline visits',
      adminOnly: true,
    },
    {
      href: '/dashboard/family',
      label: 'Family Members',
      icon: '👨‍👩‍👧‍👦',
      badge: memberCount,
      description: 'Manage who has access',
      adminOnly: false,
    },
    {
      href: '/dashboard/guide',
      label: 'Farm Guide',
      icon: '📖',
      badge: 0,
      description: 'Tips and instructions for guests',
      adminOnly: false,
    },
  ]

  const visible = links.filter(l => !l.adminOnly || isAdmin)

  return (
    <nav className="w-full md:w-56 shrink-0">
      <ul className="space-y-1">
        {visible.map(link => {
          const isActive = pathname === link.href
          return (
            <li key={link.href}>
              <Link
                href={link.href}
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
    </nav>
  )
}

'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Props = {
  tripCount: number
  memberCount: number
}

export default function AdminNav({ tripCount, memberCount }: Props) {
  const pathname = usePathname()

  const links = [
    {
      href: '/admin/trips',
      label: 'Trip Requests',
      icon: '📅',
      badge: tripCount,
      description: 'Approve or decline visit requests',
    },
    {
      href: '/admin/members',
      label: 'New Members',
      icon: '👋',
      badge: memberCount,
      description: 'People waiting to be let in',
    },
    {
      href: '/admin/family',
      label: 'The Family',
      icon: '👨‍👩‍👧‍👦',
      badge: 0,
      description: 'Manage who has access',
    },
  ]

  return (
    <nav className="w-full md:w-64 shrink-0">
      <ul className="space-y-1">
        {links.map(link => {
          const isActive = pathname === link.href
          return (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`flex items-center justify-between px-4 py-3 rounded-xl transition group ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{link.icon}</span>
                  <div>
                    <p className={`text-sm font-medium leading-tight ${isActive ? 'text-white' : 'text-gray-900'}`}>
                      {link.label}
                    </p>
                    <p className={`text-xs mt-0.5 hidden md:block ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
                      {link.description}
                    </p>
                  </div>
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

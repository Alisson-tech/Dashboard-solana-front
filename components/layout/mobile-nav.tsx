'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const mobileLinks = [
  { href: '/dashboard', label: 'Home', icon: 'home' },
  { href: '/bounties', label: 'Browse', icon: 'explore' },
  { href: '/create', label: 'Submit', icon: 'add_circle' },
  { href: '/profile', label: 'Profile', icon: 'person' },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 z-50 flex w-full items-center justify-around rounded-t-2xl border-t border-on-surface-variant/15 bg-background/80 px-4 py-3 pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.5)] backdrop-blur-lg lg:hidden">
      {mobileLinks.map((link) => {
        const isActive = pathname === link.href
        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              'flex flex-col items-center justify-center',
              isActive
                ? 'scale-110 text-secondary'
                : 'text-on-surface-variant'
            )}
          >
            <span className="material-symbols-outlined">{link.icon}</span>
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {link.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}

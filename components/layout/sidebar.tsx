'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { PublicKey } from '@solana/web3.js'
import { cn } from '@/lib/utils'
import { useBurnerWallet } from '@/hooks/use-burner-wallet'

const sidebarLinks = [
  { href: '/dashboard', label: 'Overview', icon: 'dashboard' },
  { href: '/bounties', label: 'Bounties', icon: 'payments' },
  { href: '/analytics', label: 'Analytics', icon: 'leaderboard' },
  { href: '/settings', label: 'Settings', icon: 'settings' },
]

const bottomLinks = [
  { href: '/support', label: 'Support', icon: 'help' },
  { href: '/docs', label: 'Docs', icon: 'description' },
]

interface SidebarProps {
  showHeader?: boolean
}

export function Sidebar({ showHeader = true }: SidebarProps) {
  const pathname = usePathname()
  const { isAuthenticated, primaryWallet, user } = useDynamicContext()
  const { wallet: burner, balance: burnerBalance } = useBurnerWallet()
  
  const connected = isAuthenticated
  const activeWallet = primaryWallet || burner
  const publicKey = activeWallet?.address 
    ? new PublicKey(activeWallet.address) 
    : ('publicKey' in (activeWallet || {})) 
      ? (activeWallet as any).publicKey 
      : null

  return (
    <aside className={`fixed left-0 top-0 hidden h-screen w-64 flex-col border-r border-on-surface-variant/10 bg-surface-container-low lg:flex ${showHeader ? 'pt-20' : 'pt-6'}`}>
      {/* User Profile Section */}
      <div className="px-6 py-6">
        <Link href="/profile" className="flex items-center gap-3 group">
          <div className="relative">
            <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-primary/20 group-hover:border-primary/40 transition-colors">
              <div className="h-full w-full bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary">person</span>
              </div>
            </div>
            {connected && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-surface-container-low bg-secondary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-on-surface truncate group-hover:text-primary transition-colors">
              {isAuthenticated ? (user?.email?.split('@')[0] || 'User') : 'SolCuts HQ'}
            </p>
            <p className="text-xs text-on-surface-variant">
              {connected ? (
                <span className="flex items-center gap-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${primaryWallet ? 'bg-secondary' : 'bg-primary animate-pulse'}`} />
                  {primaryWallet ? 'Verified Host' : 'Abstracted Mode'}
                </span>
              ) : (
                'Not connected'
              )}
            </p>
          </div>
        </Link>

        {/* Wallet Info */}
        {connected && publicKey && (
          <div className="mt-4 rounded-xl bg-surface-container-high p-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                  {primaryWallet ? 'Primary Wallet' : 'Session Wallet'}
                </p>
                <p className="font-mono text-xs text-on-surface">
                  {publicKey.toString().slice(0, 6)}...{publicKey.toString().slice(-4)}
                </p>
              </div>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${primaryWallet ? 'bg-secondary/10 text-secondary' : 'bg-primary/10 text-primary'}`}>
                {primaryWallet ? 'DEVNET' : 'DEMO'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="mx-6 mb-4 grid grid-cols-2 gap-2">
        <div className="rounded-lg bg-surface-container-high p-3 text-center">
          <p className="font-headline text-lg font-bold text-on-surface">12</p>
          <p className="text-[10px] text-on-surface-variant">Active</p>
        </div>
        <div className="rounded-lg bg-surface-container-high p-3 text-center">
          <p className="font-headline text-lg font-bold text-secondary">32.5</p>
          <p className="text-[10px] text-on-surface-variant">SOL Earned</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-4">
        <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
          Menu
        </p>
        {sidebarLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + '/')
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'group flex items-center gap-3 rounded-xl px-4 py-3 transition-all',
                isActive
                  ? 'bg-gradient-to-r from-primary/15 to-transparent text-primary'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              )}
            >
              <span
                className={cn(
                  'material-symbols-outlined transition-all',
                  isActive && 'text-primary'
                )}
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {link.icon}
              </span>
              <span className="font-medium">{link.label}</span>
              {isActive && (
                <span className="ml-auto h-2 w-2 rounded-full bg-primary" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Create Bounty CTA */}
      <div className="mx-4 mb-4">
        <Link
          href="/create"
          className="gradient-solana flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold text-on-primary-fixed transition-all hover:shadow-[0_0_20px_rgba(52,254,160,0.3)] active:scale-95"
        >
          <span className="material-symbols-outlined text-sm">add</span>
          Create Bounty
        </Link>
      </div>

      {/* Bottom Links */}
      <div className="space-y-1 border-t border-outline-variant/10 px-4 py-4">
        <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60">
          Resources
        </p>
        {bottomLinks.map((link) => {
          const isActive = pathname === link.href
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-all',
                isActive
                  ? 'bg-surface-container-high text-on-surface'
                  : 'text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface'
              )}
            >
              <span className="material-symbols-outlined text-sm">{link.icon}</span>
              {link.label}
            </Link>
          )
        })}
      </div>

      {/* Version Badge */}
      <div className="border-t border-outline-variant/10 px-6 py-3">
        <div className="flex items-center justify-between text-[10px] text-on-surface-variant/60">
          <span>SolCuts v0.1.0</span>
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-secondary" />
            Devnet
          </span>
        </div>
      </div>
    </aside>
  )
}

'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DynamicWidget, useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { PublicKey } from '@solana/web3.js'
import { cn } from '@/lib/utils'

const navLinks = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/bounties', label: 'Marketplace' },
  { href: '/create', label: 'Create Bounty' },
]

const notifications = [
  {
    id: 1,
    type: 'success',
    title: 'Bounty Completed',
    message: 'Summer Clip Challenge has ended. 5.2 SOL distributed.',
    time: '2 min ago',
    read: false,
  },
  {
    id: 2,
    type: 'info',
    title: 'New Submission',
    message: '@clipmaster99 submitted a clip to your bounty.',
    time: '15 min ago',
    read: false,
  },
  {
    id: 3,
    type: 'warning',
    title: 'Bounty Ending Soon',
    message: 'Viral Gaming Moments ends in 2 hours.',
    time: '1 hour ago',
    read: true,
  },
  {
    id: 4,
    type: 'success',
    title: 'Payout Received',
    message: 'You earned 0.85 SOL from DeFi Tutorial Challenge.',
    time: '3 hours ago',
    read: true,
  },
]

interface HeaderProps {
  hideNav?: boolean
}

export function Header({ hideNav = false }: HeaderProps) {
  const pathname = usePathname()
  const { isAuthenticated, user, primaryWallet } = useDynamicContext()
  
  const connected = isAuthenticated
  const publicKey = primaryWallet?.address ? new PublicKey(primaryWallet.address) : null
  const [showNotifications, setShowNotifications] = useState(false)
  const [showWalletMenu, setShowWalletMenu] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const walletRef = useRef<HTMLDivElement>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (walletRef.current && !walletRef.current.contains(event.target as Node)) {
        setShowWalletMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return 'check_circle'
      case 'warning':
        return 'warning'
      case 'info':
        return 'info'
      default:
        return 'notifications'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'text-secondary'
      case 'warning':
        return 'text-warning'
      case 'info':
        return 'text-primary'
      default:
        return 'text-on-surface-variant'
    }
  }

  return (
    <nav className="fixed left-0 right-0 top-0 z-50 border-b border-on-surface-variant/15 bg-background/60 shadow-[0_40px_40px_-15px_rgba(153,69,255,0.08)] backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-4 py-4 md:px-6">
        <div className="flex items-center gap-8">
          <Link
            href="/"
            className="gradient-text font-headline text-2xl font-bold tracking-tight"
          >
            SolCuts
          </Link>
          <div className="hidden items-center gap-6 md:flex">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'font-headline tracking-tight transition-colors',
                    isActive
                      ? 'border-b-2 border-secondary pb-1 text-secondary'
                      : 'text-on-surface-variant hover:text-on-surface'
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          {/* Wallet Info Button */}
          {connected && publicKey && (
            <div className="relative" ref={walletRef}>
              <button
                onClick={() => setShowWalletMenu(!showWalletMenu)}
                className="flex items-center gap-2 rounded-full border border-outline-variant/20 bg-surface-container-high/50 px-3 py-2 transition-all duration-300 hover:border-primary/30 hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined text-sm text-primary">
                  account_balance_wallet
                </span>
                <span className="hidden text-xs font-medium text-on-surface md:inline">
                  {publicKey.toString().slice(0, 4)}...{publicKey.toString().slice(-4)}
                </span>
              </button>

              {showWalletMenu && (
                <div className="absolute right-0 top-full mt-2 w-72 overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-low shadow-xl">
                  <div className="border-b border-outline-variant/10 bg-gradient-to-r from-primary/10 to-secondary/10 p-4">
                    <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      Connected Wallet
                    </p>
                    <p className="mt-1 font-mono text-sm text-on-surface">
                      {publicKey.toString().slice(0, 12)}...{publicKey.toString().slice(-8)}
                    </p>
                  </div>
                  <div className="p-2">
                    <div className="flex items-center justify-between rounded-xl bg-surface-container-high p-3">
                      <div>
                        <p className="text-xs text-on-surface-variant">Balance</p>
                        <p className="font-headline text-lg font-bold text-on-surface">
                          -- SOL
                        </p>
                      </div>
                      <span className="rounded-full bg-secondary/10 px-2 py-1 text-[10px] font-bold text-secondary">
                        DEVNET
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-outline-variant/10 p-2">
                    <Link
                      href="/settings?tab=wallet"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                      onClick={() => setShowWalletMenu(false)}
                    >
                      <span className="material-symbols-outlined text-sm">settings</span>
                      Wallet Settings
                    </Link>
                    <a
                      href={`https://explorer.solana.com/address/${publicKey.toString()}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
                    >
                      <span className="material-symbols-outlined text-sm">open_in_new</span>
                      View on Explorer
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative rounded-full p-2 transition-all duration-300 hover:bg-surface-container-high/50"
            >
              <span className="material-symbols-outlined text-on-surface-variant">
                notifications
              </span>
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-error text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-low shadow-xl md:w-96">
                <div className="flex items-center justify-between border-b border-outline-variant/10 p-4">
                  <h3 className="font-headline font-bold text-on-surface">Notifications</h3>
                  <button className="text-xs font-medium text-primary hover:underline">
                    Mark all read
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        'flex gap-3 border-b border-outline-variant/5 p-4 transition-colors hover:bg-surface-container-high',
                        !notif.read && 'bg-primary/5'
                      )}
                    >
                      <span
                        className={cn(
                          'material-symbols-outlined mt-0.5',
                          getNotificationColor(notif.type)
                        )}
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {getNotificationIcon(notif.type)}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-on-surface">{notif.title}</p>
                          {!notif.read && (
                            <span className="mt-1 h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-on-surface-variant">
                          {notif.message}
                        </p>
                        <p className="mt-1 text-xs text-on-surface-variant/60">
                          {notif.time}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-outline-variant/10 p-2">
                  <Link
                    href="/settings?tab=notifications"
                    className="flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium text-primary hover:bg-primary/5"
                    onClick={() => setShowNotifications(false)}
                  >
                    View All Notifications
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Wallet Connect Button */}
          <DynamicWidget />

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="rounded-lg p-2 hover:bg-surface-container-high md:hidden"
          >
            <span className="material-symbols-outlined text-on-surface">
              {showMobileMenu ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="border-t border-outline-variant/10 bg-surface-container-low p-4 md:hidden">
          <div className="space-y-2">
            {navLinks.map((link) => {
              const isActive = pathname === link.href
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setShowMobileMenu(false)}
                  className={cn(
                    'block rounded-lg px-4 py-3 font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : 'text-on-surface-variant hover:bg-surface-container-high'
                  )}
                >
                  {link.label}
                </Link>
              )
            })}
            <hr className="border-outline-variant/10" />
            <Link
              href="/analytics"
              onClick={() => setShowMobileMenu(false)}
              className="block rounded-lg px-4 py-3 font-medium text-on-surface-variant hover:bg-surface-container-high"
            >
              Analytics
            </Link>
            <Link
              href="/settings"
              onClick={() => setShowMobileMenu(false)}
              className="block rounded-lg px-4 py-3 font-medium text-on-surface-variant hover:bg-surface-container-high"
            >
              Settings
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

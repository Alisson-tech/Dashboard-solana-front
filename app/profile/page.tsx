'use client'

import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { MainLayout } from '@/components/layout/main-layout'
import { DynamicWidget } from '@dynamic-labs/sdk-react-core'

export default function ProfilePage() {
  const { user, isAuthenticated, primaryWallet } = useDynamicContext()

  return (
    <MainLayout>
      <div className="mx-auto max-w-4xl py-12">
        <header className="mb-12">
          <h1 className="font-headline text-4xl font-bold text-on-surface">Your Profile</h1>
          <p className="text-on-surface-variant">Manage your account and connected wallets.</p>
        </header>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          <div className="md:col-span-1">
            <div className="rounded-3xl border border-outline-variant/10 bg-surface-container-low p-6 text-center">
              <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                <span className="material-symbols-outlined text-4xl text-primary">person</span>
              </div>
              <h2 className="font-headline text-xl font-bold text-on-surface">
                {user?.email || 'Anonymous User'}
              </h2>
              <p className="text-sm text-on-surface-variant">Member since 2026</p>
              
              <div className="mt-6">
                <DynamicWidget />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-8">
            <div className="rounded-3xl border border-outline-variant/10 bg-surface-container-low p-8">
              <h3 className="mb-6 font-headline text-2xl font-bold text-on-surface">Account Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between border-b border-outline-variant/10 pb-4">
                  <span className="text-on-surface-variant">Email Address</span>
                  <span className="font-medium text-on-surface">{user?.email || 'Not provided'}</span>
                </div>
                <div className="flex justify-between border-b border-outline-variant/10 pb-4">
                  <span className="text-on-surface-variant">Primary Wallet</span>
                  <span className="font-mono text-sm text-on-surface">
                    {primaryWallet?.address ? `${primaryWallet.address.slice(0, 8)}...${primaryWallet.address.slice(-8)}` : 'None'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-outline-variant/10 pb-4">
                  <span className="text-on-surface-variant">Auth Method</span>
                  <span className="capitalize text-on-surface">{user?.verifiedCredentials?.[0]?.format || 'Standard'}</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-outline-variant/10 bg-surface-container-low p-8">
              <h3 className="mb-6 font-headline text-2xl font-bold text-on-surface">Activity Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-surface-container-high p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Challenges Hosted</p>
                  <p className="font-headline text-2xl font-bold text-on-surface">0</p>
                </div>
                <div className="rounded-2xl bg-surface-container-high p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Clips Submitted</p>
                  <p className="font-headline text-2xl font-bold text-on-surface">0</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

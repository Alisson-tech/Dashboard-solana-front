'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useAuth } from '@/context/auth-context'
import { MainLayout } from '@/components/layout/main-layout'

export default function ProfilePage() {
  const { publicKey } = useWallet()
  const { role } = useAuth()

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
                {publicKey ? `${publicKey.toString().slice(0, 6)}...` : 'Anonymous'}
              </h2>
              <p className="text-sm text-on-surface-variant capitalize">{role || 'Unregistered'} · Member since 2026</p>
              
              <div className="mt-6">
                <WalletMultiButton />
              </div>
            </div>
          </div>

          <div className="md:col-span-2 space-y-8">
            <div className="rounded-3xl border border-outline-variant/10 bg-surface-container-low p-8">
              <h3 className="mb-6 font-headline text-2xl font-bold text-on-surface">Account Details</h3>
              <div className="space-y-4">
                <div className="flex justify-between border-b border-outline-variant/10 pb-4">
                  <span className="text-on-surface-variant">Wallet Address</span>
                  <span className="font-mono text-sm text-on-surface">
                    {publicKey ? `${publicKey.toString().slice(0, 8)}...${publicKey.toString().slice(-8)}` : 'Not connected'}
                  </span>
                </div>
                <div className="flex justify-between border-b border-outline-variant/10 pb-4">
                  <span className="text-on-surface-variant">Role</span>
                  <span className="font-medium text-on-surface capitalize">{role || 'Not set'}</span>
                </div>
                <div className="flex justify-between border-b border-outline-variant/10 pb-4">
                  <span className="text-on-surface-variant">Network</span>
                  <span className="rounded-full bg-secondary/10 px-2 py-0.5 text-[10px] font-bold text-secondary">Devnet</span>
                </div>
              </div>
            </div>

            <div className="rounded-3xl border border-outline-variant/10 bg-surface-container-low p-8">
              <h3 className="mb-6 font-headline text-2xl font-bold text-on-surface">Activity Stats</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-2xl bg-surface-container-high p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Challenges Hosted</p>
                  <p className="font-headline text-2xl font-bold text-on-surface">{role === 'creator' ? '...' : '0'}</p>
                </div>
                <div className="rounded-2xl bg-surface-container-high p-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Clips Submitted</p>
                  <p className="font-headline text-2xl font-bold text-on-surface">{role === 'editor' ? '...' : '0'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

'use client'

import { useState } from 'react'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { PublicKey } from '@solana/web3.js'
import { MainLayout } from '@/components/layout/main-layout'

export default function SettingsPage() {
  const { isAuthenticated, primaryWallet } = useDynamicContext()
  
  const connected = isAuthenticated
  const publicKey = primaryWallet?.address ? new PublicKey(primaryWallet.address) : null
  const [activeTab, setActiveTab] = useState('profile')
  const [notifications, setNotifications] = useState({
    email: true,
    browser: true,
    bountyUpdates: true,
    payouts: true,
    marketing: false,
  })

  const tabs = [
    { id: 'profile', label: 'Profile', icon: 'person' },
    { id: 'wallet', label: 'Wallet', icon: 'account_balance_wallet' },
    { id: 'notifications', label: 'Notifications', icon: 'notifications' },
    { id: 'security', label: 'Security', icon: 'security' },
  ]

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-headline text-3xl font-bold tracking-tight text-on-surface">
            Settings
          </h1>
          <p className="text-on-surface-variant">
            Manage your account preferences and wallet settings
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Sidebar Tabs */}
          <div className="space-y-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === 'profile' && (
              <div className="space-y-6 rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
                <h2 className="font-headline text-xl font-semibold text-on-surface">
                  Profile Information
                </h2>
                
                <div className="flex items-center gap-6">
                  <div className="relative">
                    <div className="h-20 w-20 overflow-hidden rounded-full border-2 border-primary/20">
                      <img
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuBeBxXGfjNrxWckRKGfaK6fqhizpFWzzuJETbzEcPFE41Zz12mz27uIXnd90ji1mtSwCeMJu7PdyOjo0_FSxEfMzsajRklIV0tSsAGHC92QaWlUpD-OW-yPqbwdpTbuF-FpaWHPZYN9_GxMRqeX5DoSqVYpSpC4p9yhpSxKtbHL_y5XTsQCH2Vc9jLSXgapd8gZV3SY6oupQS1bj8w8f3hKdRBniUr2iSTqobX8-EFp1yIgbYsrctWhaS6mQ1YexNow1j4P_a8MoFB7"
                        alt="Profile"
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <button className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-on-primary-fixed">
                      <span className="material-symbols-outlined text-sm">edit</span>
                    </button>
                  </div>
                  <div>
                    <p className="font-bold text-on-surface">SolCuts HQ</p>
                    <p className="text-sm text-on-surface-variant">Verified Host</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      Display Name
                    </label>
                    <input
                      type="text"
                      defaultValue="SolCuts HQ"
                      className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-high px-4 py-3 text-on-surface focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      Email
                    </label>
                    <input
                      type="email"
                      defaultValue="host@solcuts.io"
                      className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-high px-4 py-3 text-on-surface focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                      Bio
                    </label>
                    <textarea
                      rows={3}
                      defaultValue="Creator of viral clip challenges on Solana. Let's build the attention economy together!"
                      className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-high px-4 py-3 text-on-surface focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <button className="rounded-xl bg-primary px-6 py-3 font-bold text-on-primary-fixed transition-all hover:bg-primary/90">
                  Save Changes
                </button>
              </div>
            )}

            {activeTab === 'wallet' && (
              <div className="space-y-6 rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
                <h2 className="font-headline text-xl font-semibold text-on-surface">
                  Wallet Settings
                </h2>

                <div className="rounded-xl border border-outline-variant/10 bg-surface-container-high p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
                      </div>
                      <div>
                        <p className="font-bold text-on-surface">
                          {connected ? 'Connected Wallet' : 'No Wallet Connected'}
                        </p>
                        <p className="font-mono text-xs text-on-surface-variant">
                          {publicKey ? `${publicKey.toString().slice(0, 8)}...${publicKey.toString().slice(-8)}` : 'Connect your Solana wallet'}
                        </p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${connected ? 'bg-secondary/10 text-secondary' : 'bg-error/10 text-error'}`}>
                      {connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-on-surface">Network</h3>
                  <div className="flex gap-4">
                    <button className="flex-1 rounded-xl border-2 border-primary bg-primary/10 p-4 text-left">
                      <p className="font-bold text-primary">Devnet</p>
                      <p className="text-xs text-on-surface-variant">For testing</p>
                    </button>
                    <button className="flex-1 rounded-xl border border-outline-variant/20 p-4 text-left hover:bg-surface-container-high">
                      <p className="font-bold text-on-surface">Mainnet</p>
                      <p className="text-xs text-on-surface-variant">Production</p>
                    </button>
                  </div>
                </div>

                <div className="rounded-xl bg-surface-container-high p-4">
                  <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-sm">info</span>
                    Devnet SOL can be obtained from the Solana Faucet for testing purposes.
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="space-y-6 rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
                <h2 className="font-headline text-xl font-semibold text-on-surface">
                  Notification Preferences
                </h2>

                <div className="space-y-4">
                  {[
                    { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
                    { key: 'browser', label: 'Browser Notifications', desc: 'Get notified in your browser' },
                    { key: 'bountyUpdates', label: 'Bounty Updates', desc: 'New submissions and milestones' },
                    { key: 'payouts', label: 'Payout Alerts', desc: 'When funds are distributed' },
                    { key: 'marketing', label: 'Marketing', desc: 'News and feature updates' },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container-high p-4"
                    >
                      <div>
                        <p className="font-medium text-on-surface">{item.label}</p>
                        <p className="text-sm text-on-surface-variant">{item.desc}</p>
                      </div>
                      <button
                        onClick={() =>
                          setNotifications((prev) => ({
                            ...prev,
                            [item.key]: !prev[item.key as keyof typeof notifications],
                          }))
                        }
                        className={`relative h-6 w-11 rounded-full transition-all ${
                          notifications[item.key as keyof typeof notifications]
                            ? 'bg-primary'
                            : 'bg-surface-container-lowest'
                        }`}
                      >
                        <span
                          className={`absolute top-1 h-4 w-4 rounded-full bg-white transition-all ${
                            notifications[item.key as keyof typeof notifications]
                              ? 'left-6'
                              : 'left-1'
                          }`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6 rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
                <h2 className="font-headline text-xl font-semibold text-on-surface">
                  Security Settings
                </h2>

                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container-high p-4">
                    <div className="flex items-center gap-4">
                      <span className="material-symbols-outlined text-secondary">verified_user</span>
                      <div>
                        <p className="font-medium text-on-surface">Two-Factor Authentication</p>
                        <p className="text-sm text-on-surface-variant">Add an extra layer of security</p>
                      </div>
                    </div>
                    <button className="rounded-lg border border-outline-variant/20 px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-lowest">
                      Enable
                    </button>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container-high p-4">
                    <div className="flex items-center gap-4">
                      <span className="material-symbols-outlined text-primary">history</span>
                      <div>
                        <p className="font-medium text-on-surface">Login History</p>
                        <p className="text-sm text-on-surface-variant">View recent account activity</p>
                      </div>
                    </div>
                    <button className="rounded-lg border border-outline-variant/20 px-4 py-2 text-sm font-medium text-on-surface hover:bg-surface-container-lowest">
                      View
                    </button>
                  </div>

                  <div className="flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container-high p-4">
                    <div className="flex items-center gap-4">
                      <span className="material-symbols-outlined text-error">delete</span>
                      <div>
                        <p className="font-medium text-on-surface">Delete Account</p>
                        <p className="text-sm text-on-surface-variant">Permanently delete your account</p>
                      </div>
                    </div>
                    <button className="rounded-lg border border-error/20 px-4 py-2 text-sm font-medium text-error hover:bg-error/10">
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

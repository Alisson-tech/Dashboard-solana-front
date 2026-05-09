'use client'

import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAuth } from '@/context/auth-context'

export default function OnboardingPage() {
  const { publicKey, disconnect } = useWallet()
  const { completeOnboarding, isLoading, setSelectedRole: setContextSelectedRole } = useAuth()
  const [selectedRole, setSelectedRole] = useState<'creator' | 'editor' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const walletAddress = publicKey?.toBase58()

  const handleConfirm = async () => {
    if (!selectedRole) return
    setIsSubmitting(true)
    try {
      // For editors: don't create a profile here. Let the EditorOnboardingGate
      // handle the full onboarding (register channels + deposit stake).
      // Just set the selected role in context and redirect.
      if (selectedRole === 'editor') {
        setContextSelectedRole('editor')
        // The EditorOnboardingGate will create the profile properly with channels
        // Redirect to bounties where the gate will guide through full onboarding
        window.location.href = '/bounties'
        return
      }

      // For creators: create empty profile on-chain
      await completeOnboarding(selectedRole)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="pointer-events-none fixed bottom-0 right-0 -z-10 opacity-10 blur-3xl">
        <div className="h-[500px] w-[500px] rounded-full bg-primary"></div>
      </div>
      <div className="pointer-events-none fixed left-0 top-0 -z-10 opacity-5 blur-3xl">
        <div className="h-[800px] w-[800px] rounded-full bg-secondary"></div>
      </div>

      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-primary text-3xl">account_balance_wallet</span>
            </div>
          </div>
          <h1 className="font-headline text-4xl font-bold text-on-surface mb-3">
            Welcome to <span className="gradient-text">SolCuts</span>
          </h1>
          <p className="text-on-surface-variant max-w-md mx-auto">
            Wallet <span className="font-mono text-xs text-secondary break-all">{walletAddress}</span>
          </p>
        </div>

        {/* Role Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <button
            onClick={() => setSelectedRole('creator')}
            className={`group relative overflow-hidden rounded-3xl border-2 p-8 text-left transition-all ${
              selectedRole === 'creator'
                ? 'border-primary bg-primary/5 shadow-[0_0_30px_rgba(153,69,255,0.15)]'
                : 'border-outline-variant/20 bg-surface-container-low hover:border-primary/30'
            }`}
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <span className="material-symbols-outlined text-3xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  add_circle
                </span>
            </div>
            <h2 className="font-headline text-2xl font-bold text-on-surface mb-3">
              I'm a Creator
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Create bounty pools, lock SOL rewards, and attract editors to produce clips from your content.
            </p>
            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm text-secondary">check</span>
                Create and manage bounty pools
              </div>
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm text-secondary">check</span>
                Set prize amounts and scoring rules
              </div>
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm text-secondary">check</span>
                Review AI-validated submissions
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedRole('editor')}
            className={`group relative overflow-hidden rounded-3xl border-2 p-8 text-left transition-all ${
              selectedRole === 'editor'
                ? 'border-secondary bg-secondary/5 shadow-[0_0_30px_rgba(52,254,160,0.15)]'
                : 'border-outline-variant/20 bg-surface-container-low hover:border-secondary/30'
            }`}
          >
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
              <span className="material-symbols-outlined text-3xl text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  movie
              </span>
            </div>
            <h2 className="font-headline text-2xl font-bold text-on-surface mb-3">
              I'm an Editor
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              Browse open pools, submit your clips, and earn SOL rewards based on engagement.
            </p>
            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm text-secondary">check</span>
                Browse and join open pools
              </div>
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm text-secondary">check</span>
                Submit clips and track rankings
              </div>
              <div className="flex items-center gap-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-sm text-secondary">check</span>
                Earn SOL from your engagement
              </div>
            </div>
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleConfirm}
            disabled={!selectedRole || isSubmitting || isLoading}
            className={`gradient-solana rounded-xl px-12 py-4 font-bold text-on-primary-fixed transition-all hover:shadow-[0_20px_40px_-10px_rgba(52,254,160,0.3)] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 ${
              selectedRole === 'editor' ? 'shadow-[0_20px_40px_-10px_rgba(52,254,160,0.2)]' : ''
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center gap-2">
                <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                Setting up...
              </span>
            ) : (
              `Continue as ${selectedRole === 'creator' ? 'Creator' : selectedRole === 'editor' ? 'Editor' : '...'}`
            )}
          </button>

          <button
            onClick={disconnect}
            className="text-sm text-on-surface-variant hover:text-on-surface transition-colors"
          >
            Disconnect wallet
          </button>
        </div>
      </div>
    </div>
  )
}

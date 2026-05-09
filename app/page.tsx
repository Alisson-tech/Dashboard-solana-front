'use client'

import Link from 'next/link'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { mockBounties, formatTimeLeft } from '@/lib/mock-data'
import { useAuth } from '@/context/auth-context'

export default function HomePage() {
  const { publicKey } = useWallet()
  const { isOnboarded, role, isLoading } = useAuth()
  const connected = !!publicKey

  console.log('HomePage render:', { isOnboarded, role, isLoading, connected })

  const getDashboardUrl = () => {
    console.log('getDashboardUrl:', { isOnboarded, isLoading, role })
    if (!isOnboarded || isLoading) return '/onboarding'
    return role === 'creator' ? '/dashboard' : '/editor-dashboard'
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed left-0 right-0 top-0 z-50 border-b border-on-surface-variant/15 bg-background/60 shadow-[0_40px_40px_-15px_rgba(153,69,255,0.08)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-[1440px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-8">
            <span className="gradient-text font-headline text-2xl font-bold tracking-tight">
              SolCuts
            </span>
            <div className="hidden items-center gap-6 md:flex">
              <Link
                href="/dashboard"
                className="font-headline tracking-tight text-on-surface-variant transition-colors hover:text-on-surface"
              >
                Dashboard
              </Link>
              <Link
                href="/bounties"
                className="font-headline tracking-tight text-on-surface-variant transition-colors hover:text-on-surface"
              >
                Marketplace
              </Link>
            </div>
          </div>
          <WalletMultiButton />
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 pb-20 pt-32">
        {/* Background Effects */}
        <div className="pointer-events-none absolute bottom-0 right-0 -z-10 opacity-10 blur-3xl">
          <div className="h-[500px] w-[500px] rounded-full bg-primary"></div>
        </div>
        <div className="pointer-events-none absolute left-0 top-0 -z-10 opacity-5 blur-3xl">
          <div className="h-[800px] w-[800px] rounded-full bg-secondary"></div>
        </div>

        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col items-center text-center">
            <span className="mb-6 rounded-full border border-secondary/30 bg-secondary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-secondary">
              Powered by Solana
            </span>
            <h1 className="mb-6 max-w-4xl text-balance font-headline text-5xl font-bold tracking-tight text-on-surface md:text-7xl">
              Turn{' '}
              <span className="gradient-text">Views</span> into{' '}
              <span className="gradient-text">SOL</span>
            </h1>
            <p className="mb-10 max-w-2xl text-pretty text-lg text-on-surface-variant">
              A bounty platform for clip creators. Create challenges, reward engagement,
              and earn SOL automatically with AI-powered validation.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              {connected && !isLoading ? (
                <Link
                  href={getDashboardUrl()}
                  className="gradient-solana flex items-center gap-3 rounded-xl px-8 py-4 font-bold text-on-primary-fixed shadow-[0_20px_40px_-10px_rgba(52,254,160,0.3)] transition-transform hover:scale-[1.02] active:scale-95"
                >
                  <span className="material-symbols-outlined">dashboard</span>
                  {isOnboarded ? 'Go to Dashboard' : 'Complete Onboarding'}
                </Link>
              ) : (
                <WalletMultiButton />
              )}
              <Link
                href="/bounties"
                className="flex items-center gap-3 rounded-xl border border-outline-variant px-8 py-4 font-bold text-on-surface transition-colors hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined">explore</span>
                Explore Bounties
              </Link>
            </div>
          </div>

          {/* How it Works */}
          <div className="mt-32">
            <h2 className="mb-12 text-center font-headline text-3xl font-bold text-on-surface">
              How It Works
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: 'add_circle',
                  title: 'Create a Bounty',
                  description:
                    'Define the challenge, required hashtag, and prize pool in SOL. Funds are locked in escrow.',
                },
                {
                  icon: 'movie',
                  title: 'Editors Compete',
                  description:
                    'Creators make clips from your content and post them on social media with the hashtag.',
                },
                {
                  icon: 'psychology',
                  title: 'AI Validates & Pays',
                  description:
                    'Our AI Oracle checks engagement metrics and distributes rewards automatically.',
                },
              ].map((step, index) => (
                <div
                  key={index}
                  className="group relative overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-low p-8 transition-colors hover:border-primary/30"
                >
                  <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-primary/5 blur-3xl transition-colors group-hover:bg-primary/10"></div>
                  <span className="material-symbols-outlined mb-4 block text-3xl text-primary">
                    {step.icon}
                  </span>
                  <h3 className="mb-2 font-headline text-xl font-bold text-on-surface">
                    {step.title}
                  </h3>
                  <p className="text-sm leading-relaxed text-on-surface-variant">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Active Bounties Preview */}
          <div className="mt-32">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-headline text-2xl font-bold text-on-surface">
                <span className="h-6 w-2 rounded-full bg-secondary"></span>
                Active Bounties
              </h2>
              <Link
                href="/bounties"
                className="flex items-center gap-1 text-sm text-on-surface-variant transition-colors hover:text-secondary"
              >
                View All{' '}
                <span className="material-symbols-outlined text-xs">
                  arrow_forward
                </span>
              </Link>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {mockBounties.slice(0, 3).map((bounty) => (
                <Link
                  key={bounty.id}
                  href={`/bounties/${bounty.id}`}
                  className="group overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-low transition-all hover:border-primary/30 hover:shadow-lg"
                >
                  <div className="p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h3 className="mb-1 font-bold text-on-surface">
                          {bounty.title}
                        </h3>
                        <span className="text-xs text-secondary">
                          #{bounty.hashtag}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-headline text-xl font-bold text-secondary">
                          {bounty.prizePool}
                        </div>
                        <div className="text-xs text-on-surface-variant">
                          SOL
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-on-surface-variant">
                        <span className="material-symbols-outlined text-sm">
                          movie
                        </span>
                        {bounty.totalClips} clips
                      </div>
                      <div className="flex items-center gap-1 text-error">
                        <span className="material-symbols-outlined text-sm">
                          schedule
                        </span>
                        {formatTimeLeft(bounty.deadline)}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-32 grid gap-6 md:grid-cols-4">
            {[
              { value: '1,248+', label: 'SOL Distributed' },
              { value: '8,432', label: 'Clips Created' },
              { value: '942', label: 'Active Editors' },
              { value: '99.8%', label: 'Oracle Accuracy' },
            ].map((stat, index) => (
              <div
                key={index}
                className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-8 text-center"
              >
                <div className="mb-2 font-headline text-4xl font-bold text-on-surface">
                  {stat.value}
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-32 rounded-3xl bg-gradient-to-br from-surface-container-high to-surface p-1">
            <div className="rounded-[calc(1.5rem-4px)] bg-surface p-12 text-center">
              <h2 className="mb-4 font-headline text-3xl font-bold text-on-surface">
                Ready to get started?
              </h2>
              <p className="mb-8 text-on-surface-variant">
                Connect your Solana wallet and start creating bounties or participating as an editor.
              </p>
              <WalletMultiButton />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-outline-variant/10 px-6 py-12">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <span className="gradient-text font-headline text-xl font-bold">
              SolCuts
            </span>
            <div className="flex gap-6 text-sm text-on-surface-variant">
              <Link href="/docs" className="hover:text-on-surface">
                Docs
              </Link>
              <Link href="/support" className="hover:text-on-surface">
                Support
              </Link>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-on-surface"
              >
                Twitter
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-on-surface"
              >
                Discord
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

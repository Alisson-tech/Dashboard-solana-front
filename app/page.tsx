'use client'

import Link from 'next/link'
import { DynamicWidget, useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { mockBounties, formatTimeLeft } from '@/lib/mock-data'

export default function HomePage() {
  const { isAuthenticated } = useDynamicContext()
  const connected = isAuthenticated

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
          <DynamicWidget />
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
              Transforme{' '}
              <span className="gradient-text">Visualizações</span> em{' '}
              <span className="gradient-text">SOL</span>
            </h1>
            <p className="mb-10 max-w-2xl text-pretty text-lg text-on-surface-variant">
              Plataforma de bounties para criadores de clips. Crie desafios, recompense
              viralizações e ganhe SOL automaticamente com validação por IA.
            </p>

            <div className="flex flex-col gap-4 sm:flex-row">
              {connected ? (
                <Link
                  href="/dashboard"
                  className="gradient-solana flex items-center gap-3 rounded-xl px-8 py-4 font-bold text-on-primary-fixed shadow-[0_20px_40px_-10px_rgba(52,254,160,0.3)] transition-transform hover:scale-[1.02] active:scale-95"
                >
                  <span className="material-symbols-outlined">dashboard</span>
                  Ir para Dashboard
                </Link>
              ) : (
                <DynamicWidget />
              )}
              <Link
                href="/bounties"
                className="flex items-center gap-3 rounded-xl border border-outline-variant px-8 py-4 font-bold text-on-surface transition-colors hover:bg-surface-container-high"
              >
                <span className="material-symbols-outlined">explore</span>
                Explorar Bounties
              </Link>
            </div>
          </div>

          {/* How it Works */}
          <div className="mt-32">
            <h2 className="mb-12 text-center font-headline text-3xl font-bold text-on-surface">
              Como Funciona
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {[
                {
                  icon: 'add_circle',
                  title: 'Crie um Bounty',
                  description:
                    'Defina o desafio, a hashtag obrigatória e o prize pool em SOL. Os fundos ficam em escrow seguro.',
                },
                {
                  icon: 'movie',
                  title: 'Clippers Competem',
                  description:
                    'Criadores fazem clips do seu conteúdo e postam nas redes sociais com a hashtag.',
                },
                {
                  icon: 'psychology',
                  title: 'IA Valida & Paga',
                  description:
                    'Nosso Oracle AI verifica as métricas de engajamento e distribui o prêmio automaticamente.',
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
                Bounties Ativos
              </h2>
              <Link
                href="/bounties"
                className="flex items-center gap-1 text-sm text-on-surface-variant transition-colors hover:text-secondary"
              >
                Ver Todos{' '}
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
              { value: '1,248+', label: 'SOL Distribuído' },
              { value: '8,432', label: 'Clips Criados' },
              { value: '942', label: 'Clippers Ativos' },
              { value: '99.8%', label: 'Precisão Oracle' },
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
                Pronto para começar?
              </h2>
              <p className="mb-8 text-on-surface-variant">
                Conecte sua carteira Solana e comece a criar bounties ou
                participar como clipper.
              </p>
              <DynamicWidget />
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

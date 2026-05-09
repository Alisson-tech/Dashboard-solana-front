'use client'

import { useState } from 'react'
import Link from 'next/link'
import { MainLayout } from '@/components/layout/main-layout'

const sections = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: 'rocket_launch',
    content: `
## Welcome to SolCuts

SolCuts is a decentralized bounty platform for content creators built on Solana. It connects Hosts (content creators) with Clippers (video editors) through trustless escrow and AI-powered validation.

### Quick Start

1. **Log in or Connect your wallet** (Google, Email, Phantom, Solflare, etc.)
2. **Choose your role**: Host (create bounties) or Clipper (submit clips)
3. **Start earning or promoting** your content

### Requirements

- A Solana wallet with some SOL for transactions
- For Hosts: Video content to promote
- For Clippers: Video editing skills and social media accounts
    `,
  },
  {
    id: 'for-hosts',
    title: 'For Hosts',
    icon: 'person',
    content: `
## Creating Bounties

As a Host, you can create bounties to incentivize clippers to create viral content from your videos.

### How to Create a Bounty

1. Click "Create Bounty" in the navigation
2. Fill in the bounty details:
   - **Challenge Name**: A catchy name for your bounty
   - **Hashtag**: Required hashtag for submissions
   - **Source Video**: Link to your original content
   - **Prize Pool**: Amount of SOL to distribute
   - **Deadline**: When the bounty ends

### Escrow System

When you create a bounty, your SOL is locked in a secure escrow PDA (Program Derived Address). This ensures:
- Funds are guaranteed for winners
- Automatic distribution at deadline
- No trust required between parties

### Platform Fee

A 0.5% platform fee is added to your prize pool to support the protocol.
    `,
  },
  {
    id: 'for-clippers',
    title: 'For Clippers',
    icon: 'movie',
    content: `
## Submitting Clips

Clippers can earn SOL by creating engaging clips from bounty source videos.

### How to Submit

1. Browse active bounties in the Marketplace
2. Download/view the source video
3. Create your clip and post to TikTok, Instagram, or YouTube
4. Include the required hashtag
5. Submit the link on SolCuts with your entry stake

### Entry Stake

A small stake (typically 0.05 SOL) is required to submit. This:
- Prevents spam submissions
- Is fully refunded to honest participants
- Shows commitment to the challenge

### Engagement Score

Your ranking is based on:
- Total views
- Likes and comments
- AI quality multiplier (0.5x - 1.5x)
- Platform-specific metrics
    `,
  },
  {
    id: 'ai-oracle',
    title: 'AI Oracle',
    icon: 'psychology',
    content: `
## How the AI Oracle Works

The AI Oracle is the automated system that validates submissions and calculates rankings.

### Validation Process

1. **Hashtag Verification**: Confirms the required hashtag is present
2. **Content Matching**: Uses computer vision to verify clip derives from source
3. **Metric Collection**: Gathers engagement data from platforms
4. **Score Calculation**: Applies the engagement formula

### Quality Multiplier

The AI evaluates content quality and applies a multiplier:
- **1.5x**: Exceptional editing, high engagement quality
- **1.0x**: Standard quality
- **0.5x**: Low effort or engagement farming

### Finalization

At the deadline, the Oracle:
1. Collects final metrics
2. Calculates rankings
3. Signs the payout transaction
4. Triggers automatic distribution
    `,
  },
  {
    id: 'tokenomics',
    title: 'Tokenomics',
    icon: 'payments',
    content: `
## Reward Distribution

### Prize Pool Distribution

Rewards are distributed based on the bounty's configuration:

**Top 10 Model**:
- 1st Place: 30%
- 2nd Place: 20%
- 3rd Place: 15%
- 4th-5th: 10% each
- 6th-10th: 3% each

**Proportional Model**:
- Based on engagement score percentage
- Minimum threshold may apply

### Entry Stake Returns

- Honest participants: Full refund
- Fraudulent submissions: Stake forfeited to prize pool
- Platform violations: Stake may be slashed

### Platform Economics

- 0.5% protocol fee on prize pools
- No fees on entry stake refunds
- Revenue supports development and infrastructure
    `,
  },
]

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('getting-started')

  const currentSection = sections.find((s) => s.id === activeSection)

  return (
    <MainLayout showSidebar={false}>
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Sidebar */}
          <aside className="space-y-2 lg:sticky lg:top-24 lg:h-fit">
            <Link
              href="/dashboard"
              className="mb-6 flex items-center gap-2 text-sm text-on-surface-variant hover:text-on-surface"
            >
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Back to Dashboard
            </Link>
            <h2 className="mb-4 font-headline text-xl font-bold text-on-surface">
              Documentation
            </h2>
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-all ${
                  activeSection === section.id
                    ? 'bg-primary/10 text-primary'
                    : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <span className="material-symbols-outlined text-sm">{section.icon}</span>
                {section.title}
              </button>
            ))}
          </aside>

          {/* Content */}
          <main className="lg:col-span-3">
            <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-8">
              <div className="mb-6 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <span className="material-symbols-outlined text-primary">
                    {currentSection?.icon}
                  </span>
                </div>
                <h1 className="font-headline text-2xl font-bold text-on-surface">
                  {currentSection?.title}
                </h1>
              </div>
              <div className="prose prose-invert max-w-none">
                <div className="space-y-4 text-on-surface-variant [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-on-surface [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-on-surface [&_li]:ml-4 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:leading-relaxed [&_strong]:text-on-surface [&_ul]:list-disc [&_ul]:pl-4">
                  {currentSection?.content.split('\n').map((line, i) => {
                    if (line.startsWith('## ')) {
                      return <h2 key={i}>{line.replace('## ', '')}</h2>
                    }
                    if (line.startsWith('### ')) {
                      return <h3 key={i}>{line.replace('### ', '')}</h3>
                    }
                    if (line.startsWith('- **')) {
                      const match = line.match(/- \*\*(.+?)\*\*: (.+)/)
                      if (match) {
                        return (
                          <li key={i}>
                            <strong>{match[1]}</strong>: {match[2]}
                          </li>
                        )
                      }
                    }
                    if (line.startsWith('- ')) {
                      return <li key={i}>{line.replace('- ', '')}</li>
                    }
                    if (line.match(/^\d+\. /)) {
                      return <li key={i}>{line.replace(/^\d+\. /, '')}</li>
                    }
                    if (line.trim()) {
                      return <p key={i}>{line}</p>
                    }
                    return null
                  })}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </MainLayout>
  )
}

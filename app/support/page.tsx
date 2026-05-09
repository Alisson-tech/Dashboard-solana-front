'use client'

import { useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'

const faqs = [
  {
    question: 'How do bounties work?',
    answer: 'Hosts create bounties by locking SOL in an escrow. Clippers submit their edited videos with the required hashtag. The AI Oracle validates submissions and distributes rewards based on engagement metrics.',
  },
  {
    question: 'What is the entry stake?',
    answer: 'The entry stake (typically 0.05 SOL) is a small deposit required to submit a clip. It prevents spam and is fully refunded to honest participants after the bounty ends.',
  },
  {
    question: 'How does the AI Oracle work?',
    answer: 'Our AI Oracle automatically scans social platforms for the designated hashtag, verifies the source video match using computer vision, and calculates engagement scores based on views, likes, and comments.',
  },
  {
    question: 'When do I get paid?',
    answer: 'Payouts are automatically distributed when the bounty deadline is reached. The AI Oracle finalizes the rankings and triggers the smart contract to distribute funds proportionally.',
  },
  {
    question: 'Which platforms are supported?',
    answer: 'Currently, SolCuts supports TikTok, Instagram Reels, and YouTube Shorts. More platforms will be added based on community feedback.',
  },
]

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const [ticketSubject, setTicketSubject] = useState('')
  const [ticketMessage, setTicketMessage] = useState('')

  return (
    <MainLayout>
      <div className="space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="font-headline text-4xl font-bold tracking-tight text-on-surface">
            How can we help?
          </h1>
          <p className="mt-2 text-on-surface-variant">
            Find answers or reach out to our support team
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <a href="https://discord.gg/solcuts" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6 transition-all hover:border-primary/30">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <span className="material-symbols-outlined text-primary">forum</span>
            </div>
            <div>
              <p className="font-bold text-on-surface">Discord Community</p>
              <p className="text-sm text-on-surface-variant">Join our community</p>
            </div>
          </a>
          <a href="https://twitter.com/solcuts" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6 transition-all hover:border-secondary/30">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/10">
              <span className="material-symbols-outlined text-secondary">tag</span>
            </div>
            <div>
              <p className="font-bold text-on-surface">Twitter / X</p>
              <p className="text-sm text-on-surface-variant">Follow for updates</p>
            </div>
          </a>
          <a href="mailto:support@solcuts.io" className="flex items-center gap-4 rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6 transition-all hover:border-tertiary/30">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-tertiary/10">
              <span className="material-symbols-outlined text-tertiary">mail</span>
            </div>
            <div>
              <p className="font-bold text-on-surface">Email Support</p>
              <p className="text-sm text-on-surface-variant">support@solcuts.io</p>
            </div>
          </a>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* FAQ */}
          <div className="space-y-4">
            <h2 className="font-headline text-2xl font-bold text-on-surface">
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {faqs.map((faq, index) => (
                <div
                  key={index}
                  className="rounded-xl border border-outline-variant/10 bg-surface-container-low overflow-hidden"
                >
                  <button
                    onClick={() => setOpenFaq(openFaq === index ? null : index)}
                    className="flex w-full items-center justify-between p-4 text-left"
                  >
                    <span className="font-medium text-on-surface">{faq.question}</span>
                    <span className={`material-symbols-outlined text-on-surface-variant transition-transform ${openFaq === index ? 'rotate-180' : ''}`}>
                      expand_more
                    </span>
                  </button>
                  {openFaq === index && (
                    <div className="border-t border-outline-variant/10 px-4 pb-4 pt-2">
                      <p className="text-sm leading-relaxed text-on-surface-variant">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Contact Form */}
          <div className="rounded-2xl border border-outline-variant/10 bg-surface-container-low p-6">
            <h2 className="mb-6 font-headline text-2xl font-bold text-on-surface">
              Submit a Ticket
            </h2>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Subject
                </label>
                <input
                  type="text"
                  value={ticketSubject}
                  onChange={(e) => setTicketSubject(e.target.value)}
                  placeholder="What do you need help with?"
                  className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-high px-4 py-3 text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Category
                </label>
                <select className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-high px-4 py-3 text-on-surface focus:border-primary focus:outline-none">
                  <option>General Question</option>
                  <option>Bounty Issue</option>
                  <option>Payment Problem</option>
                  <option>Technical Bug</option>
                  <option>Account Issue</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">
                  Message
                </label>
                <textarea
                  rows={5}
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  placeholder="Describe your issue in detail..."
                  className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-high px-4 py-3 text-on-surface placeholder:text-on-surface-variant focus:border-primary focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-primary py-3 font-bold text-on-primary-fixed transition-all hover:bg-primary/90"
              >
                Submit Ticket
              </button>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}

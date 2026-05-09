'use client'

import { Header } from './header'
import { Sidebar } from './sidebar'
import { MobileNav } from './mobile-nav'
import { useState, type ReactNode } from 'react'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { useBurnerWallet } from '@/hooks/use-burner-wallet'

interface MainLayoutProps {
  children: ReactNode
  showSidebar?: boolean
  showHeader?: boolean
}

export function MainLayout({ children, showSidebar = true, showHeader = true }: MainLayoutProps) {
  const [showDebug, setShowDebug] = useState(false)
  const { user, isAuthenticated, primaryWallet, sdkHasLoaded } = useDynamicContext()
  const { wallet: burner, generateWallet, balance: burnerBalance, isGenerating } = useBurnerWallet()

  return (
    <div className="min-h-screen bg-background">
      {showHeader && <Header />}
      {showSidebar && <Sidebar showHeader={showHeader} />}
      <main
        className={`min-h-screen pb-20 ${showHeader ? 'pt-24' : 'pt-6'} ${showSidebar ? 'lg:ml-64' : ''} px-6`}
      >
        <div className="mx-auto max-w-[1200px]">{children}</div>
      </main>
      <MobileNav />

      {/* Premium Debug Panel */}
      <div className="fixed bottom-4 right-4 z-[9999]">
        {!showDebug ? (
          <button 
            onClick={() => setShowDebug(true)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high border border-outline-variant/20 shadow-xl text-primary hover:scale-110 transition-transform"
          >
            <span className="material-symbols-outlined text-xl">terminal</span>
          </button>
        ) : (
          <div className="w-80 rounded-2xl border border-outline-variant/20 bg-surface-container-high p-5 shadow-2xl backdrop-blur-xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-headline font-bold text-on-surface">Agentic Debug</h3>
              <button onClick={() => setShowDebug(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            
            <div className="space-y-3 text-[11px]">
              <div className="flex justify-between border-b border-outline-variant/10 pb-1">
                <span className="text-on-surface-variant">Auth Status</span>
                <span className={isAuthenticated ? "text-secondary font-bold" : "text-error"}>{isAuthenticated ? "Logged In" : "Out"}</span>
              </div>
              <div className="flex justify-between border-b border-outline-variant/10 pb-1">
                <span className="text-on-surface-variant">User Email</span>
                <span className="text-on-surface truncate max-w-[150px]">{user?.email || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-outline-variant/10 pb-1">
                <span className="text-on-surface-variant">Primary Wallet</span>
                <span className={primaryWallet ? "text-secondary font-bold" : "text-error"}>
                  {primaryWallet ? `${primaryWallet.address.slice(0, 6)}...` : "NONE"}
                </span>
              </div>
              
              {!primaryWallet && isAuthenticated && (
                <div className="mt-4 rounded-xl bg-primary/5 p-3 border border-primary/20">
                  <p className="mb-2 font-bold text-primary text-[10px]">Embedded Wallet Fail</p>
                  <p className="mb-3 text-[9px] text-on-surface-variant leading-tight">
                    The Dynamic environment is authenticated but hasn't provided a wallet. You can use a local Burner Wallet to unblock tests.
                  </p>
                  <button 
                    onClick={generateWallet}
                    disabled={isGenerating}
                    className="w-full rounded-lg bg-primary py-2 text-[10px] font-bold text-on-primary-fixed hover:opacity-90 disabled:opacity-50"
                  >
                    {isGenerating ? 'Airdropping...' : burner ? 'Regenerate Burner' : 'Generate Burner Wallet'}
                  </button>
                </div>
              )}

              {burner && (
                <div className="mt-2 rounded-xl bg-secondary/5 p-3 border border-secondary/20">
                  <p className="mb-1 font-bold text-secondary text-[10px]">Active Burner Wallet</p>
                  <p className="text-[9px] font-mono text-on-surface break-all">{burner.publicKey.toString()}</p>
                  <p className="mt-1 text-[10px] font-bold text-secondary">Balance: {burnerBalance.toFixed(3)} SOL</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

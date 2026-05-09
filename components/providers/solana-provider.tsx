'use client'

import { useMemo, type ReactNode } from 'react'
import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core'
import { SolanaWalletConnectors } from '@dynamic-labs/solana'
import { ConnectionProvider } from '@solana/wallet-adapter-react'
import { clusterApiUrl } from '@solana/web3.js'

interface SolanaProviderProps {
  children: ReactNode
}

export function SolanaProvider({ children }: SolanaProviderProps) {
  const endpoint = useMemo(() => clusterApiUrl('devnet'), [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <DynamicContextProvider
        settings={{
          environmentId: process.env.NEXT_PUBLIC_DYNAMIC_ENV_ID || '615fc5b4-e636-409f-b45c-0afa0dac9f0e',
          walletConnectors: [SolanaWalletConnectors],
          /* @ts-ignore */
          createEmbeddedWallets: true,
          /* @ts-ignore - Try to force creation for social providers */
          shouldCreateWalletOnEmittingEmail: true,
        }}
      >
        {children}
      </DynamicContextProvider>
    </ConnectionProvider>
  )
}



'use client'

import { useState, useEffect } from 'react'
import { Keypair, Connection, LAMPORTS_PER_SOL } from '@solana/web3.js'
import * as anchor from '@coral-xyz/anchor'

export interface BurnerWallet {
  publicKey: anchor.web3.PublicKey
  signTransaction: (tx: anchor.web3.Transaction) => Promise<anchor.web3.Transaction>
  signAllTransactions: (txs: anchor.web3.Transaction[]) => Promise<anchor.web3.Transaction[]>
}

export function useBurnerWallet() {
  const [wallet, setWallet] = useState<BurnerWallet | null>(null)
  const [balance, setBalance] = useState(0)
  const [isGenerating, setIsGenerating] = useState(false)

  const generateWallet = async () => {
    setIsGenerating(true)
    try {
      const kp = Keypair.generate()
      
      const burner: BurnerWallet = {
        publicKey: kp.publicKey,
        signTransaction: async (tx) => {
          tx.partialSign(kp)
          return tx
        },
        signAllTransactions: async (txs) => {
          txs.forEach(tx => tx.partialSign(kp))
          return txs
        }
      }

      setWallet(burner)
      
      // Save to session storage for persistence
      sessionStorage.setItem('sc_burner_pk', kp.publicKey.toString())
      sessionStorage.setItem('sc_burner_sk', JSON.stringify(Array.from(kp.secretKey)))
      
      // Try to airdrop
      const conn = new Connection('https://api.devnet.solana.com', 'confirmed')
      try {
        const sig = await conn.requestAirdrop(kp.publicKey, LAMPORTS_PER_SOL)
        await conn.confirmTransaction(sig)
        const bal = await conn.getBalance(kp.publicKey)
        setBalance(bal / LAMPORTS_PER_SOL)
      } catch (e) {
        console.warn('Airdrop failed, but wallet generated:', e)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  useEffect(() => {
    const savedSk = sessionStorage.getItem('sc_burner_sk')
    if (savedSk) {
      try {
        const sk = new Uint8Array(JSON.parse(savedSk))
        const kp = Keypair.fromSecretKey(sk)
        const burner: BurnerWallet = {
          publicKey: kp.publicKey,
          signTransaction: async (tx) => {
            tx.partialSign(kp)
            return tx
          },
          signAllTransactions: async (txs) => {
            txs.forEach(tx => tx.partialSign(kp))
            return txs
          }
        }
        setWallet(burner)
        
        const conn = new Connection('https://api.devnet.solana.com', 'confirmed')
        conn.getBalance(kp.publicKey).then(b => setBalance(b / LAMPORTS_PER_SOL))
      } catch (e) {
        console.error('Failed to restore burner wallet', e)
      }
    }
  }, [])

  return { wallet, balance, generateWallet, isGenerating }
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { toast } from 'sonner'
import * as anchor from '@coral-xyz/anchor'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { getProgram } from '@/lib/anchor/program'
import {
  getUserProfilePDA,
  getStakeAccountPDA,
  getGlobalConfigPDA,
} from '@/lib/solana'
import { checkEditorOnboarding, OnboardingStatus, MIN_REQUIRED_CHANNELS, MAX_UI_REGISTRABLE_CHANNELS } from '@/lib/editor-onboarding'

interface EditorOnboardingGateProps {
  children: React.ReactNode
}

export function EditorOnboardingGate({ children }: EditorOnboardingGateProps) {
  const { connection } = useConnection()
  const { publicKey, connected, signTransaction, sendTransaction } = useWallet()

  const [status, setStatus] = useState<OnboardingStatus>({
    hasProfile: false,
    hasStake: false,
    stakeAmount: 0,
    minStake: 100_000_000,
    channelIds: [],
    isBanned: false,
    isLoading: true,
    error: null,
  })

  const [wizardStep, setWizardStep] = useState<1 | 2>(1)
  // Dynamic channel input fields for the wizard; start with one empty field
  const [channels, setChannels] = useState<string[]>([''])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const refresh = useCallback(async () => {
    if (!connected || !publicKey || !connection) {
      setStatus(s => ({ ...s, isLoading: false }))
      return
    }
    setStatus(s => ({ ...s, isLoading: true, error: null }))
    try {
      const result = await checkEditorOnboarding(connection, publicKey)
      setStatus({ ...result, isLoading: false, error: null })
      // Auto-advance wizard to step 2 if profile done
      if (result.hasProfile && !result.hasStake) setWizardStep(2)
      // If profile exists and has channels, prefill channel inputs for UX (but we cannot update on-chain without program change)
      if (result.hasProfile && result.channelIds && result.channelIds.length > 0) {
        setChannels(result.channelIds.slice(0, MAX_UI_REGISTRABLE_CHANNELS))
      }
    } catch (e: any) {
      setStatus(s => ({ ...s, isLoading: false, error: e?.message || 'Failed to check on-chain status' }))
    }
  }, [connected, publicKey, connection])

  useEffect(() => { refresh() }, [refresh])

  // Utility: fetch latest blockhash with retry/backoff to handle transient
  // RPC "Internal error" failures. Keeps logic local to avoid changing
  // shared libs; small number of retries is sufficient for devnet hiccups.
  const getLatestBlockhashWithRetry = async (attempts = 5, baseDelay = 300) => {
    for (let i = 0; i < attempts; i++) {
      try {
        return await connection.getLatestBlockhash('confirmed')
      } catch (err: any) {
        // On last attempt rethrow so callers can handle
        if (i === attempts - 1) throw err
        // small backoff
        // eslint-disable-next-line no-await-in-loop
        await new Promise(r => setTimeout(r, baseDelay * (i + 1)))
      }
    }
    // Should never reach here
    throw new Error('Failed to fetch latest blockhash')
  }

  // ─── Step 1: Register Channel ──────────────────────────────────────────────
  // Helpers for dynamic channel fields
  const addChannelField = () => {
    if (channels.length >= MAX_UI_REGISTRABLE_CHANNELS) return
    setChannels(prev => [...prev, ''])
  }
  const updateChannel = (idx: number, value: string) => setChannels(prev => prev.map((c, i) => (i === idx ? value : c)))
  const removeChannel = (idx: number) => {
    if (channels.length <= 1) return
    setChannels(prev => prev.filter((_, i) => i !== idx))
  }

  const validateChannels = () => {
    const trimmed = channels.map(c => c.trim()).filter(Boolean)
    if (trimmed.length < MIN_REQUIRED_CHANNELS) {
      toast.error(`Por favor insira pelo menos ${MIN_REQUIRED_CHANNELS} Channel ID.`)
      return null
    }
    for (const ch of trimmed) {
      if (ch.length > 64) { toast.error('Channel ID muito longo'); return null }
    }
    return trimmed
  }

  // New handler to register initial profile with one or more channels
  const handleRegisterChannel = async () => {
    if (!publicKey || !connected) return
    const channelArray = validateChannels()
    if (!channelArray) return
    setIsSubmitting(true)
    try {
      // Ensure the UserProfile PDA does not already exist. If it exists,
      // initialize would fail with "Allocate: account ... already in use".
      let accountInfo = null
      for (let i = 0; i < 3; i++) {
        try {
          // eslint-disable-next-line no-await-in-loop
          accountInfo = await connection.getAccountInfo(getUserProfilePDA(publicKey))
          break
        } catch (err) {
          // transient RPC error: wait briefly and retry
          // eslint-disable-next-line no-await-in-loop
          await new Promise(r => setTimeout(r, 300))
        }
      }

      if (accountInfo) {
        // Profile already exists — refresh status and inform the user.
        toast.error('Um perfil já existe para esta carteira. Atualizando status...')
        await refresh()
        setIsSubmitting(false)
        if (!status.hasStake) setWizardStep(2)
        return
      }

      const wallet = { publicKey, signTransaction, sendTransaction } as any
      const program = getProgram(connection, wallet)
      const configPda = getGlobalConfigPDA()

      // Get latest blockhash before signing (with retry for RPC flakiness)
      let blockhash: string, lastValidBlockHeight: number
      try {
        ;({ blockhash, lastValidBlockHeight } = await getLatestBlockhashWithRetry())
      } catch (bhErr: any) {
        console.error('Failed to fetch latest blockhash', bhErr)
        toast.error('Erro ao obter blockhash do RPC. Tente novamente em alguns segundos ou mude o endpoint RPC.')
        setIsSubmitting(false)
        return
      }

      const sig = await (program.methods as any)
        .initializeUser(channelArray)
        .accounts({
          userProfile: getUserProfilePDA(publicKey),
          config: configPda,
          authority: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      // Confirm with HTTP polling fallback (Devnet WS is unreliable)
      try {
        await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed')
      } catch {
        let landed = false
        for (let i = 0; i < 6; i++) {
          // eslint-disable-next-line no-await-in-loop
          await new Promise(r => setTimeout(r, 2000))
          // eslint-disable-next-line no-await-in-loop
          const tx = await connection.getTransaction(sig, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 })
          if (tx) { landed = true; break }
        }
        if (!landed) throw new Error('Transaction not confirmed after 12s')
      }

      toast.success('Channel(s) registered! Tx: ' + sig.slice(0, 16) + '…')
      await refresh()
      setWizardStep(2)
    } catch (e: any) {
      console.error(e)
      // Try to extract simulation logs from the SendTransactionError if available
      try {
        if (e && typeof e.getLogs === 'function') {
          // eslint-disable-next-line no-await-in-loop
          const logs = await e.getLogs()
          console.error('Transaction logs:', logs)
          toast.error('Transaction failed: ' + (Array.isArray(logs) ? logs.slice(-6).join('\n') : String(logs)))
        } else if (e && e.logs) {
          console.error('Transaction logs:', e.logs)
          toast.error('Transaction failed: ' + (Array.isArray(e.logs) ? e.logs.slice(-3).join(' | ') : e.message))
        } else {
          toast.error('Failed to register channel(s): ' + (e?.message || 'Unknown error'))
        }
      } catch (logErr) {
        console.error('Error while reading tx logs', logErr)
        toast.error('Failed to register channel(s): ' + (e?.message || 'Unknown error'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Step 2: Deposit Stake ─────────────────────────────────────────────────
  const handleDepositStake = async () => {
    if (!publicKey || !connected) return
    const amount = status.minStake || 100_000_000
    setIsSubmitting(true)
    try {
      const wallet = { publicKey, signTransaction, sendTransaction } as any
      const program = getProgram(connection, wallet)
      const configPda = getGlobalConfigPDA()

      // Get latest blockhash before signing (with retry for RPC flakiness)
      let blockhash: string, lastValidBlockHeight: number
      try {
        ;({ blockhash, lastValidBlockHeight } = await getLatestBlockhashWithRetry())
      } catch (bhErr: any) {
        console.error('Failed to fetch latest blockhash', bhErr)
        toast.error('Erro ao obter blockhash do RPC. Tente novamente em alguns segundos ou mude o endpoint RPC.')
        setIsSubmitting(false)
        return
      }

      const sig = await (program.methods as any)
        .depositStake(new anchor.BN(amount))
        .accounts({
          stakeAccount: getStakeAccountPDA(publicKey),
          config: configPda,
          authority: publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      // Confirm with HTTP polling fallback (Devnet WS is unreliable)
      try {
        await connection.confirmTransaction({ signature: sig, blockhash, lastValidBlockHeight }, 'confirmed')
      } catch {
        let landed = false
        for (let i = 0; i < 6; i++) {
          await new Promise(r => setTimeout(r, 2000))
          const tx = await connection.getTransaction(sig, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 })
          if (tx) { landed = true; break }
        }
        if (!landed) throw new Error('Transaction not confirmed after 12s')
      }

      toast.success('Stake deposited! Tx: ' + sig.slice(0, 16) + '…')
      await refresh()
    } catch (e: any) {
      console.error(e)
      // Provide more helpful hint when the RPC fails to return blockhash
      if (e && e.message && e.message.includes('failed to get latest blockhash')) {
        toast.error('RPC falhou ao obter o blockhash. Tente trocar de endpoint RPC ou aguarde alguns segundos e tente novamente.')
      } else {
        toast.error('Failed to deposit stake: ' + (e?.message || 'Unknown error'))
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const isUnlocked = connected && status.hasProfile && status.hasStake && !status.isBanned

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative">
      {/* Blurred background content */}
      <div
        className={`transition-all duration-500 ${
          !isUnlocked && connected ? 'pointer-events-none select-none blur-md brightness-50' : ''
        }`}
        aria-hidden={!isUnlocked}
      >
        {children}
      </div>

      {/* Overlay gate — only shown when connected but not onboarded */}
      {connected && !status.isLoading && !isUnlocked && (
        <div className="absolute inset-0 z-50 flex items-start justify-center pt-32 px-4">
          <div className="w-full max-w-md rounded-3xl border border-outline-variant/20 bg-surface-container/95 backdrop-blur-xl shadow-2xl overflow-hidden">
            
            {/* Header */}
            <div className="relative bg-gradient-to-br from-primary/20 via-secondary/10 to-transparent p-8 pb-6">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 ring-1 ring-primary/30">
                <span className="material-symbols-outlined text-3xl text-primary">lock</span>
              </div>
              <h2 className="font-headline text-2xl font-bold text-on-surface">
                {status.isBanned ? 'Account Suspended' : 'Complete Editor Setup'}
              </h2>
              <p className="mt-2 text-sm text-on-surface-variant">
                {status.isBanned
                  ? 'Your account has been banned. Contact support.'
                  : 'Two quick on-chain steps to access the Bounty Marketplace.'}
              </p>

              {/* Progress pills */}
              {!status.isBanned && (
                <div className="mt-6 flex gap-2">
                  {[1, 2].map(step => (
                    <div key={step} className="flex items-center gap-2">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${
                          (step === 1 && status.hasProfile) || (step === 2 && status.hasStake)
                            ? 'bg-primary text-on-primary'
                            : step === wizardStep
                            ? 'bg-primary/30 text-primary ring-2 ring-primary'
                            : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        {(step === 1 && status.hasProfile) || (step === 2 && status.hasStake)
                          ? <span className="material-symbols-outlined text-sm">check</span>
                          : step}
                      </div>
                      <span className={`text-xs ${step === wizardStep ? 'text-primary font-medium' : 'text-on-surface-variant'}`}>
                        {step === 1 ? 'Register Channel' : 'Deposit Stake'}
                      </span>
                      {step < 2 && <div className="mx-1 h-px w-8 bg-outline-variant/30" />}
                    </div>
                  ))}
                </div>
              )}
            </div>

              {/* Step Content */}
              {!status.isBanned && (
                <div className="p-8 pt-6">
                {wizardStep === 1 && !status.hasProfile && (
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-on-surface">YouTube Channel ID(s)</label>
                      <div className="space-y-2">
                        {channels.map((ch, idx) => (
                          <div key={idx} className="flex items-center gap-2 rounded-xl border border-outline-variant/30 bg-surface-container-high px-3 py-2">
                            <span className="material-symbols-outlined text-on-surface-variant">smart_display</span>
                            <input
                              type="text"
                              value={ch}
                              onChange={e => updateChannel(idx, e.target.value)}
                              placeholder="UCxxxxxxxxxxxxxxxxxxx"
                              className="flex-1 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/50"
                            />
                            {channels.length > 1 && (
                              <button type="button" onClick={() => removeChannel(idx)} className="text-error px-2">Remover</button>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="mt-2 flex items-center justify-between">
                        <button
                          type="button"
                          onClick={addChannelField}
                          disabled={channels.length >= MAX_UI_REGISTRABLE_CHANNELS}
                          className="rounded-xl border px-4 py-2 text-sm"
                        >
                          Adicionar canal ({channels.length}/{MAX_UI_REGISTRABLE_CHANNELS})
                        </button>
                        <button
                          onClick={handleRegisterChannel}
                          disabled={isSubmitting}
                          className="rounded-xl bg-primary py-3 px-4 text-sm font-bold text-on-primary transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2"
                        >
                          {isSubmitting ? (
                            <><span className="animate-spin material-symbols-outlined text-sm">progress_activity</span> Registrando…</>
                          ) : (
                            <><span className="material-symbols-outlined text-sm">person_add</span> Register Channel On-Chain</>
                          )}
                        </button>
                      </div>

                      <div className="mt-2 space-y-1.5 rounded-lg bg-surface-container px-3 py-2">
                        <p className="text-xs font-medium text-on-surface">Como encontrar seu Channel ID:</p>
                        <p className="text-xs text-on-surface-variant">1. Acesse <a href="https://www.youtube.com/account_advanced" target="_blank" rel="noopener noreferrer" className="text-primary underline">youtube.com/account_advanced</a></p>
                        <p className="text-xs text-on-surface-variant">2. Copie o <strong>ID do canal</strong> — começa com <code className="rounded bg-surface-container-high px-1 text-secondary">UC</code></p>
                        <p className="text-[10px] text-error/80 mt-1">⚠️ O handle <code className="rounded bg-surface-container-high px-1">@SeuCanal</code> NÃO funciona. O Oracle valida pelo Channel ID interno.</p>
                      </div>
                    </div>
                  </div>
                )}

                {(wizardStep === 2 || status.hasProfile) && !status.hasStake && (
                  <div className="space-y-4">
                    <div className="rounded-xl border border-outline-variant/20 bg-surface-container-high p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-on-surface-variant">Minimum stake required</span>
                        <span className="font-bold text-on-surface">
                          {(status.minStake / 1e9).toFixed(2)} SOL
                        </span>
                      </div>
                      {status.stakeAmount > 0 && (
                        <div className="mt-2 flex items-center justify-between">
                          <span className="text-sm text-on-surface-variant">Your current stake</span>
                          <span className="text-sm font-medium text-secondary">
                            {(status.stakeAmount / 1e9).toFixed(4)} SOL
                          </span>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-on-surface-variant">
                      This stake is locked as a good-faith deposit and protects the platform against spam. You can request to unstake after 3 days cooldown.
                    </p>
                    <button
                      onClick={handleDepositStake}
                      disabled={isSubmitting}
                      className="w-full rounded-xl bg-secondary py-3 text-sm font-bold text-on-secondary transition-all hover:bg-secondary/90 disabled:cursor-not-allowed disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {isSubmitting ? (
                        <><span className="animate-spin material-symbols-outlined text-sm">progress_activity</span> Depositing…</>
                      ) : (
                        <><span className="material-symbols-outlined text-sm">account_balance_wallet</span> Deposit {(status.minStake / 1e9).toFixed(2)} SOL Stake</>
                      )}
                    </button>
                  </div>
                )}

                {status.hasProfile && status.hasStake && (
                  <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <span className="material-symbols-outlined text-4xl text-primary">check_circle</span>
                    <p className="font-semibold text-on-surface">All set! Refreshing…</p>
                  </div>
                )}
              </div>
            )}

            {status.isBanned && (
              <div className="p-8 text-center">
                <span className="material-symbols-outlined text-4xl text-error">block</span>
                <p className="mt-2 text-sm text-on-surface-variant">Your account has been flagged for violating platform rules.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading skeleton overlay */}
      {connected && status.isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center">
          <div className="flex items-center gap-3 rounded-2xl bg-surface-container/80 px-6 py-4 backdrop-blur-sm">
            <span className="animate-spin material-symbols-outlined text-primary">progress_activity</span>
            <span className="text-sm text-on-surface-variant">Checking your on-chain access…</span>
          </div>
        </div>
      )}
    </div>
  )
}

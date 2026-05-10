'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
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
import { useAuth } from '@/context/auth-context'

interface EditorOnboardingGateProps {
  children: React.ReactNode
}

export function EditorOnboardingGate({ children }: EditorOnboardingGateProps) {
  const router = useRouter()
  const { connection } = useConnection()
  const { publicKey, connected, signTransaction, sendTransaction } = useWallet()
  const { role, selectedRole } = useAuth()

  // Use selectedRole if no profile yet (user just chose role), otherwise use on-chain role
  const currentRole = role || selectedRole

  const [status, setStatus] = useState<OnboardingStatus>({
    hasProfile: false,
    hasStake: false,
    stakeAmount: 0,
    minStake: 100_000_000,
    channelIds: [],
    hasEnoughChannels: false,
    isBanned: false,
    isLoading: true,
    error: null,
  })

  const [wizardStep, setWizardStep] = useState<1 | 2>(1)
  // Dynamic channel input fields for the wizard; start with one empty field
  const [channels, setChannels] = useState<string[]>([''])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [stakeError, setStakeError] = useState<string | null>(null)
  const [hasRedirected, setHasRedirected] = useState(false)

  const refresh = useCallback(async () => {
    // Throttle refresh calls to avoid spamming RPC endpoints (dev fast-refresh can trigger many calls)
    const now = Date.now()
    if ((refresh as any)._last && now - (refresh as any)._last < 1500) return
    ;(refresh as any)._last = now
    if (!connected || !publicKey || !connection) {
      setStatus(s => ({ ...s, isLoading: false }))
      return
    }
    setStatus(s => ({ ...s, isLoading: true, error: null }))
    try {
      const result = await checkEditorOnboarding(connection, publicKey)
      setStatus({ ...result, isLoading: false, error: null })
      // Auto-advance wizard to step 2 ONLY if profile AND channels are done (step 1 complete)
      if (result.hasProfile && result.hasEnoughChannels && !result.hasStake) {
        setWizardStep(2)
      } else {
        // Otherwise always go back to step 1 (either no profile or incomplete channels)
        setWizardStep(1)
      }
      // If profile exists and has channels, prefill channel inputs for UX
      if (result.hasProfile && result.channelIds && result.channelIds.length > 0) {
        setChannels(result.channelIds.slice(0, MAX_UI_REGISTRABLE_CHANNELS))
      }
    } catch (e: any) {
      // If RPC fails (rate limits, network), ensure the gate shows and avoid leaving UI in loading state.
      const msg = e?.message || String(e)
      // Suggest RPC change on 429
      if (msg.includes('429') || /Too Many Requests/i.test(msg)) {
        toast.error('RPC rate-limited (429). Try changing your RPC endpoint or wait a few seconds.')
      } else {
        toast.error('Falha ao checar status on-chain: ' + (msg || 'Unknown error'))
      }
      // Force conservative status so the onboarding wizard appears and blocks access until resolved
      setStatus({
        hasProfile: false,
        hasStake: false,
        stakeAmount: 0,
        minStake: 100_000_000,
        channelIds: [],
        isBanned: false,
        isLoading: false,
        error: msg,
      })
    }
  }, [connected, publicKey, connection])

  useEffect(() => { refresh() }, [refresh])

  // Only editors need to complete onboarding. Others (creators, non-connected users) can browse freely.
  // If currentRole is explicitly 'editor', require full onboarding. Otherwise allow.
  const isUnlocked =
    !connected ||
    currentRole !== 'editor' ||
    (status.hasProfile && status.hasStake && status.hasEnoughChannels && !status.isBanned)

  // Redirect to editor dashboard only ONCE when onboarding is just completed
  useEffect(() => {
    // Only redirect if: not loading, unlocked, is editor, and haven't redirected yet
    // AND status shows we just got profile+stake (onboarding was just completed)
    if (!status.isLoading && isUnlocked && currentRole === 'editor' && !hasRedirected && status.hasProfile && status.hasStake) {
      setHasRedirected(true)
      // Small delay to ensure UI is ready
      const timer = setTimeout(() => {
        toast.success('Welcome to SolCuts! 🎉', { description: 'You now have full access.' })
        router.push('/editor-dashboard')
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [status.isLoading, isUnlocked, currentRole, hasRedirected, status.hasProfile, status.hasStake, router])

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
      toast.error(`Please enter at least ${MIN_REQUIRED_CHANNELS} Channel ID.`)
      return null
    }
    for (const ch of trimmed) {
      if (ch.length > 64) {
        toast.error('Channel ID too long');
        return null
      }
    }
    // Check for duplicate channel IDs
    const uniqueChannels = new Set(trimmed)
    if (uniqueChannels.size !== trimmed.length) {
      toast.error('Duplicate channel IDs detected. Each channel must be unique.')
      return null
    }
    return trimmed
  }

  // New handler to register initial profile with one or more channels
  const handleRegisterChannel = async () => {
    if (!publicKey || !connected) return

    // If profile already exists, cannot update channels (program limitation)
    if (status.hasProfile) {
      toast.error('Seu perfil já existe. Canais devem ser registrados na criação inicial do perfil. Contate suporte para reatribuir seu perfil.')
      setIsSubmitting(false)
      return
    }

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
        // Profile already exists — this shouldn't happen due to check above but keep as safety
        toast.error('A profile already exists for this wallet.')
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
        toast.error('Failed to get blockhash from RPC. Try again in a few seconds or change your RPC endpoint.')
        setIsSubmitting(false)
        return
      }

      // Send transaction with custom confirmation timeout (5 minutes instead of 30 seconds)
      let sig: string
      try {
        sig = await (program.methods as any)
          .initializeUser(channelArray)
          .accounts({
            userProfile: getUserProfilePDA(publicKey),
            config: configPda,
            authority: publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc({ skipPreflight: false })
      } catch (e: any) {
        // If the error is about confirmation timeout, continue to manual polling
        if (!e?.message?.includes('confirmed') && !e?.message?.includes('Timeout')) {
          throw e
        }
        // Extract signature if available
        const sigMatch = e?.message?.match(/[1-9A-HJ-NP-Z]{86,88}/)
        if (!sigMatch) throw e
        sig = sigMatch[0]
      }

      // Poll for confirmation with 5 minute timeout
      let landed = false
      for (let i = 0; i < 150; i++) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise(r => setTimeout(r, 2000))
        // eslint-disable-next-line no-await-in-loop
        const tx = await connection.getTransaction(sig, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 })
        if (tx) { landed = true; break }
      }
      if (!landed) throw new Error('Transaction not confirmed after 5 minutes. Check explorer or try again.')

      toast.success('Channels registered! Moving to Step 2...', { description: 'Now deposit stake to complete onboarding.' })
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
        toast.error('Failed to get blockhash from RPC. Try again in a few seconds or change your RPC endpoint.')
        setIsSubmitting(false)
        return
      }

      // Send transaction with custom confirmation timeout (5 minutes instead of 30 seconds)
      let sig: string
      try {
        sig = await (program.methods as any)
          .depositStake(new anchor.BN(amount))
          .accounts({
            stakeAccount: getStakeAccountPDA(publicKey),
            config: configPda,
            authority: publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc({ skipPreflight: false })
      } catch (e: any) {
        // If the error is about confirmation timeout, continue to manual polling
        if (!e?.message?.includes('confirmed') && !e?.message?.includes('Timeout')) {
          throw e
        }
        // Extract signature if available
        const sigMatch = e?.message?.match(/[1-9A-HJ-NP-Z]{86,88}/)
        if (!sigMatch) throw e
        sig = sigMatch[0]
      }

      // Poll for confirmation with 5 minute timeout
      let landed = false
      for (let i = 0; i < 150; i++) {
        await new Promise(r => setTimeout(r, 2000))
        const tx = await connection.getTransaction(sig, { commitment: 'confirmed', maxSupportedTransactionVersion: 0 })
        if (tx) { landed = true; break }
      }
      if (!landed) throw new Error(`Transaction not confirmed after 5 minutes. Check explorer with signature: ${sig.slice(0, 20)}... or try again.`)

      toast.success('Stake deposited! Onboarding complete!', { description: 'You now have full access to the Bounty Marketplace.' })
      await refresh()
    } catch (e: any) {
      console.error(e)
      const errorMsg = e?.message || 'Unknown error'
      setStakeError(errorMsg)
      // Provide more helpful hint when the RPC fails to return blockhash
      if (errorMsg.includes('failed to get latest blockhash')) {
        toast.error('RPC failed to get blockhash. Try changing your RPC endpoint or wait a few seconds and retry.')
      } else if (errorMsg.includes('not confirmed')) {
        toast.error('⏱️ Transaction too slow. Wait a few minutes and click "Try Again".')
      } else {
        toast.error('Failed to deposit stake: ' + errorMsg)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  // Debug: log unlock decision
  if (!status.isLoading) {
    console.log('[EditorOnboardingGate]', {
      connected,
      currentRole,
      hasProfile: status.hasProfile,
      hasStake: status.hasStake,
      hasEnoughChannels: status.hasEnoughChannels,
      isBanned: status.isBanned,
      isUnlocked,
    })
  }

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="relative">
      {/* Blurred background content */}
      <div
        className={`transition-all duration-500 ${
          !isUnlocked ? 'pointer-events-none select-none blur-md brightness-50' : ''
        }`}
        aria-hidden={!isUnlocked}
      >
        {children}
      </div>

      {/* Overlay gate — shown whenever user is not unlocked (connected or not) */}
      {!status.isLoading && !isUnlocked && (
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
              {/* If not connected, encourage wallet connection upfront */}
              {!connected && (
                <div className="mt-4 flex items-center gap-3">
                  <p className="text-sm text-on-surface-variant">Connect your wallet to begin the on-chain setup.</p>
                  <div>
                    <WalletMultiButton />
                  </div>
                </div>
              )}
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
                          (step === 1 && status.hasProfile && status.hasEnoughChannels) || (step === 2 && status.hasStake)
                            ? 'bg-primary text-on-primary'
                            : step === wizardStep
                            ? 'bg-primary/30 text-primary ring-2 ring-primary'
                            : 'bg-surface-container-high text-on-surface-variant'
                        }`}
                      >
                        {(step === 1 && status.hasProfile && status.hasEnoughChannels) || (step === 2 && status.hasStake)
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
                {wizardStep === 1 && (!status.hasProfile || !status.hasEnoughChannels) && (
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
                              <button type="button" onClick={() => removeChannel(idx)} className="text-error px-2">Remove</button>
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
                          Add Channel ({channels.length}/{MAX_UI_REGISTRABLE_CHANNELS})
                        </button>
                        <button
                          onClick={handleRegisterChannel}
                          disabled={isSubmitting}
                          className="rounded-xl bg-primary py-3 px-4 text-sm font-bold text-on-primary transition-all hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2"
                        >
                          {isSubmitting ? (
                            <><span className="animate-spin material-symbols-outlined text-sm">progress_activity</span> Registering…</>
                          ) : (
                            <><span className="material-symbols-outlined text-sm">person_add</span> Register Channel On-Chain</>
                          )}
                        </button>
                      </div>

                      <div className="mt-2 space-y-1.5 rounded-lg bg-surface-container px-3 py-2">
                        <p className="text-xs font-medium text-on-surface">⚠️ Important: Channel IDs Are Immutable</p>
                        <p className="text-[10px] text-on-surface-variant">Channel IDs registered here <strong>cannot be changed or updated</strong> after profile creation. Verify carefully before confirming.</p>
                      </div>
                      <div className="mt-2 space-y-1.5 rounded-lg bg-surface-container px-3 py-2">
                        <p className="text-xs font-medium text-on-surface">How to Find Your Channel ID:</p>
                        <p className="text-xs text-on-surface-variant">1. Visit <a href="https://www.youtube.com/account_advanced" target="_blank" rel="noopener noreferrer" className="text-primary underline">youtube.com/account_advanced</a></p>
                        <p className="text-xs text-on-surface-variant">2. Copy the <strong>Channel ID</strong> — it starts with <code className="rounded bg-surface-container-high px-1 text-secondary">UC</code></p>
                        <p className="text-[10px] text-error/80 mt-1">⚠️ Your handle <code className="rounded bg-surface-container-high px-1">@YourChannel</code> does NOT work. The Oracle validates by internal Channel ID.</p>
                      </div>
                    </div>
                  </div>
                )}

                {wizardStep === 2 && status.hasProfile && status.hasEnoughChannels && !status.hasStake && (
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
                    <div className="space-y-3">
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

                      {stakeError && (
                        <div className="rounded-lg border border-error/20 bg-error/5 p-3">
                          <p className="text-xs text-error mb-2">{stakeError}</p>
                          <button
                            onClick={() => {
                              setStakeError(null)
                              handleDepositStake()
                            }}
                            disabled={isSubmitting}
                            className="w-full rounded-lg border border-error/30 py-2 text-xs font-medium text-error hover:bg-error/10 disabled:opacity-50"
                          >
                            Try Again
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {status.hasProfile && status.hasStake && status.hasEnoughChannels && (
                  <div className="flex flex-col items-center gap-3 py-4 text-center">
                    <span className="material-symbols-outlined text-4xl text-primary">check_circle</span>
                    <p className="font-semibold text-on-surface">All set! Refreshing…</p>
                  </div>
                )}

                {/* If profile+stake exist but channels are missing, inform user of program limitation */}
                {status.hasProfile && status.hasStake && !status.hasEnoughChannels && (
                  <div className="space-y-3 rounded-lg border border-error/20 bg-error/5 p-4">
                    <div className="flex items-start gap-3">
                      <span className="material-symbols-outlined text-2xl text-error">error</span>
                      <div>
                        <p className="font-medium text-on-surface">Your profile was created without YouTube Channel IDs.</p>
                        <p className="text-sm text-on-surface-variant mt-1">
                          Due to a technical limitation, channels <strong>must be registered during initial profile creation</strong> and cannot be updated later.
                        </p>
                        <p className="text-sm text-on-surface-variant mt-2">
                          <strong>Solution:</strong> Contact support to reconfigure your profile or create a new one with the correct Channel IDs.
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href="https://discord.gg/solcuts"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-xl bg-secondary py-2 px-3 text-sm font-bold text-on-secondary"
                      >
                        Contact Support
                      </a>
                      <button
                        onClick={async () => { await refresh() }}
                        className="rounded-xl border px-3 py-2 text-sm"
                      >
                        Refresh
                      </button>
                    </div>
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

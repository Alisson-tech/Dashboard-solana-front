'use client'

import { Connection, PublicKey } from '@solana/web3.js'
import { getProgram } from './anchor/program'
import { getUserProfilePDA, getStakeAccountPDA, getGlobalConfigPDA } from './solana'

export interface OnboardingStatus {
  hasProfile: boolean          // UserProfile PDA exists on-chain
  hasStake: boolean            // StakeAccount exists and amount >= minStake
  stakeAmount: number          // lamports currently staked
  minStake: number             // minimum required (from GlobalConfig)
  channelIds: string[]         // registered channel IDs
  isBanned: boolean
  hasEnoughChannels: boolean
  isLoading: boolean
  error: string | null
}

const DEFAULT_MIN_STAKE = 100_000_000 // 0.1 SOL fallback

// UX limits for channel registration in the wizard (frontend-only)
export const MIN_REQUIRED_CHANNELS = 1
export const MAX_UI_REGISTRABLE_CHANNELS = 5

export async function checkEditorOnboarding(
  connection: Connection,
  walletPubkey: PublicKey
): Promise<Omit<OnboardingStatus, 'isLoading' | 'error'>> {
  const dummyWallet = { publicKey: walletPubkey } as any
  const program = getProgram(connection, dummyWallet)

  // Fetch all three in parallel
  const [profileInfo, stakeInfo, configInfo] = await Promise.allSettled([
    connection.getAccountInfo(getUserProfilePDA(walletPubkey)),
    connection.getAccountInfo(getStakeAccountPDA(walletPubkey)),
    connection.getAccountInfo(getGlobalConfigPDA()),
  ])

  // ─── GlobalConfig — get minStake ───────────────────────────────────────────
  let minStake = DEFAULT_MIN_STAKE
  if (configInfo.status === 'fulfilled' && configInfo.value) {
    try {
      const raw = await (program.account as any).globalConfig.fetch(getGlobalConfigPDA())
      minStake = Number(raw.minStakeAmount)
    } catch { /* use fallback */ }
  }

  // ─── UserProfile ──────────────────────────────────────────────────────────
  let hasProfile = false
  let channelIds: string[] = []
  let isBanned = false
  if (profileInfo.status === 'fulfilled' && profileInfo.value) {
    try {
      const raw = await (program.account as any).userProfile.fetch(getUserProfilePDA(walletPubkey))
      hasProfile = true
      channelIds = raw.channelIds ?? []
      isBanned = raw.isBanned ?? false
    } catch { /* account exists but decode failed - treat as no profile */ }
  }

  // ─── StakeAccount ─────────────────────────────────────────────────────────
  let hasStake = false
  let stakeAmount = 0
  if (stakeInfo.status === 'fulfilled' && stakeInfo.value) {
    try {
      const raw = await (program.account as any).stakeAccount.fetch(getStakeAccountPDA(walletPubkey))
      stakeAmount = Number(raw.amount)
      hasStake = stakeAmount >= minStake
    } catch { /* account exists but decode failed */ }
  }

  const hasEnoughChannels = channelIds.length >= MIN_REQUIRED_CHANNELS

  return { hasProfile, hasStake, stakeAmount, minStake, channelIds, isBanned, hasEnoughChannels }
}

'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useConnection } from '@solana/wallet-adapter-react'
import { useRouter, usePathname } from 'next/navigation'
import { PublicKey, Transaction, TransactionInstruction } from '@solana/web3.js'
import {
  getUserProfilePDA,
  getUserProfile,
  getStakeAccount,
  getGlobalConfig,
  PROGRAM_PUBKEY,
} from '@/lib/solana'
import { MIN_REQUIRED_CHANNELS } from '@/lib/editor-onboarding'

export type UserRole = 'creator' | 'editor' | null

interface AuthContextValue {
  role: UserRole
  selectedRole: UserRole
  isOnboarded: boolean
  isLoading: boolean
  setRole: (role: UserRole) => void
  setSelectedRole: (role: UserRole) => void
  completeOnboarding: (role: 'creator' | 'editor') => Promise<void>
  checkExistingUser: () => Promise<void>
  walletAddress: string | null
}

const AuthContext = createContext<AuthContextValue>({
  role: null,
  selectedRole: null,
  isOnboarded: false,
  isLoading: true,
  setRole: () => {},
  setSelectedRole: () => {},
  completeOnboarding: async () => {},
  checkExistingUser: async () => {},
  walletAddress: null,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const { publicKey, signTransaction } = useWallet()
  const { connection } = useConnection()
  const router = useRouter()
  const pathname = usePathname()
  const [role, setRole] = useState<UserRole>(null)
  const [selectedRole, setSelectedRoleState] = useState<UserRole>(null)
  const [isOnboarded, setIsOnboarded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const walletAddress = publicKey?.toBase58() || null

  // Persist selectedRole to localStorage so it survives page reloads
  const setSelectedRole = useCallback((newRole: UserRole) => {
    setSelectedRoleState(newRole)
    if (newRole && walletAddress) {
      try {
        localStorage.setItem(`selectedRole_${walletAddress}`, newRole)
      } catch (e) {
        console.warn('Failed to save selectedRole to localStorage', e)
      }
    }
  }, [walletAddress])

  const checkExistingUser = useCallback(async () => {
    if (!publicKey || !connection) {
      setIsLoading(false)
      return
    }

    try {
      const userProfile = await getUserProfile(connection, publicKey)
      console.log('UserProfile found:', userProfile)

      if (!userProfile) {
        console.log('No user profile found - not onboarded')
        setIsOnboarded(false)
        setRole(null)
        return
      }

      if (userProfile.isBanned) {
        console.log('User is banned')
        setIsOnboarded(false)
        setRole(null)
        return
      }

      // At this point we have a non-banned profile. For creators we consider
      // them onboarded once the profile exists. For editors we require
      // at least one channel ID (MIN_REQUIRED_CHANNELS) and the minimum stake.
      setRole(userProfile.role)

      if (userProfile.role === 'creator') {
        setIsOnboarded(true)
        console.log('Creator profile exists -> onboarded')
        return
      }

      // Editor: validate channels and stake
      const stake = await getStakeAccount(connection, publicKey)
      const globalCfg = await getGlobalConfig(connection)
      const minStake = globalCfg?.minStakeAmount ?? 100_000_000
      const hasEnoughChannels = Array.isArray(userProfile.channelIds) && userProfile.channelIds.length >= MIN_REQUIRED_CHANNELS
      const stakeAmount = stake?.amount ?? 0

      if (hasEnoughChannels && stakeAmount >= minStake) {
        setIsOnboarded(true)
        console.log('Editor meets channel+stake requirements -> onboarded')
      } else {
        setIsOnboarded(false)
        console.log('Editor missing channels or stake -> not onboarded', { hasEnoughChannels, stakeAmount, minStake })
      }
    } catch (e) {
      console.error('Error checking user:', e)
      setIsOnboarded(false)
      setRole(null)
    } finally {
      setIsLoading(false)
    }
  }, [publicKey, connection])

  const completeOnboarding = useCallback(async (selectedRole: 'creator' | 'editor') => {
    if (!publicKey || !signTransaction || !connection) return

    try {
      const authority = publicKey
      const userProfilePDA = getUserProfilePDA(authority)
      const globalConfigPDA = PublicKey.findProgramAddressSync(
        [Buffer.from('global_config_v1')],
        PROGRAM_PUBKEY
      )[0]

      const discriminator = new Uint8Array([111, 17, 185, 250, 60, 122, 38, 254])
      
      const roleByte = selectedRole === 'creator' ? 0 : 1
      
      const channelIdsData = new Uint8Array(4)
      channelIdsData.set([0x00, 0x00, 0x00, 0x00], 0)
      
      const data = new Uint8Array(13)
      data.set(discriminator, 0)
      data.set([roleByte], 8)
      data.set(channelIdsData, 9)

      const systemProgram = new PublicKey('11111111111111111111111111111111')

      const ix = new TransactionInstruction({
        programId: PROGRAM_PUBKEY,
        keys: [
          { pubkey: userProfilePDA, isSigner: false, isWritable: true },
          { pubkey: globalConfigPDA, isSigner: false, isWritable: false },
          { pubkey: authority, isSigner: true, isWritable: true },
          { pubkey: systemProgram, isSigner: false, isWritable: false },
        ],
        data: Buffer.from(data),
      })

      const tx = new Transaction().add(ix)
      tx.feePayer = authority

      for (let attempt = 0; attempt < 5; attempt++) {
        const { blockhash } = await connection.getLatestBlockhash('finalized')
        tx.recentBlockhash = blockhash

        const signedTx = await signTransaction(tx)

        try {
          await connection.sendRawTransaction(signedTx.serialize(), { skipPreflight: true, maxRetries: 5 })
          break
        } catch (sendErr: any) {
          const msg = (sendErr?.message || sendErr?.toString() || '').toLowerCase()
          if (msg.includes('blockhash not found') && attempt < 4) {
            console.warn(`Blockhash expired during onboard, retrying (${attempt + 1}/5)...`)
            continue
          }
          throw sendErr
        }
      }

      setRole(selectedRole)
      setIsOnboarded(true)

      if (selectedRole === 'creator') {
        router.push('/dashboard')
      } else {
        router.push('/editor-dashboard')
      }
    } catch (error) {
      console.error('Failed to create user:', error)
    }
  }, [publicKey, signTransaction, connection, router])

  useEffect(() => {
    // Load selectedRole from localStorage when wallet connects
    if (walletAddress) {
      try {
        const savedRole = localStorage.getItem(`selectedRole_${walletAddress}`)
        if (savedRole === 'creator' || savedRole === 'editor') {
          setSelectedRoleState(savedRole)
        }
      } catch (e) {
        console.warn('Failed to load selectedRole from localStorage', e)
      }
    }
  }, [walletAddress])

  useEffect(() => {
    if (walletAddress && connection) {
      checkExistingUser()
    } else {
      setRole(null)
      setIsOnboarded(false)
      setIsLoading(false)
    }
  }, [walletAddress, connection, checkExistingUser])

  useEffect(() => {
    console.log('Auth redirect check:', { isLoading, walletAddress, isOnboarded, role, pathname })
    
    if (isLoading || !walletAddress) return

    const publicRoutes = ['/', '/bounties', '/support', '/docs']
    const isPublic = publicRoutes.some(r => pathname === r || pathname.startsWith('/bounties/'))

    if (isPublic) return

    // Redirect from onboarding if already onboarded
    if (isOnboarded && pathname === '/onboarding') {
      router.push(role === 'creator' ? '/dashboard' : '/editor-dashboard')
      return
    }

    // Redirect to onboarding if not onboarded
    if (!isOnboarded && pathname !== '/onboarding') {
      router.push('/onboarding')
      return
    }

    // Role-based redirects
    if (isOnboarded && role) {
      console.log('Checking role redirect:', { role, pathname })
      
      // Editor trying to access creator pages
      if (role === 'editor' && (
        pathname === '/dashboard' || 
        pathname === '/create' || 
        pathname === '/analytics' ||
        pathname === '/settings'
      )) {
        console.log('Redirecting editor from creator page to editor-dashboard')
        router.push('/editor-dashboard')
        return
      }
      
      // Creator trying to access editor pages  
      if (role === 'creator' && pathname === '/editor-dashboard') {
        console.log('Redirecting creator from editor page to dashboard')
        router.push('/dashboard')
        return
      }
    }
  }, [isLoading, walletAddress, isOnboarded, role, pathname, router])

  return (
    <AuthContext.Provider value={{ role, selectedRole, isOnboarded, isLoading, setRole, setSelectedRole, completeOnboarding, checkExistingUser, walletAddress }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

'use client'

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useRouter, usePathname } from 'next/navigation'
import { coreApi } from '@/lib/api'

export type UserRole = 'creator' | 'editor' | null

interface AuthContextValue {
  role: UserRole
  isOnboarded: boolean
  isLoading: boolean
  setRole: (role: UserRole) => void
  completeOnboarding: (role: 'creator' | 'editor') => Promise<void>
  checkExistingUser: () => Promise<void>
  walletAddress: string | null
}

const AuthContext = createContext<AuthContextValue>({
  role: null,
  isOnboarded: false,
  isLoading: true,
  setRole: () => {},
  completeOnboarding: async () => {},
  checkExistingUser: async () => {},
  walletAddress: null,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const { publicKey } = useWallet()
  const router = useRouter()
  const pathname = usePathname()
  const [role, setRole] = useState<UserRole>(null)
  const [isOnboarded, setIsOnboarded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const walletAddress = publicKey?.toBase58() || null

  const checkExistingUser = useCallback(async () => {
    if (!walletAddress) {
      setIsLoading(false)
      return
    }

    try {
      const user = await coreApi.getUser(walletAddress)
      if (user?.role) {
        setRole(user.role)
        setIsOnboarded(true)
      } else {
        setIsOnboarded(false)
        setRole(null)
      }
    } catch {
      setIsOnboarded(false)
      setRole(null)
    } finally {
      setIsLoading(false)
    }
  }, [walletAddress])

  const completeOnboarding = useCallback(async (selectedRole: 'creator' | 'editor') => {
    if (!walletAddress) return

    try {
      await coreApi.createUser({ walletAddress, role: selectedRole })
      setRole(selectedRole)
      setIsOnboarded(true)

      if (selectedRole === 'creator') {
        router.push('/dashboard')
      } else {
        router.push('/editor-dashboard')
      }
    } catch (error) {
      console.error('Failed to save role:', error)
    }
  }, [walletAddress, router])

  useEffect(() => {
    if (walletAddress) {
      checkExistingUser()
    } else {
      setRole(null)
      setIsOnboarded(false)
      setIsLoading(false)
    }
  }, [walletAddress, checkExistingUser])

  useEffect(() => {
    if (isLoading || !walletAddress) return

    const publicRoutes = ['/', '/bounties', '/support', '/docs']
    const isPublic = publicRoutes.some(r => pathname === r || pathname.startsWith('/bounties/'))

    if (isPublic) return

    if (!isOnboarded && pathname !== '/onboarding') {
      router.push('/onboarding')
    }

    if (isOnboarded) {
      if (role === 'creator' && pathname === '/editor-dashboard') {
        router.push('/dashboard')
      }
      if (role === 'editor' && (pathname === '/dashboard' || pathname === '/create' || pathname === '/analytics')) {
        router.push('/editor-dashboard')
      }
    }
  }, [isLoading, walletAddress, isOnboarded, role, pathname, router])

  return (
    <AuthContext.Provider value={{ role, isOnboarded, isLoading, setRole, completeOnboarding, checkExistingUser, walletAddress }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

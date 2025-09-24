import { useMemo } from 'react'
import { useAuth } from '@/app/context/auth-context'
import { getApiKey } from '@/app/lib/api-helpers'

export interface OptimizedAuthData {
  user: any
  userId?: string
  userEmail?: string | null
  isAuthenticated: boolean
  isLoading: boolean
  getApiKey: () => Promise<string | null>
}

/**
 * Optimized authentication hook that properly uses api-helpers
 * Replaces scattered auth patterns and fixes api-helpers usage
 */
export function useOptimizedAuth(): OptimizedAuthData {
  const { firebaseUser, authLoading } = useAuth()
  
  return useMemo(() => ({
    user: firebaseUser,
    userId: firebaseUser?.uid,
    userEmail: firebaseUser?.email,
    isAuthenticated: !!firebaseUser,
    isLoading: authLoading || firebaseUser === undefined,
    
    // Properly expose api-helpers functionality
    getApiKey: async () => {
      try {
        return await getApiKey()
      } catch (error) {
        console.error('Failed to get API key:', error)
        return null
      }
    }
  }), [firebaseUser, authLoading])
}

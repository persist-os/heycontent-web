import { useMemo } from 'react'
import { useAuth } from '@/app/context/auth-context'
import type { AuthData } from '../types/chat-container.types'

export function useAuthData(): AuthData {
  const { firebaseUser } = useAuth()
  
  return useMemo(() => ({
    user: firebaseUser,
    userId: firebaseUser?.uid,
    userEmail: firebaseUser?.email,
    isAuthenticated: !!firebaseUser,
    isLoading: firebaseUser === undefined
  }), [firebaseUser])
}

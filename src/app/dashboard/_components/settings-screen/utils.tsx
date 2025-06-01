// File: components/settings/utils.ts
import { signOut, updateProfile } from 'firebase/auth'
import { getFirebaseAuth } from '@/app/lib/firebase'
import { fetchWithAuth } from '@/app/lib/api-helpers'
import { toast } from 'react-hot-toast'
import { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime'

export const handleSignOut = async (router: AppRouterInstance) => {
  try {
    localStorage.removeItem('apiKey')
    localStorage.removeItem('firebaseToken')
    localStorage.removeItem('userId')
    sessionStorage.removeItem('apiKey')
    sessionStorage.removeItem('firebaseToken')
    sessionStorage.removeItem('userId')
    localStorage.clear()
    sessionStorage.clear()

    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })

    const data = await response.json()
    if (!response.ok) throw new Error(data.details || data.error || 'Failed to logout')

    try {
      const auth = getFirebaseAuth();
      await signOut(auth);
    } catch (firebaseError) {
      console.warn('Firebase signOut error:', firebaseError)
    }

    router.push('/auth/login')
    window.location.reload()
  } catch (error) {
    console.error('Sign out error:', error)
    toast.error('Failed to sign out. Please try again.')
  }
}

export const handleResendVerification = async (setIsResending: (val: boolean) => void) => {
  setIsResending(true)
  try {
    let auth;
    try {
      auth = getFirebaseAuth();
    } catch (err) {
      throw new Error('Auth not initialized');
    }
    if (!auth) throw new Error('Auth not initialized');
    const email = auth.currentUser?.email;
    const response = await fetchWithAuth('/api/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ email }),
    })
    if (!response) throw new Error('Failed to resend verification email')
    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to resend verification email')
    }
    toast.success('Verification email sent. Please check your inbox.')
  } catch (error) {
    console.error('Resend verification error:', error)
    toast.error(error instanceof Error ? error.message : 'Failed to send verification email')
  } finally {
    setIsResending(false)
  }
}


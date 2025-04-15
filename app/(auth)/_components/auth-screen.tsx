'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Chrome
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { auth } from '@/app/lib/firebase'
import { 
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from 'firebase/auth'
import { useAuth } from '@/app/context/auth-context'

interface AuthScreenProps {
  isLogin?: boolean
  onSuccess?: (email: string) => void
}

export function AuthScreen({ isLogin = true, onSuccess }: AuthScreenProps) {
  const { user, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')
  const [showResendVerification, setShowResendVerification] = useState(false)

  useEffect(() => {
    if (error === 'UNVERIFIED_EMAIL' || 
        error === 'CallbackRouteError' || 
        error === 'AccessDenied' || 
        urlError === 'AccessDenied') {
      setShowResendVerification(true)
    }
  }, [error, urlError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)
    
    try {
      console.log('Attempting to submit form with:', { email, action: isLogin ? 'login' : 'register' })
      
      const response = await fetch('/api/auth/firebase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          action: isLogin ? 'login' : 'register'
        }),
      })

      console.log('Auth response status:', response.status)
      const data = await response.json()
      console.log('Auth response data:', data)

      if (!response.ok) {
        if (data.error === 'UNVERIFIED_EMAIL') {
          router.push(`/verify-email?email=${encodeURIComponent(email)}`)
          return
        }
        throw new Error(data.error)
      }

      // Wait for auth state to be updated and token to be set
      await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
          if (user) {
            console.log('Auth state updated with user:', user.email);
            // Get the latest token
            const token = await user.getIdToken(true);
            console.log('Token obtained successfully');
            unsubscribe();
            resolve(user);
          }
        });
      });

      // Add a small delay to ensure the cookie is set
      await new Promise(resolve => setTimeout(resolve, 100));

      // Use the redirect path from the server response if available
      const redirectPath = data.redirect || '/chat';
      console.log('Redirecting to:', redirectPath);
      window.location.href = redirectPath;
    } catch (err) {
      console.error('Auth error:', err)
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      if (!auth) {
        throw new Error('Firebase auth not initialized')
      }
      
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({
        prompt: 'select_account'
      })
      
      try {
        const result = await signInWithPopup(auth, provider)
        
        if (result.user) {
          const idToken = await result.user.getIdToken()
          
          const response = await fetch('/api/auth/firebase', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              idToken,
              action: 'google'
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to set session')
          }

          const data = await response.json();
          const redirectPath = data.redirect || '/chat';
          console.log('Google sign-in redirecting to:', redirectPath);
          window.location.href = redirectPath;
        }
      } catch (popupError) {
        if (popupError instanceof Error && popupError.message.includes('popup')) {
          throw new Error('Please allow popups for Google Sign-In')
        }
        throw popupError
      }
    } catch (err) {
      console.error('Google Sign-In error:', err)
      setError(err instanceof Error ? err.message : 'Failed to sign in with Google')
    } finally {
      setIsLoading(false)
    }
  }

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'OAuthSignin':
        return 'Error starting Google sign in. Please try again.';
      case 'OAuthCallback':
        return 'Error completing Google sign in. Please try again.';
      case 'UserExists':
        return 'An account with this email already exists. Please verify your email or sign in.';
      case 'CredentialsSignin':
        return 'Invalid email or password.';
      case 'UNVERIFIED_EMAIL':
      case 'CallbackRouteError':
      case 'AccessDenied':
        return 'Please verify your email before signing in.';
      default:
        return error || 'An error occurred. Please try again.';
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-center">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
                required
                placeholder="Enter your name"
                aria-label="Full Name"
              />
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border rounded-md pl-10"
                required
                placeholder="Enter your email"
                aria-label="Email Address"
              />
              <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded-md pl-10 pr-10"
                required
                placeholder="Enter your password"
                aria-label="Password"
              />
              <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>
          {error && (
            <div className="text-red-500 text-sm">{getErrorMessage(error)}</div>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">Or continue with</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-white border border-gray-300 py-2 rounded-md hover:bg-gray-50 disabled:opacity-50"
          >
            <Chrome className="h-5 w-5" />
            Google
          </button>
          <div className="text-center text-sm">
            {isLogin ? (
              <>
                Don't have an account?{' '}
                <Link href="/register" className="text-blue-500 hover:underline">
                  Sign up
                </Link>
              </>
            ) : (
              <>
                Already have an account?{' '}
                <Link href="/login" className="text-blue-500 hover:underline">
                  Sign in
                </Link>
              </>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
} 
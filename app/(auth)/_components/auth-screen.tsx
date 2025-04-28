'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Chrome
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { auth } from '@/app/lib/firebase'
import {
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
  signInWithCustomToken
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
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

      const data = await response.json()
      console.log('Auth response:', { ...data, customToken: data.customToken ? '[TOKEN_PRESENT]' : undefined })

      if (!response.ok) {
        throw new Error(data.error)
      }

      // Save API key to localStorage if it exists in the response
      if (data.apiKey) {
        localStorage.removeItem('apiKey'); // Clear any previous API key
        localStorage.setItem('apiKey', JSON.stringify(data.apiKey));
        console.log('API key saved to localStorage');
      }

      // If we have a custom token, sign in with it
      if (data.customToken && auth) {
        try {
          console.log('Attempting to sign in with custom token...')
          // Sign in with the custom token
          const userCredential = await signInWithCustomToken(auth, data.customToken)
          console.log('Sign in successful:', userCredential.user?.uid)
          
          if (userCredential.user) {
            // Get Firebase ID token after authenticating with custom token
            console.log('Getting Firebase ID token for backend auth...')
            const idToken = await userCredential.user.getIdToken(true)
            console.log('Firebase ID token obtained:', idToken)
            
            // Send ID token to backend for proper authentication and API key generation if needed
            if (!data.apiKey) {
              console.log('No API key in initial response, sending ID token to backend...')
              const apiKeyResponse = await fetch('/api/auth/firebase', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  idToken,
                  action: 'refresh'
                }),
              })
              
              const apiKeyData = await apiKeyResponse.json()
              if (apiKeyData.apiKey) {
                localStorage.removeItem('apiKey'); // Clear any previous API key
                localStorage.setItem('apiKey', JSON.stringify(apiKeyData.apiKey));
                console.log('API key received and saved to localStorage');
              }
            }
            
            // If we have a redirect URL in the response, use it
            if (data.redirect) {
              router.push(data.redirect)
              return
            }
            // Default redirect after successful login
            router.push('/chat')
            return
          }
        } catch (signInError) {
          console.error('Error signing in with custom token:', signInError)
          throw new Error('Failed to complete sign in')
        }
      }

      // If all else fails, show an error
      throw new Error('Authentication successful but unable to redirect')
    } catch (err) {
      console.error('Auth error:', err)
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      console.log('Starting Google Sign-In process...');
      
      if (!auth) {
        console.error('Firebase auth not initialized');
        throw new Error('Firebase auth not initialized')
      }

      const provider = new GoogleAuthProvider()
      // Add explicit configuration
      provider.addScope('email')
      provider.addScope('profile')
      provider.setCustomParameters({
        prompt: 'select_account',
        login_hint: ''
      })
      console.log('Google provider configured with scopes');

      console.log('Attempting to sign in with popup...');
      try {
        const result = await signInWithPopup(auth, provider)
        console.log('Sign in with popup successful');

        if (result.user) {
          console.log('User signed in, getting ID token...');
          const idToken = await result.user.getIdToken()
          console.log('ID token obtained:', idToken.slice(0, 5) + '...' + idToken.slice(-5));

          console.log('Sending token to backend...');
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

          const data = await response.json();
          
          if (!response.ok) {
            console.error('Backend response error:', data);
            throw new Error('Failed to set session')
          }
          console.log('Backend authentication successful');

          // Save API key to localStorage if it exists in the response
          if (data.apiKey) {
            localStorage.removeItem('apiKey'); // Clear any previous API key
            localStorage.setItem('apiKey', JSON.stringify(data.apiKey));
            console.log('API key saved to localStorage');
          }

          // Use router.push instead of window.location
          router.push('/chat')
        }
      } catch (popupError) {
        console.error('Popup error details:', popupError);
        throw popupError;
      }
    } catch (err) {
      console.error('Google Sign-In error details:', err);
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
    <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm shadow-xl">
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
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
import { signIn, signOut } from 'next-auth/react'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

interface AuthScreenProps {
  isLogin?: boolean
  onSuccess?: (email: string) => void
}

export function AuthScreen({ isLogin = true, onSuccess }: AuthScreenProps) {
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
      if (isLogin) {
        const result = await signIn('credentials', {
          email,
          password,
          redirect: false
        })

        if (result?.error) {
          setError(result.error)
          if (result.error === 'UNVERIFIED_EMAIL') {
            router.push(`/verify-email?email=${encodeURIComponent(email)}`)
            return
          }
          if (result.error === 'CallbackRouteError' || result.error === 'AccessDenied') {
            setShowResendVerification(true)
          }
        } else {
          router.push('/chat')
        }
      } else {
        console.log('📧 Registering new user...')
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email,
            password,
            name,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error)
        }

        console.log('✅ Registration successful!')
        
        if (onSuccess) {
          onSuccess(email)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true)
      const result = await signIn('google', { 
        callbackUrl: '/chat',
        redirect: false,
      })

      if (result?.ok) {
        // Sync the session with Convex
        await fetch('/api/auth/sync', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        })
        
        // Now redirect
        router.push('/chat')
      } else {
        throw new Error(result?.error || 'Failed to sign in')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with Google'
      setError(errorMessage)
      setIsLoading(false)
      console.error('Google sign-in error:', err)
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
    <div className="min-h-screen bg-[#F8F0F9] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold">
            {isLogin ? "Welcome back to HeyContent" : "Join HeyContent"}
          </CardTitle>
          <p className="text-gray-500 text-sm">
            {isLogin ? "Sign in to continue" : "Sign up to get started"}
          </p>
          {(error || urlError) && (
            <p className="text-red-500 text-sm">
              {getErrorMessage(error || urlError || '')}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <button 
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <>
                  <Chrome className="w-4 h-4" />
                  <span className="font-medium">Continue with Google</span>
                </>
              )}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-gray-500">or</span>
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    className="w-full px-3 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required={!isLogin}
                  />
                  <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <div className="relative">
                <input
                  type="email"
                  className="w-full px-3 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-3 py-2 pl-10 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <div className="text-sm text-right">
                <Link href="/forgot-password" className="text-blue-500 hover:underline">
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? "Loading..." : isLogin ? "Sign in" : "Sign up"}
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => router.push(isLogin ? '/register' : '/login')}
                className="text-sm text-blue-500 hover:underline"
              >
                {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>

            {showResendVerification && (
              <button
                type="button"
                onClick={() => {
                  fetch('/api/auth/verify-email', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ email }),
                  })
                  .then(() => {
                    toast.success('Verification email sent! Please check your inbox.')
                  })
                  .catch(() => {
                    toast.error('Failed to send verification email.')
                  })
                }}
                className="mt-2 text-sm text-blue-500 hover:underline"
              >
                Resend verification email
              </button>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
} 
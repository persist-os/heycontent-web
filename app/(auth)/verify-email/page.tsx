'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Mail } from 'lucide-react'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const [isResending, setIsResending] = useState(false)
  const searchParams = useSearchParams()
  const email = searchParams.get('email')
  const error = searchParams.get('error')

  const handleResendVerification = async () => {
    if (!email) return;
    
    setIsResending(true)
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to resend verification email')
      }

      toast.success('Verification email sent! Please check your inbox.')
    } catch (error) {
      console.error('Resend error:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to send verification email')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F8F0F9] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-semibold">
            Check Your Email
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-center">
            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Mail className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          
          <div className="text-center space-y-2">
            <p className="text-gray-600">
              We sent a verification link to
            </p>
            <p className="font-medium">{email}</p>
            <p className="text-sm text-gray-500">
              Click the link in your email to verify your account
            </p>
          </div>

          {error && (
            <div className="text-center text-red-500 text-sm">
              {error === 'invalid-token' 
                ? 'This verification link is invalid or has expired. Please request a new one.'
                : 'Something went wrong. Please try again.'}
            </div>
          )}

          <button
            onClick={handleResendVerification}
            disabled={isResending}
            className="w-full py-2 text-blue-500 hover:text-blue-600 text-sm"
          >
            {isResending ? 'Sending...' : 'Resend verification email'}
          </button>

          <div className="text-center">
            <Link 
              href="/login"
              className="text-sm text-gray-500 hover:text-gray-600"
            >
              Back to login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 
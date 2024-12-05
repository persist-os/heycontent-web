'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default function VerifyEmailPage() {
  const [isVerifying, setIsVerifying] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setError('No verification token found')
      setIsVerifying(false)
      return
    }

    const verifyEmail = async () => {
      try {
        const response = await fetch('/api/auth/verify-email', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ token }),
        })

        if (response.ok) {
          router.push('/login?verified=true')
        } else {
          const data = await response.json()
          throw new Error(data.error || 'Failed to verify email')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      } finally {
        setIsVerifying(false)
      }
    }

    verifyEmail()
  }, [token, router])

  return (
    <div className="min-h-screen bg-[#F8F0F9] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm shadow-xl">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-semibold">
            Email Verification
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isVerifying ? (
            <p className="text-center">Verifying your email...</p>
          ) : error ? (
            <div className="space-y-4">
              <p className="text-red-500">{error}</p>
              <Link 
                href="/login"
                className="block text-center text-blue-500 hover:underline"
              >
                Back to login
              </Link>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
} 
'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/src/components/ui/card'
import { CheckCircle2 } from 'lucide-react'

export default function VerificationSuccessPage() {
  return (
    <div className="min-h-screen bg-[#F8F0F9] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl">Email Verified!</CardTitle>
        </CardHeader>
        <CardContent className="text-center">
          <p className="mb-6">
            Your email has been successfully verified. You can now sign in to your account.
          </p>
          <Link 
            href="/login"
            className="block w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Sign In
          </Link>
        </CardContent>
      </Card>
    </div>
  )
} 
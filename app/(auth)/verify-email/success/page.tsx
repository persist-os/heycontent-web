'use client'

import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2 } from 'lucide-react'

export default function VerificationSuccessPage() {
  return (
    <div className="min-h-screen bg-[#F8F0F9] flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-white/80 backdrop-blur-sm shadow-xl">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl text-center">Email Verified!</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center mb-6">
            Your email has been successfully verified. You can now access all features of AVA IRIS.
          </p>
          <Link 
            href="/login"
            className="block w-full py-2 text-center bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Continue to Login
          </Link>
        </CardContent>
      </Card>
    </div>
  )
} 
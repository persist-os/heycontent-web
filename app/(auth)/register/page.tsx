'use client'

import { useRouter } from 'next/navigation'
import { AuthScreen } from '../_components/auth-screen'
import { toast } from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()

  const onRegisterSuccess = (email: string) => {
    router.push(`/verify-email?email=${encodeURIComponent(email)}`)
    toast.success('Please check your email to verify your account.')
  }

  return <AuthScreen 
    isLogin={false} 
    onSuccess={onRegisterSuccess}
  />
} 
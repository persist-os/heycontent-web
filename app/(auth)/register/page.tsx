'use client'

import { useRouter } from 'next/navigation'
import { AuthScreen } from '../_components/auth-screen'
import { toast } from 'react-hot-toast'

export default function RegisterPage() {
  const router = useRouter()

  const onRegisterSuccess = (apiKey: string) => {
    router.push('/chat');
    toast.success('Registration successful! Welcome to HeyContent.');
  };

  return <AuthScreen 
    isLogin={false} 
    onSuccess={onRegisterSuccess}
  />
} 
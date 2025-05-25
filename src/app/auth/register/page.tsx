'use client'

import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import RegisterScreen from '../_components/register-screen';

export default function RegisterPage() {
  const router = useRouter();

  const onRegisterSuccess = (apiKey: string) => {
    router.push('/dashboard/chat');
    toast.success('Registration successful! Welcome to HeyContent.');
  };

  return <RegisterScreen onSuccess={onRegisterSuccess} />;
}
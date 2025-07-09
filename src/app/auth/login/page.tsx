'use client'

import { useSearchParams } from 'next/navigation';
import LoginScreen from '../_components/login-screen';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const searchParams = useSearchParams();
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    let r = searchParams.get('reason');
    if (!r) {
      // Fallback for hard reloads or direct links
      const params = new URLSearchParams(window.location.search);
      r = params.get('reason');
    }
    if (!r) {
      // Fallback for sessionStorage
      r = sessionStorage.getItem('logoutReason');
      sessionStorage.removeItem('logoutReason');
    }
    setReason(r);
  }, [searchParams]);

  return <LoginScreen reason={reason} />;
}

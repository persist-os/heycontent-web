'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function SessionCleanup() {
  const router = useRouter()

  useEffect(() => {
    // Only clear auth-related cookies and storage
    const authCookies = ['token', 'next-auth.session-token', '__Secure-next-auth.session-token'];
    document.cookie.split(";").forEach((c) => {
      const cookieName = c.split("=")[0].trim();
      if (authCookies.includes(cookieName)) {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      }
    });
    
    // Only clear auth-related storage
    localStorage.removeItem('firebase:authUser');
    sessionStorage.removeItem('firebase:authUser');
    
    // Force a hard reload to clear everything
    router.refresh()
    // We intentionally only run this once on mount as it's a cleanup component
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
} 
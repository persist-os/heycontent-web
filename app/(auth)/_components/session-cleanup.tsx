'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function SessionCleanup() {
  const router = useRouter()

  useEffect(() => {
    // Clear cookies and storage on mount
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
    });
    localStorage.clear()
    sessionStorage.clear()
    
    // Force a hard reload to clear everything
    router.refresh()
  }, [])

  return null
} 
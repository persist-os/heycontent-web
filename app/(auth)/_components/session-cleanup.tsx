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
    // We intentionally only run this once on mount as it's a cleanup component
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
} 
'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function LivingProjectsScreen() {
  const router = useRouter()
  
  useEffect(() => {
    router.push('/dashboard/thinking_lab')
  }, [router])
  
  return null
}

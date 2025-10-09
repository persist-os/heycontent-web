'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  
  useEffect(() => {
    // Redirect to Briefing Room as the default dashboard view
    router.replace('/dashboard/briefing_room')
  }, [router])
  
  return (
    <div className="h-screen w-full flex items-center justify-center">
      <div className="text-muted-foreground">Loading...</div>
    </div>
  )
} 
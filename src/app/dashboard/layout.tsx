'use client'

import React, { useEffect } from 'react'
import { DashboardNav } from './_components/dashboard-nav'
import { useAuth } from '@/app/context/auth-context'
import { usePathname } from 'next/navigation'
import { useSidebar } from '@/app/context/sidebar-context'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { firebaseUser, authLoading } = useAuth()
  const { isExpanded, setIsExpanded } = useSidebar()

  useEffect(() => {
    if (!authLoading && !firebaseUser) {
      window.location.href = '/auth/login'
    }
  }, [firebaseUser, authLoading])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!firebaseUser) {
    return null
  }

  return (
    <div className="relative flex min-h-screen">
      <div className="fixed inset-y-0 left-0 z-40">
        <DashboardNav />
      </div>
      <main className={`flex-1 transition-[margin] duration-300 ${isExpanded ? 'md:ml-64' : 'ml-0'}`}>
        {children}
      </main>
    </div>
  )
}
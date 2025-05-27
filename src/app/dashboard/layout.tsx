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
  const { user, loading } = useAuth()
  const { isExpanded, setIsExpanded } = useSidebar()

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = '/auth/login'
    }
  }, [user, loading])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="relative flex min-h-screen">
      <div className="fixed inset-y-0 left-0 z-40">
        <DashboardNav />
      </div>
      <main className={`flex-1 transition-[margin] duration-300 ${isExpanded ? 'md:ml-64' : ''}`}>
        {children}
      </main>
    </div>
  )
}
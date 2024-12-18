import React from 'react'
import { DashboardNav } from './_components/dashboard-nav'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()
  
  if (!session) {
    redirect('/login')
  }

  return (
    <div className="h-screen flex bg-white">
      <DashboardNav />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
} 
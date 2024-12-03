'use client'

import React from 'react'
import { DashboardNav } from './_components/dashboard-nav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="h-screen flex bg-white overflow-hidden">
      <DashboardNav />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
} 
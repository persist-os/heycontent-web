'use client'

import React from 'react'
import { DashboardNav } from './_components/dashboard-nav'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#F8F0F9] flex">
      <DashboardNav />
      <main className="flex-1 p-8">
        <div className="bg-white/70 backdrop-blur-md rounded-3xl min-h-[calc(100vh-4rem)] p-6 shadow-lg">
          {children}
        </div>
      </main>
    </div>
  )
} 
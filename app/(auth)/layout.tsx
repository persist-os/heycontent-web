'use client'

import React from 'react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-[#F8F0F9] flex items-center justify-center p-4">
      {children}
    </div>
  )
} 
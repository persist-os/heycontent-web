'use client'

import React from 'react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-b from-background/80 via-muted/20 to-background/80 p-4">
      {children}
    </div>
  )
} 
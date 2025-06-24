'use client'

import React from 'react'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen w-full bg-[#F8F0F9] p-4 light-mode-forced" style={{
      '--background': '0 0% 100%', // Force white background
      '--foreground': '240 10% 3.9%', // Force dark text
      '--card': '0 0% 100%',
      '--card-foreground': '240 10% 3.9%',
      '--popover': '0 0% 100%',
      '--popover-foreground': '240 10% 3.9%',
      '--primary': '55 95% 58%', // Keep HeyContent yellow
      '--primary-foreground': '0 0% 0%',
      '--secondary': '240 4.8% 95.9%',
      '--secondary-foreground': '240 5.9% 10%',
      '--muted': '240 4.8% 95.9%',
      '--muted-foreground': '240 3.8% 46.1%',
      '--accent': '55 95% 58%',
      '--accent-foreground': '0 0% 0%',
      '--destructive': '0 84.2% 60.2%',
      '--destructive-foreground': '0 0% 98%',
      '--border': '240 5.9% 90%',
      '--input': '240 5.9% 90%',
      '--ring': '55 95% 58%',
    } as React.CSSProperties}>
      {children}
    </div>
  )
} 
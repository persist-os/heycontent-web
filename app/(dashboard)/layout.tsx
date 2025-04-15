'use client'

import React, { useEffect, useState } from 'react'
import { DashboardNav } from './_components/dashboard-nav'
import { auth } from '@/app/lib/firebase'
import { useRouter } from 'next/navigation'
import { onAuthStateChanged } from 'firebase/auth'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      console.error('Firebase auth not initialized')
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'User exists' : 'No user')
      
      if (!user) {
        console.log('No user found, redirecting to login')
        // Store current path for redirect back after login
        const currentPath = window.location.pathname;
        if (currentPath !== '/login') {
          router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
        }
        return
      }

      try {
        // Refresh the ID token to ensure it's valid
        const token = await user.getIdToken(true)
        console.log('Token refreshed successfully')
        
        const response = await fetch('/api/auth/firebase', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            idToken: token,
            action: 'refresh'
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to set token')
        }

        console.log('Token set successfully')
      } catch (error) {
        console.error('Error refreshing token:', error)
        router.push('/login')
        return
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-white">
      <DashboardNav />
      <main className="flex-1 h-full overflow-y-auto">
        <div className="max-w-6xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  )
} 
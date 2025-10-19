 'use client'

import { ReactNode, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from './context/auth-context'
import { SidebarProvider } from './context/sidebar-context'
import { NotesProvider } from './context/notes-context'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { trackPageview } from '@/lib/analytics'

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export function Providers({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  // Track pageviews on route change
  useEffect(() => {
    if (pathname) trackPageview(pathname)
  }, [pathname])

  // Note: Subscription enforcement is now handled by dashboard/layout.tsx
  // This removes the old free tier limit modal that was conflicting

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ConvexProvider client={convex}>
        <AuthProvider>
          <SidebarProvider>
            <NotesProvider>
              {children}
            </NotesProvider>
          </SidebarProvider>
        </AuthProvider>
      </ConvexProvider>
    </ThemeProvider>
  )
}
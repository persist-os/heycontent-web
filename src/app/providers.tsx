 'use client'

import { ReactNode, useEffect, createContext, useContext } from 'react'
import { usePathname } from 'next/navigation'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from './context/auth-context'
import { SidebarProvider } from './context/sidebar-context'
import { NotesProvider } from './context/notes-context'
import { LanguageProvider } from './context/language-context'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { trackPageview } from '@/lib/analytics'
import { LanguageDetectionWrapper } from '@/components/translation/LanguageDetectionWrapper'

// Create Convex client - use placeholder URL if not configured
// This allows the app to start; Convex operations will fail gracefully
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || 'https://placeholder.convex.cloud'
const convex = new ConvexReactClient(convexUrl)

// Context to check if Convex is properly configured (not placeholder)
export const ConvexConfiguredContext = createContext<boolean>(false)
export const useConvexConfigured = () => useContext(ConvexConfiguredContext)

const isConvexConfigured = !!process.env.NEXT_PUBLIC_CONVEX_URL

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
      <ConvexConfiguredContext.Provider value={isConvexConfigured}>
        <ConvexProvider client={convex}>
          <AuthProvider>
            <LanguageProvider>
              <LanguageDetectionWrapper>
                <SidebarProvider>
                  <NotesProvider>
                    {children}
                  </NotesProvider>
                </SidebarProvider>
              </LanguageDetectionWrapper>
            </LanguageProvider>
          </AuthProvider>
        </ConvexProvider>
      </ConvexConfiguredContext.Provider>
    </ThemeProvider>
  )
}
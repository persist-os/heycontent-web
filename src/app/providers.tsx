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

// Only create Convex client if URL is configured
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
const convex = convexUrl ? new ConvexReactClient(convexUrl) : null

// Context to check if Convex is available
export const ConvexConfiguredContext = createContext<boolean>(false)
export const useConvexConfigured = () => useContext(ConvexConfiguredContext)

// Wrapper component that conditionally provides Convex
function ConvexWrapper({ children }: { children: ReactNode }) {
  if (convex) {
    return (
      <ConvexConfiguredContext.Provider value={true}>
        <ConvexProvider client={convex}>{children}</ConvexProvider>
      </ConvexConfiguredContext.Provider>
    )
  }
  // When Convex is not configured, render children without the provider
  // This allows the app to run in a limited mode for development/preview
  return (
    <ConvexConfiguredContext.Provider value={false}>
      {children}
    </ConvexConfiguredContext.Provider>
  )
}

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
      <ConvexWrapper>
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
      </ConvexWrapper>
    </ThemeProvider>
  )
}
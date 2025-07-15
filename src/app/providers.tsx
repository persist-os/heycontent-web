'use client'

import { ReactNode } from 'react'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from './context/auth-context'
import { SidebarProvider } from './context/sidebar-context'
import { NotesProvider } from './context/notes-context'
import { ConvexProvider, ConvexReactClient } from 'convex/react'

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export function Providers({ children }: { children: ReactNode }) {
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
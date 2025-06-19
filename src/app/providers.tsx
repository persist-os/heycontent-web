'use client'

import { ReactNode } from 'react'
import { AuthProvider } from './context/auth-context'
import { SidebarProvider } from './context/sidebar-context'
import { NotesProvider } from './context/notes-context'
import { ConvexProvider, ConvexReactClient } from 'convex/react'

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ConvexProvider client={convex}>
      <AuthProvider>
        <SidebarProvider>
          <NotesProvider>
            {children}
          </NotesProvider>
        </SidebarProvider>
      </AuthProvider>
    </ConvexProvider>
  )
}
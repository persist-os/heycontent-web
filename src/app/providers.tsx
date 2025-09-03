 'use client'

import { ReactNode, useEffect, useState } from 'react'
import { ThemeProvider } from 'next-themes'
import { AuthProvider } from './context/auth-context'
import { SidebarProvider } from './context/sidebar-context'
import { NotesProvider } from './context/notes-context'
import { ConvexProvider, ConvexReactClient } from 'convex/react'
import { Button } from '@/components/ui/button'
import { getApiKey } from '@/app/lib/api-helpers'

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export function Providers({ children }: { children: ReactNode }) {
  const [limitExceeded, setLimitExceeded] = useState(false)
  const [limitInfo, setLimitInfo] = useState<{ included?: number; used?: number } | null>(null)

  // Global 402 interceptor across the entire app
  useEffect(() => {
    if (typeof window === 'undefined') return
    const originalFetch = window.fetch
    const patchedFetch: typeof window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const res = await originalFetch(input, init)
      try {
        if (res.status === 402) {
          let included: number | undefined
          let used: number | undefined
          try {
            const cloned = res.clone()
            const data = await cloned.json()
            if (typeof (data as any)?.included === 'number') included = (data as any).included
            if (typeof (data as any)?.used === 'number') used = (data as any).used
          } catch {}
          console.debug('[UsageLimit] Detected 402 from fetch', { url: typeof input === 'string' ? input : (input as URL).toString(), included, used })
          setLimitExceeded(true)
          setLimitInfo(prev => ({ included: included ?? prev?.included, used: used ?? prev?.used }))
        }
      } catch {}
      return res
    }
    window.fetch = patchedFetch
    return () => { window.fetch = originalFetch }
  }, [])

  // Initial ping: if already over limit, trigger modal immediately (no auto-redirect; let user choose)
  useEffect(() => {
    (async () => {
      try {
        const apiKey = await getApiKey()
        if (!apiKey) return
        const resp = await fetch('/api/subscription/usage', {
          headers: { Authorization: `Bearer ${apiKey}` },
        })
        if (resp.status === 402) {
          console.debug('[UsageLimit] Initial ping detected 402')
          setLimitExceeded(true)
          const inc = Number(resp.headers.get('X-Free-Tier-Limit') || NaN)
          const usd = Number(resp.headers.get('X-Free-Tier-Used') || NaN)
          setLimitInfo({ included: Number.isFinite(inc) ? inc : undefined, used: Number.isFinite(usd) ? usd : undefined })
        }
      } catch {}
    })()
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <ConvexProvider client={convex}>
        <AuthProvider>
          <SidebarProvider>
            <NotesProvider>
              {children}
              {limitExceeded && (
                <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="max-w-md w-full bg-background border border-border rounded-xl p-6 shadow-xl">
                    <h2 className="text-xl font-semibold mb-2">You've used your free requests</h2>
                    <p className="text-sm text-muted-foreground mb-4">
                      Your free tier limit has been reached{limitInfo?.included !== undefined && limitInfo?.used !== undefined ? ` (${limitInfo.used}/${limitInfo.included})` : ''}. Upgrade your plan to continue using HeyContent.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-end">
                      <Button
                        onClick={() => {
                          try { window.sessionStorage.setItem('settingsActiveTab', 'subscription') } catch {}
                          window.location.href = '/settings'
                        }}
                      >
                        Manage subscription
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </NotesProvider>
          </SidebarProvider>
        </AuthProvider>
      </ConvexProvider>
    </ThemeProvider>
  )
}
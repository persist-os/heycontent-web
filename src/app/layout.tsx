import React from 'react'
import type { Metadata } from 'next'
import './globals.css'
import { Providers } from './providers'
import { headers } from 'next/headers'
import { Toaster } from 'react-hot-toast'
import { CommandPaletteProvider } from './context/CommandPaletteProvider'
import { InlineReplyProvider } from './context/inline-reply-context'
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: 'HeyContent',
  description: 'AI-powered platform for content creators',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const isSignOut = headersList.get('x-signout')

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        {isSignOut && (
          <meta
            httpEquiv="Clear-Site-Data"
            content="cache, cookies, storage"
          />
        )}
      </head>
      <body className="font-sans min-h-screen">
        <Providers>
          <InlineReplyProvider>
            <CommandPaletteProvider>
              <Toaster position="top-center" />
              {children}
            </CommandPaletteProvider>
          </InlineReplyProvider>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}

import React from 'react'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { headers } from 'next/headers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'AVA OwnIt',
  description: 'AI-powered creator management platform',
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
        {isSignOut && (
          <meta
            httpEquiv="Clear-Site-Data"
            content='"cache", "cookies", "storage"'
          />
        )}
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}

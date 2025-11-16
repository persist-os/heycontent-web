import React from 'react'
import type { Metadata, Viewport } from 'next'
import Script from 'next/script'
import { DM_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { headers } from 'next/headers'
import { Toaster } from 'react-hot-toast'
import { InlineReplyProvider } from './context/inline-reply-context'
import { TiptapEditorProvider } from './context/tiptap-editor-context'
import { Analytics } from "@vercel/analytics/next"

// DM Sans font with all required weights (200, 400, 600)
const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['200', '400', '600'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const siteUrl = 'https://heycontext.co'
const siteName = 'HeyContext'
const siteDescription = 'Stop repeating yourself. AI-powered memory system that learns from every conversation, connects your thoughts automatically, and surfaces insights from your accumulated knowledge. Your personal AI that actually remembers and evolves with you.'

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' }
  ],
}

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'HeyContext - AI Memory That Evolves With You',
    template: '%s | HeyContext'
  },
  description: siteDescription,
  keywords: [
    'HeyContext',
    'hey context',
    'AI memory',
    'context aware AI',
    'evolving AI memory',
    'persistent AI memory',
    'AI that remembers',
    'connected thinking',
    'knowledge management',
    'personal AI assistant',
    'AI note taking',
    'automatic context',
    'background processing AI',
    'memory-first AI',
    'conversation memory',
    'accumulated knowledge',
    'AI insights',
    'pattern recognition AI',
    'thought organization',
    'intelligent note taking',
    'second brain',
    'digital memory',
    'cognitive AI',
    'contextual intelligence'
  ],
  authors: [{ name: 'HeyContext Team' }],
  creator: 'HeyContext',
  publisher: 'HeyContext',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteUrl,
    siteName,
    title: 'HeyContext - AI Memory That Evolves With You',
    description: 'Stop repeating yourself. Memory that grows with every conversation. Connections that form automatically. AI that finally works the way you think.',
    images: [
      // Note: dashboard-preview.png not yet created - will be added when available
      // {
      //   url: `${siteUrl}/dashboard-preview.png`,
      //   width: 1920,
      //   height: 1080,
      //   alt: 'HeyContext Dashboard - Your AI Memory Hub',
      // },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HeyContext - AI Memory That Evolves With You',
    description: 'Stop repeating yourself. AI-powered memory that learns from every conversation and connects your thoughts automatically.',
    // images: [`${siteUrl}/dashboard-preview.png`], // Commented out until image is created
    creator: '@heycontext',
    site: '@heycontext',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: [
      { url: '/favicon.ico' }
    ],
  },
  manifest: '/site.webmanifest',
  alternates: {
    canonical: siteUrl,
  },
  category: 'technology',
  classification: 'Productivity Software',
  other: {
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'HeyContext',
    'mobile-web-app-capable': 'yes',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const headersList = await headers()
  const isSignOut = headersList.get('x-signout')

  // Structured data for Organization and WebSite
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'HeyContext',
    url: siteUrl,
    logo: `${siteUrl}/hey-content-large-square.svg`,
    description: siteDescription,
    sameAs: [
      'https://twitter.com/heycontext',
      'https://linkedin.com/company/heycontext'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      availableLanguage: ['English']
    }
  }

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteName,
    url: siteUrl,
    description: siteDescription,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${siteUrl}/dashboard?search={search_term_string}`
      },
      'query-input': 'required name=search_term_string'
    }
  }

  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'HeyContext',
    operatingSystem: 'Web Browser, iOS, Android',
    applicationCategory: 'ProductivityApplication',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD'
    },
    description: siteDescription
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {isSignOut && (
          <meta
            httpEquiv="Clear-Site-Data"
            content="cache, cookies, storage"
          />
        )}
        
        {/* Advanced Performance Optimizations */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://apis.google.com" />
        <link rel="dns-prefetch" href="https://js.stripe.com" />
        <link rel="preconnect" href="https://va.vercel-scripts.com" />
        
        {/* Canonical URL */}
        <link rel="canonical" href={siteUrl} />
        
        {/* Favicon links with cache-busting - browsers cache favicons aggressively */}
        <link rel="icon" type="image/x-icon" href="/favicon.ico?v=2" />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg?v=2" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png?v=2" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=2" />
        {/* Legacy iOS Safari - some browsers auto-request this */}
        <link rel="apple-touch-icon-precomposed" sizes="180x180" href="/apple-touch-icon.png?v=2" />
        
        {/* Additional SEO Meta Tags */}
        <meta name="theme-color" content="#3b82f6" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="HeyContext" />
        <meta name="application-name" content="HeyContext" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Entity and Knowledge Graph Signals */}
        <meta property="og:site_name" content="HeyContext" />
        <meta property="og:locale" content="en_US" />
        <meta name="twitter:site" content="@heycontext" />
        <meta name="twitter:creator" content="@heycontext" />
        
        {/* AI Search Optimization Tags */}
        <meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        <meta name="bingbot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />
        
        {/* Language and Regional Targeting */}
        <meta httpEquiv="content-language" content="en-US" />
        <link rel="alternate" hrefLang="en" href={siteUrl} />
        <link rel="alternate" hrefLang="x-default" href={siteUrl} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
        />
      </head>
      
      {/* Google Tag Manager */}
      <Script
        src="https://www.googletagmanager.com/gtag/js?id=AW-17670765753"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'AW-17670765753');
        `}
      </Script>
      <body className={`${dmSans.variable} font-sans min-h-screen`}>
        <Providers>
          <InlineReplyProvider>
            <TiptapEditorProvider>
              <Toaster position="top-center" />
              {children}
            </TiptapEditorProvider>
          </InlineReplyProvider>
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}

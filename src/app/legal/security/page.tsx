import React from 'react'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Security & Cookie Policy - HeyContext',
  description: 'Learn about HeyContext security measures and cookie policy. We use minimal tracking, prioritize your data protection, and maintain transparent security practices.',
  keywords: [
    'HeyContext security',
    'data security',
    'cookie policy',
    'data protection',
    'secure AI platform',
    'privacy controls'
  ],
  openGraph: {
    title: 'Security & Cookie Policy - HeyContext',
    description: 'Transparent security practices and minimal cookie usage for your privacy.',
    type: 'website',
    url: 'https://heycontext.co/legal/security',
  },
  alternates: {
    canonical: 'https://heycontext.co/legal/security',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Security() {
  return (
    <div className="max-w-none">
      {/* Header Navigation */}
      <nav className="mb-12">
        <Link 
          href="/" 
          className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>
      </nav>

      {/* Document Header */}
      <header className="mb-16 border-b border-border pb-8">
        <h1 className="text-5xl font-light text-foreground mb-4 tracking-tight">
          Security Policy
        </h1>
        <p className="text-lg text-muted-foreground">
          Last updated: {new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </p>
      </header>

      {/* Document Content */}
      <article className="space-y-12 text-foreground leading-relaxed">
        {/* Data Protection Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">
            Data Protection
          </h2>
          <p className="text-lg leading-8">
            We take reasonable steps to protect your data and maintain the integrity of HeyContext. Only authorized personnel may access your data for support or technical reasons. No system is completely secure, and we cannot guarantee absolute security.
          </p>
        </section>

        {/* Platform Connections Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">
            Platform Connections
          </h2>
          <p className="text-lg leading-8">
            When you connect your Google account for authentication, we use official APIs and protocols. You can disconnect integrations at any time from your account settings.
          </p>
        </section>

        {/* Data Access Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">
            Data Access
          </h2>
          <ul className="space-y-3 ml-6">
            <li className="flex items-start">
              <span className="w-2 h-2 bg-muted-foreground rounded-full mt-2.5 mr-3 flex-shrink-0"></span>
              You control your account and data within HeyContext.
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-muted-foreground rounded-full mt-2.5 mr-3 flex-shrink-0"></span>
              Our team may access your data only as needed for support or technical troubleshooting.
            </li>
            <li className="flex items-start">
              <span className="w-2 h-2 bg-muted-foreground rounded-full mt-2.5 mr-3 flex-shrink-0"></span>
              We do not guarantee the security of data transmitted over the internet.
            </li>
          </ul>
        </section>

        {/* Cookie Policy Section */}
        <section className="space-y-6 border-t border-border pt-12">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">Cookie Policy</h2>
          <p>
            This Cookie Policy explains how Divertissement AI, Inc. ("Company," "we," "us," and "our") uses cookies and similar technologies to recognize you when you visit our website at <a href="https://www.heycontext.co" className="text-blue-600 dark:text-blue-400 hover:underline">https://www.heycontext.co</a> ("Website"). It explains what these technologies are and why we use them, as well as your rights to control our use of them.
          </p>
          <p>
            In some cases we may use cookies to collect personal information, or that becomes personal information if we combine it with other information.
          </p>
          <h3 className="text-xl font-medium text-foreground mt-8">What are cookies?</h3>
          <p>
            Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.
          </p>
          <h3 className="text-xl font-medium text-foreground mt-8">What cookies do we use?</h3>
          <p>
            We only use cookies that are strictly necessary for authentication and security. We do <span className="font-semibold">not</span> use cookies for analytics, advertising, or tracking your behavior.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-[300px] mt-2 mb-6 border border-border text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="px-4 py-2 border-b border-border text-left font-semibold">Name</th>
                  <th className="px-4 py-2 border-b border-border text-left font-semibold">Provider</th>
                  <th className="px-4 py-2 border-b border-border text-left font-semibold">Type</th>
                  <th className="px-4 py-2 border-b border-border text-left font-semibold">Purpose</th>
                  <th className="px-4 py-2 border-b border-border text-left font-semibold">Expires in</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border-b border-border">firebase-auth-token</td>
                  <td className="px-4 py-2 border-b border-border">www.heycontext.co</td>
                  <td className="px-4 py-2 border-b border-border">First-party cookie</td>
                  <td className="px-4 py-2 border-b border-border">Used to keep you signed in and authenticate your session securely.</td>
                  <td className="px-4 py-2 border-b border-border">1 week or until logout</td>
                </tr>
              </tbody>
            </table>
          </div>
          <h3 className="text-xl font-medium text-foreground mt-8">What about localStorage?</h3>
          <p>
            We use your browser's <span className="font-semibold">localStorage</span> to remember your sidebar state (open or closed) for a better user experience. This is not a cookie and is never sent to our servers or shared with third parties.
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-[300px] mt-2 mb-6 border border-border text-sm">
              <thead>
                <tr className="bg-muted">
                  <th className="px-4 py-2 border-b border-border text-left font-semibold">Key</th>
                  <th className="px-4 py-2 border-b border-border text-left font-semibold">Type</th>
                  <th className="px-4 py-2 border-b border-border text-left font-semibold">Purpose</th>
                  <th className="px-4 py-2 border-b border-border text-left font-semibold">Expires in</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="px-4 py-2 border-b border-border">heycontext-sidebar-state</td>
                  <td className="px-4 py-2 border-b border-border">localStorage</td>
                  <td className="px-4 py-2 border-b border-border">Remembers if your sidebar is open or closed.</td>
                  <td className="px-4 py-2 border-b border-border">Persistent (until you clear your browser storage)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <h3 className="text-xl font-medium text-foreground mt-8">How can I control cookies?</h3>
          <p>
            You have the right to decide whether to accept or reject cookies. You can set your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept our authentication cookie, you may not be able to use some parts of HeyContext.
          </p>
          <h3 className="text-xl font-medium text-foreground mt-8">Other tracking technologies</h3>
          <p>
            We do not use web beacons, Flash cookies, or other tracking technologies for analytics or advertising. If this changes, we will update this policy and notify you.
          </p>
        </section>

        {/* Contact Section */}
        <section className="space-y-6 border-t border-border pt-12">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">
            Contact Information
          </h2>
          <div className="space-y-4">
            <p className="text-lg leading-8">
              Last updated: {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
            <p className="leading-7">
              For security-related inquiries, contact us at{' '}
              <a 
                href="mailto:hello@divertissement.ai" 
                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors underline"
              >
                hello@divertissement.ai
              </a>.
            </p>
          </div>
        </section>
      </article>
    </div>
  );
} 
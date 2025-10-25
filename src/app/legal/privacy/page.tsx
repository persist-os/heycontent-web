import React from 'react'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy - HeyContext',
  description: 'HeyContext Privacy Policy. We never sell your data, use it for advertising, or share it with third parties. Zero data sharing, zero external access, zero compromise on your personal privacy.',
  keywords: [
    'HeyContext privacy',
    'data privacy',
    'secure AI',
    'private conversations',
    'data protection',
    'GDPR compliance',
    'privacy policy'
  ],
  openGraph: {
    title: 'Privacy Policy - HeyContext',
    description: 'Learn how HeyContext protects your privacy. We never sell your data or use it for advertising.',
    type: 'website',
    url: 'https://heycontext.co/legal/privacy',
  },
  alternates: {
    canonical: 'https://heycontext.co/legal/privacy',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Privacy() {
  return (
    <div className="max-w-none">
      {/* Google API Limited Use Disclosure */}
      <div className="mb-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 rounded-r-md">
        <p className="text-base text-yellow-800 dark:text-yellow-200 font-semibold">
          HeyContext's use and transfer of information received from Google APIs to any other app will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noopener noreferrer" className="underline text-yellow-900 dark:text-yellow-100 hover:text-yellow-700 dark:hover:text-yellow-300">Google API Services User Data Policy</a>, including the Limited Use requirements.
        </p>
      </div>
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
          Privacy Policy
        </h1>
        <p className="text-lg text-muted-foreground">
          Last updated: October 25, 2025
        </p>
        <p className="mt-4 text-base text-foreground">
          This Privacy Policy describes how PersistOS ("we", "us", or "our") collects, uses, and discloses your information when you use HeyContext. It also explains your privacy rights and how the law protects you. By using HeyContext, you agree to the collection and use of information in accordance with this Privacy Policy.
        </p>
        {/* Explicit clarity for Chrome Web Store compliance */}
        <section className="mt-8 space-y-4">
          <h2 className="text-2xl font-semibold text-foreground">No Sale or Unrelated Transfer of Data</h2>
          <p className="text-base text-foreground">
            We do <strong>not</strong> sell, rent, or transfer your personal data to third parties for advertising, marketing, or any unrelated purposes. All data is used solely to provide HeyContext's features and services to you, maintaining complete privacy and personal control over your conversations and thoughts.
          </p>
          <h2 className="text-2xl font-semibold text-foreground">No Ads or Ad Targeting</h2>
          <p className="text-base text-foreground">
            We do <strong>not</strong> serve ads on our platform, nor do we use your data for ad targeting or monetization. Your data is never used for advertising purposes.
          </p>
        </section>
      </header>

      <article className="space-y-12 text-foreground leading-relaxed">
        {/* Interpretation and Definitions */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">Interpretation and Definitions</h2>
          <h3 className="text-xl font-medium text-foreground">Interpretation</h3>
          <p>The words with initial capital letters have meanings defined below. These definitions apply regardless of whether they appear in singular or plural.</p>
          <h3 className="text-xl font-medium text-foreground">Definitions</h3>
          <ul className="space-y-2 ml-6">
            <li><strong>Account</strong>: A unique account created for you to access HeyContext.</li>
            <li><strong>Company</strong>: PersistOS ("we", "us", or "our").</li>
            <li><strong>Cookies</strong>: Small files placed on your device by a website, containing details of your browsing history and preferences.</li>
            <li><strong>Country</strong>: California, United States.</li>
            <li><strong>Device</strong>: Any device that can access HeyContext, such as a computer, phone, or tablet.</li>
            <li><strong>Personal Data</strong>: Any information that relates to an identified or identifiable individual.</li>
            <li><strong>Service</strong>: The HeyContext website and platform.</li>
            <li><strong>Service Provider</strong>: Any natural or legal person who processes data on behalf of the Company, including third-party companies or individuals who help provide or analyze the Service.</li>
            <li><strong>Third-party Social Media Service</strong>: Any website or social network through which a user can log in or create an account to use HeyContext (e.g., Google).</li>
            <li><strong>Usage Data</strong>: Data collected automatically, either generated by the use of HeyContext or from the platform infrastructure itself (e.g., duration of a page visit).</li>
            <li><strong>Website</strong>: HeyContext, accessible from <a href="https://www.heycontext.co/" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">https://www.heycontext.co/</a></li>
            <li><strong>You</strong>: The individual accessing or using HeyContext, or the company or other legal entity on behalf of which such individual is accessing or using HeyContext, as applicable.</li>
          </ul>
        </section>

        {/* Collecting and Using Your Personal Data */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">Collecting and Using Your Personal Data</h2>
          <h3 className="text-xl font-medium text-foreground">Types of Data Collected</h3>
          <h4 className="text-lg font-medium text-foreground">Personal Data</h4>
          <p>We may ask you to provide certain personally identifiable information that can be used to contact or identify you. This may include, but is not limited to:</p>
          <ul className="space-y-2 ml-6">
            <li>Email address</li>
            <li>First and last name</li>
            <li>Profile information</li>
            <li>Usage Data</li>
          </ul>
          <h4 className="text-lg font-medium text-foreground">Usage Data</h4>
          <p>Usage Data is collected automatically when using HeyContext. This may include information such as your device's IP address, browser type, browser version, the pages you visit, the time and date of your visit, time spent on those pages, unique device identifiers, and other diagnostic data.</p>
          <h4 className="text-lg font-medium text-foreground">Information from Third-Party Social Media Services</h4>
          <p>HeyContext allows you to connect your account to Google for authentication. If you choose to connect, we may collect information associated with those accounts, such as your name and email address, as permitted by your settings and Google's policies.</p>
          <h4 className="text-lg font-medium text-foreground">Cookies and Tracking Technologies</h4>
          <p>We use cookies and similar tracking technologies to track activity on HeyContext and store certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some parts of HeyContext. For more information, see our <Link href="/legal/security" className="text-blue-600 dark:text-blue-400 hover:underline">Cookie Policy</Link>.</p>
        </section>

        {/* Use of Your Personal Data */}
        <section className="space-y-6">
          <h3 className="text-xl font-medium text-foreground">How We Use Your Personal Data</h3>
          <ul className="space-y-2 ml-6">
            <li>To provide and maintain HeyContext, including to monitor usage and improve the Service.</li>
            <li>To manage your account and provide you with access to features.</li>
            <li>To contact you with updates or information related to HeyContent.</li>
            <li>To provide you with personalized AI responses that learn from your conversations.</li>
            <li>To facilitate secure authentication with Google, with your consent.</li>
            <li>To comply with legal obligations.</li>
          </ul>
        </section>

        {/* Sharing Your Personal Data */}
        <section className="space-y-6">
          <h3 className="text-xl font-medium text-foreground">Sharing Your Personal Data</h3>
          <ul className="space-y-2 ml-6">
            <li>With service providers who help us operate and improve HeyContext.</li>
            <li>We do not share your personal data with business partners or third parties for marketing purposes.</li>
            <li>For legal reasons, if required by law or to protect the rights and safety of HeyContext or others.</li>
            <li>With your consent, for any other purpose disclosed to you at the time of collection.</li>
          </ul>
        </section>

        {/* Retention of Your Personal Data */}
        <section className="space-y-6">
          <h3 className="text-xl font-medium text-foreground">Retention of Your Personal Data</h3>
          <p>We retain your personal data only as long as necessary for the purposes set out in this Privacy Policy, or as required by law. You may request deletion of your data at any time by deleting your account or contacting us.</p>
        </section>

        {/* Transfer of Your Personal Data */}
        <section className="space-y-6">
          <h3 className="text-xl font-medium text-foreground">Transfer of Your Personal Data</h3>
          <p>Your information may be processed and stored in countries other than your own. By using HeyContext, you consent to such transfers. We take reasonable steps to ensure your data is treated securely and in accordance with this Privacy Policy.</p>
        </section>

        {/* Data Security */}
        <section className="space-y-6">
          <h3 className="text-xl font-medium text-foreground">Data Security</h3>
          <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-400 p-4 rounded-r-md">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-green-700 dark:text-green-200 font-medium">
                  Security procedures are in place to protect the confidentiality of your data. We implement industry-standard security measures to safeguard your personal information against unauthorized access, alteration, or destruction.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Delete Your Personal Data */}
        <section className="space-y-6">
          <h3 className="text-xl font-medium text-foreground">Delete Your Personal Data</h3>
          <p>You may delete your account and associated data at any time from within HeyContext. We may retain certain information as required by law or for legitimate business purposes.</p>
        </section>

        {/* Children's Privacy */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">Children's Privacy</h2>
          <p>HeyContext is not intended for anyone under the age of 13. We do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal data, please contact us and we will take steps to remove that information.</p>
        </section>

        {/* Links to Other Websites */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">Links to Other Websites</h2>
          <p>HeyContext may contain links to other websites not operated by us. We are not responsible for the content or privacy practices of those sites. We encourage you to review the privacy policy of every site you visit.</p>
        </section>

        {/* Changes to this Privacy Policy */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">Changes to this Privacy Policy</h2>
          <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.</p>
        </section>

        {/* YouTube API & Google Privacy Policy Section */}
        <section className="space-y-6 border-t border-border pt-12">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">Third-Party API Services</h2>
          
          <h3 className="text-xl font-medium text-foreground">Google API Services</h3>
          <p>
            Our application uses Google API Services for authentication. By using HeyContext, you are also agreeing to be bound by the <a href="https://www.google.com/policies/privacy" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Google Privacy Policy</a>.
          </p>
          
          <p>
            <strong>Data Deletion and Revoking Access:</strong> You can revoke this application's access to your Google data at any time via the <a href="https://security.google.com/settings/" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Google security settings page</a>. If you wish to delete any data stored by our app, please delete your account from the settings page and <strong>all your data will be permanently deleted</strong>.
          </p>
        </section>

        {/* Contact Section */}
        <section className="space-y-6 border-t border-border pt-12">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">Contact Us</h2>
          <p>If you have any questions about this Privacy Policy, you can contact us at <a href="mailto:hello@persistos.com" className="text-blue-600 dark:text-blue-400 hover:underline">hello@persistos.com</a>.</p>
        </section>
      </article>
    </div>
  );
} 
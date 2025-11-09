import React from 'react'
import Link from 'next/link'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service - HeyContext',
  description: 'HeyContext Terms of Service. Legal terms governing your use of our AI-powered memory platform. Privacy-first, user-focused terms for a transparent relationship.',
  keywords: [
    'HeyContext terms',
    'terms of service',
    'user agreement',
    'legal terms',
    'service agreement'
  ],
  openGraph: {
    title: 'Terms of Service - HeyContext',
    description: 'Legal terms governing your use of HeyContext AI memory platform.',
    type: 'website',
    url: 'https://heycontext.co/legal/terms',
  },
  alternates: {
    canonical: 'https://heycontext.co/legal/terms',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function Terms() {
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
          Terms of Service
        </h1>
        <p className="text-lg text-muted-foreground">
          Last updated: October 25, 2025
        </p>
      </header>

      <article className="space-y-12 text-foreground leading-relaxed">
        {/* Agreement Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">Agreement to Our Legal Terms</h2>
          <p>
            These Terms of Service ("Terms") constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you"), and PersistOS ("Company," "we," "us," or "our"), concerning your access to and use of the HeyContext website (<a href="https://www.heycontext.co" className="text-blue-600 dark:text-blue-400 hover:underline">https://www.heycontext.co</a>) and any related products and services that refer or link to these Terms (collectively, the "Services").
          </p>
          <p>
            By accessing or using the Services, you agree that you have read, understood, and agree to be bound by all of these Terms. IF YOU DO NOT AGREE WITH ALL OF THESE TERMS, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SERVICES AND YOU MUST DISCONTINUE USE IMMEDIATELY.
          </p>
          <p>
            <strong>Google Terms of Service:</strong> Our Services use Google API Services for authentication. By using HeyContext, you also agree to be bound by the <a href="https://policies.google.com/terms" className="text-blue-600 dark:text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">Google Terms of Service</a>.
          </p>
          <p>

          </p>
          <p>
            We may update these Terms from time to time. We will alert you about any changes by updating the "Last updated" date at the top of these Terms. It is your responsibility to review these Terms periodically. Your continued use of the Services after any changes constitutes your acceptance of those changes.
          </p>
          <p>
            The Services are intended for users who are at least 18 years old. Persons under the age of 18 are not permitted to use or register for the Services.
          </p>
          <p>
            You can contact us by email at <a href="mailto:hello@persistos.co" className="text-blue-600 dark:text-blue-400 hover:underline">hello@persistos.co</a>.
          </p>
        </section>

        {/* Table of Contents */}
        <section className="space-y-2">
          <h2 className="text-2xl font-medium text-foreground">Table of Contents</h2>
          <ol className="list-decimal ml-8 space-y-1">
            <li>Our Services</li>
            <li>Intellectual Property Rights</li>
            <li>User Representations</li>
            <li>User Registration</li>
            <li>Purchases and Payment</li>
            <li>Subscriptions</li>
            <li>Prohibited Activities</li>
            <li>User Generated Contributions</li>
            <li>Contribution License</li>
            <li>Social Media</li>
            <li>Third-Party Websites and Content</li>
            <li>Services Management</li>
            <li>Privacy Policy</li>
            <li>Term and Termination</li>
            <li>Modifications and Interruptions</li>
            <li>Governing Law</li>
            <li>Dispute Resolution</li>
            <li>Corrections</li>
            <li>Disclaimer</li>
            <li>Limitations of Liability</li>
            <li>Indemnification</li>
            <li>User Data</li>
            <li>Electronic Communications, Transactions, and Signatures</li>
            <li>California Users and Residents</li>
            <li>Miscellaneous</li>
            <li>Contact Us</li>
          </ol>
        </section>

        {/* 1. Our Services */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-foreground">1. Our Services</h2>
          <p>
            HeyContext is an AI-powered platform that remembers you privately, providing thoughtfully designed intelligence that learns from every conversation and builds understanding over time. Our platform uses Firebase for authentication and Convex for secure data storage. The Services are not intended for use in any jurisdiction or country where such use would be contrary to law or regulation.
          </p>
          <p>
            The Services are not tailored to comply with industry-specific regulations (such as HIPAA or FISMA). If your interactions would be subject to such laws, you may not use the Services.
          </p>
        </section>

        {/* 2. Intellectual Property Rights */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-foreground">2. Intellectual Property Rights</h2>
          <p>
            HeyContext and its licensors own all rights to the platform, including the software, website design, branding, and all related intellectual property. These are protected by copyright, trademark, and other applicable laws.
          </p>
          <p>
            You retain all rights to the content you create using our Services. You are free to use, publish, and monetize your own content without restriction from us.
          </p>
          <p>
            You may reference or promote HeyContext in connection with your own work, provided you do not misrepresent your relationship with us or use our branding in a misleading or unlawful way. Any use of HeyContext's platform, software, or branding beyond these purposes requires our express written permission.
          </p>
        </section>

        {/* 3. User Representations */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-foreground">3. User Representations</h2>
          <p>
            By using the Services, you represent and warrant that all registration information you submit is true and accurate, you have the legal capacity to agree to these Terms, and you will not use the Services for any unlawful or unauthorized purpose.
          </p>
        </section>

        {/* 4. User Registration */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-foreground">4. User Registration</h2>
          <p>
            You may be required to register to use the Services. You agree to keep your password confidential and are responsible for all use of your account. We reserve the right to remove or change a username if we determine it is inappropriate.
          </p>
        </section>

        {/* 5. Purchases and Payment */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-foreground">5. Purchases and Payment</h2>
          <p>
            We use Stripe to process payments. You agree to provide current, complete, and accurate purchase and account information for all purchases made via the Services. All payments are in US dollars. We reserve the right to refuse or cancel orders at our discretion.
          </p>
        </section>

        {/* 6. Subscriptions */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-foreground">6. Subscriptions</h2>
          <p>
            Your subscription will continue and automatically renew unless canceled. You can cancel your subscription at any time from your account. All purchases are non-refundable. We may change subscription fees and will communicate any changes as required by law.
          </p>
        </section>

        {/* 7. Prohibited Activities */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-foreground">7. Prohibited Activities</h2>
          <p>
            You may not use the Services for any unlawful purpose or in any way that could harm us or other users. Prohibited activities include, but are not limited to: attempting to gain unauthorized access, interfering with the Services, using automated systems to access the Services, or using the Services for any commercial purpose not expressly permitted by us.
          </p>
        </section>

        {/* 8. User Generated Contributions */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-foreground">8. User Generated Contributions</h2>
          <p>
            The Services may allow you to submit content, such as comments or feedback. You are responsible for your contributions and must have the necessary rights to submit them. We may remove or edit any contributions at our discretion.
          </p>
        </section>

        {/* 9. Contribution License */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-foreground">9. Contribution License</h2>
          <p>
            By posting contributions, you grant us a worldwide, royalty-free license to use, reproduce, and display your contributions in connection with the Services. You retain ownership of your contributions.
          </p>
        </section>

        {/* 10. Social Media */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-foreground">10. Social Media</h2>
          <p>
            You may link your account with Google for authentication purposes. We are not responsible for the content or practices of these third-party services. Your use of third-party integrations is subject to their terms and privacy policies.
          </p>
        </section>

        {/* 11. Third-Party Websites and Content */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-foreground">11. Third-Party Websites and Content</h2>
          <p>
            The Services may contain links to third-party websites or content. We are not responsible for the content, accuracy, or practices of any third-party websites or content.
          </p>
        </section>

        {/* 12. Services Management */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-foreground">12. Services Management</h2>
          <p>
            We reserve the right to monitor the Services for violations of these Terms and to take appropriate action, including removing content or disabling accounts.
          </p>
        </section>

        {/* 13. Privacy Policy */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-foreground">13. Privacy Policy</h2>
          <p>
            We care about your privacy and data security. Please review our <Link href="/legal/privacy" className="text-blue-600 dark:text-blue-400 hover:underline">Privacy Policy</Link>. By using the Services, you agree to be bound by our Privacy Policy.
          </p>
        </section>

        {/* 14. Term and Termination */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-foreground">14. Term and Termination</h2>
          <p>
            These Terms remain in effect while you use the Services. We may suspend or terminate your access at any time for any reason, including violation of these Terms.
          </p>
        </section>

        {/* 15. Modifications and Interruptions */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-foreground">15. Modifications and Interruptions</h2>
          <p>
            We may change, suspend, or discontinue the Services at any time without notice. We are not liable for any loss or inconvenience caused by your inability to access the Services.
          </p>
        </section>

        {/* 16. Governing Law */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-foreground">16. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of California, without regard to conflict of law principles.
          </p>
        </section>

        {/* 17. Dispute Resolution */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-foreground">17. Dispute Resolution</h2>
          <p>
            If you have a dispute with us, please contact us first to try to resolve it informally. Any disputes arising from these Terms will be resolved in the state or federal courts located in California, unless otherwise required by law.
          </p>
        </section>

        {/* 18. Corrections */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-foreground">18. Corrections</h2>
          <p>
            We reserve the right to correct any errors or omissions in the Services at any time without notice.
          </p>
        </section>

        {/* 19. Disclaimer */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-foreground">19. Disclaimer</h2>
          <p>
            The Services are provided "as is" and "as available." We disclaim all warranties, express or implied, to the fullest extent permitted by law.
          </p>
        </section>

        {/* 20. Limitations of Liability */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-foreground">20. Limitations of Liability</h2>
          <p>
            To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, or consequential damages arising from your use of the Services.
          </p>
        </section>

        {/* 21. Indemnification */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-foreground">21. Indemnification</h2>
          <p>
            You agree to defend, indemnify, and hold us harmless from any claims arising from your violation of these Terms or your use of the Services.
          </p>
        </section>

        {/* 22. User Data */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-foreground">22. User Data</h2>
          <p>
            We will maintain certain data that you transmit to the Services for the purpose of managing your account. You are responsible for all activity that occurs under your account.
          </p>
        </section>

        {/* 23. Electronic Communications, Transactions, and Signatures */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-foreground">23. Electronic Communications, Transactions, and Signatures</h2>
          <p>
            Visiting our Services, sending us emails, and completing online forms constitute electronic communications. You consent to receive electronic communications from us.
          </p>
        </section>

        {/* 24. California Users and Residents */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-foreground">24. California Users and Residents</h2>
          <p>
            If any complaint with us is not satisfactorily resolved, you can contact the Complaint Assistance Unit of the Division of Consumer Services of the California Department of Consumer Affairs.
          </p>
        </section>

        {/* 25. Miscellaneous */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-foreground">25. Miscellaneous</h2>
          <p>
            These Terms constitute the entire agreement between you and us regarding use of the Services. Our failure to exercise any right or provision of these Terms shall not operate as a waiver of such right or provision.
          </p>
        </section>

        {/* 26. Contact Us */}
        <section className="space-y-6 border-t border-border pt-12">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">Contact Us</h2>
          <p>
            If you have any questions or concerns about these Terms, please contact us at <a href="mailto:hello@persistos.co" className="text-blue-600 dark:text-blue-400 hover:underline">hello@persistos.co</a>.
          </p>
        </section>
      </article>
    </div>
  );
} 
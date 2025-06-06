import React from 'react'
import Link from 'next/link'

export default function Terms() {
  return (
    <div className="max-w-none">
      {/* Header Navigation */}
      <nav className="mb-12">
        <Link 
          href="/" 
          className="inline-flex items-center text-gray-600 hover:text-gray-900 transition-colors duration-200 font-medium"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Home
        </Link>
      </nav>

      {/* Document Header */}
      <header className="mb-16 border-b border-gray-200 pb-8">
        <h1 className="text-5xl font-light text-gray-900 mb-4 tracking-tight">
          Terms of Service
        </h1>
        <p className="text-lg text-gray-600">
          Last updated: June 06, 2025
        </p>
      </header>

      <article className="space-y-12 text-gray-800 leading-relaxed">
        {/* Agreement Section */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-gray-900 border-b border-gray-100 pb-3">Agreement to Our Legal Terms</h2>
          <p>
            These Terms of Service ("Terms") constitute a legally binding agreement made between you, whether personally or on behalf of an entity ("you"), and Divertissement AI, Inc. ("Company," "we," "us," or "our"), concerning your access to and use of the HeyContent website (<a href="https://www.heycontent.co" className="text-blue-600 hover:underline">https://www.heycontent.co</a>) and any related products and services that refer or link to these Terms (collectively, the "Services").
          </p>
          <p>
            By accessing or using the Services, you agree that you have read, understood, and agree to be bound by all of these Terms. IF YOU DO NOT AGREE WITH ALL OF THESE TERMS, THEN YOU ARE EXPRESSLY PROHIBITED FROM USING THE SERVICES AND YOU MUST DISCONTINUE USE IMMEDIATELY.
          </p>
          <p>
            We may update these Terms from time to time. We will alert you about any changes by updating the "Last updated" date at the top of these Terms. It is your responsibility to review these Terms periodically. Your continued use of the Services after any changes constitutes your acceptance of those changes.
          </p>
          <p>
            The Services are intended for users who are at least 18 years old. Persons under the age of 18 are not permitted to use or register for the Services.
          </p>
          <p>
            You can contact us by email at <a href="mailto:hello@divertissement.ai" className="text-blue-600 hover:underline">hello@divertissement.ai</a>.
          </p>
        </section>

        {/* Table of Contents */}
        <section className="space-y-2">
          <h2 className="text-2xl font-medium text-gray-900">Table of Contents</h2>
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
          <h2 className="text-2xl font-medium text-gray-900">1. Our Services</h2>
          <p>
            HeyContent is an AI-powered platform for content creators, providing tools for content creation, analytics, and collaboration. Our platform integrates with YouTube, Instagram, Gmail, and Google to help you analyze and manage your content. We use Stripe for payments, Convex for database operations, and Firebase for authentication. The Services are not intended for use in any jurisdiction or country where such use would be contrary to law or regulation.
          </p>
          <p>
            The Services are not tailored to comply with industry-specific regulations (such as HIPAA or FISMA). If your interactions would be subject to such laws, you may not use the Services.
          </p>
        </section>

        {/* 2. Intellectual Property Rights */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-gray-900">2. Intellectual Property Rights</h2>
          <p>
            HeyContent and its licensors own all rights to the platform, including the software, website design, branding, and all related intellectual property. These are protected by copyright, trademark, and other applicable laws.
          </p>
          <p>
            You retain all rights to the content you create using our Services. You are free to use, publish, and monetize your own content without restriction from us.
          </p>
          <p>
            You may reference or promote HeyContent in connection with your own work, provided you do not misrepresent your relationship with us or use our branding in a misleading or unlawful way. Any use of HeyContent's platform, software, or branding beyond these purposes requires our express written permission.
          </p>
        </section>

        {/* 3. User Representations */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-gray-900">3. User Representations</h2>
          <p>
            By using the Services, you represent and warrant that all registration information you submit is true and accurate, you have the legal capacity to agree to these Terms, and you will not use the Services for any unlawful or unauthorized purpose.
          </p>
        </section>

        {/* 4. User Registration */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-gray-900">4. User Registration</h2>
          <p>
            You may be required to register to use the Services. You agree to keep your password confidential and are responsible for all use of your account. We reserve the right to remove or change a username if we determine it is inappropriate.
          </p>
        </section>

        {/* 5. Purchases and Payment */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-gray-900">5. Purchases and Payment</h2>
          <p>
            We use Stripe to process payments. You agree to provide current, complete, and accurate purchase and account information for all purchases made via the Services. All payments are in US dollars. We reserve the right to refuse or cancel orders at our discretion.
          </p>
        </section>

        {/* 6. Subscriptions */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-gray-900">6. Subscriptions</h2>
          <p>
            Your subscription will continue and automatically renew unless canceled. You can cancel your subscription at any time from your account. All purchases are non-refundable. We may change subscription fees and will communicate any changes as required by law.
          </p>
        </section>

        {/* 7. Prohibited Activities */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-gray-900">7. Prohibited Activities</h2>
          <p>
            You may not use the Services for any unlawful purpose or in any way that could harm us or other users. Prohibited activities include, but are not limited to: attempting to gain unauthorized access, interfering with the Services, using automated systems to access the Services, or using the Services for any commercial purpose not expressly permitted by us.
          </p>
        </section>

        {/* 8. User Generated Contributions */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-gray-900">8. User Generated Contributions</h2>
          <p>
            The Services may allow you to submit content, such as comments or feedback. You are responsible for your contributions and must have the necessary rights to submit them. We may remove or edit any contributions at our discretion.
          </p>
        </section>

        {/* 9. Contribution License */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-gray-900">9. Contribution License</h2>
          <p>
            By posting contributions, you grant us a worldwide, royalty-free license to use, reproduce, and display your contributions in connection with the Services. You retain ownership of your contributions.
          </p>
        </section>

        {/* 10. Social Media */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-gray-900">10. Social Media</h2>
          <p>
            You may link your account with third-party services such as Google, YouTube, Instagram, and Gmail. We are not responsible for the content or practices of these third-party services. Your use of third-party integrations is subject to their terms and privacy policies.
          </p>
        </section>

        {/* 11. Third-Party Websites and Content */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-gray-900">11. Third-Party Websites and Content</h2>
          <p>
            The Services may contain links to third-party websites or content. We are not responsible for the content, accuracy, or practices of any third-party websites or content.
          </p>
        </section>

        {/* 12. Services Management */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-gray-900">12. Services Management</h2>
          <p>
            We reserve the right to monitor the Services for violations of these Terms and to take appropriate action, including removing content or disabling accounts.
          </p>
        </section>

        {/* 13. Privacy Policy */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-gray-900">13. Privacy Policy</h2>
          <p>
            We care about your privacy and data security. Please review our <Link href="/legal/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>. By using the Services, you agree to be bound by our Privacy Policy.
          </p>
        </section>

        {/* 14. Term and Termination */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-gray-900">14. Term and Termination</h2>
          <p>
            These Terms remain in effect while you use the Services. We may suspend or terminate your access at any time for any reason, including violation of these Terms.
          </p>
        </section>

        {/* 15. Modifications and Interruptions */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-gray-900">15. Modifications and Interruptions</h2>
          <p>
            We may change, suspend, or discontinue the Services at any time without notice. We are not liable for any loss or inconvenience caused by your inability to access the Services.
          </p>
        </section>

        {/* 16. Governing Law */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-gray-900">16. Governing Law</h2>
          <p>
            These Terms are governed by the laws of the State of California, without regard to conflict of law principles.
          </p>
        </section>

        {/* 17. Dispute Resolution */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-gray-900">17. Dispute Resolution</h2>
          <p>
            If you have a dispute with us, please contact us first to try to resolve it informally. Any disputes arising from these Terms will be resolved in the state or federal courts located in California, unless otherwise required by law.
          </p>
        </section>

        {/* 18. Corrections */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-gray-900">18. Corrections</h2>
          <p>
            We reserve the right to correct any errors or omissions in the Services at any time without notice.
          </p>
        </section>

        {/* 19. Disclaimer */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-gray-900">19. Disclaimer</h2>
          <p>
            The Services are provided "as is" and "as available." We disclaim all warranties, express or implied, to the fullest extent permitted by law.
          </p>
        </section>

        {/* 20. Limitations of Liability */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-gray-900">20. Limitations of Liability</h2>
          <p>
            To the fullest extent permitted by law, we are not liable for any indirect, incidental, or consequential damages arising from your use of the Services.
          </p>
        </section>

        {/* 21. Indemnification */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-gray-900">21. Indemnification</h2>
          <p>
            You agree to indemnify and hold us harmless from any claims, damages, or expenses arising from your use of the Services or your violation of these Terms.
          </p>
        </section>

        {/* 22. User Data */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-gray-900">22. User Data</h2>
          <p>
            We may maintain certain data you transmit to the Services for the purpose of managing the Services. You are responsible for all data you provide.
          </p>
        </section>

        {/* 23. Electronic Communications, Transactions, and Signatures */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-gray-900">23. Electronic Communications, Transactions, and Signatures</h2>
          <p>
            By using the Services, you consent to receive electronic communications from us and agree that electronic agreements, notices, and records satisfy any legal requirements for written communication.
          </p>
        </section>

        {/* 24. California Users and Residents */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-gray-900">24. California Users and Residents</h2>
          <p>
            If you are a California resident and have a complaint, you may contact the Complaint Assistance Unit of the Division of Consumer Services of the California Department of Consumer Affairs.
          </p>
        </section>

        {/* 25. Miscellaneous */}
        <section className="space-y-4">
          <h2 className="text-2xl font-medium text-gray-900">25. Miscellaneous</h2>
          <p>
            These Terms constitute the entire agreement between you and us regarding the Services. If any provision is found to be unlawful or unenforceable, the remaining provisions will remain in effect.
          </p>
        </section>

        {/* 26. Contact Us */}
        <section className="space-y-4 border-t border-gray-200 pt-12">
          <h2 className="text-2xl font-medium text-gray-900">26. Contact Us</h2>
          <p>
            If you have any questions or concerns about these Terms, please contact us at <a href="mailto:hello@divertissement.ai" className="text-blue-600 hover:underline">hello@divertissement.ai</a>.
          </p>
        </section>
      </article>
    </div>
  );
} 
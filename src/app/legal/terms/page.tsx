import React from 'react'
import Link from 'next/link';

export default function Terms() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <nav className="mb-8">
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          ← Back to Home
        </Link>
      </nav>

      <article className="prose prose-gray max-w-none">
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last Updated: December 7, 2024</p>
        
        <div className="mb-12">
          <p className="mb-8">
            Thank you for choosing HeyContent. These Terms of Service ("Terms") constitute a legally binding agreement between 
            you and HeyContent, Inc. ("HeyContent," "we," "our," or "us") governing your use of our AI-powered analytics platform, 
            including all associated websites, services, and applications (collectively, the "Services").
          </p>
        </div>

        {/* Core Services */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">1. Understanding Our Services</h2>
          <p>
            HeyContent provides an artificial intelligence-powered platform designed to help content creators and influencers 
            optimize their online presence. Our Services analyze data from your connected platforms to provide insights, 
            recommendations, and growth strategies.
          </p>
        </section>

        {/* Account & Registration */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">2. Registration and Account Access</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium mb-3">Age Requirements and Eligibility</h3>
              <p>
                You must be at least 13 years old to use our Services. If you are under 18 years of age, you must obtain 
                verifiable consent from a parent or legal guardian before using our Services.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3">Account Creation and Security</h3>
              <p>
                When registering for an account, you must provide accurate, current, and complete information. You are 
                responsible for maintaining the confidentiality of your account credentials.
              </p>
            </div>
          </div>
        </section>

        {/* Platform Integration */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">3. Platform Integration and Data Processing</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium mb-3">Connected Platforms</h3>
              <p className="mb-4">Our Services integrate with various third-party platforms to provide comprehensive analytics and insights:</p>
              <ul className="list-disc pl-6 space-y-3">
                <li>
                  <span className="font-medium">Google Workspace & Microsoft Outlook:</span> Email communications and calendar data analysis
                </li>
                <li>
                  <span className="font-medium">YouTube:</span> Channel metrics, video performance, and audience engagement analysis
                </li>
                <li>
                  <span className="font-medium">Instagram:</span> Post performance, story analytics, and audience demographics
                </li>
                <li>
                  <span className="font-medium">TikTok:</span> Video metrics, engagement rates, and trend analysis
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Data Rights and Controls */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">4. Your Rights and Controls</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium mb-3">Data Control and Access</h3>
              <p className="mb-4">You maintain full control over your connected platform data. At any time, you may:</p>
              <ul className="list-disc pl-6 space-y-3">
                <li>
                  <span className="font-medium">Manage Platform Connections:</span> Connect or disconnect any integrated platform through your account settings
                </li>
                <li>
                  <span className="font-medium">Access Your Data:</span> Request a comprehensive export of all data we have collected
                </li>
                <li>
                  <span className="font-medium">Modify Permissions:</span> Adjust the scope of data access through your account settings
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3">Data Deletion Rights</h3>
              <p className="mb-4">You have multiple options for requesting data deletion:</p>
              <ul className="list-disc pl-6 space-y-3">
                <li>Platform-Specific Deletion through respective platform settings</li>
                <li>Complete Account Deletion with 30-day data removal</li>
                <li>Selective Data Deletion while maintaining your account</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Intellectual Property */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property Rights</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium mb-3">Our Property</h3>
              <p>
                The HeyContent platform, including all software, algorithms, designs, analytics systems, and related 
                technologies, are owned by HeyContent. Nothing in these Terms transfers ownership of our intellectual 
                property to you.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3">Your Content</h3>
              <p>
                You retain all rights to your original content and data. By using our Services, you grant us a limited 
                license to access, analyze, and process this information solely to provide and improve our Services.
              </p>
            </div>
          </div>
        </section>

        {/* Service Reliability */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">6. Service Reliability and Modifications</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium mb-3">Service Availability</h3>
              <p>
                While we strive for consistent service availability, we do not guarantee uninterrupted access. 
                Temporary interruptions may occur due to maintenance, updates, or factors beyond our control.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3">Platform Evolution</h3>
              <p>
                We continuously improve our Services and may add, modify, or remove features. We will notify you 
                of significant changes that might affect your use of the Services.
              </p>
            </div>
          </div>
        </section>

        {/* Payment Terms */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">7. Payment Terms</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium mb-3">Subscription and Fees</h3>
              <p>
                Our Services are provided on a subscription basis. Fees are billed according to your selected plan 
                and are non-refundable, except as required by law.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3">Price Changes</h3>
              <p>
                We may modify our pricing with thirty (30) days notice. Changes will take effect on your next 
                billing cycle. You may cancel your subscription before new prices take effect.
              </p>
            </div>
          </div>
        </section>

        {/* Account Termination */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">8. Account Termination</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium mb-3">Termination by Users</h3>
              <p>
                You may terminate your account at any time. Upon termination, we will process the deletion of your 
                data as outlined in our Privacy Policy.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3">Termination by HeyContent</h3>
              <p className="mb-4">We reserve the right to suspend or terminate your access if:</p>
              <ul className="list-disc pl-6 space-y-3">
                <li>You violate these Terms or our platform policies</li>
                <li>We are required to do so by law</li>
                <li>Your account has been inactive for over 12 months</li>
                <li>You fail to pay applicable fees after notice</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Dispute Resolution */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">9. Dispute Resolution</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium mb-3">Initial Resolution</h3>
              <p>
                If you have any concerns or disputes, please contact us first at legal@heycontent.com. We will work 
                in good faith to resolve any issues directly with you.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3">Arbitration Agreement</h3>
              <p>
                Any unresolved dispute shall be resolved through binding arbitration, conducted by the American 
                Arbitration Association under its Commercial Arbitration Rules in San Francisco, California.
              </p>
            </div>
          </div>
        </section>

        {/* Final Provisions */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">10. General Provisions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium mb-3">Governing Law</h3>
              <p>
                These Terms are governed by the laws of the State of California, without regard to its conflict 
                of law principles.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3">Changes to Terms</h3>
              <p>
                We may update these Terms to reflect changes in our Services or legal requirements. We will 
                provide at least 30 days' notice of material changes through our website or email.
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-16 pt-8 border-t border-gray-200">
          <p className="text-gray-600 text-sm">
            For questions about these Terms of Service, please contact us at{' '}
            <a href="mailto:hello@divertissement.ai" className="text-blue-600 hover:text-blue-800">
              hello@divertissement.ai
            </a>
          </p>
        </footer>
      </article>
    </div>
  );
} 
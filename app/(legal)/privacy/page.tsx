import React from 'react'
import Link from 'next/link'

export default function Privacy() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <nav className="mb-8">
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          ← Back to Home
        </Link>
      </nav>

      <article className="prose prose-gray max-w-none">
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last Updated: December 7, 2024</p>
        
        <div className="mb-12">
          <p className="mb-8">
            At HeyContent, Inc. ("HeyContent," "we," "our," or "us"), we understand the importance of your privacy and the 
            trust you place in us when sharing your information. This Privacy Policy explains how we collect, use, protect, 
            and handle your personal information when you use our AI-powered analytics platform and related services 
            (collectively, the "Services").
          </p>
        </div>

        {/* Information Collection */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">1. Information Collection and Processing</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium mb-3">Platform Integration Data</h3>
              <p className="mb-4">
                Our Services are designed to help you optimize your online presence by analyzing data from various 
                platforms you choose to connect. Here's how we handle data from each integrated platform:
              </p>
              <ul className="list-disc pl-6 space-y-4">
                <li>
                  <span className="font-medium">Google Workspace Integration:</span> We access and process your email 
                  communications, calendar events, and related metadata. This includes sender and recipient information, 
                  timestamps, subject lines, and other relevant data points that help us analyze your professional 
                  relationships and communication patterns.
                </li>
                <li>
                  <span className="font-medium">Microsoft Outlook Integration:</span> Similar to Google Workspace, we 
                  process your Outlook email communications and calendar data. This includes email metadata, meeting 
                  schedules, and communication patterns.
                </li>
                <li>
                  <span className="font-medium">YouTube Integration:</span> We process channel analytics, video 
                  performance metrics, and audience engagement data. This includes view counts, watch time, audience 
                  retention rates, demographic information, and engagement metrics.
                </li>
                <li>
                  <span className="font-medium">Instagram Integration:</span> We process your post performance metrics, 
                  story analytics, audience demographics, and engagement data.
                </li>
                <li>
                  <span className="font-medium">TikTok Integration:</span> We analyze video performance metrics, 
                  engagement rates, follower growth, and audience interaction patterns.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3">How We Use Your Information</h3>
              <ul className="list-disc pl-6 space-y-3">
                <li>
                  <span className="font-medium">Service Improvement and AI Training:</span> We may use your data to 
                  improve our Services and train our AI models. You can opt out at any time through your account settings.
                </li>
                <li>
                  <span className="font-medium">Performance Analytics:</span> We analyze your content performance across 
                  all connected platforms to identify patterns, trends, and opportunities for improvement.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Data Protection */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">2. Data Protection and Security</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium mb-3">Security Measures</h3>
              <ul className="list-disc pl-6 space-y-3">
                <li>
                  <span className="font-medium">Storage Protection:</span> All data is encrypted both in transit and at 
                  rest using industry-standard encryption protocols.
                </li>
                <li>
                  <span className="font-medium">Access Controls:</span> We limit access to authorized personnel who need 
                  it to provide our Services.
                </li>
                <li>
                  <span className="font-medium">Regular Audits:</span> We conduct regular security audits and 
                  vulnerability assessments.
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Platform-Specific Data Handling */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">3. Platform-Specific Data Handling</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium mb-3">Data Retention and Deletion</h3>
              <p className="mb-4">Each integrated platform has specific requirements for data handling and deletion:</p>
              <ul className="list-disc pl-6 space-y-4">
                <li>
                  <span className="font-medium">Google Workspace:</span> We maintain detailed logs of all data access 
                  and processing. When you request deletion, we remove all email analysis data, communication patterns, 
                  and derived insights within 30 days.
                </li>
                <li>
                  <span className="font-medium">Microsoft Outlook:</span> We process and store email analytics and 
                  communication pattern data in compliance with Microsoft's enterprise security requirements. Data 
                  deletion requests are processed within 30 days.
                </li>
                <li>
                  <span className="font-medium">YouTube:</span> Content analysis data is stored securely and updated 
                  continuously while your account is active. Upon deletion request, we remove all YouTube-specific 
                  data and derived analytics within 30 days.
                </li>
                <li>
                  <span className="font-medium">Instagram & TikTok:</span> Performance data and engagement metrics 
                  are continuously updated and stored while your account is connected. Deletion requests result in 
                  the complete removal of all related data and derived insights.
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3">Cross-Platform Analytics</h3>
              <p>
                When you connect multiple platforms, we may combine data across platforms to provide comprehensive 
                insights. This cross-platform analysis helps identify broader patterns and opportunities but requires 
                additional privacy protections. We maintain strict data segregation between platforms while allowing 
                for aggregate analysis.
              </p>
            </div>
          </div>
        </section>

        {/* User Rights and Controls */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">4. User Rights and Controls</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium mb-3">Data Access Rights</h3>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 space-y-3">
                <li>Request a comprehensive copy of all your data stored in our systems</li>
                <li>Receive an explanation of how your data is being used for analytics and insights</li>
                <li>Access a detailed log of all AI-powered analysis performed on your data</li>
                <li>Export your data in machine-readable formats</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3">Control Over AI Training</h3>
              <p className="mb-4">Our AI systems learn from platform data to improve recommendations and insights. You have granular control over how your data contributes to this process:</p>
              <ul className="list-disc pl-6 space-y-3">
                <li>Choose whether your data can be used for AI model training</li>
                <li>Select specific types of data that can be used for training</li>
                <li>Opt out of AI training while maintaining full service functionality</li>
                <li>Receive transparency reports about how your data influences our AI systems</li>
              </ul>
            </div>
          </div>
        </section>

        {/* International Data Transfers */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">5. International Data Transfers</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium mb-3">Data Processing Locations</h3>
              <p>
                HeyContent processes and stores data in secure facilities located in the United States. When you use our 
                Services from outside the United States, your information may be transferred to, stored, and processed 
                in the United States or other countries where our service providers maintain facilities.
              </p>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3">International Data Protection</h3>
              <p className="mb-4">We ensure appropriate safeguards for international data transfers through:</p>
              <ul className="list-disc pl-6 space-y-3">
                <li>Standard contractual clauses approved by relevant data protection authorities</li>
                <li>Data processing agreements with our service providers</li>
                <li>Compliance with regional data protection requirements</li>
                <li>Regular audits of our data protection measures</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Children's Privacy */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">6. Children's Privacy and Protection</h2>
          
          <div>
            <h3 className="text-xl font-medium mb-3">Age Restrictions</h3>
            <p>
              Our Services are not directed to children under 13 years of age. We do not knowingly collect personal 
              information from children under 13. If we learn that we have collected personal information from a child 
              under 13, we will promptly delete such information.
            </p>
          </div>
        </section>

        {/* Data Retention */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">7. Data Retention and Deletion</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium mb-3">Retention Periods</h3>
              <p className="mb-4">
                We retain your information for as long as necessary to provide our Services and fulfill the purposes 
                outlined in this Privacy Policy. Specific retention periods vary based on:
              </p>
              <ul className="list-disc pl-6 space-y-3">
                <li>Type of information</li>
                <li>Purpose of processing</li>
                <li>Legal requirements</li>
                <li>Platform-specific requirements</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3">Deletion Procedures</h3>
              <p className="mb-4">When you request data deletion, we:</p>
              <ul className="list-disc pl-6 space-y-3">
                <li>Initiate deletion within 24 hours of request</li>
                <li>Complete deletion within 30 days</li>
                <li>Provide confirmation of deletion</li>
                <li>Remove data from all active systems</li>
                <li>Ensure deletion from backup systems within 90 days</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Updates to Policy */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">8. Updates to Privacy Policy</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium mb-3">Policy Changes</h3>
              <p className="mb-4">We may update this Privacy Policy to reflect:</p>
              <ul className="list-disc pl-6 space-y-3">
                <li>Changes in our practices</li>
                <li>New features or services</li>
                <li>Legal requirements</li>
                <li>Security updates</li>
              </ul>
            </div>

            <div>
              <h3 className="text-xl font-medium mb-3">Notice Period</h3>
              <p>
                Material changes will be communicated at least 30 days before implementation, giving you time to 
                review and consider the changes.
              </p>
            </div>
          </div>
        </section>

        <footer className="mt-16 pt-8 border-t border-gray-200">
          <p className="text-gray-600 text-sm">
            For questions about this Privacy Policy, please contact us at{' '}
            <a href="mailto:hello@divertissement.ai" className="text-blue-600 hover:text-blue-800">
              hello@divertissement.ai
            </a>
          </p>
        </footer>
      </article>
    </div>
  );
} 
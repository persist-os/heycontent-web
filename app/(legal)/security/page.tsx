import React from 'react'
import Link from 'next/link'

export default function Security() {
  return (
    <div className="prose prose-gray max-w-none">
      <nav className="mb-8">
        <Link href="/" className="text-blue-600 hover:text-blue-800">
          ← Back to Home
        </Link>
      </nav>
      
      <h1>Security Policy</h1>

      <section>
        <h2>Data Protection</h2>
        <p>
          Your security is our priority. We implement industry-standard measures to protect your data:
        </p>
        <ul>
          <li>Encrypted data transmission (SSL/TLS)</li>
          <li>Secure OAuth for platform connections</li>
          <li>Regular security updates and monitoring</li>
          <li>Access controls and authentication</li>
        </ul>
      </section>

      <section>
        <h2>Platform Connections</h2>
        <p>
          When connecting social media accounts:
        </p>
        <ul>
          <li>We use official APIs and OAuth protocols</li>
          <li>Your credentials are never stored</li>
          <li>You can revoke access at any time</li>
          <li>Access tokens are encrypted</li>
        </ul>
      </section>

      <section>
        <h2>Data Access</h2>
        <ul>
          <li>Only you can access your account data</li>
          <li>Our AI processes data securely</li>
          <li>No data sharing with third parties</li>
          <li>Regular access audits and monitoring</li>
        </ul>
      </section>

      <footer className="mt-12 text-sm text-gray-500">
        Last updated: {new Date().toLocaleDateString()}
      </footer>
    </div>
  );
} 
import React from 'react';
import Link from 'next/link';

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
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
          About HeyContent
        </h1>
        <p className="text-lg text-gray-600">
          Last updated: June 06, 2025
        </p>
      </header>

      <article className="space-y-12 text-gray-800 leading-relaxed">
        {/* Platform Overview */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-gray-900 border-b border-gray-100 pb-3">What is HeyContent?</h2>
          <p>
            HeyContent is an AI-powered platform designed for creators, brands, and digital teams who want to elevate their content strategy and audience engagement. We provide advanced tools for content creation, analytics, and workflow optimization, all in one place.
          </p>
          <p>
            Our platform integrates directly with YouTube, Instagram, Gmail, and Google, allowing you to analyze your content performance, manage your digital presence, and gain actionable insights. We use Stripe for secure payments, Convex for fast and reliable database operations, and Firebase for authentication and account management.
          </p>
        </section>

        {/* Mission and Vision */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-gray-900 border-b border-gray-100 pb-3">Our Mission</h2>
          <p>
            Our mission is to empower creators and brands to make smarter, data-driven decisions and grow their digital presence. We believe in democratizing access to high-quality content strategy and analytics, making it possible for anyone to compete and thrive online.
          </p>
        </section>

        {/* What You Can Do with HeyContent */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-gray-900 border-b border-gray-100 pb-3">What You Can Do</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Connect your YouTube, Instagram, and Gmail accounts to centralize your content analytics and communications.</li>
            <li>Analyze your content performance across platforms with AI-powered insights and recommendations.</li>
            <li>Receive personalized suggestions for content strategy, timing, and audience engagement.</li>
            <li>Collaborate with your team or brand partners using shared analytics and content planning tools.</li>
            <li>Manage your subscription and payments securely through Stripe.</li>
            <li>Maintain full ownership and control of your content and data.</li>
          </ul>
        </section>

        {/* How It Works */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-gray-900 border-b border-gray-100 pb-3">How It Works</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Sign up and authenticate securely with Firebase.</li>
            <li>Connect your social and email accounts (YouTube, Instagram, Gmail, Google) to unlock analytics and insights.</li>
            <li>Use our AI-driven dashboard to view performance metrics, content suggestions, and growth opportunities.</li>
            <li>Export or share insights with your team or collaborators.</li>
            <li>All your data is stored securely using Convex and is never sold or used for advertising.</li>
          </ul>
        </section>

        {/* Who We Serve */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-gray-900 border-b border-gray-100 pb-3">Who We Serve</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Individual creators looking to grow their audience and monetize their content.</li>
            <li>Brands and agencies seeking deeper insights into their digital campaigns and partnerships.</li>
            <li>Teams collaborating on content strategy and analytics.</li>
          </ul>
        </section>

        {/* Our Technology and Values */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-gray-900 border-b border-gray-100 pb-3">Our Technology & Values</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Proprietary AI models for content analysis, trend detection, and personalized recommendations.</li>
            <li>Direct integrations with YouTube, Instagram, Gmail, and Google for seamless data access.</li>
            <li>Secure authentication and user management with Firebase.</li>
            <li>Fast, reliable, and scalable data storage with Convex.</li>
            <li>Payments and subscriptions handled securely via Stripe.</li>
            <li>We do not sell your data or use it for advertising. Your privacy and control are core to our values.</li>
            <li>We are committed to strong privacy and data security practices, but no system is 100% secure.</li>
            <li>We believe creators should own and control their content and data.</li>
          </ul>
        </section>

        {/* Join Us Section */}
        <section className="space-y-6 border-t border-gray-200 pt-12">
          <h2 className="text-3xl font-medium text-gray-900 border-b border-gray-100 pb-3">Join HeyContent</h2>
          <p>
            Whether you're a creator, brand, or team, HeyContent is here to help you unlock your digital potential. Sign up today to experience the next generation of AI-powered content strategy and analytics.
          </p>
        </section>
      </article>
    </div>
  );
} 
import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About HeyContext - AI Memory That Remembers You Privately',
  description: 'Learn about HeyContext, the AI-powered platform that remembers you privately. Thoughtfully designed intelligence that learns from every conversation, builds understanding over time, and keeps everything completely yours.',
  keywords: [
    'about HeyContext',
    'AI memory platform',
    'private AI assistant',
    'personal AI that learns',
    'conversational AI',
    'secure AI platform',
    'privacy-first AI',
    'intelligent memory system'
  ],
  openGraph: {
    title: 'About HeyContext - AI Memory That Remembers You Privately',
    description: 'Discover how HeyContext creates a private space for thinking where your thoughts are connected across time, never lost, and always yours.',
    type: 'website',
    url: 'https://heycontext.co/about',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About HeyContext - AI Memory That Remembers You Privately',
    description: 'Discover how HeyContext creates a private space for thinking where your thoughts are connected across time.',
  },
  alternates: {
    canonical: 'https://heycontext.co/about',
  },
};

export default function About() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
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
          About HeyContext
        </h1>
        <p className="text-lg text-muted-foreground">
          Last updated: June 06, 2025
        </p>
      </header>

      <article className="space-y-12 text-foreground leading-relaxed">
        {/* Platform Overview */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">What is HeyContext?</h2>
          <p>
            HeyContext is an AI-powered platform that remembers you privately. We provide thoughtfully designed intelligence that learns from every conversation, builds understanding over time, and keeps everything completely yours.
          </p>
          <p>
            Our platform creates a private space for thinking where your thoughts are connected across time, never lost, and always yours. We prioritize privacy above all else, ensuring zero data sharing, zero external access, and zero compromise on your personal privacy.
          </p>
        </section>

        {/* Mission and Vision */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">Our Mission</h2>
          <p>
            Our mission is to create AI tools that remember you privately, providing thoughtfully designed intelligence that learns and grows with you while keeping everything completely secure and personal. We believe in empowering individuals with beautifully simple, deeply personal AI that respects your privacy.
          </p>
        </section>

        {/* What You Can Do with HeyContext */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">What You Can Do</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Have natural conversations that build understanding over time and remember your preferences.</li>
            <li>Organize scattered thoughts with AI that learns your thinking patterns and communication style.</li>
            <li>Get personalized responses that connect to your previous conversations and projects.</li>
            <li>Maintain complete privacy with zero data sharing or external access to your conversations.</li>
            <li>Experience beautifully simple, intuitively designed AI that feels natural from first use.</li>
            <li>Keep full ownership and control of all your thoughts, conversations, and personal data.</li>
          </ul>
        </section>

        {/* How It Works */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">How It Works</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Simply describe what you need in natural language to get started.</li>
            <li>AI learns your communication style and preferences through every interaction.</li>
            <li>Your thoughts and conversations are connected across time, building deeper understanding.</li>
            <li>Everything remains completely private with zero external sharing or data mining.</li>
            <li>All your conversations are stored securely and remain exclusively yours forever.</li>
          </ul>
        </section>

        {/* Who We Serve */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">Who We Serve</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Individuals who want AI that truly understands and remembers them personally.</li>
            <li>People seeking a private space for thinking and organizing their thoughts.</li>
            <li>Anyone who values privacy and wants AI that learns without compromising their personal data.</li>
          </ul>
        </section>

        {/* Our Technology and Values */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">Our Technology & Values</h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li>Proprietary AI models that learn your communication patterns and thinking style.</li>
            <li>Thoughtfully designed interface that feels natural and intuitive from first use.</li>
            <li>Secure authentication and user management with Firebase.</li>
            <li>Fast, reliable, and scalable data storage with Convex for your conversations.</li>
            <li>Zero data sharing, zero external access, zero compromise on your personal privacy.</li>
            <li>We never sell your data, use it for advertising, or share it with third parties.</li>
            <li>We are committed to strong privacy and data security practices, though no system is 100% secure.</li>
            <li>We believe individuals should own and control their thoughts, conversations, and personal data.</li>
          </ul>
        </section>

        {/* Join Us Section */}
        <section className="space-y-6 border-t border-border pt-12">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">Join HeyContext</h2>
          <p>
            Whether you're looking for a private thinking partner or AI that truly understands you, HeyContext is here to provide beautifully simple, deeply personal intelligence. Experience thoughtfully designed AI that remembers you privately and keeps everything completely yours.
          </p>
        </section>
      </article>
    </div>
  );
} 
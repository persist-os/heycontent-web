import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { T } from '@/components/translation';

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
          <T context="about.nav.backHome">Back to Home</T>
        </Link>
      </nav>

      {/* Document Header */}
      <header className="mb-16 border-b border-border pb-8">
        <h1 className="text-5xl font-light text-foreground mb-4 tracking-tight">
          <T context="about.header.title">About HeyContext</T>
        </h1>
        <p className="text-lg text-muted-foreground">
          <T context="about.header.lastUpdated">Last updated: June 06, 2025</T>
        </p>
      </header>

      <article className="space-y-12 text-foreground leading-relaxed">
        {/* Platform Overview */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">
            <T context="about.platform.heading">What is HeyContext?</T>
          </h2>
          <p>
            <T context="about.platform.description1">HeyContext is an AI-powered platform that remembers you privately. We provide thoughtfully designed intelligence that learns from every conversation, builds understanding over time, and keeps everything completely yours.</T>
          </p>
          <p>
            <T context="about.platform.description2">Our platform creates a private space for thinking where your thoughts are connected across time, never lost, and always yours. We prioritize privacy above all else, ensuring zero data sharing, zero external access, and zero compromise on your personal privacy.</T>
          </p>
        </section>

        {/* Mission and Vision */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">
            <T context="about.mission.heading">Our Mission</T>
          </h2>
          <p>
            <T context="about.mission.description">Our mission is to create AI tools that remember you privately, providing thoughtfully designed intelligence that learns and grows with you while keeping everything completely secure and personal. We believe in empowering individuals with beautifully simple, deeply personal AI that respects your privacy.</T>
          </p>
        </section>

        {/* What You Can Do with HeyContext */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">
            <T context="about.canDo.heading">What You Can Do</T>
          </h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li><T context="about.canDo.item1">Have natural conversations that build understanding over time and remember your preferences.</T></li>
            <li><T context="about.canDo.item2">Organize scattered thoughts with AI that learns your thinking patterns and communication style.</T></li>
            <li><T context="about.canDo.item3">Get personalized responses that connect to your previous conversations and projects.</T></li>
            <li><T context="about.canDo.item4">Maintain complete privacy with zero data sharing or external access to your conversations.</T></li>
            <li><T context="about.canDo.item5">Experience beautifully simple, intuitively designed AI that feels natural from first use.</T></li>
            <li><T context="about.canDo.item6">Keep full ownership and control of all your thoughts, conversations, and personal data.</T></li>
          </ul>
        </section>

        {/* How It Works */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">
            <T context="about.howItWorks.heading">How It Works</T>
          </h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li><T context="about.howItWorks.item1">Simply describe what you need in natural language to get started.</T></li>
            <li><T context="about.howItWorks.item2">AI learns your communication style and preferences through every interaction.</T></li>
            <li><T context="about.howItWorks.item3">Your thoughts and conversations are connected across time, building deeper understanding.</T></li>
            <li><T context="about.howItWorks.item4">Everything remains completely private with zero external sharing or data mining.</T></li>
            <li><T context="about.howItWorks.item5">All your conversations are stored securely and remain exclusively yours forever.</T></li>
          </ul>
        </section>

        {/* Who We Serve */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">
            <T context="about.whoWeServe.heading">Who We Serve</T>
          </h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li><T context="about.whoWeServe.item1">Individuals who want AI that truly understands and remembers them personally.</T></li>
            <li><T context="about.whoWeServe.item2">People seeking a private space for thinking and organizing their thoughts.</T></li>
            <li><T context="about.whoWeServe.item3">Anyone who values privacy and wants AI that learns without compromising their personal data.</T></li>
          </ul>
        </section>

        {/* Our Technology and Values */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">
            <T context="about.technology.heading">Our Technology & Values</T>
          </h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li><T context="about.technology.item1">Proprietary AI models that learn your communication patterns and thinking style.</T></li>
            <li><T context="about.technology.item2">Thoughtfully designed interface that feels natural and intuitive from first use.</T></li>
            <li><T context="about.technology.item3">Secure authentication and user management with Firebase.</T></li>
            <li><T context="about.technology.item4">Fast, reliable, and scalable data storage with Convex for your conversations.</T></li>
            <li><T context="about.technology.item5">Zero data sharing, zero external access, zero compromise on your personal privacy.</T></li>
            <li><T context="about.technology.item6">We never sell your data, use it for advertising, or share it with third parties.</T></li>
            <li><T context="about.technology.item7">We are committed to strong privacy and data security practices, though no system is 100% secure.</T></li>
            <li><T context="about.technology.item8">We believe individuals should own and control their thoughts, conversations, and personal data.</T></li>
          </ul>
        </section>

        {/* Join Us Section */}
        <section className="space-y-6 border-t border-border pt-12">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">
            <T context="about.join.heading">Join HeyContext</T>
          </h2>
          <p>
            <T context="about.join.description">Whether you're looking for a private thinking partner or AI that truly understands you, HeyContext is here to provide beautifully simple, deeply personal intelligence. Experience thoughtfully designed AI that remembers you privately and keeps everything completely yours.</T>
          </p>
        </section>
      </article>
    </div>
  );
} 
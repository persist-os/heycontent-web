import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { T } from '@/components/translation';

export const metadata: Metadata = {
  title: 'About HeyContext - Cosmic Intelligence That Evolves With You',
  description: 'Learn about HeyContext, the cosmic intelligence system that discovers patterns you never noticed. Living projects, crystal formation, and constellation thinking that evolves with your mind.',
  keywords: [
    'about HeyContext',
    'AI memory platform',
    'private AI assistant',
    'personal AI that learns',
    'conversational AI',
    'secure AI platform',
    'privacy-first AI',
    'intelligent memory system',
    'cosmic intelligence system',
    'living projects AI',
    'crystal formation insights',
    'constellation thinking',
    'pattern recognition AI',
    'shard extraction',
    'thinking lab memory'
  ],
  openGraph: {
    title: 'About HeyContext - Cosmic Intelligence That Evolves With You',
    description: 'Discover how HeyContext creates living constellations from your scattered thinking, forming crystals of insight that reveal patterns you never noticed about yourself.',
    type: 'website',
    url: 'https://heycontext.co/about',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About HeyContext - Cosmic Intelligence That Evolves With You',
    description: 'Cosmic intelligence that spots patterns in your scattered thinking and creates living constellations that evolve with your mind.',
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
          <T context="about.header.lastUpdated">Last updated: November 01, 2025</T>
        </p>
      </header>

      <article className="space-y-12 text-foreground leading-relaxed">
        {/* Cosmic Intelligence Overview */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">
            <T context="about.platform.heading">What is HeyContext?</T>
          </h2>
          <p>
            <T context="about.platform.description1">HeyContext is a cosmic intelligence system that discovers patterns you never noticed about yourself. We create living constellations from your scattered thinking, forming crystals of insight through shard extraction, and building understanding that evolves with your mind.</T>
          </p>
          <p>
            <T context="about.platform.description2">Our system transforms disconnected thoughts into living projects that grow and adapt. Through crystal formation and pattern recognition, we reveal the hidden connections in your thinking while keeping everything completely private and exclusively yours.</T>
          </p>
        </section>

        {/* Mission and Vision */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">
            <T context="about.mission.heading">Our Mission</T>
          </h2>
          <p>
            <T context="about.mission.description">Our mission is to create cosmic intelligence that helps you discover patterns in your scattered thinking. We build living constellations that evolve with your mind, forming crystals of insight that reveal who you are and how you think, while keeping everything completely secure and personal.</T>
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
            <li><T context="about.howItWorks.item1">Constellations: Create goals that evolve with AI-generated tools tailored to your working style.</T></li>
            <li><T context="about.howItWorks.item2">Thinking Lab: Have deep conversations that remember everything and connect ideas across time.</T></li>
            <li><T context="about.howItWorks.item3">Files: Write notes that automatically link to related content across all your work.</T></li>
            <li><T context="about.howItWorks.item4">Cosmic Intelligence: Watch insights crystallize from your patterns—stars for your concrete achievements, crystals for your consciousness and thinking patterns.</T></li>
            <li><T context="about.howItWorks.item5">Everything remains completely private with zero external sharing or data mining.</T></li>
          </ul>
          <p className="mt-6">
            <T context="about.howItWorks.compareLink">See how HeyContext's cosmic intelligence compares to ChatGPT, Claude, and others</T> →{' '}
            <Link href="/compare" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
              Compare AI Platforms
            </Link>
          </p>
        </section>

        {/* Who We Serve */}
        <section className="space-y-6">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">
            <T context="about.whoWeServe.heading">Who We Serve</T>
          </h2>
          <ul className="space-y-2 ml-6 list-disc">
            <li><T context="about.whoWeServe.item1">People drowning in scattered notes and disconnected thoughts who want AI that discovers patterns they never noticed.</T></li>
            <li><T context="about.whoWeServe.item2">Anyone tired of re-explaining context to AI over and over, seeking tools that remember why things mattered, not just what was said.</T></li>
            <li><T context="about.whoWeServe.item3">Individuals who value privacy and want cosmic intelligence that learns without compromising their personal data during insight discovery.</T></li>
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
          <p className="mt-6">
            <T context="about.technology.privacyLink">Learn how we protect your thoughts during crystal formation and pattern discovery</T> →{' '}
            <Link href="/legal/privacy" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
              Privacy Policy
            </Link>
          </p>
        </section>

        {/* Join Us Section */}
        <section className="space-y-6 border-t border-border pt-12">
          <h2 className="text-3xl font-medium text-foreground border-b border-border pb-3">
            <T context="about.join.heading">Join HeyContext</T>
          </h2>
          <p>
            <T context="about.join.description">Whether you're drowning in scattered thinking or seeking AI that discovers patterns you never noticed, HeyContext is here to provide cosmic intelligence that evolves with your mind. Experience living constellations, crystal formation, and pattern recognition that keeps everything completely yours.</T>
          </p>
        </section>
      </article>
    </div>
  );
} 
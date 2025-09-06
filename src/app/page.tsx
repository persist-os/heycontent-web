'use client'

console.log('[LandingPage] Module loaded');

import React from 'react'
import Head from 'next/head'
import { HeroSection } from '../components/ui/hero-section'
import { ValueCards } from '../components/ui/value-cards'
import { UIPreview } from '../components/ui/ui-preview'
import { WhyItWorks } from '../components/ui/why-it-works'
import { Personas } from '../components/ui/personas'
import { PrivacyTrust } from '../components/ui/privacy-trust'
import { CTABand } from '../components/ui/cta-band'
import { FAQ } from '../components/ui/faq'
import Footer from '../components/ui/Footer'

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {"@type": "Question","name": "What makes HeyContext different from notes apps or AI chat?","acceptedAnswer": {"@type": "Answer","text": "Notes store text; chat answers prompts. HeyContext keeps projects alive via background agents that condense updates, flag contradictions, and prepare Since-You-Left bundles."}},
    {"@type": "Question","name": "What do I actually see in the app?","acceptedAnswer": {"@type": "Answer","text": "A Project Brief that updates itself, Since-You-Left bundles, Contradiction Flags, and a Because panel showing sources for every claim."}},
    {"@type": "Question","name": "Do I need to organize anything?","acceptedAnswer": {"@type": "Answer","text": "No. Drop notes and conversations into a project; the system structures and updates the brief for you."}},
    {"@type": "Question","name": "How is this private?","acceptedAnswer": {"@type": "Answer","text": "Local-first by default with explicit, itemized cloud calls. Every surfaced claim links to its source."}},
    {"@type": "Question","name": "Can I use it without being good at AI?","acceptedAnswer": {"@type": "Answer","text": "Yes. You don't have to prompt. The value shows up as ready-to-use outputs—briefs, bundles, and tasks."}},
    {"@type": "Question","name": "What's under the hood?","acceptedAnswer": {"@type": "Answer","text": "Async multi-agent orchestration and a Redis-powered working memory keep projects current without busywork."}},
    {"@type": "Question","name": "How do I start?","acceptedAnswer": {"@type": "Answer","text": "Create a project, paste your notes or links, and come back later to a refreshed brief and a Since-You-Left bundle."}}
  ]
}

export default function LandingPage() {
  console.log('[LandingPage] Function start');

  console.log('[LandingPage] Before render');

  return (
    <>
      <Head>
        <title>HeyContext - The AI Project Platform</title>
        <meta name="description" content="HeyContext turns every project into a living memory that summarizes, reconciles, and resurfaces work—so you don't have to. Projects that think in the background." />
        <meta name="keywords" content="AI project management, living memory, project briefs, async agents, context management" />
        <meta property="og:title" content="HeyContext - Projects that think in the background" />
        <meta property="og:description" content="Turn every project into a living memory that summarizes, reconciles, and resurfaces work automatically." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="HeyContext - The AI Project Platform" />
        <meta name="twitter:description" content="Projects that think in the background. Auto-updated briefs, since-you-left bundles, and contradiction flags." />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </Head>
      
      <div className="min-h-screen flex flex-col">
        <HeroSection />
        <ValueCards />
        <UIPreview />
        <WhyItWorks />
        <Personas />
        <PrivacyTrust />
        <CTABand />
        <FAQ />
        <Footer />
      </div>
    </>
  );
} 
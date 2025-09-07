'use client'

console.log('[LandingPage] Module loaded');

import React from 'react'
import Head from 'next/head'
import { HeroSection } from '../components/ui/hero-section'
import { ValueCards } from '../components/ui/value-cards'
import { AgentsShowcase } from '../components/ui/agents-showcase'
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
    {"@type": "Question","name": "What's available right now?","acceptedAnswer": {"@type": "Answer","text": "Advanced chat that remembers your conversations, smart notes that connect to your discussions, inline writing assistance that learns your style, and a personal AI that understands your preferences."}},
    {"@type": "Question","name": "What's the project platform you're building toward?","acceptedAnswer": {"@type": "Answer","text": "We're adding features that coordinate projects automatically: auto-generated briefs, team context sharing, contradiction detection, and intelligent task management."}},
    {"@type": "Question","name": "How is this different from ChatGPT or Claude?","acceptedAnswer": {"@type": "Answer","text": "Those tools start fresh every conversation. HeyContext builds understanding over time, connects ideas across conversations, and organizes itself around your actual work."}},
    {"@type": "Question","name": "Is this for teams or individuals?","acceptedAnswer": {"@type": "Answer","text": "Both. Right now, each person gets their own contextual AI. Soon, we're adding team features so project context can be shared seamlessly across 2-5 person teams."}},
    {"@type": "Question","name": "How do you handle privacy?","acceptedAnswer": {"@type": "Answer","text": "Your conversations stay private. We only use cloud AI services when you explicitly ask for help, and we show you exactly what's being processed."}},
    {"@type": "Question","name": "Do I need to be technical to use this?","acceptedAnswer": {"@type": "Answer","text": "Not at all. Just chat naturally and take notes. The AI organizes itself around your work style. No prompting required, no complex setup."}},
    {"@type": "Question","name": "How do I get started?","acceptedAnswer": {"@type": "Answer","text": "Sign up and start chatting about your work or projects. The AI will begin building context immediately."}}
  ]
}

export default function LandingPage() {
  console.log('[LandingPage] Function start');

  console.log('[LandingPage] Before render');

  return (
    <>
      <Head>
        <title>HeyContext - Building toward the AI Project Platform</title>
        <meta name="description" content="Advanced chat, smart notes, and writing assistance that understand your context. Building toward the AI project platform with team coordination and automated project management." />
        <meta name="keywords" content="contextual AI, smart notes, project coordination, team collaboration, AI assistant" />
        <meta property="og:title" content="HeyContext - Building toward the AI Project Platform" />
        <meta property="og:description" content="Advanced AI tools that build understanding over time. Start with contextual chat and notes, evolve toward full project coordination." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="HeyContext - Contextual AI for thoughtful work" />
        <meta name="twitter:description" content="AI that remembers your conversations, organizes your notes, and builds understanding over time." />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      </Head>
      
      <div className="min-h-screen flex flex-col snap-y snap-mandatory overflow-y-scroll scroll-smooth">
        <section className="snap-start snap-always">
          <HeroSection />
        </section>
        <section className="snap-start">
          <ValueCards />
        </section>
        <section className="snap-start">
          <AgentsShowcase />
        </section>
        <section className="snap-start">
          <WhyItWorks />
        </section>
        {/* <Personas /> */}
        {/* <PrivacyTrust /> */}
        <section className="snap-start">
          <CTABand />
        </section>
        <section className="snap-start">
          <FAQ />
        </section>
        <section className="snap-end">
          <Footer />
        </section>
      </div>

      <style jsx global>{`
        /* Enhanced mobile interactions */
        @media (max-width: 768px) {
          /* Improve scroll snap for mobile */
          .snap-y {
            scroll-snap-type: y proximity;
          }
          
          /* Better touch targets */
          .touch-manipulation {
            touch-action: manipulation;
            -webkit-tap-highlight-color: transparent;
          }
          
          /* Smooth momentum scrolling on iOS */
          * {
            -webkit-overflow-scrolling: touch;
          }
          
          /* Prevent zoom on inputs */
          input[type="text"],
          input[type="email"],
          input[type="password"],
          textarea {
            font-size: 16px !important;
          }
          
          /* Enhanced button feedback */
          button:active,
          .active\\:scale-95:active {
            transform: scale(0.95);
            transition: transform 0.1s ease;
          }
          
          /* Better hover states for touch */
          @media (hover: none) and (pointer: coarse) {
            .hover\\:scale-105:hover {
              transform: none;
            }
            
            .hover\\:bg-blue-50\\/30:hover {
              background-color: rgba(239, 246, 255, 0.3);
            }
            
            .hover\\:bg-slate-50\\/50:hover {
              background-color: rgba(248, 250, 252, 0.5);
            }
          }
          
          /* Improved scroll indicators */
          ::-webkit-scrollbar {
            width: 3px;
          }
          
          ::-webkit-scrollbar-track {
            background: transparent;
          }
          
          ::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.3);
            border-radius: 3px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: rgba(148, 163, 184, 0.5);
          }
        }
        
        /* Reduce motion for users who prefer it */
        @media (prefers-reduced-motion: reduce) {
          .animate-fade-in-up,
          .animate-pulse-slow,
          .animate-float,
          .animate-float-delayed,
          .animate-float-slow {
            animation: none;
          }
          
          .transition-all,
          .transition-transform,
          .transition-colors,
          .transition-opacity {
            transition: none;
          }
        }
        
        /* Enhanced focus states for accessibility */
        button:focus-visible,
        a:focus-visible,
        input:focus-visible,
        textarea:focus-visible {
          outline: 2px solid #3b82f6;
          outline-offset: 2px;
        }
      `}</style>
    </>
  );
} 
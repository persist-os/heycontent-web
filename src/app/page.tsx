'use client'

console.log('[LandingPage] Module loaded');

import React from 'react'
import Head from 'next/head'
import { HeroSection } from '../components/ui/hero-section'
import { ValueCards } from '../components/ui/value-cards'
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
    {"@type": "Question","name": "What's available right now?","acceptedAnswer": {"@type": "Answer","text": "Memory that accumulates and connects automatically. Every conversation you have, every note you write, feeds a system that spots patterns and surfaces insights. Chat that references what you said last month without prompting. Notes that link to related thinking across all your content. Active memory that processes and grows."}},
    {"@type": "Question","name": "Where is this headed?","acceptedAnswer": {"@type": "Answer","text": "Background processing that happens overnight. Contradictions spotted before you see them. Understanding that refines itself while you're away. Multiple forms of analysis running simultaneously—each one feeding insights to the others. Eventually: memory so deep it anticipates what you need before you ask."}},
    {"@type": "Question","name": "How is this different from ChatGPT or Claude?","acceptedAnswer": {"@type": "Answer","text": "They remember conversations. We extract understanding. ChatGPT and Claude: You upload a document, it stays exactly as uploaded. Static memory. This: Every interaction feeds background analysis. Connections form between old conversations and new ones. Memory that actively processes instead of passively storing."}},
    {"@type": "Question","name": "Who is this for?","acceptedAnswer": {"@type": "Answer","text": "Anyone drowning in scattered notes and disconnected thoughts. Anyone tired of re-explaining the same context to AI over and over. Anyone who wishes their tools remembered not just what they said, but why it mattered. If your work involves ideas that build over time, this was built for you."}},
    {"@type": "Question","name": "What about privacy?","acceptedAnswer": {"@type": "Answer","text": "Your conversations and notes stay yours. Period. We use cloud AI only when you explicitly ask for help. Nothing trains external models. Nothing gets shared or sold. Your thinking belongs to you."}},
    {"@type": "Question","name": "Is this complicated to use?","acceptedAnswer": {"@type": "Answer","text": "Talk about whatever you're working on. Write notes like you normally would. The system figures out what matters. No prompt engineering. No organizing. No setup rituals. Complicated under the hood. Dead simple in practice."}},
    {"@type": "Question","name": "How do I start?","acceptedAnswer": {"@type": "Answer","text": "Sign up. Start a conversation about your work. The memory begins building immediately. Every message adds context. Every note creates connections. Within days, you'll have an AI that knows your work better than any tool you've used."}}
  ]
}

export default function LandingPage() {
  console.log('[LandingPage] Function start');

  console.log('[LandingPage] Before render');

  return (
    <>
      <Head>
        <title>Stop Repeating Yourself - AI That Actually Learns You</title>
        <meta name="description" content="Memory that grows with every conversation. Connections that form automatically. Stop explaining context over and over. Start with AI that already knows how you think." />
        <meta name="keywords" content="AI memory that evolves, stop repeating yourself, connected thinking, permanent AI memory, context aware AI, background processing AI" />
        <meta property="og:title" content="Stop Repeating Yourself - AI That Actually Learns You" />
        <meta property="og:description" content="Memory that grows. Connections that form automatically. Patterns that emerge from your scattered thinking. AI that finally works the way you think." />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="AI That Actually Learns You" />
        <meta name="twitter:description" content="Memory that evolves. What you said last month connects to today. Your scattered notes reveal patterns. Stop explaining yourself over and over." />
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
          body input[type="text"],
          body input[type="email"],
          body input[type="password"],
          body textarea {
            font-size: 16px;
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
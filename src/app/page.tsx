import React from 'react'
import { Metadata } from 'next'
import { HeroSection } from '../components/ui/hero-section'
import { TheDifference } from '../components/ui/the-difference'
import { HotSauceProof } from '../components/ui/hot-sauce-proof'
import { WhyItWorks } from '../components/ui/why-it-works'
import { RealExamples } from '../components/ui/real-examples'
import { FAQ } from '../components/ui/faq'
import { TheBottomLine } from '../components/ui/the-bottom-line'
import { BlogSection } from '../components/ui/blog-section'
import Footer from '../components/ui/Footer'
import { siteConfig } from './metadata'
import { T } from '@/components/translation'

// Server-side metadata for SEO
export const metadata: Metadata = {
  title: 'System Generator | Complete Systems in 90 Seconds',
  description: 'HeyContext generates complete systems—not single responses. Coordinated agents create 3-4 interconnected artifacts: lists, reports, timelines, trackers, emails. From question to complete system in 90 seconds. Research papers, vacation plans, business projects—ready to use immediately.',
  keywords: [...siteConfig.keywords, 'system generator', 'complete systems', 'interconnected artifacts', 'coordinated agents', '90-second generation'],
  openGraph: {
    title: 'System Generator | Complete Systems in 90 Seconds',
    description: 'HeyContext generates complete systems—not single responses. Coordinated agents create 3-4 interconnected artifacts in 90 seconds. Research papers, vacation plans, business projects—ready to use immediately.',
    type: 'website',
    url: siteConfig.url,
    // images: [
    //   {
    //     url: `${siteConfig.url}/dashboard-preview.png`,
    //     width: 1920,
    //     height: 1080,
    //     alt: 'HeyContext - AI Platform Dashboard',
    //   },
    // ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'System Generator - Complete Systems in 90 Seconds',
    description: 'HeyContext generates complete systems—not single responses. Coordinated agents create 3-4 interconnected artifacts in 90 seconds. Research papers, vacation plans, business projects—ready to use immediately.',
    // images: [`${siteConfig.url}/dashboard-preview.png`], // Commented out until image is created
    creator: '@heycontext',
  },
  alternates: {
    canonical: siteConfig.url,
  },
};

// FAQ structured data for rich snippets
const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "What is a system generator?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "HeyContext generates complete systems—not single responses. Coordinated agents create 3-4 interconnected artifacts: lists, reports, timelines, trackers, emails. Research papers, vacation plans, business projects—from question to complete system in 90 seconds."
      }
    },
    {
      "@type": "Question",
      "name": "How does HeyContext create complete systems?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Coordinated agents create interconnected artifacts that reference each other. Reports cite analyses, emails align with calendars, budgets inform timelines. Complete systems from one request."
      }
    },
    {
      "@type": "Question",
      "name": "What are interconnected artifacts?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Structured deliverables that work together: lists, reports, timelines, trackers, emails. Unlike single documents, artifacts reference each other and form complete systems ready to use."
      }
    },
    {
      "@type": "Question",
      "name": "How fast is system generation?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Complete systems generated in 90 seconds. Research paper outlines, vacation itineraries, business plans, interview prep—all created instantly with interconnected artifacts."
      }
    },
    {
      "@type": "Question",
      "name": "Can teams collaborate on systems?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Yes. Share projects with collaborators. Multiple team members can edit the same artifacts simultaneously. Real-time coordination on interconnected systems."
      }
    },
    {
      "@type": "Question",
      "name": "How do I start?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Sign up, describe your need, get a complete system in 90 seconds. Research outline + key sources + timeline ready to use immediately."
      }
    }
  ]
};

// BreadcrumbList for better navigation understanding
const breadcrumbJsonLd = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": siteConfig.url
    }
  ]
};

// Advanced HowTo schema for AI search engines
const howToJsonLd = {
  "@context": "https://schema.org",
  "@type": "HowTo",
  "name": "How to Generate Complete Systems with HeyContext",
  "description": "Complete guide to generating interconnected systems in 90 seconds using coordinated agents",
  // "image": `${siteConfig.url}/dashboard-preview.png`, // Commented out until image is created
  "totalTime": "PT2M",
  "estimatedCost": {
    "@type": "MonetaryAmount",
    "currency": "USD",
    "value": "0"
  },
  "step": [
    {
      "@type": "HowToStep",
      "name": "Create Your Account",
      "text": "Sign up for HeyContext with your email or Google account. Setup takes less than 60 seconds.",
      "url": `${siteConfig.url}/auth/register`,
      "position": 1
    },
    {
      "@type": "HowToStep",
      "name": "Describe Your Need",
      "text": "Describe the system you need: 'Write my research paper' or 'Plan my vacation' or 'Launch my business'. Be specific about what you want to accomplish.",
      "position": 2
    },
    {
      "@type": "HowToStep",
      "name": "Agents Coordinate Automatically",
      "text": "Coordinated agents work together to create 3-4 interconnected artifacts. Reports reference analyses, emails align with calendars, budgets inform timelines.",
      "position": 3
    },
    {
      "@type": "HowToStep",
      "name": "Review Structured Artifacts",
      "text": "Review and edit your complete system. Research outline, vacation itinerary, business plan—all interconnected and ready to use immediately.",
      "position": 4
    }
  ]
};

// VideoObject schema for future video content
const videoJsonLd = {
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "HeyContext - AI Memory Platform Demo",
  "description": "See how HeyContext creates persistent AI memory that evolves with every conversation",
  // "thumbnailUrl": `${siteConfig.url}/dashboard-preview.png`, // Commented out until image is created
  "uploadDate": new Date().toISOString(),
  "duration": "PT2M30S",
  "contentUrl": `${siteConfig.url}`,
  "embedUrl": `${siteConfig.url}`
};

// Speakable schema for voice search optimization
const speakableJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "HeyContext - AI Memory That Evolves",
  "speakable": {
    "@type": "SpeakableSpecification",
    "cssSelector": [".hero-title", ".value-proposition", ".feature-highlight"]
  }
};

// Product schema
const productJsonLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "HeyContext - System Generator",
  "description": "System Generator—Complete Systems in 90 Seconds",
  "category": "System Generator",
  "brand": {
    "@type": "Brand",
    "name": "HeyContext"
  },
  "offers": {
    "@type": "Offer",
    "url": `${siteConfig.url}/auth/register`,
    "priceCurrency": "USD",
    "price": "0",
    "priceValidUntil": "2026-12-31",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "HeyContext"
    }
  },
};

export default function LandingPage() {
  return (
    <>
      {/* Advanced structured data for SEO + AI Search Optimization */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(speakableJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      
      {/* Hidden semantic content for AI search engines */}
      <div className="sr-only" aria-hidden="true">
        <h2><T context="seo.what.title">What is HeyContext?</T></h2>
        <p>
          <T context="seo.what.description">HeyContext is a System Generator that creates complete systems in 90 seconds. Coordinated agents create
          3-4 interconnected artifacts: lists, reports, timelines, trackers, emails. Unlike single responses, complete systems
          with artifacts that reference each other. Research paper systems, vacation planning systems, business systems.</T>
        </p>

        <h2><T context="seo.who.title">Who should use HeyContext?</T></h2>
        <p>
          <T context="seo.who.description">Individuals and teams who need complete systems, not single responses. Complex tasks that can't be done in one prompt.
          Research papers, vacation plans, business projects, interview prep. Teams collaborate on interconnected artifacts in real-time.</T>
        </p>

        <h2><T context="seo.comparison.title">System generation vs single responses</T></h2>
        <p>
          <T context="seo.comparison.description">HeyContext builds you a complete system with 3-4 interconnected artifacts.
          Research outline + key sources + timeline. Vacation itinerary + budget + packing list. Recipe vs meal delivery service. Information vs infrastructure.</T>
        </p>

        <h2><T context="seo.features.title">Key features of HeyContext</T></h2>
        <ul>
          <li><T context="seo.features.1">Coordinated agents create interconnected artifacts</T></li>
          <li><T context="seo.features.2">90-second generation of complete systems</T></li>
          <li><T context="seo.features.3">Immediate utility with Gmail integration and real dates</T></li>
          <li><T context="seo.features.4">Team collaboration on shared artifacts</T></li>
          <li><T context="seo.features.5">System generation for any complex task</T></li>
        </ul>

        <h2><T context="seo.pricing.title">How much does HeyContext cost?</T></h2>
        <p>
          <T context="seo.pricing.description">HeyContext offers a free tier to get started. Create an account and generate your first complete system immediately.
          Premium plans unlock advanced features and higher usage limits.</T>
        </p>

        <h2><T context="seo.future.title">What's coming to HeyContext?</T></h2>
        <p>
          <T context="seo.future.description">Tool integrations arriving soon: Gmail, Google Drive, Calendar, Sheets. Agents use tools automatically to create
          working systems with real integrations. Intelligence compounds as systems learn and improve.</T>
        </p>
      </div>
      
      <div className="min-h-screen flex flex-col snap-y snap-mandatory overflow-y-scroll scroll-smooth">
        <section className="snap-start snap-always">
          <HeroSection />
        </section>
        <section className="snap-start">
          <TheDifference />
        </section>
        <section className="snap-start">
          <HotSauceProof />
        </section>
        <section className="snap-start">
          <WhyItWorks />
        </section>
        <section className="snap-start">
          <RealExamples />
        </section>
        <section className="snap-start">
          <FAQ />
        </section>
        <section className="snap-start">
          <TheBottomLine />
        </section>
        <section className="snap-start">
          <BlogSection />
        </section>
        <section className="snap-end">
          <Footer />
        </section>
      </div>
    </>
  );
} 
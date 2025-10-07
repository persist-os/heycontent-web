import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { siteConfig } from '../metadata';
import { PricingTable } from './components/PricingTable';
import { ApiCallBreakdown } from './components/ApiCallBreakdown';
import { PricingFAQ } from './components/PricingFAQ';
import Footer from '../../components/ui/Footer';
import { Button } from '../../components/ui/button';
import { Activity, Bell, Shield } from 'lucide-react';

// ISR: Revalidate every week for pricing updates
export const revalidate = 604800;

export const metadata: Metadata = {
  title: 'Pricing - HeyContext | Usage-Based AI Memory',
  description: 'Start free with 50 API calls. Upgrade to Basic ($10/mo) or Pro ($25/mo) for more. Only pay for what you use. No surprises, full control.',
  keywords: [
    'HeyContext pricing',
    'AI memory cost',
    'usage based pricing',
    'AI assistant pricing',
    'ChatGPT alternative pricing',
    'pay as you go AI',
    'affordable AI memory',
    'AI subscription plans',
    'metered AI pricing'
  ],
  openGraph: {
    title: 'HeyContext Pricing - Pay Only for What You Use',
    description: 'Free tier available. Flexible plans from $10/mo. Track usage in real-time.',
    type: 'website',
    url: `${siteConfig.url}/pricing`,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HeyContext Pricing - Simple, Transparent Pricing',
    description: 'Start free. Upgrade when ready. Always know what you\'re paying for.',
  },
  alternates: {
    canonical: `${siteConfig.url}/pricing`,
  },
};

// Pricing schema for rich results
const pricingSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "HeyContext",
  "description": "AI-powered memory system that learns from every conversation",
  "brand": {
    "@type": "Brand",
    "name": "HeyContext"
  },
  "offers": [
    {
      "@type": "Offer",
      "name": "Free",
      "price": "0",
      "priceCurrency": "USD",
      "description": "50 API calls per month"
    },
    {
      "@type": "Offer",
      "name": "Basic",
      "price": "10",
      "priceCurrency": "USD",
      "description": "100 API calls per month plus overage billing"
    },
    {
      "@type": "Offer",
      "name": "Pro",
      "price": "25",
      "priceCurrency": "USD",
      "description": "1,000 API calls per month plus overage billing"
    }
  ]
};

export default function PricingPage() {
  return (
    <>
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(pricingSchema) }}
      />
      
      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="pt-20 pb-12 px-4 sm:px-6 bg-gradient-to-b from-slate-50 to-white dark:from-slate-950 dark:to-background">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
              Simple, Usage-Based Pricing
            </h1>
            <p className="text-xl sm:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Pay only for what you use. Start free, scale as you grow.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="text-lg px-8">
                  Start Free
                  <span className="ml-2 text-sm opacity-80">No credit card required</span>
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Pricing Table */}
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-7xl mx-auto">
            <PricingTable />
          </div>
        </section>

        {/* What Counts as an API Call */}
        <section className="py-16 px-4 sm:px-6 bg-slate-50 dark:bg-slate-900/30">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
              What Counts as an API Call?
            </h2>
            <p className="text-center text-muted-foreground mb-12 text-lg">
              Clear, transparent usage tracking. No hidden charges.
            </p>
            <ApiCallBreakdown />
          </div>
        </section>

        {/* Stay in Control */}
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
              Stay in Control
            </h2>
            <p className="text-center text-muted-foreground mb-12 text-lg">
              Full transparency and control over your spending
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Activity className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Real-Time Dashboard</h3>
                <p className="text-muted-foreground">
                  Track your API usage minute-by-minute in your settings. Always know where you stand.
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Bell className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Monitor Your Usage</h3>
                <p className="text-muted-foreground">
                  Check your current usage anytime in your settings dashboard.
                </p>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No Surprise Bills</h3>
                <p className="text-muted-foreground">
                  Free tier has a hard cap. Paid tiers let you set spending limits. You're in control.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 px-4 sm:px-6 bg-slate-50 dark:bg-slate-900/30">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
              Pricing FAQs
            </h2>
            <p className="text-center text-muted-foreground mb-12 text-lg">
              Everything you need to know about HeyContext pricing
            </p>
            <PricingFAQ />
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Start free. No credit card required. Upgrade anytime.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register">
                <Button size="lg" className="text-lg px-8">
                  Start Free Now
                </Button>
              </Link>
              <Link href="/compare">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Compare Plans
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
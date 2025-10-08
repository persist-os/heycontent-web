import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { siteConfig } from '../../metadata';
import { Button } from '../../../components/ui/button';

// ISR: Revalidate every week
export const revalidate = 604800;

export const metadata: Metadata = {
  title: 'HeyContext vs Notion AI: Conversational Memory vs Workspace AI (2025)',
  description: 'Detailed comparison of HeyContext vs Notion AI. Compare AI-first memory system vs workspace AI assistant. Which is better for note-taking and knowledge management?',
  keywords: [
    'HeyContext vs Notion AI',
    'Notion AI alternative',
    'AI note taking comparison',
    'Notion AI vs HeyContext',
    'best AI for notes',
    'conversational AI vs workspace AI',
    'AI memory system',
    'Notion alternative',
    'smart note taking',
    'AI knowledge management'
  ],
  openGraph: {
    title: 'HeyContext vs Notion AI: Memory vs Workspace 2025',
    description: 'Compare AI-first memory vs workspace AI. Which approach is better for your workflow?',
    type: 'article',
    url: `${siteConfig.url}/compare/heycontext-vs-notion-ai`,
  },
  alternates: {
    canonical: `${siteConfig.url}/compare/heycontext-vs-notion-ai`,
  },
};

const comparisonJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "HeyContext vs Notion AI: Complete Comparison",
  "description": "Comprehensive comparison of HeyContext and Notion AI approaches",
  "author": {
    "@type": "Organization",
    "name": "HeyContext"
  },
  "publisher": {
    "@type": "Organization",
    "name": "HeyContext",
    "logo": {
      "@type": "ImageObject",
      "url": `${siteConfig.url}/hey-content-large-square.svg`
    }
  },
  "dateModified": new Date().toISOString(),
};

const features = [
  {
    feature: 'Primary Focus',
    heycontext: 'AI-first conversational memory',
    notion: 'Workspace with AI features',
  },
  {
    feature: 'Conversational Memory',
    heycontext: 'Persistent across all interactions',
    notion: 'No conversational memory',
  },
  {
    feature: 'Note Integration',
    heycontext: 'Unified with conversations',
    notion: 'Document-centric with AI assistance',
  },
  {
    feature: 'Background Processing',
    heycontext: 'Continuous insight extraction',
    notion: 'On-demand AI assistance',
  },
  {
    feature: 'Standalone Usage',
    heycontext: 'Full standalone platform',
    notion: 'Requires Notion workspace',
  },
  {
    feature: 'AI Chat',
    heycontext: 'Full conversational AI',
    notion: 'Basic Q&A on documents',
  },
  {
    feature: 'Context Building',
    heycontext: 'Evolves over time automatically',
    notion: 'Static documents with AI tools',
  },
  {
    feature: 'Team Collaboration',
    heycontext: 'Share notes & add friends',
    notion: 'Excellent (core strength)',
  },
  {
    feature: 'Database Features',
    heycontext: 'Coming soon',
    notion: 'Advanced databases & views',
  },
  {
    feature: 'Document Organization',
    heycontext: 'AI-powered tagging',
    notion: 'Manual hierarchies & databases',
  },
  {
    feature: 'Starting Price',
    heycontext: 'Free → $10 → $25/mo',
    notion: '$10/mo AI addon (+ Notion subscription)',
  },
  {
    feature: 'Total Cost',
    heycontext: '$10/mo for full features',
    notion: '$20/mo minimum (Plus + AI)',
  },
];

export default function HeyContextVsNotionAI() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(comparisonJsonLd) }}
      />
      
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Breadcrumb */}
        <nav className="mb-12 flex items-center text-sm text-muted-foreground font-light">
          <Link href="/" className="hover:text-foreground transition-colors duration-300">Home</Link>
          <span className="mx-3 text-muted-foreground/40">/</span>
          <Link href="/compare" className="hover:text-foreground transition-colors duration-300">Compare</Link>
          <span className="mx-3 text-muted-foreground/40">/</span>
          <span className="text-foreground font-medium">HeyContext vs Notion AI</span>
        </nav>

        {/* Hero */}
        <header className="mb-24">
          <div className="flex items-center gap-8 mb-6">
            <h1 className="text-5xl sm:text-6xl font-light tracking-tight">
              HeyContext vs Notion AI
            </h1>
            <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-border/60 to-transparent" />
          </div>
          <div className="ml-0 md:ml-12 space-y-4">
            <h2 className="text-2xl font-medium text-muted-foreground">
              AI-first memory vs workspace assistant
            </h2>
            <p className="text-sm text-muted-foreground/60 font-light">
              Updated {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </header>

        {/* Quick Answer */}
        <section className="mb-20 border-l-2 border-green-400/30 pl-8">
          <h2 className="text-lg font-light text-muted-foreground mb-6 tracking-wide uppercase">
            Quick Answer
          </h2>
          <div className="space-y-6 text-lg leading-relaxed">
            <p>
              <span className="font-medium text-foreground">Notion AI</span>
              <span className="text-muted-foreground"> is a powerful AI addon for Notion's workspace. It helps you write, summarize, and organize within your existing notes and databases. Perfect if you're already using Notion for team collaboration.</span>
            </p>
            <p>
              <span className="font-medium text-foreground">HeyContext</span>
              <span className="text-muted-foreground"> is built as an </span>
              <em className="font-medium text-foreground">AI-first platform</em>
              <span className="text-muted-foreground"> with conversational memory that evolves. It combines notes with persistent AI that learns from all your interactions, not just assists with document tasks.</span>
            </p>
          </div>
          
          {/* Decision framework */}
          <div className="mt-12 grid md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h3 className="text-sm font-medium tracking-wide text-muted-foreground">
                Choose HeyContext for
              </h3>
              <div className="space-y-3 text-base">
                <p className="text-foreground">Conversational AI that remembers</p>
                <p className="text-foreground">Memory that evolves over time</p>
                <p className="text-foreground">Standalone AI platform</p>
                <p className="text-foreground">Background insight extraction</p>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-medium tracking-wide text-muted-foreground">
                Choose Notion AI for
              </h3>
              <div className="space-y-3 text-base">
                <p className="text-foreground">Already using Notion for team work</p>
                <p className="text-foreground">Need advanced databases & views</p>
                <p className="text-foreground">Team collaboration features</p>
                <p className="text-foreground">Document-centric workflow</p>
              </div>
            </div>
          </div>
        </section>

        {/* Key Difference */}
        <section className="mb-24">
          <div className="mb-12">
            <h2 className="text-3xl font-light tracking-tight mb-2">The Fundamental Difference</h2>
            <div className="h-px bg-gradient-to-r from-border/40 via-border to-transparent" />
          </div>
          
          <div className="grid md:grid-cols-2 gap-16">
            <div className="space-y-6">
              <div className="h-px w-16 bg-gradient-to-r from-purple-400/60 to-transparent" />
              <h3 className="text-2xl font-medium">HeyContext: AI-First Platform</h3>
              <p className="text-muted-foreground leading-relaxed">
                Built around <span className="font-medium text-foreground">conversational AI with persistent memory</span>. Every interaction—whether chat or note—feeds into an evolving understanding of your work and thinking patterns.
              </p>
              <div className="space-y-3 text-sm pt-4">
                <p className="text-foreground">Conversational memory across all work</p>
                <p className="text-foreground">Background processing and insights</p>
                <p className="text-foreground">AI learns from every interaction</p>
              </div>
            </div>
            
            <div className="space-y-6 md:mt-12">
              <div className="h-px w-16 bg-gradient-to-r from-slate-400/60 to-transparent" />
              <h3 className="text-2xl font-medium">Notion AI: Workspace-First</h3>
              <p className="text-muted-foreground leading-relaxed">
                A <span className="font-medium text-foreground">workspace tool with AI features</span>. Excellent for team collaboration, databases, and document management. AI assists with writing and summarization but doesn't build conversational memory.
              </p>
              <div className="space-y-3 text-sm pt-4 text-muted-foreground">
                <p>No standalone conversational AI</p>
                <p>AI tools assist with documents</p>
                <p>Requires Notion workspace subscription</p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Comparison */}
        <section className="mb-24">
          <div className="mb-12">
            <h2 className="text-3xl font-light tracking-tight mb-2">Feature-by-Feature</h2>
            <div className="h-px bg-gradient-to-r from-border/40 via-border to-transparent" />
          </div>
          
          <div className="overflow-x-auto">
            <div className="min-w-full">
              {/* Table header */}
              <div className="grid grid-cols-[2fr_3fr_3fr] gap-8 pb-4 border-b border-border/40">
                <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Feature</div>
                <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">HeyContext</div>
                <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Notion AI</div>
              </div>
              
              {/* Table rows */}
              <div className="divide-y divide-border/20">
                {features.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-[2fr_3fr_3fr] gap-8 py-6 hover:bg-muted/20 transition-colors duration-300">
                    <div className="text-sm font-medium text-foreground">{row.feature}</div>
                    <div className="text-sm text-muted-foreground leading-relaxed">{row.heycontext}</div>
                    <div className="text-sm text-muted-foreground leading-relaxed">{row.notion}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Comparison */}
        <section className="mb-24">
          <div className="mb-12">
            <h2 className="text-3xl font-light tracking-tight mb-2">Pricing</h2>
            <div className="h-px bg-gradient-to-r from-border/40 via-border to-transparent" />
          </div>
          
          <div className="grid md:grid-cols-2 gap-16">
            <div className="space-y-8">
              <h3 className="text-xl font-medium">HeyContext</h3>
              <div className="space-y-6">
                <div className="pb-6 border-b border-border/20">
                  <p className="text-3xl font-light mb-2">Free</p>
                  <p className="text-sm text-muted-foreground mb-4">50 API calls · ~10 conversations</p>
                  <p className="text-sm text-foreground">Full features unlocked, no credit card required</p>
                </div>
                <div className="pb-6 border-b border-border/20">
                  <p className="text-3xl font-light mb-2">$10<span className="text-lg text-muted-foreground">/mo</span></p>
                  <p className="text-sm text-muted-foreground mb-4">100 API calls + overage billing</p>
                  <p className="text-sm text-foreground">~20 conversations/month · Advanced insights · Full AI memory</p>
                </div>
                <div>
                  <p className="text-3xl font-light mb-2">$25<span className="text-lg text-muted-foreground">/mo</span></p>
                  <p className="text-sm text-muted-foreground mb-4">1,000 API calls + overage</p>
                  <p className="text-sm text-foreground">~200+ conversations · Priority support · Lower overage rate</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-8 md:mt-12">
              <h3 className="text-xl font-medium">Notion AI</h3>
              <div className="space-y-6">
                <div className="pb-6 border-b border-border/20">
                  <p className="text-3xl font-light mb-2">$10<span className="text-lg text-muted-foreground">/user/mo</span></p>
                  <p className="text-sm text-muted-foreground mb-4">Notion AI addon</p>
                  <p className="text-sm text-foreground">Requires Notion Plus ($10/mo) or higher</p>
                  <p className="text-sm text-muted-foreground mt-2">Total: $20/user/month minimum</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-3">What's Included:</p>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>AI writing assistance</p>
                    <p>Document summarization</p>
                    <p>Q&A on your documents</p>
                    <p>Database autofill</p>
                    <p>Translation features</p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Note:</span> Notion AI requires an active Notion subscription. You cannot use Notion AI standalone.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="mb-24">
          <div className="mb-12">
            <h2 className="text-3xl font-light tracking-tight mb-2">Which Should You Choose?</h2>
            <div className="h-px bg-gradient-to-r from-border/40 via-border to-transparent" />
          </div>
          
          <div className="grid md:grid-cols-2 gap-16">
            <div className="space-y-8">
              <div className="h-px w-12 bg-gradient-to-r from-green-400/40 to-transparent" />
              <h3 className="text-xl font-medium">Choose HeyContext</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Need Conversational AI</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Want to talk to an AI that remembers everything</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Memory That Evolves</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">AI learns from all interactions automatically</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Standalone Platform</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Don't need Notion's workspace features</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Background Insights</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Want AI processing happening passively</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Better Value</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">$10/mo vs $20/mo for AI features</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-8 md:mt-12">
              <div className="h-px w-12 bg-gradient-to-r from-slate-400/40 to-transparent" />
              <h3 className="text-xl font-medium">Choose Notion AI</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Already Using Notion</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Team already works in Notion workspace</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Team Collaboration</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Need robust team features and permissions</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Advanced Databases</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Rely on Notion's database views and filters</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Document-Centric</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Workflow centers on documents, not conversations</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">AI as Helper Tool</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Want AI to assist, not lead</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Real-World Scenarios */}
        <section className="mb-24">
          <div className="mb-12">
            <h2 className="text-3xl font-light tracking-tight mb-2">Real-World Scenarios</h2>
            <div className="h-px bg-gradient-to-r from-border/40 via-border to-transparent" />
          </div>
          
          <div className="space-y-16">
            <div className="border-l-2 border-border/30 pl-8 space-y-4">
              <h3 className="text-xl font-medium">Solo Creator Building Knowledge Over Time</h3>
              <p className="text-muted-foreground leading-relaxed">
                You're a writer, researcher, or creator working alone. You want AI that learns from your work over months.
              </p>
              <div className="grid md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">HeyContext</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Perfect fit. Conversational AI builds understanding from all your notes and chats. Memory evolves with your thinking.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Notion AI</p>
                  <p className="text-sm text-muted-foreground/70 leading-relaxed">Can work, but you're paying for team features you don't need. No conversational memory to build on.</p>
                </div>
              </div>
            </div>
            
            <div className="border-l-2 border-border/30 pl-8 space-y-4">
              <h3 className="text-xl font-medium">Team Using Notion for Everything</h3>
              <p className="text-muted-foreground leading-relaxed">
                Your entire team lives in Notion. Wikis, docs, project management, databases—it's your workspace.
              </p>
              <div className="grid md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">HeyContext</p>
                  <p className="text-sm text-muted-foreground/70 leading-relaxed">Can share notes with individuals, but Notion's collaboration features are more mature for large teams.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Notion AI</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Perfect fit. Adds AI to your existing workflow without changing anything. Team can use AI in the tools they already know.</p>
                </div>
              </div>
            </div>
            
            <div className="border-l-2 border-border/30 pl-8 space-y-4">
              <h3 className="text-xl font-medium">Need Deep Conversational AI</h3>
              <p className="text-muted-foreground leading-relaxed">
                You want to have long conversations with an AI that remembers context from weeks ago and makes connections.
              </p>
              <div className="grid md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">HeyContext</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Built for this. Full conversational AI with persistent memory. Every conversation builds on previous understanding.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Notion AI</p>
                  <p className="text-sm text-muted-foreground/70 leading-relaxed">Not designed for this. AI is document-focused with basic Q&A. No conversational memory across interactions.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-24">
          <div className="mb-12">
            <h2 className="text-3xl font-light tracking-tight mb-2">Questions</h2>
            <div className="h-px bg-gradient-to-r from-border/40 via-border to-transparent" />
          </div>
          
          <div className="space-y-8">
            <div className="border-b border-border/20 pb-8">
              <h3 className="text-lg font-medium mb-3">Can I use both HeyContext and Notion AI?</h3>
              <p className="text-muted-foreground leading-relaxed">
                Yes! Many users keep Notion for team collaboration and document organization, while using HeyContext for conversational AI and personal memory. They serve different purposes.
              </p>
            </div>
            <div className="border-b border-border/20 pb-8">
              <h3 className="text-lg font-medium mb-3">Can I use Notion AI without a Notion subscription?</h3>
              <p className="text-muted-foreground leading-relaxed">
                No. Notion AI is an addon that requires an active Notion subscription (Plus, Business, or Enterprise). The minimum cost is $20/month ($10 for Notion Plus + $10 for AI addon).
              </p>
            </div>
            <div className="border-b border-border/20 pb-8">
              <h3 className="text-lg font-medium mb-3">Does HeyContext have database features like Notion?</h3>
              <p className="text-muted-foreground leading-relaxed">
                Not yet. HeyContext focuses on AI-first memory and conversations. Advanced database features are on the roadmap, but currently HeyContext is built around conversational AI rather than document databases.
              </p>
            </div>
            <div className="border-b border-border/20 pb-8">
              <h3 className="text-lg font-medium mb-3">Which is better for personal knowledge management?</h3>
              <p className="text-muted-foreground leading-relaxed">
                HeyContext excels at personal knowledge management because of its conversational AI and evolving memory. Notion AI is better if you prefer hierarchical document organization and don't need conversational memory.
              </p>
            </div>
            <div className="border-b border-border/20 pb-8">
              <h3 className="text-lg font-medium mb-3">Can I import my Notion notes into HeyContext?</h3>
              <p className="text-muted-foreground leading-relaxed">
                Not Yet, but we are working on it. It is on our roadmap.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-24 mb-16">
          <div className="text-center space-y-8 max-w-2xl mx-auto">
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            <h2 className="text-3xl font-light tracking-tight">Try HeyContext Free</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Experience conversational AI with memory that evolves. No credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/auth/register">
                <Button size="lg" className="text-base px-8 font-medium">
                  Start Building Your AI Memory
                </Button>
              </Link>
              <Link href="/compare">
                <Button size="lg" variant="outline" className="text-base px-8 font-medium">
                  All Comparisons
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}


import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { siteConfig } from '../../metadata';
import { Button } from '../../../components/ui/button';

// ISR: Revalidate every week
export const revalidate = 604800;

export const metadata: Metadata = {
  title: 'HeyContext vs Claude: Persistent Memory vs Context Window (2025)',
  description: 'Detailed comparison of HeyContext vs Claude AI. Compare permanent memory that evolves vs 200K token context window. Which is better for long-term projects?',
  keywords: [
    'HeyContext vs Claude',
    'Claude alternative',
    'Claude AI comparison',
    'persistent memory vs context window',
    'Claude 200k tokens',
    'best AI for long-term projects',
    'AI memory system',
    'Claude vs HeyContext',
    'AI that remembers',
    'context window vs memory'
  ],
  openGraph: {
    title: 'HeyContext vs Claude: Memory vs Context Window 2025',
    description: 'Compare persistent AI memory vs large context windows. Which approach is better for your needs?',
    type: 'article',
    url: `${siteConfig.url}/compare/heycontext-vs-claude`,
  },
  alternates: {
    canonical: `${siteConfig.url}/compare/heycontext-vs-claude`,
  },
};

const comparisonJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "HeyContext vs Claude: Complete AI Comparison",
  "description": "Comprehensive comparison of HeyContext and Claude AI memory approaches",
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
    feature: 'Memory Type',
    heycontext: 'Permanent, evolving memory',
    claude: 'Large working memory (200K tokens)',
  },
  {
    feature: 'Memory Persistence',
    heycontext: 'Never expires, builds over time',
    claude: 'Chat-based, resets between conversations',
  },
  {
    feature: 'Background Processing',
    heycontext: 'Continuous insight extraction',
    claude: 'Only responds when prompted',
  },
  {
    feature: 'Cross-Project Learning',
    heycontext: 'All projects inform each other',
    claude: 'Isolated per project',
  },
  {
    feature: 'Context Approach',
    heycontext: 'Long-term memory',
    claude: 'Large short-term memory',
  },
  {
    feature: 'Document Analysis',
    heycontext: 'Good with integrated notes',
    claude: 'Exceptional with large documents',
  },
  {
    feature: 'Context Window',
    heycontext: 'Standard (128k tokens)',
    claude: '200K tokens (industry leading)',
  },
  {
    feature: 'Integrated Notes',
    heycontext: 'Unified with conversations',
    claude: 'Upload per project',
  },
  {
    feature: 'Living Projects',
    heycontext: 'Evolving with ambient insights',
    claude: 'Project folders with documents',
  },
  {
    feature: 'Safety Focus',
    heycontext: 'Privacy-focused',
    claude: 'Exceptional safety measures',
  },
  {
    feature: 'Web Browsing',
    heycontext: 'Coming soon',
    claude: 'Available (web search)',
  },
  {
    feature: 'Starting Price',
    heycontext: 'Free → $10 → $25/mo',
    claude: 'Free → $20/mo',
  },
];

export default function HeyContextVsClaude() {
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
          <span className="text-foreground font-medium">HeyContext vs Claude</span>
        </nav>

        {/* Hero */}
        <header className="mb-24">
          <div className="flex items-center gap-8 mb-6">
            <h1 className="text-5xl sm:text-6xl font-light tracking-tight">
              HeyContext vs Claude
            </h1>
            <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-border/60 to-transparent" />
          </div>
          <div className="ml-0 md:ml-12 space-y-4">
            <h2 className="text-2xl font-medium text-muted-foreground">
              Permanent memory vs large context window
            </h2>
            <p className="text-sm text-muted-foreground/60 font-light">
              Updated {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </header>

        {/* Quick Answer */}
        <section className="mb-20 border-l-2 border-purple-400/30 pl-8">
          <h2 className="text-lg font-light text-muted-foreground mb-6 tracking-wide uppercase">
            Quick Answer
          </h2>
          <div className="space-y-6 text-lg leading-relaxed">
            <p>
              <span className="font-medium text-foreground">Claude</span>
              <span className="text-muted-foreground"> by Anthropic offers an exceptional 200K token context window and project-based organization. It excels at analyzing large documents and maintaining context within a single conversation or project.</span>
            </p>
            <p>
              <span className="font-medium text-foreground">HeyContext</span>
              <span className="text-muted-foreground"> takes a fundamentally different approach: instead of a large </span>
              <em className="font-medium text-foreground">working memory</em>
              <span className="text-muted-foreground">, it provides permanent </span>
              <em className="font-medium text-foreground">long-term memory</em>
              <span className="text-muted-foreground"> that builds understanding across all conversations and never expires.</span>
            </p>
          </div>
          
          {/* Decision framework */}
          <div className="mt-12 grid md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h3 className="text-sm font-medium tracking-wide text-muted-foreground">
                Choose HeyContext for
              </h3>
              <div className="space-y-3 text-base">
                <p className="text-foreground">Memory that persists indefinitely</p>
                <p className="text-foreground">Learning across all conversations</p>
                <p className="text-foreground">Background insight extraction</p>
                <p className="text-foreground">Evolving understanding over time</p>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-medium tracking-wide text-muted-foreground">
                Choose Claude for
              </h3>
              <div className="space-y-3 text-base">
                <p className="text-foreground">Analyzing very large documents</p>
                <p className="text-foreground">Single-session deep work</p>
                <p className="text-foreground">Safety-critical applications</p>
                <p className="text-foreground">Project-based organization</p>
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
              <h3 className="text-2xl font-medium">HeyContext: Long-Term Memory</h3>
              <p className="text-muted-foreground leading-relaxed">
                Memory that <span className="font-medium text-foreground">persists permanently and evolves</span>. Every conversation builds understanding that carries forward indefinitely. Context never expires or resets.
              </p>
              <div className="space-y-3 text-sm pt-4">
                <p className="text-foreground">Memory builds across months and years</p>
                <p className="text-foreground">Insights extracted automatically</p>
                <p className="text-foreground">All conversations inform each other</p>
              </div>
            </div>
            
            <div className="space-y-6 md:mt-12">
              <div className="h-px w-16 bg-gradient-to-r from-orange-400/60 to-transparent" />
              <h3 className="text-2xl font-medium">Claude: Large Working Memory</h3>
              <p className="text-muted-foreground leading-relaxed">
                A <span className="font-medium text-foreground">massive 200K token context window</span> lets you work with huge amounts of information in a single session. Perfect for analyzing large documents or maintaining context in long conversations.
              </p>
              <div className="space-y-3 text-sm pt-4 text-muted-foreground">
                <p>Context persists within project only</p>
                <p>Resets when switching projects</p>
                <p>No background processing between sessions</p>
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
                <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Claude</div>
              </div>
              
              {/* Table rows */}
              <div className="divide-y divide-border/20">
                {features.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-[2fr_3fr_3fr] gap-8 py-6 hover:bg-muted/20 transition-colors duration-300">
                    <div className="text-sm font-medium text-foreground">{row.feature}</div>
                    <div className="text-sm text-muted-foreground leading-relaxed">{row.heycontext}</div>
                    <div className="text-sm text-muted-foreground leading-relaxed">{row.claude}</div>
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
                  <p className="text-sm text-foreground">~20 conversations/month · Advanced insights</p>
                </div>
                <div>
                  <p className="text-3xl font-light mb-2">$25<span className="text-lg text-muted-foreground">/mo</span></p>
                  <p className="text-sm text-muted-foreground mb-4">1,000 API calls + overage</p>
                  <p className="text-sm text-foreground">~200+ conversations · Priority support · Lower overage rate</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-8 md:mt-12">
              <h3 className="text-xl font-medium">Claude</h3>
              <div className="space-y-6">
                <div className="pb-6 border-b border-border/20">
                  <p className="text-3xl font-light mb-2">Free</p>
                  <p className="text-sm text-muted-foreground mb-4">Claude Sonnet 4 access</p>
                  <p className="text-sm text-foreground">Limited usage · 200K context window</p>
                </div>
                <div>
                  <p className="text-3xl font-light mb-2">$20<span className="text-lg text-muted-foreground">/mo</span></p>
                  <p className="text-sm text-muted-foreground mb-4">Claude Pro</p>
                  <p className="text-sm text-foreground">5x usage limit · Claude Opus 4 access · Priority access · Early features</p>
                </div>
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
                  <p className="font-medium text-foreground">Building Context Over Time</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Projects spanning weeks, months, or years</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Cross-Project Learning</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Want insights from all your work to inform new projects</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Automatic Memory Building</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Don't want to manually maintain context</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Background Insights</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Want AI processing happening passively</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Better Value at Scale</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">$10/mo vs $20/mo for ongoing use</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-8 md:mt-12">
              <div className="h-px w-12 bg-gradient-to-r from-orange-400/40 to-transparent" />
              <h3 className="text-xl font-medium">Choose Claude</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Analyzing Large Documents</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Working with 50+ page documents in single sessions</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Single-Session Deep Work</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Need massive context within one conversation</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Safety-Critical Applications</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Anthropic's exceptional safety measures</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Project-Based Workflow</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Prefer organizing work into separate projects</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Long-Form Writing Analysis</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Exceptional at analyzing and generating long content</p>
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
              <h3 className="text-xl font-medium">6-Month Product Development</h3>
              <p className="text-muted-foreground leading-relaxed">
                Building a product with evolving requirements, design decisions, and feature discussions spanning half a year.
              </p>
              <div className="grid md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">HeyContext</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Remembers every decision and why you made it. Context builds continuously. Old decisions inform new features automatically.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Claude</p>
                  <p className="text-sm text-muted-foreground/70 leading-relaxed">Excellent for deep analysis within each project session, but you'll need to re-upload context for new project phases.</p>
                </div>
              </div>
            </div>
            
            <div className="border-l-2 border-border/30 pl-8 space-y-4">
              <h3 className="text-xl font-medium">Analyzing a 100-Page Research Paper</h3>
              <p className="text-muted-foreground leading-relaxed">
                Need to deeply analyze a very long document right now, with lots of back-and-forth discussion.
              </p>
              <div className="grid md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">HeyContext</p>
                  <p className="text-sm text-muted-foreground/70 leading-relaxed">128k context window is good but may require breaking very large documents into sections.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Claude</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">200K token window handles entire document easily. Exceptional long-form analysis and comprehension.</p>
                </div>
              </div>
            </div>
            
            <div className="border-l-2 border-border/30 pl-8 space-y-4">
              <h3 className="text-xl font-medium">Multiple Interconnected Projects</h3>
              <p className="text-muted-foreground leading-relaxed">
                Working on 3 different projects where insights from one should inform the others.
              </p>
              <div className="grid md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">HeyContext</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">All projects share memory. Patterns from Project A automatically inform Project B. Cross-project learning happens naturally.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Claude</p>
                  <p className="text-sm text-muted-foreground/70 leading-relaxed">Projects are isolated. You'll manually transfer context between project folders.</p>
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
              <h3 className="text-lg font-medium mb-3">Can I use both HeyContext and Claude?</h3>
              <p className="text-muted-foreground leading-relaxed">
                Absolutely. Many users use Claude for single-session document analysis and deep dives, while using HeyContext for long-term memory and cross-project learning. They complement each other well.
              </p>
            </div>
            <div className="border-b border-border/20 pb-8">
              <h3 className="text-lg font-medium mb-3">What does "200K tokens" actually mean?</h3>
              <p className="text-muted-foreground leading-relaxed">
                200K tokens is roughly 150,000 words or about 500 pages of text. It's the amount of information Claude can hold in its "working memory" during a single conversation. HeyContext has a smaller working memory (128k tokens) but permanent long-term memory.
              </p>
            </div>
            <div className="border-b border-border/20 pb-8">
              <h3 className="text-lg font-medium mb-3">Which is better for research projects?</h3>
              <p className="text-muted-foreground leading-relaxed">
                It depends. Claude excels at analyzing large documents in single sessions. HeyContext excels at building understanding over weeks/months of research. For ongoing research where context builds over time, HeyContext is better. For one-time deep document analysis, Claude shines.
              </p>
            </div>
            <div className="border-b border-border/20 pb-8">
              <h3 className="text-lg font-medium mb-3">Does HeyContext's memory work across projects like Claude's projects?</h3>
              <p className="text-muted-foreground leading-relaxed">
                Yes, but even better. While Claude isolates across conversations, HeyContext's memory spans all your work. Insights from one project automatically inform others. Think of it as one unified memory rather than separate project folders.
              </p>
            </div>
            <div className="border-b border-border/20 pb-8">
              <h3 className="text-lg font-medium mb-3">Can I migrate from Claude to HeyContext?</h3>
              <p className="text-muted-foreground leading-relaxed">
                Not currently, but we are working on it. It is on our roadmap. You can export your Claude conversations and import them into HeyContext. The AI will process them and build understanding from your past interactions. There's a guide in settings to help with the process.
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
              Experience memory that never expires. No credit card required.
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

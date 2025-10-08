import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { siteConfig } from '../../metadata';
import { Button } from '../../../components/ui/button';

// ISR: Revalidate every week
export const revalidate = 604800;

export const metadata: Metadata = {
  title: 'HeyContext vs ChatGPT: Which AI Has Better Memory? (2025 Comparison)',
  description: 'Detailed comparison of HeyContext vs ChatGPT. Learn which AI memory system is better for persistent context, evolving understanding, and long-term projects. Side-by-side feature comparison.',
  keywords: [
    'HeyContext vs ChatGPT',
    'ChatGPT alternative',
    'AI with persistent memory',
    'ChatGPT memory limitations',
    'best AI memory system',
    'AI that remembers everything',
    'ChatGPT vs HeyContext',
    'persistent AI memory',
    'ChatGPT memory features',
    'AI assistant comparison'
  ],
  openGraph: {
    title: 'HeyContext vs ChatGPT: Complete Comparison 2025',
    description: 'Which AI memory system is better? Compare features, pricing, and capabilities.',
    type: 'article',
    url: `${siteConfig.url}/compare/heycontext-vs-chatgpt`,
  },
  alternates: {
    canonical: `${siteConfig.url}/compare/heycontext-vs-chatgpt`,
  },
};

const comparisonJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "HeyContext vs ChatGPT: Complete AI Memory Comparison",
  "description": "Comprehensive comparison of HeyContext and ChatGPT memory systems",
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
  "datePublished": "2025-01-07",
  "dateModified": new Date().toISOString(),
};

const features = [
  {
    feature: 'Persistent Memory',
    heycontext: 'Evolves indefinitely across all conversations',
    chatgpt: 'Stores explicit facts, requires manual prompts',
  },
  {
    feature: 'Background Processing',
    heycontext: 'Continuous insight extraction',
    chatgpt: 'Only responds when prompted',
  },
  {
    feature: 'Context Learning',
    heycontext: 'Automatic from every interaction',
    chatgpt: 'Manual "remember this" prompts',
  },
  {
    feature: 'Cross-Conversation Insights',
    heycontext: 'All conversations inform each other',
    chatgpt: 'Basic memory recall, no active insights',
  },
  {
    feature: 'Integrated Notes',
    heycontext: 'Unified with conversations',
    chatgpt: 'Separate tools required',
  },
  {
    feature: 'Living Projects',
    heycontext: 'Evolving with ambient insights',
    chatgpt: 'Basic file uploads',
  },
  {
    feature: 'Memory Architecture',
    heycontext: 'Multi-dimensional clusters',
    chatgpt: 'Simple fact storage',
  },
  {
    feature: 'General AI',
    heycontext: 'GPT-4 powered',
    chatgpt: 'GPT-4 powered',
  },
  {
    feature: 'Web Browsing',
    heycontext: 'Coming soon',
    chatgpt: 'Real-time search',
  },
  {
    feature: 'Image Generation',
    heycontext: 'Coming soon',
    chatgpt: 'DALL-E 3 built-in',
  },
  {
    feature: 'Code Execution',
    heycontext: 'Coming soon',
    chatgpt: 'Python interpreter',
  },
  {
    feature: 'Starting Price',
    heycontext: 'Free → $10 → $25/mo',
    chatgpt: 'Free → $20/mo',
  },
];

export default function HeyContextVsChatGPT() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(comparisonJsonLd) }}
      />
      
      <div className="max-w-6xl mx-auto px-6 py-16">
        {/* Breadcrumb - subtle, text-only */}
        <nav className="mb-12 flex items-center text-sm text-muted-foreground font-light">
          <Link href="/" className="hover:text-foreground transition-colors duration-300">Home</Link>
          <span className="mx-3 text-muted-foreground/40">/</span>
          <Link href="/compare" className="hover:text-foreground transition-colors duration-300">Compare</Link>
          <span className="mx-3 text-muted-foreground/40">/</span>
          <span className="text-foreground font-medium">HeyContext vs ChatGPT</span>
        </nav>

        {/* Hero - asymmetric with subtle line */}
        <header className="mb-24">
          <div className="flex items-center gap-8 mb-6">
            <h1 className="text-5xl sm:text-6xl font-light tracking-tight">
              HeyContext vs ChatGPT
            </h1>
            <div className="hidden md:block flex-1 h-px bg-gradient-to-r from-border/60 to-transparent" />
          </div>
          <div className="ml-0 md:ml-12 space-y-4">
            <h2 className="text-2xl font-medium text-muted-foreground">
              Persistent memory vs conversational AI
            </h2>
            <p className="text-sm text-muted-foreground/60 font-light">
              Updated {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        </header>

        {/* Quick Answer - subtle, elegant */}
        <section className="mb-20 border-l-2 border-blue-400/30 pl-8">
          <h2 className="text-lg font-light text-muted-foreground mb-6 tracking-wide uppercase">
            Quick Answer
          </h2>
          <div className="space-y-6 text-lg leading-relaxed">
            <p>
              <span className="font-medium text-foreground">ChatGPT</span>
              <span className="text-muted-foreground"> is an excellent general-purpose AI for one-off questions, content generation, and varied tasks. It's like having a knowledgeable assistant you can ask anything.</span>
            </p>
            <p>
              <span className="font-medium text-foreground">HeyContext</span>
              <span className="text-muted-foreground"> is purpose-built for users who need an AI that </span>
              <em className="font-medium text-foreground">remembers and learns</em>
              <span className="text-muted-foreground"> from every interaction. If you're tired of repeating yourself or want an AI that builds deep understanding over time, HeyContext is designed specifically for that.</span>
            </p>
          </div>
          
          {/* Decision framework - clean text layout */}
          <div className="mt-12 grid md:grid-cols-2 gap-12">
            <div className="space-y-4">
              <h3 className="text-sm font-medium tracking-wide text-muted-foreground">
                Choose HeyContext for
              </h3>
              <div className="space-y-3 text-base">
                <p className="text-foreground">Long-term projects</p>
                <p className="text-foreground">Tired of repeating context</p>
                <p className="text-foreground">AI that learns from all interactions</p>
                <p className="text-foreground">Notes + conversations unified</p>
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="text-sm font-medium tracking-wide text-muted-foreground">
                Choose ChatGPT for
              </h3>
              <div className="space-y-3 text-base">
                <p className="text-foreground">General-purpose AI</p>
                <p className="text-foreground">Web browsing & image generation</p>
                <p className="text-foreground">Context persistence isn't critical</p>
                <p className="text-foreground">One-off interactions</p>
              </div>
            </div>
          </div>
        </section>

        {/* Key Difference - editorial layout */}
        <section className="mb-24">
          <div className="mb-12">
            <h2 className="text-3xl font-light tracking-tight mb-2">The Fundamental Difference</h2>
            <div className="h-px bg-gradient-to-r from-border/40 via-border to-transparent" />
          </div>
          
          <div className="grid md:grid-cols-2 gap-16">
            <div className="space-y-6">
              <div className="h-px w-16 bg-gradient-to-r from-purple-400/60 to-transparent" />
              <h3 className="text-2xl font-medium">HeyContext: Active Memory</h3>
              <p className="text-muted-foreground leading-relaxed">
                Memory that <span className="font-medium text-foreground">actively processes and evolves</span>. Every conversation, note, and interaction feeds into a growing understanding of your work, goals, and thinking patterns.
              </p>
              <div className="space-y-3 text-sm pt-4">
                <p className="text-foreground">Insights extracted automatically in the background</p>
                <p className="text-foreground">Context that evolves along with you</p>
                <p className="text-foreground">Connections form between old and new knowledge</p>
              </div>
            </div>
            
            <div className="space-y-6 md:mt-12">
              <div className="h-px w-16 bg-gradient-to-r from-slate-400/60 to-transparent" />
              <h3 className="text-2xl font-medium">ChatGPT: Conversational Memory</h3>
              <p className="text-muted-foreground leading-relaxed">
                Memory that <span className="font-medium text-foreground">stores what you explicitly tell it</span>. Great for individual conversations, but context doesn't carry over automatically between sessions.
              </p>
              <div className="space-y-3 text-sm pt-4 text-muted-foreground">
              <p>Basic memory recall, no context evolution</p>
              <p>Requires manual "remember this" prompts</p>
              <p>No automatic insight extraction</p>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Comparison - clean table */}
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
                <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">ChatGPT</div>
              </div>
              
              {/* Table rows */}
              <div className="divide-y divide-border/20">
                {features.map((row, idx) => (
                  <div key={idx} className="grid grid-cols-[2fr_3fr_3fr] gap-8 py-6 hover:bg-muted/20 transition-colors duration-300">
                    <div className="text-sm font-medium text-foreground">{row.feature}</div>
                    <div className="text-sm text-muted-foreground leading-relaxed">{row.heycontext}</div>
                    <div className="text-sm text-muted-foreground leading-relaxed">{row.chatgpt}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Comparison - simplified */}
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
              <h3 className="text-xl font-medium">ChatGPT</h3>
              <div className="space-y-6">
                <div className="pb-6 border-b border-border/20">
                  <p className="text-3xl font-light mb-2">Free</p>
                  <p className="text-sm text-muted-foreground mb-4">GPT-3.5 access</p>
                  <p className="text-sm text-foreground">Basic AI capabilities</p>
                </div>
                <div className="pb-6 border-b border-border/20">
                  <p className="text-3xl font-light mb-2">$20<span className="text-lg text-muted-foreground">/mo</span></p>
                  <p className="text-sm text-muted-foreground mb-4">ChatGPT Plus</p>
                  <p className="text-sm text-foreground">GPT-4 · Web browsing · DALL-E · Priority access</p>
                </div>
                <div>
                  <p className="text-3xl font-light mb-2">$25<span className="text-lg text-muted-foreground">/user/mo</span></p>
                  <p className="text-sm text-muted-foreground mb-4">ChatGPT Team</p>
                  <p className="text-sm text-foreground">Everything in Plus · Team workspace · Admin controls</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Use Cases - elegant text layout */}
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
                  <p className="font-medium text-foreground">Long-term Projects</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Working on things that span weeks or months</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Building Context Over Time</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Want AI that learns from every interaction</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Integrated Notes + AI</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Need notes and conversations in one system</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Tired of Repeating Yourself</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Want AI that remembers without being told</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Background Insights</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Want AI to work on your behalf passively</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-8 md:mt-12">
              <div className="h-px w-12 bg-gradient-to-r from-blue-400/40 to-transparent" />
              <h3 className="text-xl font-medium">Choose ChatGPT</h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="font-medium text-foreground">One-Off Questions</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Quick answers to varied questions</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Web Browsing Needed</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Need real-time web search capabilities</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Image Generation</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Built-in DALL-E for creating images</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">Code Execution</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Need to run Python code and analyze data</p>
                </div>
                <div className="space-y-2">
                  <p className="font-medium text-foreground">General Purpose AI</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Want versatile AI for any task</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Real-World Scenarios - clean editorial */}
        <section className="mb-24">
          <div className="mb-12">
            <h2 className="text-3xl font-light tracking-tight mb-2">Real-World Scenarios</h2>
            <div className="h-px bg-gradient-to-r from-border/40 via-border to-transparent" />
          </div>
          
          <div className="space-y-16">
            <div className="border-l-2 border-border/30 pl-8 space-y-4">
              <h3 className="text-xl font-medium">Research & Writing Projects</h3>
              <p className="text-muted-foreground leading-relaxed">
                You're writing a book that spans 6 months. Dozens of conversations, hundreds of notes, evolving ideas.
              </p>
              <div className="grid md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">HeyContext</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Every conversation and note feeds into growing understanding. AI automatically connects ideas across months of work.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">ChatGPT</p>
                  <p className="text-sm text-muted-foreground/70 leading-relaxed">Re-upload context and re-explain your book structure in each new conversation.</p>
                </div>
              </div>
            </div>
            
            <div className="border-l-2 border-border/30 pl-8 space-y-4">
              <h3 className="text-xl font-medium">Product Development</h3>
              <p className="text-muted-foreground leading-relaxed">
                Building a product over several months with evolving requirements and decisions.
              </p>
              <div className="grid md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">HeyContext</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">AI remembers past decisions, feature discussions, and why you made certain choices. Context builds continuously.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">ChatGPT</p>
                  <p className="text-sm text-muted-foreground/70 leading-relaxed">Manually maintain context documents and re-share them in new conversations.</p>
                </div>
              </div>
            </div>
            
            <div className="border-l-2 border-border/30 pl-8 space-y-4">
              <h3 className="text-xl font-medium">Content Creation with Current Events</h3>
              <p className="text-muted-foreground leading-relaxed">
                Need to create a blog post right now with current web research.
              </p>
              <div className="grid md:grid-cols-2 gap-8 pt-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">HeyContext</p>
                  <p className="text-sm text-muted-foreground/70 leading-relaxed">No web browsing yet. You'll need to manually provide current information.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">ChatGPT</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">Built-in web browsing finds current information and generates content immediately.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ - minimal design */}
        <section className="mb-24">
          <div className="mb-12">
            <h2 className="text-3xl font-light tracking-tight mb-2">Questions</h2>
            <div className="h-px bg-gradient-to-r from-border/40 via-border to-transparent" />
          </div>
          
          <div className="space-y-8">
            <div className="border-b border-border/20 pb-8">
              <h3 className="text-lg font-medium mb-3">Can I use both HeyContext and ChatGPT?</h3>
              <p className="text-muted-foreground leading-relaxed">
                Absolutely. Many users use ChatGPT for quick questions and one-off tasks, while using HeyContext for long-term projects and persistent memory needs. They complement each other well.
              </p>
            </div>
            <div className="border-b border-border/20 pb-8">
              <h3 className="text-lg font-medium mb-3">Does HeyContext have web browsing like ChatGPT?</h3>
              <p className="text-muted-foreground leading-relaxed">
                Not currently, but it's on the roadmap. HeyContext focuses on persistent memory and understanding rather than real-time information retrieval.
              </p>
            </div>
            <div className="border-b border-border/20 pb-8">
              <h3 className="text-lg font-medium mb-3">Which is more cost-effective?</h3>
              <p className="text-muted-foreground leading-relaxed">
                HeyContext starts at $10/month vs ChatGPT Plus at $20/month. For basic AI + persistent memory, HeyContext is more affordable. ChatGPT Plus includes web browsing and image generation, which adds value if you need those features.
              </p>
            </div>
            <div className="border-b border-border/20 pb-8">
              <h3 className="text-lg font-medium mb-3">How is HeyContext's memory different from ChatGPT's memory feature?</h3>
              <p className="text-muted-foreground leading-relaxed">
                ChatGPT's memory stores what you explicitly tell it to remember. HeyContext automatically extracts insights from every interaction, processes them in the background, and builds evolving understanding without manual prompts.
              </p>
            </div>
            <div className="border-b border-border/20 pb-8">
              <h3 className="text-lg font-medium mb-3">Can I migrate my ChatGPT conversations to HeyContext?</h3>
              <p className="text-muted-foreground leading-relaxed">
                You can export your ChatGPT conversations and import them into HeyContext. There is a guide in our settings to help you with the process. The AI will process them and build understanding from your past interactions.
              </p>
            </div>
          </div>
        </section>

        {/* CTA - subtle and elegant */}
        <section className="mt-24 mb-16">
          <div className="text-center space-y-8 max-w-2xl mx-auto">
            <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            <h2 className="text-3xl font-light tracking-tight">Try HeyContext Free</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Experience AI memory that actually evolves. No credit card required.
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

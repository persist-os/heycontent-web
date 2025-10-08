import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { siteConfig } from '../metadata';

// ISR: Revalidate every hour for fresh content
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'HeyContext vs ChatGPT, Claude, Notion AI - AI Memory Comparison 2025',
  description: 'Detailed comparison: HeyContext vs ChatGPT, Claude, Notion AI, Mem, and Obsidian. See which AI memory system is best for persistent context, evolving understanding, and connected thinking.',
  keywords: [
    'HeyContext vs ChatGPT',
    'ChatGPT alternative',
    'Claude alternative',
    'best AI memory app',
    'ChatGPT with persistent memory',
    'AI that remembers everything',
    'Notion AI alternative',
    'Mem alternative',
    'Obsidian AI plugin alternative',
    'second brain AI',
    'personal knowledge management AI'
  ],
  openGraph: {
    title: 'HeyContext vs ChatGPT, Claude & Others - Complete AI Memory Comparison',
    description: 'Find the best AI memory system for your needs. In-depth comparison of HeyContext, ChatGPT, Claude, and other AI assistants.',
    type: 'article',
    url: `${siteConfig.url}/compare`,
  },
  alternates: {
    canonical: `${siteConfig.url}/compare`,
  },
};

// Comparison schema for rich results
const comparisonJsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  "headline": "HeyContext vs ChatGPT, Claude, Notion AI - AI Memory Comparison",
  "description": "Comprehensive comparison of AI memory systems",
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
  "datePublished": "2025-01-06",
  "dateModified": new Date().toISOString(),
};

const features = [
  {
    feature: 'Persistent Memory',
    heycontext: 'Active processing, evolves over time',
    chatgpt: 'Static, conversation-based only',
    claude: 'Project-based, limited scope',
    notion: 'Document-based, no conversation memory',
  },
  {
    feature: 'Context Enrichment',
    heycontext: 'Automatic across all interactions',
    chatgpt: 'Manual via custom instructions',
    claude: 'Per-project only',
    notion: 'None',
  },
  {
    feature: 'Background Processing',
    heycontext: 'Continuous insight extraction',
    chatgpt: 'No background processing',
    claude: 'No background processing',
    notion: 'No background processing',
  },
  {
    feature: 'Connected Thinking',
    heycontext: 'Automatic across notes & conversations',
    chatgpt: 'Limited to single conversation',
    claude: 'Limited to project scope',
    notion: 'Manual linking required',
  },
  {
    feature: 'Privacy Model',
    heycontext: 'Privacy-focused, secure storage',
    chatgpt: 'Standard cloud storage',
    claude: 'Standard cloud storage',
    notion: 'Standard cloud storage',
  },
];

export default function ComparePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(comparisonJsonLd) }}
      />
      
      <div className="max-w-6xl mx-auto px-4 py-12">
        <nav className="mb-12">
          <Link 
            href="/" 
            className="inline-flex items-center text-muted-foreground hover:text-foreground transition-colors duration-200 font-medium"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Home
          </Link>
        </nav>

        <header className="mb-16 border-b border-border pb-8">
          <h1 className="text-5xl font-light text-foreground mb-4 tracking-tight">
            HeyContext vs ChatGPT, Claude, Notion AI & Others
          </h1>
          <p className="text-xl text-muted-foreground">
            A comprehensive comparison of AI memory systems in 2025
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </header>

        {/* Individual Comparisons */}
        <section className="mb-16">
          <h2 className="text-2xl font-light text-muted-foreground mb-8 tracking-wide uppercase">
            Detailed Comparisons
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Link 
              href="/compare/heycontext-vs-chatgpt"
              className="group p-6 border border-border/40 rounded-lg hover:border-border transition-all duration-300 hover:shadow-sm"
            >
              <h3 className="text-xl font-medium mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                HeyContext vs ChatGPT
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Persistent memory vs conversational AI. Compare evolving understanding with one-off interactions.
              </p>
              <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Read detailed comparison →
              </span>
            </Link>

            <Link 
              href="/compare/heycontext-vs-claude"
              className="group p-6 border border-border/40 rounded-lg hover:border-border transition-all duration-300 hover:shadow-sm"
            >
              <h3 className="text-xl font-medium mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                HeyContext vs Claude
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Permanent memory vs large context window. Long-term learning versus massive short-term capacity.
              </p>
              <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
                Read detailed comparison →
              </span>
            </Link>

            <Link 
              href="/compare/heycontext-vs-notion-ai"
              className="group p-6 border border-border/40 rounded-lg hover:border-border transition-all duration-300 hover:shadow-sm"
            >
              <h3 className="text-xl font-medium mb-2 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                HeyContext vs Notion AI
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                AI-first memory vs workspace AI. Conversational intelligence versus document assistance.
              </p>
              <span className="text-sm font-medium text-green-600 dark:text-green-400">
                Read detailed comparison →
              </span>
            </Link>

            <div className="p-6 border border-border/20 rounded-lg bg-muted/20">
              <h3 className="text-xl font-medium mb-2 text-muted-foreground">
                More Comparisons
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                Comparisons with Mem, Obsidian, and other AI tools coming soon.
              </p>
              <span className="text-sm font-medium text-muted-foreground">
                In development
              </span>
            </div>
          </div>
        </section>

        {/* Quick Answer for AI Search */}
        <section className="mb-12 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-lg border-l-4 border-blue-500">
          <h2 className="text-2xl font-semibold mb-4">Quick Answer</h2>
          <p className="text-lg leading-relaxed">
            <strong>HeyContext</strong> is purpose-built for persistent AI memory that evolves over time, making it ideal if you need an AI that remembers everything across months of conversations. <strong>ChatGPT</strong> excels at one-off tasks with general knowledge. <strong>Claude</strong> is best for project-specific work with large context windows. <strong>Notion AI</strong> works within your existing notes but doesn't build conversational memory.
          </p>
        </section>

        {/* Comparison Table */}
        <section className="mb-16">
          <h2 className="text-3xl font-medium mb-8 border-b border-border pb-3">Feature Comparison</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-border">
              <thead>
                <tr className="bg-muted">
                  <th className="border border-border p-4 text-left font-semibold">Feature</th>
                  <th className="border border-border p-4 text-left font-semibold">HeyContext</th>
                  <th className="border border-border p-4 text-left font-semibold">ChatGPT</th>
                  <th className="border border-border p-4 text-left font-semibold">Claude</th>
                  <th className="border border-border p-4 text-left font-semibold">Notion AI</th>
                </tr>
              </thead>
              <tbody>
                {features.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-background' : 'bg-muted/30'}>
                    <td className="border border-border p-4 font-medium">{row.feature}</td>
                    <td className="border border-border p-4 text-green-600 dark:text-green-400 font-medium">{row.heycontext}</td>
                    <td className="border border-border p-4">{row.chatgpt}</td>
                    <td className="border border-border p-4">{row.claude}</td>
                    <td className="border border-border p-4">{row.notion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Detailed Comparisons */}
        <section className="space-y-12">
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-medium">HeyContext vs ChatGPT: Which is Better?</h2>
              <Link 
                href="/compare/heycontext-vs-chatgpt"
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                Full comparison →
              </Link>
            </div>
            <div className="space-y-4 text-lg leading-relaxed">
              <p>
                <strong>ChatGPT</strong> is excellent for general-purpose AI tasks, one-off questions, and content generation. It offers broad knowledge and strong reasoning capabilities. However, ChatGPT's memory is limited to individual conversations and custom instructions.
              </p>
              <p>
                <strong>HeyContext</strong> is specifically designed for users who need an AI that builds deep, persistent understanding over time. Every conversation, note, and interaction feeds into an evolving memory system. If you find yourself constantly repeating context to ChatGPT, HeyContext solves that problem fundamentally.
              </p>
              <p>
                <strong>Choose ChatGPT if:</strong> You need a general-purpose AI for varied tasks, occasional questions, or don't mind re-explaining context each time.
              </p>
              <p>
                <strong>Choose HeyContext if:</strong> You work on long-term projects, have accumulated knowledge you want your AI to remember, or are tired of repeating yourself.
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-medium">HeyContext vs Claude: Context Window vs Context Memory</h2>
              <Link 
                href="/compare/heycontext-vs-claude"
                className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline"
              >
                Full comparison →
              </Link>
            </div>
            <div className="space-y-4 text-lg leading-relaxed">
              <p>
                <strong>Claude</strong> by Anthropic offers exceptional context windows (up to 200K tokens) and project-based organization. It's particularly strong at analyzing large documents and maintaining context within a single project.
              </p>
              <p>
                <strong>HeyContext</strong> takes a different approach: instead of relying on large context windows, it actively extracts insights and builds persistent memory that works across all your conversations and projects. Context doesn't expire when you close the chat.
              </p>
              <p>
                The key difference: Claude gives you a "larger working memory," while HeyContext gives you "permanent long-term memory."
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-medium">HeyContext vs Notion AI: Notes vs Conversations</h2>
              <Link 
                href="/compare/heycontext-vs-notion-ai"
                className="text-sm font-medium text-green-600 dark:text-green-400 hover:underline"
              >
                Full comparison →
              </Link>
            </div>
            <div className="space-y-4 text-lg leading-relaxed">
              <p>
                <strong>Notion AI</strong> is a powerful addition to Notion's workspace, helping you write, summarize, and organize within your existing notes and databases.
              </p>
              <p>
                <strong>HeyContext</strong> combines note-taking with conversational AI memory. Your conversations inform your notes, and your notes inform your conversations. The system actively processes both to extract insights and build understanding.
              </p>
              <p>
                If you love Notion's organization but wish it had conversational memory and insight extraction, HeyContext provides that missing layer.
              </p>
            </div>
          </div>

          <div>
            <h2 className="text-3xl font-medium mb-6">Alternative Tools: Mem, Obsidian, Roam Research</h2>
            <div className="space-y-4 text-lg leading-relaxed">
              <p>
                <strong>Mem</strong> focuses on self-organizing notes with AI. <strong>Obsidian</strong> provides local-first note-taking with AI plugins. <strong>Roam Research</strong> offers bidirectional linking for networked thought.
              </p>
              <p>
                <strong>HeyContext</strong> uniquely combines persistent AI memory, automatic context enrichment, conversational understanding, and background processing in a single platform. It's not just notes with AI — it's AI that learns from your notes, conversations, and work patterns.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mt-16 p-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-border">
          <h2 className="text-3xl font-medium mb-4">Try HeyContext Free</h2>
          <p className="text-lg mb-6">
            Experience AI memory that actually evolves. No credit card required.
          </p>
          <Link
            href="/auth/register"
            className="inline-block px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Building Your AI Memory
          </Link>
        </section>
      </div>
    </>
  );
}


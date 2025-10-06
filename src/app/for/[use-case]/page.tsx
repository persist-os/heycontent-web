import React from 'react';
import Link from 'next/link';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { siteConfig } from '../../metadata';

// ISR: Revalidate every 6 hours
export const revalidate = 21600;

type UseCase = {
  slug: string;
  title: string;
  description: string;
  problem: string;
  solution: string;
  benefits: string[];
  targetAudience: string[];
};

const useCases: UseCase[] = [
  {
    slug: 'researchers',
    title: 'HeyContext for Researchers - AI Research Assistant That Remembers',
    description: 'Organize research papers, connect findings across months of reading, and build accumulated knowledge that informs every new paper you read.',
    problem: 'Research involves reading hundreds of papers over months or years. Traditional tools make you re-search your own notes constantly. You lose connections between papers you read months apart.',
    solution: 'HeyContext builds persistent memory of every paper, finding, and insight. When you read a new paper, it automatically surfaces relevant notes from months ago. Your research assistant that actually remembers your entire literature review.',
    benefits: [
      'Automatic connections between papers read months apart',
      'Persistent memory of all findings and insights',
      'Background processing identifies research patterns',
      'Smart notes that link to relevant conversations',
      'Never lose a citation or insight'
    ],
    targetAudience: ['Academic researchers', 'PhD students', 'Research scientists', 'Literature reviewers']
  },
  {
    slug: 'writers',
    title: 'HeyContext for Writers - AI Writing Partner That Knows Your Style',
    description: 'Build a writing assistant that learns your voice, remembers your character details, and helps maintain consistency across long-form projects.',
    problem: 'Long-form writing requires remembering details across thousands of pages. You waste time searching for that character detail you wrote three chapters ago. Your AI assistant forgets everything between sessions.',
    solution: 'HeyContext learns your writing style, remembers every character detail, plot point, and theme. Ask about anything you\'ve written, and it recalls instantly. Your writing partner that grows with your project.',
    benefits: [
      'Learns and adapts to your unique writing style',
      'Remembers all character details and plot points',
      'Maintains consistency across long projects',
      'Surfaces relevant past writing automatically',
      'Evolves understanding of your narrative'
    ],
    targetAudience: ['Novelists', 'Screenwriters', 'Technical writers', 'Content creators', 'Journalists']
  },
  {
    slug: 'developers',
    title: 'HeyContext for Developers - AI Code Assistant With Project Memory',
    description: 'Documentation that evolves with your codebase. An AI assistant that remembers your architecture decisions, naming conventions, and coding style.',
    problem: 'Codebases grow complex. New team members ask the same questions. Documentation gets outdated. AI assistants don\'t remember your project\'s specific patterns and decisions.',
    solution: 'HeyContext builds accumulated understanding of your codebase, architecture decisions, and development patterns. Every code review, design discussion, and documentation update feeds its memory.',
    benefits: [
      'Remembers architecture decisions and their context',
      'Learns your team\'s coding conventions',
      'Connects related code across repositories',
      'Onboards new developers with accumulated knowledge',
      'Documentation that stays current with conversations'
    ],
    targetAudience: ['Software developers', 'Engineering teams', 'Tech leads', 'DevOps engineers']
  },
  {
    slug: 'knowledge-workers',
    title: 'HeyContext for Knowledge Workers - AI That Remembers Everything',
    description: 'Stop repeating yourself. An AI assistant that builds deep understanding of your work, projects, and thinking patterns over time.',
    problem: 'You explain the same context to AI tools every day. Your insights are scattered across tools. You waste time searching your own notes. AI assistants treat every conversation like the first.',
    solution: 'HeyContext is your second brain. It remembers every project, conversation, and insight. Automatically connects related thinking across weeks or months. Background processing identifies patterns you miss.',
    benefits: [
      'Stop repeating context to your AI',
      'Automatic insight extraction from all work',
      'Connections across projects and time',
      'Background processing while you work',
      'One system that grows with you'
    ],
    targetAudience: ['Consultants', 'Project managers', 'Analysts', 'Strategists', 'Entrepreneurs']
  }
];

export async function generateStaticParams() {
  return useCases.map((useCase) => ({
    'use-case': useCase.slug,
  }));
}

export async function generateMetadata({ params }: { params: { 'use-case': string } }): Promise<Metadata> {
  const useCase = useCases.find(uc => uc.slug === params['use-case']);
  
  if (!useCase) {
    return {
      title: 'Use Case Not Found',
    };
  }

  return {
    title: useCase.title,
    description: useCase.description,
    keywords: [
      `HeyContext for ${useCase.slug}`,
      `AI for ${useCase.slug}`,
      ...useCase.targetAudience.map(audience => `AI assistant for ${audience.toLowerCase()}`),
      'persistent AI memory',
      'AI that remembers'
    ],
    openGraph: {
      title: useCase.title,
      description: useCase.description,
      type: 'article',
      url: `${siteConfig.url}/for/${useCase.slug}`,
    },
    alternates: {
      canonical: `${siteConfig.url}/for/${useCase.slug}`,
    },
  };
}

export default function UseCasePage({ params }: { params: { 'use-case': string } }) {
  const useCase = useCases.find(uc => uc.slug === params['use-case']);

  if (!useCase) {
    notFound();
  }

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": useCase.title,
    "description": useCase.description,
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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      
      <div className="max-w-4xl mx-auto px-4 py-12">
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

        <header className="mb-16">
          <h1 className="text-5xl font-light text-foreground mb-6 tracking-tight">
            {useCase.title}
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            {useCase.description}
          </p>
        </header>

        <section className="mb-12 space-y-8">
          <div>
            <h2 className="text-3xl font-medium mb-4">The Problem</h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              {useCase.problem}
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-medium mb-4">How HeyContext Solves This</h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              {useCase.solution}
            </p>
          </div>

          <div>
            <h2 className="text-3xl font-medium mb-4">Key Benefits</h2>
            <ul className="space-y-3">
              {useCase.benefits.map((benefit, idx) => (
                <li key={idx} className="flex items-start text-lg">
                  <svg className="w-6 h-6 text-green-500 mr-3 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-3xl font-medium mb-4">Perfect For</h2>
            <div className="flex flex-wrap gap-3">
              {useCase.targetAudience.map((audience, idx) => (
                <span key={idx} className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded-full text-sm font-medium">
                  {audience}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="mt-16 p-8 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-border">
          <h2 className="text-3xl font-medium mb-4">Try HeyContext Free</h2>
          <p className="text-lg mb-6">
            Start building AI memory that evolves with your work. No credit card required.
          </p>
          <Link
            href="/auth/register"
            className="inline-block px-8 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
          </Link>
        </section>
      </div>
    </>
  );
}


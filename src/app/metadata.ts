// Centralized metadata configuration for HeyContext
export const siteConfig = {
  name: 'HeyContext',
  url: 'https://heycontext.ai',
  description: 'Stop repeating yourself. AI-powered memory system that learns from every conversation, connects your thoughts automatically, and surfaces insights from your accumulated knowledge. Your personal AI that actually remembers and evolves with you.',
  ogImage: 'https://heycontext.ai/dashboard-preview.png',
  twitterHandle: '@heycontext',
  
  keywords: [
    // Primary keywords
    'HeyContext',
    'hey context',
    'heycontext ai',
    
    // Core functionality
    'AI memory',
    'AI that remembers',
    'persistent AI memory',
    'evolving AI memory',
    'memory-first AI',
    'context aware AI',
    'contextual intelligence',
    
    // Use cases
    'stop repeating yourself to AI',
    'connected thinking',
    'automatic context',
    'conversation memory',
    'accumulated knowledge',
    'thought organization',
    'knowledge management',
    
    // Features
    'AI note taking',
    'intelligent note taking',
    'background processing AI',
    'AI insights',
    'pattern recognition AI',
    
    // Competitors & alternatives
    'ChatGPT with memory',
    'Claude alternative',
    'personal AI assistant',
    'second brain',
    'digital memory',
    'cognitive AI',
    'Notion AI alternative',
    'Obsidian with AI',
    'Roam Research AI',
    'Mem alternative',
    
    // Privacy & security
    'private AI',
    'secure AI platform',
    'privacy-first AI',
    
    // Platform
    'AI memory platform',
    'AI workspace',
    'productivity AI',
  ],
  
  structuredData: {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'HeyContext',
    applicationCategory: 'ProductivityApplication',
    operatingSystem: 'Web, iOS, Android',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    description: 'AI-powered memory system that learns from every conversation and connects your thoughts automatically.',
  },
};

export const generatePageMetadata = (page: {
  title: string;
  description: string;
  keywords?: string[];
  image?: string;
  path?: string;
}) => {
  const url = page.path ? `${siteConfig.url}${page.path}` : siteConfig.url;
  const image = page.image || siteConfig.ogImage;
  
  return {
    title: page.title,
    description: page.description,
    keywords: [...siteConfig.keywords, ...(page.keywords || [])],
    openGraph: {
      title: page.title,
      description: page.description,
      url,
      images: [{ url: image }],
      type: 'website' as const,
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: page.title,
      description: page.description,
      images: [image],
    },
    alternates: {
      canonical: url,
    },
  };
};


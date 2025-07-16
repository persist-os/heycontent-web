import { Partnership } from '../types';

export const mockPartnerships: Partnership[] = [
  {
    id: 'mock-1',
    emailThreadId: 'thread-1',
    brandName: 'TechCorp',
    subject: 'Partnership Proposal for Q1 Campaign',
    from: 'partnerships@techcorp.com',
    snippet: 'Hi there! We love your content and would like to explore a potential partnership opportunity...',
    messageCount: 3,
    lastActivity: Date.now() - 2 * 24 * 60 * 60 * 1000, // 2 days ago
    estimatedValue: 5000,
    status: 'active' as const,
    category: 'partnership' as const,
    smartNoteIds: [],
    createdAt: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
    updatedAt: Date.now() - 2 * 24 * 60 * 60 * 1000 // 2 days ago
  },
  {
    id: 'mock-2',
    emailThreadId: 'thread-2',
    brandName: 'FashionBrand',
    subject: 'Influencer Collaboration Opportunity',
    from: 'creator@fashionbrand.com',
    snippet: 'Your aesthetic perfectly aligns with our brand values. Let\'s discuss a collaboration...',
    messageCount: 2,
    lastActivity: Date.now() - 1 * 24 * 60 * 60 * 1000, // 1 day ago
    estimatedValue: 3200,
    status: 'negotiating' as const,
    category: 'media' as const,
    smartNoteIds: [],
    createdAt: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
    updatedAt: Date.now() - 1 * 24 * 60 * 60 * 1000 // 1 day ago
  },
  {
    id: 'mock-3',
    emailThreadId: 'thread-3',
    brandName: 'StartupX',
    subject: 'Content Creation Partnership',
    from: 'hello@startupx.io',
    snippet: 'We\'re launching a new product and would love to have you create content about it...',
    messageCount: 1,
    lastActivity: Date.now() - 3 * 24 * 60 * 60 * 1000, // 3 days ago
    estimatedValue: 1500,
    status: 'inquiry' as const,
    category: 'business' as const,
    smartNoteIds: [],
    createdAt: Date.now() - 4 * 24 * 60 * 60 * 1000, // 4 days ago
    updatedAt: Date.now() - 3 * 24 * 60 * 60 * 1000 // 3 days ago
  },
  {
    id: 'mock-4',
    emailThreadId: 'thread-4',
    brandName: 'BigCompany',
    subject: 'Long-term Brand Ambassador Program',
    from: 'ambassadors@bigcompany.com',
    snippet: 'We\'ve been following your work and are impressed with your engagement rates...',
    messageCount: 5,
    lastActivity: Date.now() - 5 * 24 * 60 * 60 * 1000, // 5 days ago
    estimatedValue: 8000,
    status: 'active' as const,
    category: 'partnership' as const,
    smartNoteIds: [],
    createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000, // 10 days ago
    updatedAt: Date.now() - 5 * 24 * 60 * 60 * 1000 // 5 days ago
  },
  {
    id: 'mock-5',
    emailThreadId: 'thread-5',
    brandName: 'LocalBusiness',
    subject: 'Social Media Collaboration',
    from: 'social@localbusiness.com',
    snippet: 'As a local business, we\'d love to support creators in our community...',
    messageCount: 1,
    lastActivity: Date.now() - 7 * 24 * 60 * 60 * 1000, // 7 days ago
    estimatedValue: 500,
    status: 'opportunity' as const,
    category: 'community' as const,
    smartNoteIds: [],
    createdAt: Date.now() - 8 * 24 * 60 * 60 * 1000, // 8 days ago
    updatedAt: Date.now() - 7 * 24 * 60 * 60 * 1000 // 7 days ago
  }
];

export const mockPartnershipMetrics = {
  activePartnerships: 2,
  pendingResponses: 3,
  pipelineValue: 18200
};

export function getMockData() {
  // Calculate brand deals count dynamically
  const brandDealsCount = mockPartnerships.filter(partnership => 
    partnership.estimatedValue > 500 || 
    partnership.status === 'negotiating' || 
    partnership.messageCount > 5
  ).length;

  // Group emails by category
  const groupedEmails = mockPartnerships.reduce((acc, partnership) => {
    const category = partnership.category || 'partnership';
    if (!acc[category]) acc[category] = [];
    acc[category].push(partnership);
    return acc;
  }, {} as Record<string, Partnership[]>);

  return {
    partnerships: mockPartnerships,
    partnershipMetrics: mockPartnershipMetrics,
    brandDealsCount,
    groupedEmails
  };
} 
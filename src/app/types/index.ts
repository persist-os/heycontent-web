export * from './chat';

export interface InsightContext {
  why: string[];
  data: string[];
  source: string;
  sourceDetails: string[];
  emails?: Array<{
    subject: string;
    from: string;
    date: string;
    dealValue?: number;
    dealType?: string;
  }>;
  videos?: Array<{
    title: string;
    views: string | number;
    engagement: string | number;
  }>;
  threadDetails?: Array<{
    threadId: string;
    subject: string;
    from: string;
    snippet: string;
    date: string;
  }>;
}

export interface AIActionableInsight {
  id: number | string;
  type: 'partnership' | 'content' | 'platform';
  opportunity: {
    title: string;
    description: string;
    impact: string;
    timing: string;
    confidence: number;
  };
  action: {
    steps: string[];
    timeToImplement: string;
    expectedOutcome: string;
    requirements: string[];
    type?: string;
    priority?: 'high' | 'medium' | 'low';
  };
  context: InsightContext;
}

export interface PartnershipContact {
  name: string;
  role: string;
  email: string;
}

export interface PartnershipEvent {
  date: string;
  event: string;
}

export interface Partnership {
  id: number;
  brand: string;
  type: string;
  status?: string;
  value?: string;
  deadline?: string;
  alignmentScore?: number;
  requirements?: string[];
  progress?: number;
  lastContact?: string;
  contacts: PartnershipContact[];
  history: PartnershipEvent[];
  receivedDate?: string;
  estimatedValue?: string;
  signals?: {
    comments: number;
    likes: number;
    dms: number;
  };
  confidence?: number;
  potentialValue?: string;
} 
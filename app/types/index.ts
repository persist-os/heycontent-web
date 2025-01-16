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
export interface SocialMetrics {
  platform: 'youtube' | 'instagram' | 'tiktok';
  metric: 'engagement' | 'reach' | 'followers' | 'views';
  timeframe: 'day' | 'week' | 'month';
  data: any;
}

export interface PartnershipData {
  id: string;
  name: string;
  platform: string;
  niche: string;
  audienceSize: number;
  emailHistory?: EmailAnalysis;
  socialMetrics?: SocialMetrics;
}

export interface EmailAnalysis {
  totalEmails: number;
  averageResponseTime: string;
  sentiment: 'positive' | 'neutral' | 'negative';
  lastInteraction: Date;
  topics: string[];
}

export interface ContentInsight {
  type: 'video' | 'post' | 'story' | 'reel';
  platform: string;
  performance: {
    views: number;
    engagement: number;
    retention?: number;
  };
  recommendations: string[];
}

export interface AudienceInsight {
  demographics: any;
  interests: string[];
  engagement_patterns: any;
  growth_trends: any;
}

export interface AIActionableInsight {
  id: number;
  type: 'content' | 'platform' | 'market';
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
    requirements?: string[];
  };
  context: {
    why: string[];
    data: string[];
  };
} 
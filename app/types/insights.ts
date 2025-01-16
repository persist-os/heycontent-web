import { PartnershipAnalysis } from './social-platforms';

export interface ContentInsight {
  type: 'partnership' | 'content' | 'engagement' | 'trend';
  title?: string;
  description?: string;
  source: 'youtube' | 'gmail' | 'combined';
  confidence: number;
  data: {
    partnerships?: number;
    avgDealValue?: number;
    contentAlignment?: boolean;
    audienceAlignment?: boolean;
    partnershipPotential?: boolean;
    engagementPotential?: 'high' | 'medium' | 'low';
    [key: string]: any;
  };
  action?: {
    type: string;
    steps: string[];
    priority: 'high' | 'medium' | 'low';
  };
}

export interface InsightContext {
  partnerships?: Array<{
    type: string;
    status: string;
    performance?: any;
  }>;
  audience?: Array<{
    demographics: any;
    interests: string[];
  }>;
  metrics?: {
    engagement: any;
    reach: any;
    growth: any;
  };
  insights?: ContentInsight[];
}

export interface EnhancedInsights {
  partnership_history: Array<{
    type: string;
    status: string;
    performance?: any;
  }>;
  audience_alignment: {
    demographics: any;
    interests: string[];
  } | null;
  performance_metrics: {
    engagement: any;
    reach: any;
    growth: any;
  } | null;
  related_insights: Array<{
    type: string;
    title: string;
    description: string;
    confidence: number;
  }>;
} 
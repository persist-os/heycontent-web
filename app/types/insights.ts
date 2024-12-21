import { PartnershipAnalysis } from './social-platforms';

export interface ContentInsight {
  type: 'partnership' | 'content' | 'engagement' | 'trend';
  title: string;
  description: string;
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
    subject: string;
    analysis: PartnershipAnalysis;
  }>;
  videoMetrics?: Array<{
    id: string;
    views: number;
    likes: number;
    comments: number;
  }>;
  channelMetrics?: {
    subscribers: number;
    totalViews: number;
    engagementRate: number;
  };
} 
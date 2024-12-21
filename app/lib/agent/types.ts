import { SocialPlatform } from '@/types/social-platforms';
import { ContentInsight, InsightContext } from '../../types/insights';

export interface ProcessMetrics {
  youtube?: {
    views: number;
    subscribers: number;
    engagement: number;
  };
  gmail?: {
    totalEmails: number;
    partnerships: number;
  };
  [key: string]: any;
}

export interface ProcessContext {
  metrics?: ProcessMetrics;
  persona?: {
    currentPersona: string;
    futureVision: string;
    timestamp: string;
  };
  userId: string;
  connectedPlatforms: SocialPlatform[];
  existingInsights?: ContentInsight[];
  insightContext?: InsightContext;
} 
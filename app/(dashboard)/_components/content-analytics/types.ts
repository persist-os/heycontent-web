// Types for Content Analytics components

export interface ContentItem {
  id: string;
  platform: 'instagram' | 'youtube' | 'gmail';
  type: 'post' | 'video' | 'tweet' | 'email';
  content: {
    text?: string;
    mediaUrl?: string;
    thumbnail?: string;
    subject?: string;
    recipients?: number;
    emailType?: 'newsletter' | 'partnership' | 'individual';
    partnerName?: string;
    thread?: {
      messageCount: number;
      lastReplyDate: string;
    };
  };
  metrics: {
    views: number;
    engagement: number;
    likes?: number;
    comments?: number;
    shares?: number;
    openRate?: number;
    clickRate?: number;
    replies?: number;
    responseTime?: number; // in hours
    dealValue?: number;
  };
  performance: {
    trend: 'up' | 'down' | 'stable';
    percentageChange: number;
  };
  publishedAt: string;
}

export type TimeRange = '7d' | '30d' | '90d';
export type SortOption = 'date' | 'engagement' | 'performance';
export type FilterType = 'all' | 'post' | 'video' | 'email';
export type Platform = 'all' | 'instagram' | 'youtube' | 'tiktok' | 'gmail';
export type EmailType = 'all' | 'newsletter' | 'partnership' | 'individual';

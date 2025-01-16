export type SocialPlatform = 
  | 'instagram' 
  | 'youtube' 
  | 'tiktok' 
  | 'gmail'

export interface EmailMessage {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  date: Date;
  body: string;
  snippet?: string;
  labels: string[];
  isRead: boolean;
  isStarred?: boolean;
  attachments?: Array<{
    filename: string;
    contentType: string;
    size: number;
  }>;
}

export interface PartnershipAnalysis {
  isPartnership: boolean;
  dealValue?: number;
  dealType?: string;
  topics: string[];
  requirements?: string[];
  deadline?: string;
  priority: 'high' | 'medium' | 'low';
  stage?: 'initial' | 'negotiation' | 'agreement' | 'active';
  timeline?: string[];
  valueHistory?: Array<{
    date: string;
    value: number;
  }>;
  context?: {
    previousDeals?: Array<{value: number, date: string}>;
    relatedContent?: Array<{videoId: string, title: string, views: number}>;
    audienceMatch?: number;
  };
  metrics?: {
    responseTime?: {exact: string, trend: string};
    lastContact?: {date: string, type: string};
    dealStages?: {current: string, history: string[]};
  };
}

export interface ThreadMessage {
  id?: string;
  from?: string | null;
  date?: string | null;
  body: string;
}

export interface EmailThread {
  messages: ThreadMessage[];
}

export interface PartnershipEmail extends EmailMessage {
  analysis: PartnershipAnalysis;
  thread?: EmailThread;
}

export interface PlatformMetrics {
  youtube?: {
    views: number;
    subscribers: number;
    totalVideos: number;
    lastVideoViews?: number;
    lastVideoId?: string;
    lastVideoTitle?: string;
    lastVideoDate?: string;
    engagement: {
      likes: number;
      comments: number;
      shares: number;
    };
  };
  gmail?: {
    totalEmails: number;
    partnerships: number;
    unreadPartnerships: number;
    lastPartnershipDate?: string;
    averageDealValue?: number;
  };
}

export interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  username: string;
  profileUrl: string;
  avatarUrl?: string;
  isConnected: boolean;
  metrics: PlatformMetrics;
  lastUpdated: Date;
} 
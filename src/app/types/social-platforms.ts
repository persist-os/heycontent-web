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
  bcc?: string[];
  body: string;
  snippet?: string;
  date: Date;
  labels?: string[];
  attachments?: Array<{
    id: string;
    name: string;
    contentType: string;
    size: number;
  }>;
  isRead?: boolean;
  isStarred?: boolean;
  metadata?: {
    [key: string]: any;
  };
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
  id: string;
  messages: EmailMessage[];
  participants: string[];
  subject: string;
  lastMessageDate: Date;
  messageCount: number;
  labels?: string[];
  metadata?: {
    [key: string]: any;
  };
}

export interface EmailContext {
  threadId: string;
  subject: string;
  participants: string[];
  lastUpdate: Date;
  messageCount: number;
  summary?: string;
  topics?: string[];
  sentiment?: string;
  importance?: number;
}

export interface PostContext {
  postId: string;
  platform: 'instagram' | 'facebook' | 'twitter';
  type: 'post' | 'story' | 'reel';
  createdAt: Date;
  engagement: {
    likes: number;
    comments: number;
    shares?: number;
    views?: number;
  };
  topics?: string[];
  sentiment?: string;
}

export interface VideoContext {
  videoId: string;
  platform: 'youtube' | 'tiktok';
  title: string;
  description?: string;
  createdAt: Date;
  duration: number;
  engagement: {
    views: number;
    likes: number;
    comments: number;
    shares?: number;
  };
  topics?: string[];
  sentiment?: string;
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
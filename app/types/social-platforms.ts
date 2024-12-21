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
  date: Date;
  body: string;
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
}

export interface PartnershipEmail extends EmailMessage {
  analysis: PartnershipAnalysis;
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
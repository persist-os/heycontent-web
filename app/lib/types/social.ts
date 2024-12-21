export type SocialPlatform = 'youtube' | 'instagram' | 'tiktok' | 'gmail';

export interface SocialAccount {
  id: string;
  provider: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  token_type?: string;
  scope?: string;
  userId: string;
  updatedAt?: Date;
  error?: string;
}

export interface UserWithAccounts {
  id: string;
  accounts: SocialAccount[];
}

export interface BaseMetrics {
  engagement: {
    rate: number;
    total: number;
    details?: Record<string, number>;
  };
  reach: number;
  audience: {
    total: number;
    growth: number;
    demographics?: any;
  };
}

export interface YouTubeMetrics extends BaseMetrics {
  views: number;
  subscribers: number;
  watchTimeHours: number;
  averageViewDuration: number;
  totalViews: number;
  subscribersGained: number;
  subscribersLost: number;
  topVideos: Array<{
    id: string;
    title: string;
    views: number;
    likes: number;
    comments: number;
    publishedAt: string;
    thumbnailUrl: string;
  }>;
  engagement: {
    rate: number;
    total: number;
    likes: number;
    comments: number;
    shares: number;
    averageViewPercentage: number;
    details: {
      likes: number;
      comments: number;
      shares: number;
    };
  };
}

export interface InstagramMetrics extends BaseMetrics {
  followers: number;
  impressions: number;
  profileVisits: number;
  reels: number;
  stories: number;
  reachRate: number;
  saveRate: number;
  commentRate: number;
  engagement: {
    rate: number;
    total: number;
    details: {
      likes: number;
      comments: number;
      saves: number;
      shares: number;
    };
  };
}

export interface TikTokMetrics extends BaseMetrics {
  followers: number;
  views: number;
  shares: number;
  likes: number;
  comments: number;
  watchTime: number;
  completionRate: number;
  engagement: {
    rate: number;
    total: number;
    details: {
      likes: number;
      comments: number;
      shares: number;
    };
  };
}

export interface EmailMetrics extends BaseMetrics {
  opens: number;
  clicks: number;
  bounces: number;
  unsubscribes: number;
  totalSubscribers: number;
  activeSubscribers: number;
  averageOpenRate: number;
  averageClickRate: number;
  bounceRate: number;
  unsubscribeRate: number;
  engagement: {
    rate: number;
    total: number;
    details: {
      opens: number;
      clicks: number;
      replies: number;
    };
  };
} 
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
  timestamp: number;
  platform: string;
}

export interface YouTubeMetrics extends BaseMetrics {
  platform: 'youtube';
  videoId: string;
  views: number;
  totalViews: number;
  likes: number;
  comments: number;
  shares: number;
  averageViewDuration: number;
  retentionRate: number;
  subscribers: number;
  watchTimeHours: number;
  subscribersGained: number;
  subscribersLost: number;
  reach: number;
  audience: {
    total: number;
    growth: number;
    demographics: Record<string, any>;
  };
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
    clickThroughRate: number;
    watchTime: number;
    subscribersGained: number;
    subscribersLost: number;
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
  demographics?: {
    ageRanges: { [key: string]: number };
    genders: { [key: string]: number };
    locations: { [key: string]: number };
  };
}

export interface InstagramMetrics extends BaseMetrics {
  platform: 'instagram';
  postId: string;
  type: 'post' | 'story' | 'reel';
  impressions: number;
  reach: number;
  likes: number;
  comments: number;
  saves: number;
  shares: number;
  followers: number;
  reels: number;
  profileVisits: number;
  storyCount: number;
  reachRate: number;
  saveRate: number;
  commentRate: number;
  engagement: {
    rate: number;
    total: number;
    actions: {
      profile_visits: number;
      follows: number;
      link_clicks?: number;
    };
    details: {
      likes: number;
      comments: number;
      saves: number;
      shares: number;
    };
  };
  storyMetrics?: {
    exits: number;
    replies: number;
    taps_forward: number;
    taps_back: number;
  };
}

export interface TikTokMetrics extends BaseMetrics {
  platform: 'tiktok';
  videoId: string;
  caption?: string;
  soundId?: string;
  soundName?: string;
  challengeIds?: string[];
  challengeNames?: string[];
  url?: string;
  publishedAt?: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  watchTime: number;
  completionRate: number;
  followers: number;
  followerStats: {
    gained: number;
    lost: number;
  };
  engagement: {
    rate: number;
    watchTime: number;
    completionRate: number;
    total: number;
    details?: {
      likes: number;
      comments: number;
      shares: number;
    };
  };
  sound: {
    uses: number;
    shares: number;
  };
  hashtags?: {
    [tag: string]: {
      views: number;
      engagement: number;
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
  reach: number;
  audience: {
    total: number;
    growth: number;
  };
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
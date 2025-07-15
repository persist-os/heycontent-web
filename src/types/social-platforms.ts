export type SocialPlatform = 
  | 'instagram' 
  | 'youtube' 
  | 'tiktok' 
  | 'gmail'

export interface SocialAccount {
  id: string
  platform: SocialPlatform
  username: string
  profileUrl: string
  avatarUrl?: string
  isConnected: boolean
  metrics: PlatformMetrics
  lastUpdated: Date
}

export interface PlatformMetrics {
  followers?: number
  following?: number
  posts?: number
  views?: number
  engagementRate?: number
  subscribers?: number
  averageViews?: number
  emailList?: number
  openRate?: number
  clickRate?: number
}

export interface InstagramMetrics extends PlatformMetrics {
  reels?: number
  stories?: number
  reachRate?: number
  saveRate?: number
  commentRate?: number
}

export interface TikTokMetrics extends PlatformMetrics {
  likes: number
  shares: number
  comments: number
  watchTime: number
  completionRate: number
}

export interface YouTubeMetrics extends PlatformMetrics {
  totalViews: number
  watchTimeHours: number
  averageViewDuration: number
  subscribersGained: number
  subscribersLost: number
  topVideos: Array<{
    id: string
    title: string
    views: number
    likes: number
    comments: number
    publishedAt: string
    thumbnailUrl: string
  }>
  revenueData?: {
    estimatedRevenue: number
    adsRevenue: number
    membershipsRevenue: number
    superChatRevenue: number
  }
  engagement: {
    likes: number
    comments: number
    shares: number
    averageViewPercentage: number
  }
}

export interface PinterestMetrics extends PlatformMetrics {
  monthlyViews: number
  pins: number
  boards: number
  saves: number
  clicks: number
}

export interface EmailMetrics extends PlatformMetrics {
  totalSubscribers: number
  activeSubscribers: number
  averageOpenRate: number
  averageClickRate: number
  bounceRate: number
  unsubscribeRate: number
}

export interface SocialIntegrationConfig {
  platform: SocialPlatform
  apiKey?: string
  apiSecret?: string
  accessToken?: string
  refreshToken?: string
  scope?: string[]
  redirectUri?: string
  clientId?: string
  clientSecret?: string
}

export interface EmailIntegrationConfig extends SocialIntegrationConfig {
  platform: 'gmail'
  scope: string[]
  labels?: string[]  // Gmail labels
  searchQuery?: string
}

export interface EmailMessage {
  id: string
  threadId: string
  subject: string
  from: string
  to: string[]
  cc?: string[]
  bcc?: string[]
  date: Date
  body: string
  attachments?: Array<{
    filename: string
    contentType: string
    size: number
    url?: string
  }>
  labels?: string[]  // Gmail labels or Outlook folders
  isRead: boolean
  isStarred?: boolean
  isPartnership?: boolean  // Custom flag for partnership emails
} 
// Types for Content Analytics components

// Base type with common fields
export interface BaseContentItem {
  id: string;
  platform: PlatformType;
  publishedAt: string; // Represents creation/publish/received date
}

// --- Platform Specific Details --- //

// Instagram Post (Updated to match schema)
export interface InstagramContentDetails {
  text?: string; // Caption
  mediaUrl: string; // URL of the primary image/video
  mediaType: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REELS'; // Match schema exactly
  thumbnailUrl?: string; // Optional specific thumbnail
  permalink: string; // Direct link to the post
  timestamp?: number; // Unix timestamp of the post
  comments?: Array<{
    id: string;
    text: string;
    timestamp: number;
    username: string;
    like_count?: number;
    replies?: Array<{
      id: string;
      text: string;
      timestamp: number;
      username?: string;
    }>;
  }>; // Comments from the post
}
export interface InstagramMetrics {
  // From embedded insights
  impressions?: number;
  reach?: number;
  likes?: number; // From insights.likes
  comments?: number; // From insights.comments
  saved?: number; // From insights.saved
  shares?: number; // From insights.shares
  total_interactions?: number;
  profile_visits?: number;
  profile_activity?: number;
  views?: number;
  follows?: number;
  // Reels-specific
  ig_reels_avg_watch_time?: number;
  ig_reels_video_view_total_time?: number;
  // From post data (fallback)
  like_count?: number; // From data.like_count
  comments_count?: number; // From data.comments_count
}
export interface InstagramChildMedia {
  id: string;
  media_url: string;
  media_type: string;
  thumbnail_url?: string | null;
}
export interface InstagramContentItem extends BaseContentItem {
  platform: 'instagram';
  content: InstagramContentDetails;
  metrics: InstagramMetrics;
  analysis?: any; // Analysis data can be any type since it's stored as JSON
  analysisMarkdown?: string; // Markdown formatted analysis for display
  children?: InstagramChildMedia[]; // Array of child media items for carousel posts (typed properly)
  convexData?: any; // Full Convex document for complete data access
}

// YouTube Video
export interface YouTubeContentDetails {
  title: string;
  description?: string;
  thumbnailUrl: string; // Mandatory thumbnail
  videoUrl?: string; // Link to video
  channelTitle?: string;
  duration?: string; // Video duration
}
export interface YouTubeMetrics {
  views: number;
  likes: number;
  dislikes?: number;
  comments: number;
  shares?: number;
  watchTimeMinutes?: number;
  averageViewDurationSeconds?: number;
}
export interface YouTubeContentItem extends BaseContentItem {
  platform: 'youtube';
  content: YouTubeContentDetails;
  metrics: YouTubeMetrics;
  analysis?: any; // Analysis data can be any type since it's stored as JSON
  analysisMarkdown?: string; // Markdown formatted analysis for display
  aiAnalysis?: string; // For backward compatibility with existing code
  convexData?: any; // Full Convex document for complete data access
}

// Gmail Email
export interface GmailContentData {
  subject?: string; // Making optional since it might be in messages array
  snippet?: string; // Body preview
  from?: string; // Sender email/name - Making optional since it might be in messages array
  recipients?: number; // Count of recipients
  emailType?: 'newsletter' | 'partnership' | 'individual' | 'other';
  partnerName?: string;
  thread?: {
    threadId: string;
    messageCount: number;
    lastReplyDate?: string;
  };
  labels?: string[];
  threadId?: string;
  emailId?: string;
  // Add the actual structure from Convex
  messageCount?: number;
  messages?: Array<{
    from: string;
    id: string;
    label_ids: string[];
    snippet: string;
    subject: string;
  }>;
}
export interface GmailContentDetails {
  data: GmailContentData;
  // Add any non-user-visible fields here if needed in the future
}
export interface GmailMetrics {
  openRate?: number;
  clickRate?: number;
  replies?: number;
  responseTime?: number;
  dealValue?: number;
}
export interface GmailContentItem extends BaseContentItem {
  platform: 'gmail';
  content: GmailContentDetails;
  metrics: GmailMetrics;
  analysis?: any; // Analysis data can be any type since it's stored as JSON
  analysisMarkdown?: string; // Markdown formatted analysis for display
  convexData?: any; // Full Convex document for complete data access
}

// Union type for handling mixed content
export type AnyContentItem = InstagramContentItem | YouTubeContentItem | GmailContentItem;

// --- Supporting Types (Refined) --- //

// Specific platforms supported
export type PlatformType = 'instagram' | 'youtube' | 'gmail' | 'all';

// Filters and Sort Options (Keep as is for now)
export type TimeRange = '7d' | '30d' | '90d' | 'all';
// Updated Sort Options based on refined metrics
export type SortOption = 'date' | 'views' | 'likes' | 'comments' | 'replies' | 'openRate' | 'reach' | 'impressions' | 'watchTimeMinutes' | 'clickRate';
// FilterType removed - Use PlatformFilterType and EmailTypeFilter
export type PlatformFilterType = 'all' | PlatformType; // Renamed for clarity
export type EmailTypeFilter = 'all' | 'newsletter' | 'partnership' | 'individual' | 'other'; // Renamed for clarity & added 'other'
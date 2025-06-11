// Types for Content Analytics components

// Base type with common fields
export interface BaseContentItem {
  id: string;
  platform: PlatformType;
  publishedAt: string; // Represents creation/publish/received date
}

// --- Platform Specific Details --- //

// Instagram Post
export interface InstagramContentDetails {
  text?: string; // Caption
  mediaUrl: string; // URL of the primary image/video
  mediaType: 'image' | 'video' | 'carousel'; // More specific type
  thumbnailUrl?: string; // Optional specific thumbnail
  permalink: string; // Direct link to the post
}
export interface InstagramMetrics {
  impressions?: number;
  reach?: number;
  likes: number;
  comments: number;
  shares?: number; // Corresponds to saves/shares
}
export interface InstagramContentItem extends BaseContentItem {
  platform: 'instagram';
  content: InstagramContentDetails;
  metrics: InstagramMetrics;
}

// YouTube Video
export interface YouTubeContentDetails {
  title: string;
  description?: string;
  thumbnailUrl: string; // Mandatory thumbnail
  videoUrl?: string; // Link to video
  channelTitle?: string;
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
  aiAnalysis?: string; // For backward compatibility with existing code
}

// Gmail Email
export interface GmailContentDetails {
  subject: string;
  snippet?: string; // Body preview
  from?: string; // Sender email/name
  recipients?: number; // Count of recipients
  emailType: 'newsletter' | 'partnership' | 'individual' | 'other'; // Added 'other'
  partnerName?: string;
  thread?: {
    threadId: string; // Use thread ID
    messageCount: number;
    lastReplyDate?: string; // Make optional
  };
  labels?: string[]; // Gmail labels
  threadId?: string; // <-- Add this line to support direct threadId
}
export interface GmailMetrics {
  openRate?: number; // Optional - for tracked emails/campaigns
  clickRate?: number; // Optional - for tracked emails/campaigns
  replies?: number; // Count of replies in the thread? Or just to this message?
  responseTime?: number; // Optional - in hours
  dealValue?: number; // Optional
}
export interface GmailContentItem extends BaseContentItem {
  platform: 'gmail';
  content: GmailContentDetails;
  metrics: GmailMetrics;
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
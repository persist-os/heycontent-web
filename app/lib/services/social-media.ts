import { prisma } from "@/lib/prisma";
import { google, youtube_v3 } from 'googleapis';
import { SocialAccount, Account, Prisma, User } from '@prisma/client';
import type { 
  YouTubeMetrics, 
  InstagramMetrics, 
  TikTokMetrics, 
  EmailMetrics,
  SocialPlatform,
  BaseMetrics
} from "@/lib/types/social";
import { YouTubeService } from './youtube';

// Define as a type that matches JsonValue structure
type YouTubeMetadata = {
  [key: string]: string | undefined;
} & {
  channelId: string;
  channelTitle?: string;
};

// Create a type guard to check if metadata is YouTubeMetadata
function isYouTubeMetadata(metadata: Prisma.JsonValue): metadata is YouTubeMetadata {
  if (!metadata || typeof metadata !== 'object') return false;
  const m = metadata as Record<string, unknown>;
  return typeof m.channelId === 'string';
}

interface SocialAccountWithMetadata extends Omit<SocialAccount, 'metadata'> {
  metadata: YouTubeMetadata;
}

interface PlatformStatus {
  platform: SocialPlatform;
  isConnected: boolean;
  lastSync: Date | null;
  error?: string;
}

interface Platform {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
  name: string | null;
  partnerships: Prisma.JsonValue;
  metadata: Prisma.JsonValue;
  metrics: Prisma.JsonValue;
  error?: string;
  isConnected: boolean;
}

interface ExtendedAccount extends Account {
  updatedAt: Date;
  error?: string;
}

interface ExtendedSocialAccount extends SocialAccount {
  updatedAt: Date;
  error?: string;
}

interface UserWithAccounts extends User {
  accounts: (Account & {
    expires_at: number | null;
    access_token: string | null;
  })[];
  socialAccounts: (SocialAccount & {
    updatedAt: Date;
    error: string | null;
    isConnected: boolean;
    accessToken: string | null;
    metadata: Prisma.JsonValue;
  })[];
}

interface SocialMetrics {
  youtube?: {
    views: number;
    subscribers: number;
    engagement: number;
    lastVideo?: {
      id: string;
      title: string;
      views: number;
      likes: number;
      comments: number;
      publishedAt: string;
    };
  };
  instagram?: any;
  tiktok?: any;
  gmail?: any;
}

export class SocialMediaService {
  private youtube: youtube_v3.Youtube | null = null;

  constructor() {
    this.initializeYouTube();
  }

  private async initializeYouTube() {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      console.warn('YouTube API key not configured');
      return;
    }
    
    try {
      console.log('Initializing YouTube client with API key');
      this.youtube = google.youtube({
        version: 'v3',
        key: apiKey,
        retry: true,
        retryConfig: {
          retry: 3,
          retryDelay: 1000,
          statusCodesToRetry: [[500, 599]]
        }
      });
      console.log('YouTube client initialized successfully');
    } catch (error) {
      console.error('Error initializing YouTube client:', error);
    }
  }

  async setupOAuth2Client(accessToken: string) {
    try {
      console.log('Setting up OAuth2 client with access token');
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      
      oauth2Client.setCredentials({
        access_token: accessToken,
        token_type: 'Bearer'
      });
      
      this.youtube = google.youtube({
        version: 'v3',
        auth: oauth2Client,
        retry: true,
        retryConfig: {
          retry: 3,
          retryDelay: 1000,
          statusCodesToRetry: [[500, 599]]
        }
      });
      console.log('OAuth2 client setup complete');
    } catch (error) {
      console.error('Error setting up OAuth2 client:', error);
      throw error;
    }
  }

  async getYouTubeMetrics(channelId: string, timeframe: string): Promise<YouTubeMetrics | undefined> {
    if (!this.youtube) {
      console.warn('YouTube client not initialized');
      return undefined;
    }

    try {
      console.log('Fetching YouTube metrics for channel:', channelId);
      
      const channelResponse = await this.youtube.channels.list({
        id: [channelId],
        part: ['statistics']
      }).then(response => response.data);

      if (!channelResponse.items || channelResponse.items.length === 0) {
        console.error('No channel found with ID:', channelId);
        return undefined;
      }

      const statistics = channelResponse.items[0].statistics;
      
      if (!statistics) {
        console.error('No statistics found for channel:', channelId);
        return undefined;
      }

      console.log('Channel statistics retrieved:', statistics);
      
      const videoCount = parseInt(statistics.videoCount || '0');
      const maxResults = Math.min(videoCount, 10); // Limit to actual videos or 10, whichever is smaller

      const videosResponse = await this.youtube.search.list({
        channelId,
        part: ['id'],
        order: 'date',
        type: ['video'],
        maxResults,
        publishedAfter: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
      }).then(response => response.data);

      const videoIds = videosResponse.items
        ?.map(item => item.id?.videoId)
        .filter((id): id is string => !!id) || [];

      console.log('Found recent videos:', videoIds);
      
      let totalViews = 0;
      let totalLikes = 0;
      let totalComments = 0;
      let topVideos: YouTubeMetrics['topVideos'] = [];

      if (videoIds.length > 0) {
        const videosDetails = await this.youtube.videos.list({
          id: videoIds,
          part: ['statistics', 'snippet']
        }).then(response => response.data);

        videosDetails.items?.forEach((video: youtube_v3.Schema$Video) => {
          const stats = video.statistics;
          const snippet = video.snippet;
          if (stats) {
            totalViews += Number(stats.viewCount) || 0;
            totalLikes += Number(stats.likeCount) || 0;
            totalComments += Number(stats.commentCount) || 0;
          }
          if (snippet && video.id) {
            topVideos.push({
              id: video.id,
              title: snippet.title || '',
              views: Number(stats?.viewCount) || 0,
              likes: Number(stats?.likeCount) || 0,
              comments: Number(stats?.commentCount) || 0,
              publishedAt: snippet.publishedAt || '',
              thumbnailUrl: snippet.thumbnails?.default?.url || ''
            });
          }
        });

        console.log('Aggregated video metrics:', { totalViews, totalLikes, totalComments });
      }

      const metrics: YouTubeMetrics = {
        views: totalViews,
        reach: totalViews * 0.8, // Estimated reach
        audience: {
          total: Number(statistics.subscriberCount) || 0,
          growth: Number(statistics.subscriberCount) - (Number(statistics.subscriberCount) * 0.9), // Estimated growth
          demographics: {}
        },
        totalViews,
        watchTimeHours: 0,
        averageViewDuration: 0,
        subscribers: Number(statistics.subscriberCount) || 0,
        subscribersGained: 0,
        subscribersLost: 0,
        topVideos,
        engagement: {
          rate: (totalLikes + totalComments) / totalViews,
          total: totalLikes + totalComments,
          likes: totalLikes,
          comments: totalComments,
          shares: 0,
          averageViewPercentage: 0,
          details: {
            likes: totalLikes,
            comments: totalComments,
            shares: 0
          }
        }
      };

      console.log('Final YouTube metrics:', metrics);
      return metrics;

    } catch (error) {
      console.error('Error fetching YouTube metrics:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      throw error;
    }
  }

  async getInstagramMetrics(accessToken: string): Promise<InstagramMetrics | undefined> {
    try {
      // Get user profile and media insights
      const userResponse = await fetch(
        `https://graph.instagram.com/me?fields=id,username,media_count,followers_count,follows_count&access_token=${accessToken}`
      );
      const userData = await userResponse.json();

      // Get recent media to calculate engagement
      const mediaResponse = await fetch(
        `https://graph.instagram.com/me/media?fields=id,media_type,insights.metric(impressions,reach,engagement,saved)&access_token=${accessToken}`
      );
      const mediaData = await mediaResponse.json();

      // Calculate engagement metrics
      let totalLikes = 0;
      let totalComments = 0;
      let totalSaves = 0;
      let totalImpressions = 0;
      let totalReach = 0;

      if (mediaData.data) {
        for (const media of mediaData.data) {
          if (media.insights) {
            totalImpressions += media.insights.data.find((d: any) => d.name === 'impressions')?.values[0]?.value || 0;
            totalReach += media.insights.data.find((d: any) => d.name === 'reach')?.values[0]?.value || 0;
            totalSaves += media.insights.data.find((d: any) => d.name === 'saved')?.values[0]?.value || 0;
            
            const engagement = media.insights.data.find((d: any) => d.name === 'engagement')?.values[0]?.value || 0;
            totalLikes += engagement;
            totalComments += engagement * 0.1; // Approximate comment ratio
          }
        }
      }

      const totalEngagements = totalLikes + totalComments + totalSaves;
      const engagementRate = userData.followers_count ? 
        (totalEngagements / (userData.followers_count * mediaData.data?.length || 1)) * 100 : 0;

      return {
        followers: userData.followers_count || 0,
        impressions: totalImpressions,
        profileVisits: 0, // Requires additional permissions
        reels: 0, // Requires additional API call
        stories: 0, // Requires additional API call
        reachRate: userData.followers_count ? (totalReach / userData.followers_count) * 100 : 0,
        saveRate: mediaData.data?.length ? (totalSaves / mediaData.data.length) : 0,
        commentRate: mediaData.data?.length ? (totalComments / mediaData.data.length) : 0,
        reach: totalReach,
        audience: {
          total: userData.followers_count || 0,
          growth: 0 // Requires historical data comparison
        },
        engagement: {
          rate: engagementRate,
          total: totalEngagements,
          details: {
            likes: totalLikes,
            comments: totalComments,
            saves: totalSaves,
            shares: 0 // Not available in basic API
          }
        }
      };
    } catch (error) {
      console.error('Error fetching Instagram metrics:', error);
      return undefined;
    }
  }

  async getTikTokMetrics(accessToken: string): Promise<TikTokMetrics | undefined> {
    // TikTok API implementation will come later
    return {
      followers: 0,
      views: 0,
      shares: 0,
      likes: 0,
      comments: 0,
      watchTime: 0,
      completionRate: 0,
      reach: 0,
      audience: {
        total: 0,
        growth: 0
      },
      engagement: {
        rate: 0,
        total: 0,
        details: {
          likes: 0,
          comments: 0,
          shares: 0
        }
      }
    };
  }

  async getEmailMetrics(accessToken: string): Promise<EmailMetrics | undefined> {
    try {
      // Set up Gmail client
      const auth = new google.auth.OAuth2()
      auth.setCredentials({ access_token: accessToken })
      const gmail = google.gmail({ version: 'v1', auth })

      // Get user profile for total counts
      const profile = await gmail.users.getProfile({
        userId: 'me'
      });

      // Get messages from last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const q = `after:${Math.floor(thirtyDaysAgo.getTime() / 1000)}`;

      const messages = await gmail.users.messages.list({
        userId: 'me',
        q,
        maxResults: 100
      });

      let totalOpens = 0;
      let totalReplies = 0;
      let totalUnread = 0;

      // Process messages to get engagement metrics
      if (messages.data.messages) {
        for (const message of messages.data.messages) {
          const fullMessage = await gmail.users.messages.get({
            userId: 'me',
            id: message.id!
          });

          const labels = fullMessage.data.labelIds || [];
          if (labels.includes('UNREAD')) {
            totalUnread++;
          }
          if (labels.includes('SENT')) {
            totalReplies++;
          }
          // Consider a message "opened" if it's not unread
          if (!labels.includes('UNREAD')) {
            totalOpens++;
          }
        }
      }

      const totalMessages = messages.data.messages?.length || 0;
      const openRate = totalMessages > 0 ? (totalOpens / totalMessages) * 100 : 0;
      const replyRate = totalMessages > 0 ? (totalReplies / totalMessages) * 100 : 0;

      return {
        opens: totalOpens,
        clicks: 0, // Not available in Gmail API
        bounces: 0, // Would need to check for bounce notifications
        unsubscribes: 0, // Would need to check for unsubscribe headers
        totalSubscribers: profile.data.messagesTotal || 0,
        activeSubscribers: profile.data.threadsTotal || 0,
        averageOpenRate: openRate,
        averageClickRate: 0, // Not available in Gmail API
        bounceRate: 0, // Would need historical bounce data
        unsubscribeRate: 0, // Would need historical unsubscribe data
        reach: profile.data.threadsTotal || 0,
        audience: {
          total: profile.data.messagesTotal || 0,
          growth: 0 // Would need historical data comparison
        },
        engagement: {
          rate: replyRate,
          total: totalReplies,
          details: {
            opens: totalOpens,
            clicks: 0, // Not available in Gmail API
            replies: totalReplies
          }
        }
      };
    } catch (error) {
      console.error('Error fetching Gmail metrics:', error);
      return undefined;
    }
  }

  async getPlatformStatus(): Promise<PlatformStatus[]> {
    try {
      const user = await prisma.user.findFirst({
        include: {
          accounts: {
            select: {
              id: true,
              provider: true,
              access_token: true,
              expires_at: true
            }
          },
          socialAccounts: {
            select: {
              id: true,
              platform: true,
              isConnected: true,
              updatedAt: true
            }
          }
        }
      }) as UserWithAccounts | null;

      if (!user) return [];

      const status: PlatformStatus[] = [];

      // Check Gmail status
      const gmailAccount = user.accounts.find((acc: Account) => acc.provider === 'google');
      status.push({
        platform: 'gmail',
        isConnected: !!gmailAccount?.access_token,
        lastSync: gmailAccount?.expires_at ? new Date(gmailAccount.expires_at * 1000) : null
      });

      // Check social platform status
      const platforms: SocialPlatform[] = ['youtube', 'instagram', 'tiktok'];
      for (const platform of platforms) {
        const account = user.socialAccounts.find((acc: SocialAccount) => acc.platform === platform);
        status.push({
          platform,
          isConnected: !!account?.isConnected,
          lastSync: account?.updatedAt || null,
          error: account?.error || undefined
        });
      }

      return status;
    } catch (error) {
      console.error('Error getting platform status:', error);
      return [];
    }
  }

  async getMetrics(): Promise<SocialMetrics | null> {
    try {
      const metrics: SocialMetrics = {};

      // Get connected accounts
      const connectedAccounts = await prisma.socialAccount.findMany({
        where: {
          isConnected: true
        },
        include: {
          user: {
            include: {
              accounts: true
            }
          }
        }
      });

      // Process each connected platform
      for (const socialAccount of connectedAccounts) {
        try {
          switch (socialAccount.platform as SocialPlatform) {
            case 'youtube':
              const googleAccount = socialAccount.user?.accounts.find(
                acc => acc.provider === 'google'
              );
              
              if (googleAccount) {
                const youtubeService = new YouTubeService(googleAccount.id);
                const channelId = socialAccount.profileUrl?.split('/').pop();
                
                if (channelId) {
                  const videoIds = await youtubeService.getRecentVideoIds(channelId);
                  const lastVideoMetrics = videoIds.length > 0 
                    ? await youtubeService.getVideoMetrics(videoIds[0])
                    : undefined;

                  metrics.youtube = {
                    views: 0, // You'll need to implement getChannelMetrics to get this
                    subscribers: 0,
                    engagement: 0,
                    lastVideo: lastVideoMetrics ? {
                      id: videoIds[0],
                      title: lastVideoMetrics.title,
                      views: lastVideoMetrics.views,
                      likes: lastVideoMetrics.likes,
                      comments: lastVideoMetrics.comments,
                      publishedAt: lastVideoMetrics.publishedAt
                    } : undefined
                  };
                }
              }
              break;
            // Add other platforms here
          }
        } catch (error) {
          console.error(`Error fetching metrics for ${socialAccount.platform}:`, error);
          // Don't let one platform's error affect others
          continue;
        }
      }

      return metrics;
    } catch (error) {
      console.error('Error fetching social media metrics:', error);
      return null;
    }
  }
} 
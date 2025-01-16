import { SocialMediaService } from "@/lib/services/social-media";
import { RAGSystem } from "@/lib/rag";
import { BaseTool } from "./base-tool";
import { z } from "zod";
import type { 
  YouTubeMetrics, 
  InstagramMetrics, 
  TikTokMetrics, 
  EmailMetrics,
  SocialPlatform,
  BaseMetrics
} from "@/lib/types/social";

interface RawYouTubeMetrics {
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
    thumbnailUrl: string;
  };
}

interface SocialMetricsResponse {
  youtube?: RawYouTubeMetrics;
  instagram?: InstagramMetrics;
  tiktok?: TikTokMetrics;
  gmail?: EmailMetrics;
}

const SocialMediaSchema = z.object({
  platform: z.enum(['youtube', 'instagram', 'tiktok', 'gmail']).optional(),
  timeframe: z.enum(['day', 'week', 'month', 'year']).optional()
});

export class SocialMediaTool extends BaseTool {
  name = "social_media";
  description = "Get social media metrics and insights";
  protected _schema = SocialMediaSchema;
  
  constructor(
    private socialService: SocialMediaService,
    private rag: RAGSystem
  ) {
    super();
  }

  async _call(args: z.infer<typeof SocialMediaSchema>) {
    try {
      const metrics = await this.socialService.getMetrics() as SocialMetricsResponse;
      if (!metrics) return "No metrics available";

      const { platform } = args;
      if (platform) {
        switch (platform.toLowerCase()) {
          case 'youtube':
            if (!metrics.youtube) return "YouTube metrics not available";
            const youtubeMetrics = this.formatYouTubeMetrics(metrics.youtube);
            return this.formatMetricsForDisplay(youtubeMetrics);
          case 'instagram':
            if (!metrics.instagram) return "Instagram metrics not available";
            return this.formatInstagramMetrics(metrics.instagram);
          case 'tiktok':
            if (!metrics.tiktok) return "TikTok metrics not available";
            return this.formatTikTokMetrics(metrics.tiktok);
          case 'gmail':
            if (!metrics.gmail) return "Email metrics not available";
            return this.formatEmailMetrics(metrics.gmail);
          default:
            return "Platform not supported";
        }
      }

      return this.formatAllMetrics(metrics);
    } catch (error) {
      console.error('Error in SocialMediaTool:', error);
      return "Error fetching social media metrics";
    }
  }

  private formatYouTubeMetrics(rawMetrics: RawYouTubeMetrics): YouTubeMetrics {
    return {
      views: rawMetrics.views,
      subscribers: rawMetrics.subscribers,
      watchTimeHours: 0,
      averageViewDuration: 0,
      totalViews: rawMetrics.views,
      subscribersGained: 0,
      subscribersLost: 0,
      engagement: {
        rate: rawMetrics.engagement,
        total: rawMetrics.engagement,
        likes: rawMetrics.lastVideo?.likes || 0,
        comments: rawMetrics.lastVideo?.comments || 0,
        shares: 0,
        averageViewPercentage: 0,
        details: {
          likes: rawMetrics.lastVideo?.likes || 0,
          comments: rawMetrics.lastVideo?.comments || 0,
          shares: 0
        }
      },
      reach: 0,
      audience: {
        total: rawMetrics.subscribers,
        growth: 0,
        demographics: {}
      },
      topVideos: rawMetrics.lastVideo ? [rawMetrics.lastVideo] : []
    };
  }

  private formatMetricsForDisplay(metrics: YouTubeMetrics): string {
    return `YouTube Metrics:
- Total Views: ${metrics.views.toLocaleString()}
- Subscribers: ${metrics.subscribers.toLocaleString()} (Gained: ${metrics.subscribersGained}, Lost: ${metrics.subscribersLost})
- Watch Time: ${metrics.watchTimeHours.toFixed(1)} hours
- Average View Duration: ${metrics.averageViewDuration.toFixed(1)} minutes
- Engagement:
  * Rate: ${(metrics.engagement.rate * 100).toFixed(1)}%
  * Likes: ${metrics.engagement.likes.toLocaleString()}
  * Comments: ${metrics.engagement.comments.toLocaleString()}
  * Shares: ${metrics.engagement.shares.toLocaleString()}
  * Average View: ${(metrics.engagement.averageViewPercentage * 100).toFixed(1)}%`;
  }

  private formatInstagramMetrics(metrics: InstagramMetrics): string {
    return `Instagram Metrics:
- Followers: ${metrics.followers}
- Reels: ${metrics.reels}
- Profile Visits: ${metrics.profileVisits}
- Stories: ${metrics.stories}
- Reach Rate: ${metrics.reachRate}%
- Save Rate: ${metrics.saveRate}%
- Comment Rate: ${metrics.commentRate}%`;
  }

  private formatTikTokMetrics(metrics: TikTokMetrics): string {
    return `TikTok Metrics:
- Followers: ${metrics.followers}
- Total Views: ${metrics.views}
- Likes: ${metrics.likes}
- Shares: ${metrics.shares}
- Comments: ${metrics.comments}
- Watch Time: ${metrics.watchTime} minutes
- Completion Rate: ${metrics.completionRate}%`;
  }

  private formatEmailMetrics(metrics: EmailMetrics): string {
    return `Email Metrics:
- Total Subscribers: ${metrics.totalSubscribers}
- Active Subscribers: ${metrics.activeSubscribers}
- Average Open Rate: ${metrics.averageOpenRate}%
- Average Click Rate: ${metrics.averageClickRate}%
- Bounce Rate: ${metrics.bounceRate}%
- Unsubscribe Rate: ${metrics.unsubscribeRate}%`;
  }

  private formatAllMetrics(metrics: SocialMetricsResponse): string {
    const parts: string[] = [];
    
    if (metrics.youtube) {
      const youtubeMetrics = this.formatYouTubeMetrics(metrics.youtube);
      parts.push(this.formatMetricsForDisplay(youtubeMetrics));
    }
    if (metrics.instagram) {
      parts.push(this.formatInstagramMetrics(metrics.instagram));
    }
    if (metrics.tiktok) {
      parts.push(this.formatTikTokMetrics(metrics.tiktok));
    }
    if (metrics.gmail) {
      parts.push(this.formatEmailMetrics(metrics.gmail));
    }
    
    return parts.join('\n\n');
  }
} 
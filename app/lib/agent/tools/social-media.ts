import { SocialMediaService } from "@/lib/services/social-media";
import { RAGSystem } from "@/lib/rag";
import { BaseTool } from "./base-tool";
import { z } from "zod";
import type { 
  YouTubeMetrics, 
  InstagramMetrics, 
  TikTokMetrics, 
  EmailMetrics,
  SocialPlatform
} from "@/lib/types/social";

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
      const metrics = await this.socialService.getMetrics();
      if (!metrics) return "No metrics available";

      const { platform } = args;
      if (platform) {
        switch (platform.toLowerCase()) {
          case 'youtube':
            if (!metrics.youtube) return "YouTube metrics not available";
            return this.formatYouTubeMetrics(metrics.youtube);
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

  private formatYouTubeMetrics(metrics: YouTubeMetrics): string {
    return `YouTube Metrics:
- Total Views: ${metrics.totalViews}
- Top Videos: ${metrics.topVideos.length} recent videos
- Subscribers: ${metrics.subscribers}
- Watch Time: ${metrics.watchTimeHours} hours
- Average View Duration: ${metrics.averageViewDuration} minutes
- Engagement:
  * Likes: ${metrics.engagement.likes}
  * Comments: ${metrics.engagement.comments}
  * Shares: ${metrics.engagement.shares}`;
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

  private formatAllMetrics(metrics: {
    youtube?: YouTubeMetrics;
    instagram?: InstagramMetrics;
    tiktok?: TikTokMetrics;
    gmail?: EmailMetrics;
  }): string {
    const parts: string[] = [];

    if (metrics.youtube) {
      parts.push(this.formatYouTubeMetrics(metrics.youtube));
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

    return parts.join('\n\n') || "No metrics available";
  }
} 
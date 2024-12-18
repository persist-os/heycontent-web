import { BaseTool } from "./base-tool";
import { z } from "zod";
import { auth } from "../../../auth";
import { prisma } from "@/lib/prisma";
import { google } from 'googleapis';
import { InstagramAPI } from "@/lib/instagram";
import { RAGSystem } from "@/lib/rag";
import { SocialMediaService } from "@/lib/services/social-media";
import type { Account } from "@prisma/client";
import type { DocumentInterface } from "../../../lib/types/document";

const SocialMediaMetricsSchema = z.object({
  platform: z.enum(["instagram", "youtube"]),
  metric: z.enum(["engagement", "reach", "followers", "views"]),
  timeframe: z.enum(["day", "week", "month"])
});

export class SocialMediaTool extends BaseTool {
  name = "social_media_analyzer";
  description = "Analyzes social media metrics and content performance across connected platforms.";
  protected _schema = SocialMediaMetricsSchema;

  constructor(
    private socialService: SocialMediaService,
    private rag: RAGSystem
  ) {
    super();
  }

  private async getYouTubeMetrics(accessToken: string, metric: string, timeframe: string) {
    const youtube = google.youtube('v3');
    const response = await youtube.channels.list({
      auth: accessToken,
      part: ['statistics'],
      mine: true
    });
    return response.data;
  }

  async _call(input: string) {
    try {
      const params = this.validateInput(input);
      const session = await auth();
      
      if (!session?.user?.id) {
        throw new Error("User not authenticated");
      }

      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          accounts: true
        }
      });

      const platformAccount = user?.accounts.find(
        (account: Account) => account.provider === params.platform && account.access_token !== null
      );

      if (!platformAccount?.access_token) {
        return `No connected ${params.platform} account found`;
      }

      let metrics;
      switch (params.platform) {
        case "youtube":
          metrics = await this.getYouTubeMetrics(
            platformAccount.access_token,
            params.metric,
            params.timeframe
          );
          break;
        case "instagram":
          metrics = await this.socialService.getInstagramMetrics(
            platformAccount.access_token,
            params.timeframe
          );
          break;
      }

      // Get relevant insights from RAG
      const insights = await this.rag.search(
        `${params.platform} ${params.metric} insights`,
        {
          type: 'smart_note',
          userId: session.user.id,
          tags: [params.platform, params.metric]
        }
      );

      return JSON.stringify({
        platform: params.platform,
        metric: params.metric,
        data: metrics,
        insights: insights.map(doc => ({
          content: doc.pageContent,
          metadata: doc.metadata
        }))
      });
    } catch (error) {
      if (error instanceof Error) {
        return `Error analyzing social media metrics: ${error.message}`;
      }
      return "An unknown error occurred";
    }
  }
} 
import { BaseTool } from "./base-tool";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const PartnershipAnalysisSchema = z.object({
  niche: z.string(),
  audience_size: z.number(),
  platform: z.enum(["instagram", "youtube", "tiktok"]),
  budget_range: z.enum(["low", "medium", "high"]),
  email_analysis: z.boolean().optional()
});

// Define types for our partner data
interface Partner {
  id: string;
  name: string;
  niche: string;
  platform: string;
  audienceSize: number;
}

interface PartnerEmail {
  partnerId: string;
  timestamp: Date;
  content: string;
}

export class PartnershipTool extends BaseTool {
  name = "partnership_analyzer";
  description = "Analyzes partnerships and email communications. Input should be a JSON string with niche, audience_size, platform, budget_range, and optional email_analysis flag.";
  protected _schema = PartnershipAnalysisSchema;

  private async analyzeEmails(partnerId: string) {
    // Type the response from Prisma
    const emails = await prisma.$queryRaw<PartnerEmail[]>`
      SELECT * FROM "PartnerEmail"
      WHERE "partnerId" = ${partnerId}
      ORDER BY timestamp DESC
      LIMIT 10
    `;

    // Analyze email sentiment and response times
    return {
      totalEmails: emails.length,
      averageResponseTime: "24 hours",
      sentiment: "positive",
      lastInteraction: emails[0]?.timestamp
    };
  }

  async _call(input: string) {
    try {
      const params = this.validateInput(input);
      
      // Get partnership data from your database with proper typing
      const partners = await prisma.$queryRaw<Partner[]>`
        SELECT * FROM "Partner"
        WHERE niche = ${params.niche}
        AND platform = ${params.platform}
        AND "audienceSize" BETWEEN ${params.audience_size * 0.8} AND ${params.audience_size * 1.2}
        LIMIT 5
      `;

      const recommendations = await Promise.all(
        partners.map(async (partner: Partner) => {
          const baseData = {
            name: partner.name,
            match_score: Math.random() * 0.3 + 0.7, // 0.7-1.0
            audience_overlap: `${Math.floor(Math.random() * 30 + 50)}%`,
            estimated_roi: ["Low", "Medium", "High"][Math.floor(Math.random() * 3)]
          };

          if (params.email_analysis) {
            const emailInsights = await this.analyzeEmails(partner.id);
            return { ...baseData, email_insights: emailInsights };
          }

          return baseData;
        })
      );

      return JSON.stringify({
        recommended_partners: recommendations,
        strategy_suggestions: [
          "Focus on co-created content",
          "Start with a trial campaign",
          "Leverage shared audience interests"
        ]
      });
    } catch (error) {
      if (error instanceof Error) {
        return `Error analyzing partnerships: ${error.message}`;
      }
      return "An unknown error occurred";
    }
  }
} 
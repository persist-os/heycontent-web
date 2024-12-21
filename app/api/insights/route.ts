export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { PlatformAgent } from '@/lib/agent'
import { ProcessContext } from '@/lib/agent/types'
import { RAGSystem } from '@/lib/rag'
import { SocialMediaService } from '@/lib/services/social-media'
import { SocialAccount } from '@prisma/client'
import { AIActionableInsight } from '@/types/index'
import { ContentAnalysisService } from '@/lib/services/content-analysis'

interface PlatformMetrics {
  youtube?: {
    views: number;
    comments: number;
    likes: number;
    subscribers: number;
  };
}

export async function GET(req: Request) {
  try {
    console.log('Starting insights generation');
    const session = await auth()
    if (!session?.user?.id) {
      console.log('No authenticated user found');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Initialize our systems
    const rag = new RAGSystem()
    const agent = new PlatformAgent()
    const socialMediaService = new SocialMediaService()
    const contentAnalysisService = new ContentAnalysisService(session.user.id)

    try {
      // Get connected platforms and their access tokens
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          accounts: true,
          socialAccounts: {
            where: { isConnected: true }
          }
        }
      });

      if (!user?.socialAccounts || user.socialAccounts.length === 0) {
        console.log('No connected platforms found');
        return NextResponse.json([])
      }

      // Get comprehensive insights
      const [partnershipInsights, contentRecommendations] = await Promise.all([
        contentAnalysisService.getPartnershipInsights(),
        contentAnalysisService.getContentRecommendations()
      ]);

      // Get user's persona for context
      const userPersona = await rag.getUserPersona(session.user.id)

      // Generate additional insights using the agent
      console.log('Generating additional insights with agent');
      const agentResponse = await agent.process(
        "Generate additional insights based on the user's metrics, persona, and existing insights. Focus on unique opportunities and gaps.",
        {
          metrics: await socialMediaService.getMetrics(),
          persona: {
            currentPersona: userPersona.currentPersona || '',
            futureVision: userPersona.futureVision || '',
            timestamp: new Date().toISOString()
          },
          userId: session.user.id,
          connectedPlatforms: user.socialAccounts.map(p => p.platform),
          existingInsights: [...partnershipInsights, ...contentRecommendations],
          insightContext: {
            partnerships: partnershipInsights.map(insight => ({
              subject: insight.title,
              analysis: {
                isPartnership: true,
                dealValue: insight.data.avgDealValue,
                dealType: insight.data.dealType || 'unknown',
                topics: [],
                priority: insight.action?.priority || 'medium'
              }
            })),
            videoMetrics: contentRecommendations.map(insight => ({
              id: insight.data.videoId || '',
              views: insight.data.views || 0,
              likes: insight.data.likes || 0,
              comments: insight.data.comments || 0
            }))
          }
        } as ProcessContext
      )

      // Combine all insights
      const allInsights = [
        ...partnershipInsights,
        ...contentRecommendations,
        ...(Array.isArray(agentResponse.output) ? agentResponse.output : [])
      ];

      // Store insights in RAG system for future reference
      if (allInsights.length > 0) {
        console.log('Storing insights in RAG system');
        await Promise.all(
          allInsights.map((insight) =>
            rag.addDocument(
              JSON.stringify(insight),
              {
                type: 'insight',
                category: insight.type,
                user_id: session.user.id,
                timestamp: new Date().toISOString()
              }
            )
          )
        )
      }

      return NextResponse.json(allInsights)
    } catch (error) {
      console.error('[INSIGHTS_PROCESSING_ERROR]', error)
      return NextResponse.json(
        { error: 'Failed to process insights', details: error instanceof Error ? error.message : 'Unknown error' },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('[INSIGHTS_AUTH_ERROR]', error)
    return NextResponse.json(
      { error: 'Authentication failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 401 }
    )
  }
}

function generateDefaultInsights(metrics: any): AIActionableInsight[] {
  const insights: AIActionableInsight[] = [];
  
  if (metrics?.youtube) {
    const { views, subscribers, comments, likes } = metrics.youtube;
    
    // Generate engagement insight
    insights.push({
      id: Date.now(),
      type: 'content',
      opportunity: {
        title: "Engagement Optimization",
        description: "Your content is receiving engagement. Let's optimize it further.",
        impact: `${comments} comments and ${likes} likes`,
        timing: "Current trend",
        confidence: 85
      },
      action: {
        steps: [
          "Analyze your most commented videos",
          "Identify common themes in high-performing content",
          "Create more content around successful topics"
        ],
        timeToImplement: "1-2 weeks",
        expectedOutcome: "Increased engagement rate",
        requirements: [
          "Access to video analytics",
          "Content performance data",
          "Engagement metrics history"
        ]
      },
      context: {
        why: [
          `You have ${views} total views`,
          `Your channel has ${subscribers} subscribers`,
          "There's potential for growth"
        ],
        data: ["View counts", "Subscriber numbers", "Engagement metrics"]
      }
    });
  }
  
  return insights;
} 
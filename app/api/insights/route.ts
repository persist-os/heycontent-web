export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { auth } from '@/app/auth'
import { RAGSystem } from '@/app/lib/rag'
import { SocialMediaService } from '@/app/lib/services/social-media'
import prisma from '@/app/lib/prisma'
import type { SocialAccount } from '@prisma/client'
import { PlatformAgent } from '@/app/lib/agent'
import { ProcessContext } from '@/app/lib/agent/types'
import { AIActionableInsight } from '@/app/types/index'
import { ContentAnalysisService } from '@/app/lib/services/content-analysis'
import { checkRateLimit, RATE_LIMIT, BURST_LIMIT } from '@/app/lib/rate-limit'
import { actionableInsights } from '@/src/data/insights'

interface PlatformMetrics {
  youtube?: {
    views: number;
    comments: number;
    likes: number;
    subscribers: number;
  };
}

interface ServiceError {
  service: string;
  error: string;
}

export async function GET(req: Request) {
  try {
    console.log('Starting insights generation');
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check rate limit
    const rateLimitResult = await checkRateLimit(`insights_${session.user.id}`);
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded',
          details: rateLimitResult.error || `Please try again in ${Math.ceil((rateLimitResult.reset - Date.now()) / 1000)} seconds`
        },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': RATE_LIMIT.toString(),
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': rateLimitResult.reset.toString(),
            'X-Concurrent-Requests': BURST_LIMIT.toString()
          }
        }
      );
    }

    // Initialize our systems
    const rag = new RAGSystem()
    const agent = new PlatformAgent()
    const socialMediaService = new SocialMediaService(rag)
    const contentAnalysisService = new ContentAnalysisService(session.user.id, rag)
    const errors: ServiceError[] = [];

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

      console.log('User query result:', {
        userId: user?.id,
        socialAccountsCount: user?.socialAccounts?.length,
        hasAccounts: !!user?.accounts,
        accountsCount: user?.accounts?.length
      });

      if (!user?.socialAccounts || user.socialAccounts.length === 0) {
        console.log('No connected platforms found, using default insights');
        return NextResponse.json({
          insights: actionableInsights,
          errors: [{ service: 'platforms', error: 'No connected platforms found - showing default insights' }]
        })
      }

      console.log('Found connected platforms:', user.socialAccounts.map((acc: SocialAccount) => ({
        platform: acc.platform,
        username: acc.username,
        isConnected: acc.isConnected
      })));

      // Get insights with error handling
      const [partnershipInsights, contentRecommendations] = await Promise.allSettled([
        contentAnalysisService.getPartnershipInsights().catch(error => {
          console.error('Error getting partnership insights:', {
            error,
            stack: error.stack,
            message: error.message
          });
          errors.push({ 
            service: 'partnerships', 
            error: error.message.includes('quota') ? 
              'Service temporarily unavailable due to quota limits' : 
              'Failed to get partnership insights: ' + error.message
          });
          return [];
        }),
        contentAnalysisService.getContentRecommendations().catch(error => {
          console.error('Error getting content recommendations:', {
            error,
            stack: error.stack,
            message: error.message
          });
          errors.push({ 
            service: 'content', 
            error: error.message.includes('quota') ? 
              'Service temporarily unavailable due to quota limits' : 
              'Failed to get content recommendations: ' + error.message
          });
          return [];
        })
      ]);

      // Log results
      console.log('Partnership insights result:', {
        status: partnershipInsights.status,
        value: partnershipInsights.status === 'fulfilled' ? 
          `Got ${partnershipInsights.value.length} insights` : 
          'Failed',
        reason: partnershipInsights.status === 'rejected' ? 
          partnershipInsights.reason : undefined
      });

      console.log('Content recommendations result:', {
        status: contentRecommendations.status,
        value: contentRecommendations.status === 'fulfilled' ? 
          `Got ${contentRecommendations.value.length} recommendations` : 
          'Failed',
        reason: contentRecommendations.status === 'rejected' ? 
          contentRecommendations.reason : undefined
      });

      // Get user's persona for context
      const userPersona = await rag.getUserPersona(session.user.id).catch(error => {
        console.error('Error getting user persona:', error);
        errors.push({ service: 'persona', error: 'Failed to get user persona' });
        return { currentPersona: '', futureVision: '' };
      });

      // Safely extract results
      const finalPartnershipInsights = partnershipInsights.status === 'fulfilled' ? partnershipInsights.value : [];
      const finalContentRecommendations = contentRecommendations.status === 'fulfilled' ? contentRecommendations.value : [];

      // Get metrics with error handling
      const metrics = await socialMediaService.getMetrics().catch(error => {
        console.error('Error getting metrics:', error);
        errors.push({ 
          service: 'metrics', 
          error: error.message.includes('quota') ? 
            'Service temporarily unavailable due to quota limits' : 
            'Failed to get metrics'
        });
        return null;
      });

      // Generate additional insights using the agent
      console.log('Generating additional insights with agent');
      const result = await agent.process(
        "Generate additional insights based on the user's metrics, persona, and existing insights. Focus on unique opportunities and gaps.",
        {
          metrics,
          persona: {
            currentPersona: userPersona.currentPersona || '',
            futureVision: userPersona.futureVision || '',
            timestamp: new Date().toISOString()
          },
          userId: session.user.id,
          connectedPlatforms: user.socialAccounts.map((p: SocialAccount) => p.platform),
          existingInsights: [...finalPartnershipInsights, ...finalContentRecommendations],
          platformStatus: user.socialAccounts.map((account: SocialAccount) => {
            const metadata = account.metadata as { features?: string[], errors?: string[] } | null;
            return {
              platform: account.platform,
              isConnected: account.isConnected,
              lastSync: account.updatedAt,
              features: metadata?.features || [],
              errors: metadata?.errors || []
            };
          }),
          insightContext: {
            partnerships: finalPartnershipInsights.map(insight => ({
              type: insight.type || 'partnership',
              status: insight.action?.priority || 'medium',
              performance: {
                dealValue: insight.data.avgDealValue,
                dealType: insight.data.dealType || 'unknown',
                topics: [],
                priority: insight.action?.priority || 'medium'
              }
            })),
            videoMetrics: finalContentRecommendations.map(insight => ({
              id: insight.data.videoId || '',
              views: insight.data.views || 0,
              likes: insight.data.likes || 0,
              comments: insight.data.comments || 0
            }))
          }
        } as ProcessContext
      ).catch(error => {
        console.error('Error generating additional insights:', error);
        errors.push({ service: 'agent', error: 'Failed to generate additional insights' });
        return { 
          conversationState: null,
          suggestions: [],
          persona: null
        };
      });

      // Combine all insights
      const allInsights = [
        ...finalPartnershipInsights,
        ...finalContentRecommendations,
        ...(('output' in result && Array.isArray(result.output)) ? result.output : 
           (Array.isArray(result.suggestions) ? result.suggestions : []))
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
            ).catch(error => {
              console.error('Error storing insight:', error);
              errors.push({ service: 'storage', error: 'Failed to store some insights' });
            })
          )
        )
      }

      // Return insights with any errors
      return NextResponse.json({
        insights: allInsights,
        errors: errors.length > 0 ? errors : undefined
      }, {
        headers: {
          'X-RateLimit-Limit': RATE_LIMIT.toString(),
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.reset.toString(),
          'X-Concurrent-Requests': BURST_LIMIT.toString()
        }
      })
    } catch (error) {
      console.error('Error processing insights:', error);
      throw error;
    }
  } catch (error: any) {
    console.error('Error in insights endpoint:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process insights',
        details: error.message,
        errors: [{ service: 'general', error: error.message }]
      },
      { status: 500 }
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
        data: ["View counts", "Subscriber numbers", "Engagement metrics"],
        source: "YouTube Analytics",
        sourceDetails: [
          "Video performance data",
          "Subscriber growth trends",
          "Engagement metrics history"
        ]
      }
    });
  }
  
  return insights;
} 
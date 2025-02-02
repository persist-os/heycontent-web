import { YouTubeService } from './youtube';
import { GmailService, GmailMessage } from './gmail';
import { getCompletion } from '../openai';
import prisma from '../prisma';

interface ContentInsight {
  type: 'partnership' | 'content' | 'engagement' | 'trend';
  title: string;
  description: string;
  source: 'youtube' | 'gmail' | 'combined';
  confidence: number;
  data: any;
  action?: {
    type: string;
    steps: string[];
    priority: 'high' | 'medium' | 'low';
  };
}

interface AnalysisLine {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  steps: string[];
}

interface PartnershipInsight {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionSteps: string[];
}

interface PartnershipAnalysisResult {
  insights: PartnershipInsight[];
}

interface VideoAnalysis {
  mainTopics: string[];
  suggestedTopics: string[];
  contentType: string;
  performanceScore: number;
  engagementTriggers: string[];
  audienceReaction: {
    positiveAspects: string[];
    negativeAspects: string[];
    questions: string[];
    suggestions: string[];
  };
}

export class ContentAnalysisService {
  private youtubeService: YouTubeService;
  private gmailService: GmailService;
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
    this.youtubeService = new YouTubeService(userId);
    this.gmailService = new GmailService(userId);
  }

  private async getGoogleAccountId(): Promise<string> {
    const account = await prisma.account.findFirst({
      where: {
        userId: this.userId,
        provider: 'google',
        // Make sure we have the required scopes
        OR: [
          { scope: { contains: 'https://www.googleapis.com/auth/gmail.readonly' } },
          { scope: { contains: 'https://www.googleapis.com/auth/youtube.readonly' } }
        ]
      }
    });

    if (!account) {
      console.error('No Google account found with required scopes for user:', this.userId);
      throw new Error('No Google account with required permissions found');
    }

    return account.id;
  }

  private async withRateLimit<T>(fn: () => Promise<T>): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      if (error?.message?.includes('Rate limit reached')) {
        const match = error.message.match(/Please try again in (\d+\.?\d*)s/);
        const waitTime = match ? parseFloat(match[1]) * 1000 : 10000;
        
        // Wait for the rate limit to reset
        await new Promise(resolve => setTimeout(resolve, waitTime));
        
        // Retry once
        return await fn();
      }
      throw error;
    }
  }

  private async analyzeWithModel(prompt: string, isComplex: boolean = false) {
    return this.withRateLimit(() => 
      getCompletion([
        { 
          role: 'system', 
          content: isComplex 
            ? 'You are an AI that provides strategic insights for content creators and their partnerships. Always respond with valid JSON.'
            : 'You are an AI that helps analyze content and partnerships. Always respond with valid JSON.' 
        },
        { role: 'user', content: prompt }
      ], {
        model: 'gpt-4-1106-preview',
        temperature: isComplex ? 0.7 : 0.5,
        response_format: { type: "json_object" }
      })
    );
  }

  async getPartnershipInsights(): Promise<ContentInsight[]> {
    try {
      const googleAccountId = await this.getGoogleAccountId();
      
      // Get partnership emails with error handling
      let partnerships: GmailMessage[] = [];
      try {
        partnerships = await this.gmailService.getPartnershipEmails({
          maxResults: 50
        });
        console.log('Retrieved partnership emails:', {
          count: partnerships.length,
          sample: partnerships.slice(0, 2).map(p => ({
            subject: p.subject,
            from: p.from,
            hasAnalysis: !!p.analysis,
            analysisFields: p.analysis ? Object.keys(p.analysis) : []
          }))
        });
      } catch (error: any) {
        console.error('Error getting partnership emails:', error);
        // Instead of continuing with empty partnerships, throw the error
        throw new Error(`Failed to get partnership emails: ${error.message}`);
      }

      // Get YouTube performance data with error handling
      let recentVideos: string[] = [];
      try {
        const channelId = await this.getChannelId();
        recentVideos = await this.youtubeService.getContentSuggestions(channelId);
        console.log('Retrieved content suggestions:', recentVideos.length);
      } catch (videoError) {
        console.error('Error getting content suggestions:', videoError);
        // Continue with empty videos since YouTube data is optional
        recentVideos = [];
      }

      // If we have no partnership data, return empty insights
      if (partnerships.length === 0) {
        console.warn('No partnership emails available for analysis');
        return [];
      }

      console.log('Starting partnership analysis with:', {
        partnershipEmails: partnerships.length,
        recentVideos: recentVideos.length
      });

      // Break analysis into smaller chunks
      const partnershipChunks = this.chunkArray(partnerships, 10);
      const insights: ContentInsight[] = [];

      for (const chunk of partnershipChunks) {
        console.log('Processing chunk of', chunk.length, 'emails');
        
        const prompt = `Analyze these partnerships and content performance. Provide the analysis in the following JSON format:
{
  "insights": [
    {
      "title": string,
      "description": string,
      "priority": "high" | "medium" | "low",
      "actionSteps": string[]
    }
  ]
}

Partnership Emails (Batch):
${chunk.map(p => `
From: ${p.from}
Subject: ${p.subject}
Date: ${p.date}
Deal Value: $${p.analysis?.dealValue || 'unknown'}
Deal Type: ${p.analysis?.dealType || 'unknown'}
Topics: ${p.analysis?.topics?.join(', ') || 'none'}
Priority: ${p.analysis?.priority || 'unknown'}
Stage: ${p.analysis?.stage || 'unknown'}
`).join('\n---\n')}

Recent Content Performance:
${recentVideos.slice(0, 5).join('\n')}

The insights should cover:
1. Best partnership opportunities based on content alignment
2. Content gaps that could attract better partnerships
3. Revenue optimization suggestions
4. Specific action steps for each insight`;

        try {
          console.log('Analyzing chunk with OpenAI...');
          const analysis = await this.analyzeWithModel(prompt, true); // Complex task -> GPT-4
          console.log('Raw analysis response:', analysis);
          
          let result;
          try {
            result = JSON.parse(analysis) as PartnershipAnalysisResult;
            console.log('Parsed analysis result:', {
              insightCount: result.insights?.length || 0,
              sampleInsight: result.insights?.[0]
            });
          } catch (parseError) {
            console.error('Error parsing analysis result:', parseError);
            console.log('Failed to parse analysis:', analysis);
            continue;
          }
          
          const chunkInsights = (result.insights || []).map((insight: PartnershipInsight) => ({
            type: 'partnership' as const,
            title: insight.title,
            description: insight.description,
            source: 'combined' as const,
            confidence: 0.85,
            data: {
              partnerships: chunk.length,
              avgDealValue: chunk.reduce((sum, p) => sum + (p.analysis?.dealValue || 0), 0) / chunk.length,
              contentAlignment: true,
              emails: chunk.map(p => ({
                subject: p.subject,
                from: p.from,
                date: p.date,
                dealValue: p.analysis?.dealValue,
                dealType: p.analysis?.dealType,
                topics: p.analysis?.topics,
                priority: p.analysis?.priority,
                stage: p.analysis?.stage
              })),
              sourceDetails: [
                `Based on ${chunk.length} partnership emails`,
                `Average deal value: $${(chunk.reduce((sum, p) => sum + (p.analysis?.dealValue || 0), 0) / chunk.length).toFixed(2)}`,
                `Most common deal type: ${this.getMostCommon(chunk.map(p => p.analysis?.dealType).filter(Boolean))}`,
                `Most common stage: ${this.getMostCommon(chunk.map(p => p.analysis?.stage).filter(Boolean))}`
              ]
            },
            action: {
              type: 'opportunity',
              steps: insight.actionSteps,
              priority: insight.priority
            }
          }));

          console.log('Generated insights for chunk:', {
            count: chunkInsights.length,
            sample: chunkInsights[0]
          });
          
          insights.push(...chunkInsights);
        } catch (error) {
          console.error('Error analyzing partnership chunk:', error);
          // Continue with next chunk if one fails
          continue;
        }
      }

      console.log('Final insights generated:', {
        totalCount: insights.length,
        types: insights.map(i => i.type),
        sample: insights[0]
      });

      return insights;
    } catch (error) {
      console.error('Error in getPartnershipInsights:', error);
      throw error;
    }
  }

  private getMostCommon(arr: (string | undefined)[]): string {
    const counts = arr.reduce((acc, val) => {
      if (!val) return acc;
      acc[val] = (acc[val] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      [0]?.[0] || 'unknown';
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  async getContentRecommendations(): Promise<ContentInsight[]> {
    const channelId = await this.getChannelId();
    
    // Get recent video performance and comments
    const videoIds = await this.getRecentVideoIds(channelId);
    const videoAnalyses = await Promise.all(
      videoIds.map(id => this.youtubeService.analyzeVideo(id))
    ) as VideoAnalysis[];

    // Get partnership context
    const partnerships = await this.gmailService.getPartnershipEmails({
      maxResults: 20
    });

    interface BasicAnalysis {
      topicSummary: string[];
      engagementSummary: string[];
    }

    interface Recommendation {
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
      actionSteps: string[];
    }

    interface AnalysisResult {
      recommendations: Recommendation[];
    }

    // Initial analysis with GPT-3.5 for basic data processing
    const basicPrompt = `Analyze these content topics and engagement. Provide the analysis in JSON format:
{
  "topicSummary": string[],
  "engagementSummary": string[]
}

Video Topics: ${videoAnalyses.flatMap(a => a.mainTopics).join(', ')}
Engagement Triggers: ${videoAnalyses.flatMap(a => a.engagementTriggers).join(', ')}`;

    await this.analyzeWithModel(basicPrompt, false); // Simple task -> GPT-3.5

    // Complex analysis with GPT-4
    const prompt = `Based on this channel's performance and opportunities, provide recommendations in the following JSON format:
{
  "recommendations": [
    {
      "title": string,
      "description": string,
      "priority": "high" | "medium" | "low",
      "actionSteps": string[]
    }
  ]
}

Channel Data:
- Video Topics: ${videoAnalyses.flatMap(a => a.mainTopics).join(', ')}
- Engagement Triggers: ${videoAnalyses.flatMap(a => a.engagementTriggers).join(', ')}
- Audience Interests: ${videoAnalyses.flatMap(a => a.audienceReaction.suggestions).join(', ')}
- Partnership Opportunities: ${partnerships.map(p => p.analysis.topics).flat().join(', ')}

The recommendations should:
1. Align with current audience interests
2. Capitalize on partnership opportunities
3. Address audience questions/needs
4. Maximize engagement potential
5. Consider trending topics`;

    const analysis = await this.analyzeWithModel(prompt, true); // Complex task -> GPT-4

    try {
      const result = JSON.parse(analysis) as AnalysisResult;
      return (result.recommendations || []).map((rec: Recommendation) => ({
        type: 'content' as const,
        title: rec.title,
        description: rec.description,
        source: 'combined' as const,
        confidence: 0.9,
        data: {
          audienceAlignment: true,
          partnershipPotential: true,
          engagementPotential: 'high',
          videos: videoAnalyses.map(v => ({
            title: v.contentType || '',
            views: v.performanceScore || 0,
            engagement: v.performanceScore || 0,
            topics: v.mainTopics || []
          })),
          sourceDetails: [
            `Based on ${videoAnalyses.length} recent videos`,
            `Main topics: ${videoAnalyses.flatMap(a => a.mainTopics).join(', ')}`,
            `Engagement triggers: ${videoAnalyses.flatMap(a => a.engagementTriggers).join(', ')}`
          ]
        },
        action: {
          type: 'content',
          steps: rec.actionSteps,
          priority: rec.priority
        }
      }));
    } catch (error) {
      console.error('Error parsing recommendations:', error);
      return [];
    }
  }

  private async getChannelId(): Promise<string> {
    const googleAccountId = await this.getGoogleAccountId();
    const auth = await this.youtubeService['getAuthorizedClient']();
    const response = await this.youtubeService['youtube'].channels.list({
      auth,
      part: ['id'],
      mine: true
    });

    const channelId = response.data.items?.[0]?.id;
    if (!channelId) {
      throw new Error('No YouTube channel found for this account');
    }

    return channelId;
  }

  private async getRecentVideoIds(channelId: string): Promise<string[]> {
    const response = await this.youtubeService['youtube'].search.list({
      auth: await this.youtubeService['getAuthorizedClient'](),
      part: ['id'],
      channelId,
      order: 'date',
      type: ['video'],
      maxResults: 10
    });

    return response.data.items
      ?.map(item => item.id?.videoId)
      .filter((id): id is string => !!id) || [];
  }
} 
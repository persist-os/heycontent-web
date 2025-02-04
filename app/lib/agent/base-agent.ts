import { RAGSystem, AVADocumentType, AVAMetadata } from "../rag";
import { OpenAI } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";
import { BaseMessage, BaseMessageLike } from "@langchain/core/messages";
import { Message } from "../../types/conversation";
import { selectModel } from "../openai";
import { BatchProcessor } from "./batch-processor";
import { PrismaClient } from "@prisma/client";
import prisma from '../prisma';  // Import the singleton instance

export interface PlatformIntegrationContext {
  instagram?: {
    reels: boolean;
    stories: boolean;
    posts: boolean;
    insights: boolean;
  };
  youtube?: {
    videos: boolean;
    analytics: boolean;
    livestreams: boolean;
    community: boolean;
  };
  tiktok?: {
    videos: boolean;
    analytics: boolean;
    trends: boolean;
  };
  gmail?: {
    emails: boolean;
    threads: boolean;
    labels: boolean;
  };
  outlook?: {
    emails: boolean;
    calendar: boolean;
    contacts: boolean;
  };
}

export interface CrossPlatformAnalytics {
  contentSynergy: Array<{
    platform: string;
    format: string;
    performance: number;
    crossPostPotential: number;
  }>;
  audienceOverlap: Array<{
    platforms: string[];
    percentage: number;
    engagement: number;
  }>;
  timeOptimization: {
    bestTimes: Record<string, string[]>;
    crossPlatformSchedule: Array<{
      platform: string;
      time: string;
      format: string;
      reason: string;
    }>;
  };
}

export interface MarketIntelligence {
  competitorAnalysis: {
    platform: string;
    competitors: Array<{
      name: string;
      metrics: Record<string, number>;
      content: string[];
      strengths: string[];
      weaknesses: string[];
    }>;
    gaps: string[];
    opportunities: Array<{
      type: string;
      description: string;
      potential: number;
    }>;
  };
  industryTrends: {
    rising: string[];
    declining: string[];
    emerging: string[];
    prediction: {
      timeframe: string;
      confidence: number;
      impact: string;
    };
  };
  nichePotential: {
    current: number;
    projected: number;
    growthAreas: string[];
    risks: string[];
    requirements: string[];
  };
}

export interface PlatformMetrics {
  youtube?: {
    subscribers?: number;
    engagement?: number | {
      likes: number;
      comments: number;
      shares: number;
      total?: number;
    };
    topVideos?: Array<{
      tags?: string[];
      categories?: string[];
    }>;
    demographics?: Demographics;
    watchTime?: number;
    retention?: number;
  };
  instagram?: {
    followers?: number;
    engagement?: number | {
      likes: number;
      comments: number;
      shares: number;
      saves: number;
      total?: number;
    };
    topPosts?: Array<{
      tags?: string[];
      categories?: string[];
    }>;
    demographics?: Demographics;
  };
  tiktok?: {
    followers?: number;
    engagement?: number | {
      likes: number;
      comments: number;
      shares: number;
      total?: number;
    };
    topVideos?: Array<{
      tags?: string[];
      categories?: string[];
    }>;
    demographics?: Demographics;
  };
}

export interface UserPersona {
  currentPersona: string;
  futureVision: string;
  timestamp: string;
  communicationStyle?: 'direct' | 'exploratory' | 'collaborative';
  detailLevel?: 'high' | 'medium' | 'low';
  pacePreference?: 'fast' | 'moderate' | 'thorough';
}

export interface Insight {
  type: 'partnership' | 'content' | 'engagement' | 'trend' | 'monetization' | 'crossplatform' | 'community';
  title: string;
  description: string;
  confidence?: number;
  action?: string;
  timestamp?: string;
  source?: string;
  data?: Record<string, unknown>;
}

export interface Partnership {
  platform: string;
  partnerId: string;
  status: string;
  type?: string;
  performance?: {
    engagement?: number;
    reach?: number;
    revenue?: number;
    [key: string]: number | undefined;
  };
}

export interface AudienceInsight {
  segment: string;
  size: number;
  engagement: number;
  demographics?: {
    ageGroups: string[];
    genders: string[];
    locations: string[];
  };
  interests: string[];
  platforms: string[];
  behavior?: {
    peakTimes?: string[];
    contentPreferences?: string[];
    interactionPatterns?: string[];
  };
}

export interface ChatInteraction {
  timestamp: string;
  topic: string;
  intent: string;
  sentiment: string;
  engagement: 'high' | 'medium' | 'low';
  context?: string;
  followUp?: string;
}

export interface DemographicMetric {
  name: string;
  value: number;
}

export interface Demographics {
  ageGroups: string[] | DemographicMetric[];
  genders: string[] | DemographicMetric[];
  locations: string[] | DemographicMetric[];
  languages: string[] | DemographicMetric[];
}

export interface AudienceBehavior {
  contentPreferences: Array<{
    type: string;
    percentage: number;
    growth: string;
  }>;
  behavioralTraits: Array<{
    trait: string;
    value: 'Very High' | 'High' | 'Medium' | 'Low' | 'Very Low';
    percentage: number;
  }>;
  peakTimes: Array<{
    day: string;
    times: string[];
    engagement: number;
  }>;
  interactionPatterns: Array<{
    type: string;
    value: number;
    trend: string;
  }>;
}

export interface AgentContext {
  userId: string;
  metrics?: PlatformMetrics;
  persona?: UserPersona;
  previousMessages?: Message[];
  crossAgentContext?: {
    insights?: Insight[];
    partnerships?: Partnership[];
    audience?: AudienceInsight[];
    chat?: ChatInteraction[];
  };
  platformIntegrations?: PlatformIntegrationContext;
  crossPlatformAnalytics?: CrossPlatformAnalytics;
  marketIntelligence?: MarketIntelligence;
  connectedPlatforms?: string[];
  niche?: string;
  targetAudience?: {
    demographics: Demographics;
    interests: string[];
    behavior: AudienceBehavior;
  };
  additionalData?: {
    [key: string]: string | number | boolean | object | null;
  };
}

export interface SearchFilter {
  type?: string;
  platform?: string;
  timeframe?: string;
  category?: string;
  user_id?: string;
  isLatest?: boolean;
  timestamp?: string;
}

export interface SearchResult {
  content: string;
  pageContent?: string;
  metadata?: {
    type?: string;
    source?: string;
    timestamp?: Date;
    relevance?: number;
  };
}

export abstract class BaseAgent {
  protected userId: string;
  protected rag: RAGSystem;
  protected model: ChatOpenAI;
  protected systemPrompt: string = '';
  protected agentType: 'chat' | 'insights' | 'partnerships' | 'audience';
  protected batchProcessor: BatchProcessor;
  protected conversationId: string;

  constructor(userId: string, rag: RAGSystem, agentType: 'chat' | 'insights' | 'partnerships' | 'audience') {
    this.userId = userId;
    this.rag = rag;
    this.agentType = agentType;
    this.conversationId = this.generateConversationId();
    
    // Select model based on agent type
    const modelName = this.getModelForAgentType(agentType);
    
    this.model = new ChatOpenAI({
      modelName,
      temperature: 0.7,
    });

    // Initialize batch processor
    this.batchProcessor = new BatchProcessor(rag, prisma);
  }

  private getModelForAgentType(type: 'chat' | 'insights' | 'partnerships' | 'audience'): string {
    switch (type) {
      case 'insights':
        // Use GPT-4 only for complex insight generation
        return selectModel('high');
      case 'partnerships':
        // Use GPT-3.5-turbo-16k for partnership analysis
        return selectModel('medium');
      default:
        // Use standard GPT-3.5-turbo for chat and audience
        return selectModel('low');
    }
  }

  abstract process(input: string): Promise<any>;

  protected convertToBaseMessage(message: Message): BaseMessageLike {
    return {
      content: message.content,
      role: message.role,
      additional_kwargs: message.metadata || {}
    };
  }

  protected convertMessagesToBaseMessages(messages: Message[]): BaseMessageLike[] {
    return messages.map(this.convertToBaseMessage);
  }

  protected convertMessageContentToString(content: any): string {
    if (typeof content === 'string') {
      return content;
    }
    if (Array.isArray(content)) {
      return content.map(item => 
        typeof item === 'string' ? item : JSON.stringify(item)
      ).join(' ');
    }
    return JSON.stringify(content);
  }

  protected async getRelevantContext(
    query: string,
    filter: string | SearchFilter,
    limit: number = 5
  ): Promise<SearchResult[]> {
    // Extract type from filter and ignore limit as it's handled internally by RAGSystem
    const type = typeof filter === 'string' ? filter : filter?.type || 'general';
    return this.rag.search(type, query);
  }

  protected async getCrossAgentContext(input: string, context: AgentContext) {
    const results = await Promise.allSettled([
      // Get relevant insights from RAG system
      this.rag.search('insight', input),
      
      // Get broader context for the query
      this.rag.search('general', input),
      
      // Get market intelligence data
      this.getMarketIntelligence(input),
      
      // Get cross-platform analytics
      this.getCrossPlatformAnalytics(context),
      
      // Get audience insights
      this.getAudienceInsights(context),
      
      // Get partnership opportunities
      this.getPartnershipOpportunities(context),
      
      // Get content performance metrics
      this.getContentPerformanceMetrics(context)
    ]);

    // Process and combine results
    const processedResults = results.map(result => 
      result.status === 'fulfilled' ? result.value : []
    );

    return {
      userInsights: processedResults[0],
      broadContext: processedResults[1],
      marketIntelligence: processedResults[2],
      platformAnalytics: processedResults[3],
      audienceInsights: processedResults[4],
      partnershipOpportunities: processedResults[5],
      contentMetrics: processedResults[6]
    };
  }

  protected async getMarketIntelligence(query: string): Promise<MarketIntelligence> {
    try {
      const response = await this.model.invoke([{
        role: "system",
        content: `You are a market intelligence expert. Analyze the latest trends and opportunities in the given domain. 
                 Return your analysis in JSON format with the following structure:
                 {
                   "competitors": [],
                   "gaps": [],
                   "opportunities": [],
                   "risingTrends": [],
                   "decliningTrends": [],
                   "emergingTrends": [],
                   "confidence": number,
                   "impact": string,
                   "currentPotential": number,
                   "projectedPotential": number,
                   "growthAreas": [],
                   "risks": [],
                   "requirements": []
                 }`
      }, {
        role: "user",
        content: `Analyze the market for: ${query}`
      }]);

      const content = typeof response.content === 'string' 
        ? response.content 
        : JSON.stringify(response.content);
        
      const analysis = JSON.parse(content);

      return {
        competitorAnalysis: {
          platform: 'all',
          competitors: analysis.competitors || [],
          gaps: analysis.gaps || [],
          opportunities: analysis.opportunities || []
        },
        industryTrends: {
          rising: analysis.risingTrends || [],
          declining: analysis.decliningTrends || [],
          emerging: analysis.emergingTrends || [],
          prediction: {
            timeframe: '3 months',
            confidence: analysis.confidence || 0,
            impact: analysis.impact || 'unknown'
          }
        },
        nichePotential: {
          current: analysis.currentPotential || 0,
          projected: analysis.projectedPotential || 0,
          growthAreas: analysis.growthAreas || [],
          risks: analysis.risks || [],
          requirements: analysis.requirements || []
        }
      };
    } catch (error) {
      console.error('Error getting market intelligence:', error);
      // Return empty data structure on error
      return {
        competitorAnalysis: {
          platform: 'all',
          competitors: [],
          gaps: [],
          opportunities: []
        },
        industryTrends: {
          rising: [],
          declining: [],
          emerging: [],
          prediction: {
            timeframe: '3 months',
            confidence: 0,
            impact: 'unknown'
          }
        },
        nichePotential: {
          current: 0,
          projected: 0,
          growthAreas: [],
          risks: [],
          requirements: []
        }
      };
    }
  }

  protected async getCrossPlatformAnalytics(context: AgentContext): Promise<CrossPlatformAnalytics> {
    // Implement cross-platform analytics gathering
    return {
      contentSynergy: [],
      audienceOverlap: [],
      timeOptimization: {
        bestTimes: {},
        crossPlatformSchedule: []
      }
    };
  }

  protected async getAudienceInsights(context: AgentContext) {
    // Fetch real audience insights using YouTube and social data
    const youtubeData = context.metrics?.youtube;
    const instagramData = context.metrics?.instagram;
    const tiktokData = context.metrics?.tiktok;

    // Combine metrics from all platforms
    const combinedMetrics = {
      totalFollowers: (youtubeData?.subscribers || 0) + 
                     (instagramData?.followers || 0) + 
                     (tiktokData?.followers || 0),
      engagement: {
        youtube: youtubeData?.engagement || 0,
        instagram: instagramData?.engagement || 0,
        tiktok: tiktokData?.engagement || 0
      },
      topPerforming: {
        youtube: youtubeData?.topVideos || [],
        instagram: instagramData?.topPosts || [],
        tiktok: tiktokData?.topVideos || []
      }
    };

    // Get demographic data from YouTube Analytics if available
    const demographics = youtubeData?.demographics || {
      ageGroups: [],
      genders: [],
      locations: []
    };

    return {
      demographics: demographics,
      interests: this.extractInterests(combinedMetrics),
      behavior: this.analyzeBehavior(combinedMetrics),
      engagement: this.calculateEngagement(combinedMetrics)
    };
  }

  private extractInterests(metrics: any) {
    // Extract interests from top performing content
    const interests = new Set<string>();
    
    Object.values(metrics.topPerforming).flat().forEach((content: any) => {
      content?.tags?.forEach((tag: string) => interests.add(tag));
      content?.categories?.forEach((category: string) => interests.add(category));
    });

    return Array.from(interests);
  }

  private analyzeBehavior(metrics: any) {
    return {
      peakEngagementTimes: this.calculatePeakTimes(metrics),
      contentPreferences: this.analyzeContentTypes(metrics),
      platformPreferences: this.analyzePlatformUsage(metrics)
    };
  }

  private calculatePeakTimes(metrics: Record<string, any>) {
    return {
      daily: [],
      weekly: [],
      monthly: []
    };
  }

  private analyzeContentTypes(metrics: Record<string, any>) {
    return {
      preferred: [],
      emerging: [],
      declining: []
    };
  }

  private analyzePlatformUsage(metrics: Record<string, any>) {
    return {
      primary: '',
      secondary: [],
      growth: {}
    };
  }

  private calculateEngagement(metrics: Record<string, any>) {
    const engagementValues = Object.values(metrics.engagement) as number[];
    return {
      overall: engagementValues.reduce((a, b) => a + b, 0) / engagementValues.length,
      byPlatform: metrics.engagement as Record<string, number>,
      trend: 'increasing'
    };
  }

  protected async getPartnershipOpportunities(context: AgentContext) {
    // Implement partnership opportunities gathering
    return {
      potential: [],
      active: [],
      historical: [],
      recommendations: []
    };
  }

  protected async getContentPerformanceMetrics(context: AgentContext) {
    // Implement content performance metrics gathering
    return {
      topPerforming: [],
      trends: [],
      opportunities: [],
      recommendations: []
    };
  }

  protected async storeResult(content: string, metadata: AVAMetadata): Promise<void> {
    try {
      // Queue for batch processing instead of immediate storage
      await this.batchProcessor.queueForBatch(
        metadata.user_id,
        content,
        metadata
      );

      // Still update screen data immediately for real-time feedback
      if (metadata.type === 'insight') {
        await this.updateScreenData(metadata.user_id, {
          content,
          timestamp: metadata.timestamp,
          type: metadata.type
        });
      }
    } catch (error) {
      console.error(`Error in storeResult for ${this.agentType}:`, error);
      throw error;
    }
  }

  protected async updateScreenData(userId: string, data: Record<string, any>): Promise<void> {
    await this.storeResult(
      JSON.stringify(data),
      {
        type: "smart_note",
        category: `${this.agentType}_screen_data`,
        user_id: userId,
        isLatest: true,
        timestamp: new Date().toISOString()
      }
    );
  }

  protected async getIntegrationStatus(userId: string): Promise<PlatformIntegrationContext> {
    const integrations = await this.getRelevantContext(
      "integration_status",
      {
        type: "smart_note",
        category: "platform_integration",
        user_id: userId,
        isLatest: true,
        timestamp: new Date().toISOString()
      },
      1
    );

    return integrations[0]?.pageContent 
      ? JSON.parse(integrations[0].pageContent)
      : {};
  }

  protected async updateIntegrationStatus(
    userId: string,
    updates: Partial<PlatformIntegrationContext>
  ): Promise<void> {
    const currentStatus = await this.getIntegrationStatus(userId);
    const newStatus = { ...currentStatus, ...updates };

    await this.storeResult(
      JSON.stringify(newStatus),
      {
        type: "smart_note",
        category: "platform_integration",
        user_id: userId,
        isLatest: true,
        timestamp: new Date().toISOString()
      }
    );
  }

  protected async search(
    query: string,
    filter: any,
    limit: number = 5
  ): Promise<any[]> {
    // Extract type from filter and ignore limit as it's handled internally by RAGSystem
    const type = typeof filter === 'string' ? filter : filter?.type || 'general';
    return this.rag.search(type, query);
  }

  protected generateConversationId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${this.agentType}_${timestamp}_${random}`;
  }

  protected getConversationId(): string {
    return this.conversationId;
  }

  protected regenerateConversationId(): string {
    this.conversationId = this.generateConversationId();
    return this.conversationId;
  }
} 
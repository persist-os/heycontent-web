import { BaseAgent, AgentContext, Demographics } from "./base-agent";
import { RAGSystem } from "../rag";
import { HumanMessage, SystemMessage, AIMessage, BaseMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

interface AudienceContext extends AgentContext {
  metrics: {
    youtube?: {
      subscribers?: number;
      demographics?: Demographics;
      watchTime?: number;
      retention?: number;
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
    };
    instagram?: {
      followers?: number;
      demographics?: Demographics;
      engagement?: number | {
        likes: number;
        comments: number;
        shares: number;
        saves: number;
        total?: number;
      };
      stories?: {
        views?: number;
        replies?: number;
      };
      topPosts?: Array<{
        tags?: string[];
        categories?: string[];
      }>;
    };
    tiktok?: {
      followers?: number;
      demographics?: Demographics;
      engagement?: number | {
        likes: number;
        comments: number;
        shares: number;
        total?: number;
      };
      watchTime?: number;
      topVideos?: Array<{
        tags?: string[];
        categories?: string[];
      }>;
    };
  };
  audienceSegments?: Array<{
    id?: string;
    name?: string;
    size?: number;
    engagement?: number;
    platforms?: string[];
    interests?: string[];
  }>;
  contentPerformance?: Array<{
    id?: string;
    platform?: string;
    type?: string;
    engagement?: number;
    audience?: string[];
  }>;
}

interface AnalysisResult {
  insights: string[];
  metrics: {
    score?: number;
    confidence?: number;
    trend?: 'increasing' | 'decreasing' | 'stable';
  };
  recommendations: string[];
  details: {
    [key: string]: {
      value: number | string;
      change?: number;
      impact?: 'high' | 'medium' | 'low';
    };
  };
}

interface AudienceInsights {
  demographicAnalysis: AnalysisResult;
  engagementAnalysis: AnalysisResult;
  segmentAnalysis: AnalysisResult;
  contentPreferences: AnalysisResult;
  growthOpportunities: AnalysisResult;
  timestamp: string;
}

interface AudienceAgentResponse {
  output: string | null;
  error?: Error;
  analysis?: string;
  metrics?: AudienceContext['metrics'];
  audienceInsights?: AudienceInsights;
  timestamp?: string;
}

export class AudienceAgent extends BaseAgent {
  protected model: ChatOpenAI;

  constructor(userId: string, rag: RAGSystem) {
    super(userId, rag, 'audience');
    this.model = new ChatOpenAI({
      modelName: "gpt-4-1106-preview",
      temperature: 0.7,
    });
  }

  protected systemPrompt = `You are an expert audience analyst focused on understanding and optimizing audience engagement across multiple platforms.

Core Rules:
1. Focus on audience insights:
   - Track audience behavior
   - Analyze engagement patterns
   - Identify audience segments
   - Monitor audience growth

2. Enable cross-platform understanding:
   - Analyze platform-specific metrics
   - Track audience overlap
   - Identify platform preferences
   - Monitor cross-platform engagement

3. Provide audience intelligence:
   - Track demographic trends
   - Monitor content preferences
   - Identify growth opportunities
   - Assess audience loyalty`;

  async process(input: string, context?: AudienceContext): Promise<AudienceAgentResponse> {
    try {
      // Ensure we have a context object
      context = context || { userId: this.userId, metrics: {} };

      // Get cross-agent context
      const crossAgentContext = await this.getCrossAgentContext(input, context);

      // Get platform integration status
      const integrationStatus = await this.getIntegrationStatus(context.userId);

      // Get audience history
      const audienceHistory = await this.getRelevantContext(
        input,
        {
          type: "insight",
          category: "audience",
          user_id: context.userId
        }
      );

      // Get user's persona
      const userPersona = await this.rag.getUserPersona(context.userId);

      // Generate audience insights
      const audienceInsights = await this.generateAudienceInsights(context);

      // Create messages for the model
      const messages = [
        new SystemMessage(this.systemPrompt),
        new HumanMessage({
          content: input,
          additional_kwargs: {
            audienceHistory,
            userPersona,
            crossAgentContext,
            integrationStatus,
            audienceInsights,
            metrics: context.metrics
          }
        })
      ];

      // Analyze audience with all context
      const response = await this.model.invoke(messages);

      if (!(response instanceof AIMessage)) {
        throw new Error("Unexpected response type from model");
      }

      // Get the response content as string
      const responseContent = typeof response.content === 'string' 
        ? response.content 
        : Array.isArray(response.content) 
          ? response.content.map(c => typeof c === 'string' ? c : JSON.stringify(c)).join('\n')
          : JSON.stringify(response.content);

      // Store the analysis with all context
      const result = {
        analysis: responseContent,
        metrics: context.metrics,
        audienceInsights,
        timestamp: new Date().toISOString()
      };

      await this.storeResult(
        JSON.stringify(result),
        {
          type: "insight",
          category: "audience",
          user_id: context.userId,
          timestamp: new Date().toISOString()
        }
      );

      // Update audience screen data for real-time updates
      await this.updateScreenData(context.userId, {
        ...result,
        lastUpdate: new Date().toISOString()
      });

      return {
        output: responseContent,
        analysis: responseContent,
        metrics: context.metrics,
        audienceInsights,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error("AudienceAgent error:", error);
      return {
        output: null,
        error: error instanceof Error ? error : new Error("Unknown error")
      };
    }
  }

  private async generateAudienceInsights(context: AudienceContext) {
    const { metrics, audienceSegments, contentPerformance } = context;
    
    // Analyze demographics
    const demographicAnalysis = this.analyzeDemographics(metrics);

    // Analyze engagement patterns
    const engagementAnalysis = this.analyzeEngagementPatterns(metrics, contentPerformance);

    // Generate audience segments
    const segmentAnalysis = this.analyzeAudienceSegments(audienceSegments, metrics);

    // Analyze content preferences
    const contentPreferences = this.analyzeContentPreferences(contentPerformance, metrics);

    // Generate growth opportunities
    const growthOpportunities = this.identifyGrowthOpportunities(metrics, audienceSegments);

    return {
      demographicAnalysis,
      engagementAnalysis,
      segmentAnalysis,
      contentPreferences,
      growthOpportunities,
      timestamp: new Date().toISOString()
    };
  }

  private analyzeDemographics(metrics: AudienceContext['metrics']): AnalysisResult {
    // Implement demographics analysis logic
    return {
      insights: [],
      metrics: {},
      recommendations: [],
      details: {}
    };
  }

  private analyzeEngagementPatterns(
    metrics: AudienceContext['metrics'],
    contentPerformance?: AudienceContext['contentPerformance']
  ): AnalysisResult {
    // Implement engagement analysis logic
    return {
      insights: [],
      metrics: {},
      recommendations: [],
      details: {}
    };
  }

  private analyzeAudienceSegments(
    segments?: AudienceContext['audienceSegments'],
    metrics?: AudienceContext['metrics']
  ): AnalysisResult {
    // Implement segment analysis logic
    return {
      insights: [],
      metrics: {},
      recommendations: [],
      details: {}
    };
  }

  private analyzeContentPreferences(
    contentPerformance?: AudienceContext['contentPerformance'],
    metrics?: AudienceContext['metrics']
  ): AnalysisResult {
    // Implement content preferences analysis logic
    return {
      insights: [],
      metrics: {},
      recommendations: [],
      details: {}
    };
  }

  private identifyGrowthOpportunities(
    metrics: AudienceContext['metrics'],
    segments?: AudienceContext['audienceSegments']
  ): AnalysisResult {
    // Implement growth opportunities analysis logic
    return {
      insights: [],
      metrics: {},
      recommendations: [],
      details: {}
    };
  }
} 
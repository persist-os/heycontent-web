import { RAGSystem, AVADocumentType, AVAMetadata } from "../rag";
import { OpenAI } from "@langchain/openai";
import { ChatOpenAI } from "@langchain/openai";
import { BaseMessage, BaseMessageLike } from "@langchain/core/messages";
import { Message } from "@/types/conversation";

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

export interface AgentContext {
  userId: string;
  metrics?: any;
  persona?: any;
  previousMessages?: Message[];
  crossAgentContext?: {
    insights?: any[];
    partnerships?: any[];
    audience?: any[];
    chat?: any[];
  };
  platformIntegrations?: PlatformIntegrationContext;
  crossPlatformAnalytics?: CrossPlatformAnalytics;
  marketIntelligence?: MarketIntelligence;
  connectedPlatforms?: string[];
  niche?: string;
  targetAudience?: {
    demographics: any;
    interests: string[];
    behavior: any;
  };
  [key: string]: any;
}

export abstract class BaseAgent {
  protected rag: RAGSystem;
  protected model: ChatOpenAI;
  protected systemPrompt: string = '';
  protected agentType: 'chat' | 'insights' | 'partnerships' | 'audience';

  constructor(rag: RAGSystem, agentType: 'chat' | 'insights' | 'partnerships' | 'audience') {
    this.rag = rag;
    this.agentType = agentType;
    this.model = new ChatOpenAI({
      modelName: "gpt-4-1106-preview",
      temperature: 0.7,
    });
  }

  abstract process(input: string, context: AgentContext): Promise<{
    output: any;
    error?: Error;
  }>;

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
    filter: any,
    limit: number = 5
  ): Promise<any[]> {
    return this.rag.search(query, filter, limit);
  }

  protected async getCrossAgentContext(query: string, context: AgentContext): Promise<{
    insights: any[];
    partnerships: any[];
    audience: any[];
  }> {
    const crossAgentResults = await Promise.all([
      this.getRelevantContext(query, { type: "insight" }, 3),
      this.getRelevantContext(query, { type: "insight", category: "partnership" }, 3),
      this.getRelevantContext(query, { type: "insight", category: "audience" }, 3)
    ]);

    return {
      insights: crossAgentResults[0],
      partnerships: crossAgentResults[1],
      audience: crossAgentResults[2]
    };
  }

  protected async storeResult(content: string, metadata: AVAMetadata): Promise<void> {
    await this.rag.addDocument(content, {
      ...metadata,
      agentType: this.agentType,
      timestamp: metadata.timestamp || new Date().toISOString()
    });
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
} 
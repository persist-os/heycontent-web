import { BaseTool } from "./base-tool";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { RAGSystem } from "@/lib/rag";
import { ContentInsight, InsightContext, EnhancedInsights } from "../../../types/insights";

const AnalysisSchema = z.object({
  content: z.string(),
  // Optional enhanced analysis parameters
  platform_data: z.object({
    platform: z.enum(["instagram", "youtube", "tiktok"]),
    audience_size: z.number(),
    niche: z.string(),
    budget_range: z.enum(["low", "medium", "high"])
  }).optional(),
  type: z.enum(["email", "thread", "social"]).optional(),
  analysis_type: z.enum(["partnership", "collaboration", "general"]).optional(),
  // Optional context from other features
  context: z.object({
    partnerships: z.array(z.any()).optional(),
    audience: z.array(z.any()).optional(),
    metrics: z.record(z.any()).optional(),
    insights: z.array(z.any()).optional()
  }).optional()
});

export class PartnershipTool extends BaseTool {
  private rag: RAGSystem;

  constructor(rag: RAGSystem) {
    super();
    this.rag = rag;
  }

  name = "partnership_analyzer";
  description = "Analyzes content for partnership and collaboration opportunities. Can perform basic analysis or enhanced analysis with additional context.";
  protected _schema = AnalysisSchema;

  async _call(input: string) {
    try {
      const params = this.validateInput(input);
      
      // Basic content analysis
      const baseAnalysis = {
        isPartnership: this.detectPartnershipIntent(params.content),
        topics: this.extractTopics(params.content),
        nextSteps: this.suggestNextSteps(params.content),
        opportunities: this.identifyOpportunities(params.content)
      };

      // Get relevant insights from RAG if available
      const relevantInsights = await this.rag.search(params.content, {
        type: 'insight',
        category: 'partnership'
      }, 3);

      // Combine with context if provided
      const context: InsightContext = {
        insights: (relevantInsights as unknown as ContentInsight[]) || [],
        ...(params.context || {})
      };

      // If we have additional context, enhance the analysis
      if (Object.keys(context).length > 0) {
        const enhancedAnalysis = await this.enhanceWithContext(baseAnalysis, context);
        return JSON.stringify({
          ...baseAnalysis,
          context_insights: enhancedAnalysis,
          recommendations: this.generateEnhancedRecommendations(baseAnalysis, enhancedAnalysis)
        });
      }

      // Otherwise return basic analysis
      return JSON.stringify({
        ...baseAnalysis,
        recommendations: this.generateRecommendations(baseAnalysis)
      });
    } catch (error) {
      if (error instanceof Error) {
        return `Error analyzing content: ${error.message}`;
      }
      return "An unknown error occurred";
    }
  }

  private async enhanceWithContext(baseAnalysis: any, context: InsightContext): Promise<EnhancedInsights> {
    const enhancedInsights: EnhancedInsights = {
      partnership_history: [],
      audience_alignment: null,
      performance_metrics: null,
      related_insights: []
    };

    // Add partnership history if available
    if (context.partnerships && context.partnerships.length > 0) {
      enhancedInsights.partnership_history = [...context.partnerships];
    }

    // Add audience insights if available
    if (context.audience && context.audience.length > 0) {
      enhancedInsights.audience_alignment = {
        demographics: context.audience[0].demographics,
        interests: context.audience[0].interests
      };
    }

    // Add metrics if available
    if (context.metrics) {
      enhancedInsights.performance_metrics = {
        engagement: context.metrics.engagement,
        reach: context.metrics.reach,
        growth: context.metrics.growth
      };
    }

    // Add related insights from RAG
    if (context.insights && context.insights.length > 0) {
      enhancedInsights.related_insights = context.insights.map((insight: ContentInsight) => ({
        type: insight.type,
        title: insight.title || '',
        description: insight.description || '',
        confidence: insight.confidence
      }));
    }

    return enhancedInsights;
  }

  private detectPartnershipIntent(content: string): boolean {
    const partnershipKeywords = [
      'collaboration', 'partnership', 'opportunity', 'work together',
      'project', 'proposal', 'interested in', 'join forces'
    ];
    return partnershipKeywords.some(keyword => 
      content.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  private extractTopics(content: string): string[] {
    const topics = new Set<string>();
    const lines = content.split('\n');
    
    for (const line of lines) {
      if (line.toLowerCase().includes('subject:')) {
        const words = line.split(/\s+/);
        words.forEach(word => {
          if (word.length > 4) topics.add(word);
        });
      }
    }

    return Array.from(topics);
  }

  private suggestNextSteps(content: string): string[] {
    const steps = [];
    
    if (content.toLowerCase().includes('meeting')) {
      steps.push('Schedule follow-up meeting');
    }
    if (content.toLowerCase().includes('proposal')) {
      steps.push('Review proposal details');
    }
    if (content.toLowerCase().includes('contract') || content.toLowerCase().includes('agreement')) {
      steps.push('Review contract terms');
    }
    
    steps.push('Draft response with clarifying questions');
    return steps;
  }

  private identifyOpportunities(content: string): string[] {
    const opportunities = [];
    
    if (content.toLowerCase().includes('collaboration')) {
      opportunities.push('Potential collaboration opportunity');
    }
    if (content.toLowerCase().includes('project')) {
      opportunities.push('Project partnership possibility');
    }
    if (content.toLowerCase().includes('content')) {
      opportunities.push('Content creation opportunity');
    }
    
    return opportunities;
  }

  private generateRecommendations(analysis: any): string[] {
    const recommendations = [];
    
    if (analysis.isPartnership) {
      recommendations.push('Evaluate partnership alignment');
      recommendations.push('Prepare detailed response');
    }
    
    if (analysis.topics.length > 0) {
      recommendations.push('Research mentioned topics for deeper context');
    }
    
    recommendations.push('Document key points for future reference');
    return recommendations;
  }

  private generateEnhancedRecommendations(baseAnalysis: any, contextAnalysis: EnhancedInsights): string[] {
    const recommendations = this.generateRecommendations(baseAnalysis);
    
    // Add recommendations based on partnership history
    if (contextAnalysis.partnership_history.length > 0) {
      recommendations.push('Review similar past partnerships');
      recommendations.push('Apply learnings from previous collaborations');
    }

    // Add recommendations based on audience alignment
    if (contextAnalysis.audience_alignment) {
      recommendations.push('Consider audience demographic alignment');
      recommendations.push('Leverage shared audience interests');
    }

    // Add recommendations based on performance metrics
    if (contextAnalysis.performance_metrics) {
      recommendations.push('Align with current performance trends');
      recommendations.push('Consider engagement patterns');
    }

    return recommendations;
  }
} 
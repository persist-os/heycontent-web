import { 
  IntentProcessor, 
  ProcessingResult, 
  Pattern,
  IntentType,
  ProcessorType
} from './types';
import { ChatAgentContext } from './chat-agent';
import { AdvancedMemorySystem } from '../memory/advanced-memory-system';
import { nanoid } from 'nanoid';

export class SmartProcessingPipeline {
  private processors: Map<ProcessorType, IntentProcessor>;
  private patterns: Map<string, Pattern>;
  private memorySystem: AdvancedMemorySystem;
  private context: ChatAgentContext;
  
  constructor(context: ChatAgentContext, memorySystem: AdvancedMemorySystem) {
    this.context = context;
    this.memorySystem = memorySystem;
    this.processors = new Map();
    this.patterns = new Map();
    this.initializePatterns();
  }

  private initializePatterns() {
    // Email patterns
    this.patterns.set('email_search', {
      id: nanoid(),
      type: 'email_search',
      keywords: ['email', 'mail', 'inbox', 'message', 'sent', 'received'],
      regex: /\b(email|mail|message|inbox|sent|received)\b/i,
      confidence: 0.8,
      lastUpdated: Date.now(),
      usageCount: 0
    });

    // Video patterns
    this.patterns.set('video_analysis', {
      id: nanoid(),
      type: 'video_analysis',
      keywords: ['video', 'youtube', 'watch time', 'views', 'engagement'],
      regex: /\b(video|youtube|watch time|views|engagement)\b/i,
      confidence: 0.8,
      lastUpdated: Date.now(),
      usageCount: 0
    });

    // Social metrics patterns
    this.patterns.set('social_metrics', {
      id: nanoid(),
      type: 'social_metrics',
      keywords: ['metrics', 'analytics', 'performance', 'stats', 'growth'],
      regex: /\b(metrics|analytics|performance|stats|growth)\b/i,
      confidence: 0.8,
      lastUpdated: Date.now(),
      usageCount: 0
    });

    // Partnership patterns
    this.patterns.set('partnership', {
      id: nanoid(),
      type: 'partnership',
      keywords: ['partner', 'collaboration', 'deal', 'sponsor', 'brand'],
      regex: /\b(partner|collaboration|deal|sponsor|brand)\b/i,
      confidence: 0.8,
      lastUpdated: Date.now(),
      usageCount: 0
    });
  }

  async process(input: string): Promise<ProcessingResult> {
    const startTime = Date.now();

    try {
      // 1. Quick intent classification
      const intent = await this.classifyIntent(input);
      
      // 2. Select appropriate processor
      const processor = this.processors.get(this.mapIntentToProcessor(intent.type));
      
      if (!processor) {
        return this.handleUnknownIntent(input, intent);
      }
      
      // 3. Check requirements
      if (!this.checkRequirements(processor.requirements)) {
        return this.handleMissingRequirements(processor.requirements);
      }
      
      // 4. Check memory first
      const memoryResult = await this.checkMemory(input, intent);
      if (this.isMemoryReliable(memoryResult)) {
        return this.enhanceMemoryResponse(memoryResult);
      }
      
      // 5. Process with context awareness
      const result = await processor.subProcessors[intent.type](input, this.context);
      
      // 6. Update memory with new result
      await this.updateMemory(input, intent, result);
      
      // 7. Enhance response with memory and context
      const enhancedResult = await this.enhanceWithMemory(result);
      
      // 8. Update metrics
      this.updateMetrics({
        processingTime: Date.now() - startTime,
        memoryHits: memoryResult ? 1 : 0,
        confidenceScore: result.confidence,
        intentAccuracy: intent.confidence
      });
      
      return enhancedResult;
      
    } catch (error) {
      console.error('Error in processing pipeline:', error);
      return this.handleError(error);
    }
  }

  private async classifyIntent(input: string): Promise<{type: IntentType; confidence: number}> {
    let bestMatch: {type: IntentType; confidence: number} = {
      type: 'general',
      confidence: 0
    };

    for (const [type, pattern] of this.patterns.entries()) {
      const confidence = this.calculatePatternConfidence(input, pattern);
      if (confidence > bestMatch.confidence) {
        bestMatch = {
          type: type as IntentType,
          confidence
        };
      }
    }

    // Update pattern usage
    if (bestMatch.type !== 'general') {
      const pattern = this.patterns.get(bestMatch.type);
      if (pattern) {
        pattern.usageCount++;
        pattern.lastUpdated = Date.now();
        this.patterns.set(bestMatch.type, pattern);
      }
    }

    return bestMatch;
  }

  private calculatePatternConfidence(input: string, pattern: Pattern): number {
    const lowercaseInput = input.toLowerCase();
    
    // Check regex match
    const regexMatch = pattern.regex?.test(input) ? 0.5 : 0;
    
    // Check keyword matches
    const keywordMatches = pattern.keywords.filter(keyword => 
      lowercaseInput.includes(keyword.toLowerCase())
    ).length;
    const keywordScore = keywordMatches / pattern.keywords.length * 0.5;
    
    return regexMatch + keywordScore;
  }

  private mapIntentToProcessor(intent: IntentType): ProcessorType {
    const mapping: Record<IntentType, ProcessorType> = {
      'email_search': 'email',
      'video_analysis': 'social_media',
      'social_metrics': 'analytics',
      'partnership': 'partnership',
      'content_strategy': 'content_strategy',
      'general': 'content_strategy'
    };
    return mapping[intent];
  }

  private async checkMemory(input: string, intent: {type: IntentType; confidence: number}) {
    try {
      const memoryResult = await this.memorySystem.searchNodes({
        type: intent.type,
        query: input,
        context: JSON.stringify(this.context)
      });

      return {
        data: memoryResult,
        confidence: this.calculateMemoryConfidence(memoryResult, intent),
        timestamp: Date.now(),
        source: 'memory',
        relevance: this.calculateRelevance(memoryResult, input)
      };
    } catch (error) {
      console.error('Error checking memory:', error);
      return null;
    }
  }

  private calculateMemoryConfidence(memoryResult: any, intent: {type: IntentType; confidence: number}): number {
    if (!memoryResult) return 0;
    
    const recencyScore = this.calculateRecencyScore(memoryResult.timestamp);
    const relevanceScore = this.calculateRelevanceScore(memoryResult, intent);
    const usageScore = this.calculateUsageScore(memoryResult);
    
    return (recencyScore * 0.4 + relevanceScore * 0.4 + usageScore * 0.2);
  }

  private calculateRecencyScore(timestamp: number): number {
    const hoursSinceUpdate = (Date.now() - timestamp) / (60 * 60 * 1000);
    return Math.exp(-hoursSinceUpdate / 24); // Decay over 24 hours
  }

  private calculateRelevanceScore(memoryResult: any, intent: {type: IntentType; confidence: number}): number {
    return intent.confidence * (memoryResult.confidence || 0.5);
  }

  private calculateUsageScore(memoryResult: any): number {
    const usageCount = memoryResult.useCount || 0;
    return Math.min(usageCount / 10, 1); // Cap at 10 uses
  }

  private calculateRelevance(memoryResult: any, input: string): number {
    // Implement relevance calculation based on content similarity
    // This is a simplified version
    return 0.5;
  }

  private isMemoryReliable(memoryResult: any): boolean {
    if (!memoryResult) return false;
    
    return memoryResult.confidence > 0.8 && 
           (Date.now() - memoryResult.timestamp) < (24 * 60 * 60 * 1000); // 24 hours
  }

  private async enhanceMemoryResponse(memoryResult: any): Promise<ProcessingResult> {
    // Implement response enhancement with memory context
    return {
      response: 'Memory-based response',
      confidence: memoryResult.confidence,
      metadata: {
        source: 'memory',
        timestamp: Date.now(),
        processingTime: 0
      }
    };
  }

  private async updateMemory(input: string, intent: {type: IntentType; confidence: number}, result: ProcessingResult) {
    try {
      // Map intent type to memory node type
      const memoryNodeType = this.mapIntentToMemoryType(intent.type);
      
      // Create memory node
      await this.memorySystem.addNode({
        id: nanoid(),
        type: memoryNodeType,
        content: {
          input,
          result,
          timestamp: Date.now()
        },
        confidence: intent.confidence,
        timestamp: Date.now(),
        relationships: new Map(),
        context: {
          situation: 'user_interaction',
          emotional_state: {
            primary: 'neutral',
            intensity: 0.5,
            confidence: 0.8
          },
          external_factors: ['custom_chat_interaction'],
          success_metrics: {
            confidence: result.confidence,
            processingTime: result.metadata?.processingTime
          }
        },
        evolution: {
          history: [{
            state: {
              content: result.response,
              timestamp: Date.now(),
              metadata: result.metadata
            },
            timestamp: Date.now(),
            trigger: 'processing'
          }],
          trend: 'stable',
          stability: 1.0
        }
      });
    } catch (error) {
      console.error('Error updating memory:', error);
    }
  }

  private mapIntentToMemoryType(intent: IntentType): "email_context" | "youtube_video" | "youtube_analytics" | "context" {
    const mapping: Record<IntentType, "email_context" | "youtube_video" | "youtube_analytics" | "context"> = {
      'email_search': 'email_context',
      'video_analysis': 'youtube_video',
      'social_metrics': 'youtube_analytics',
      'partnership': 'email_context',
      'content_strategy': 'context',
      'general': 'context'
    };
    return mapping[intent];
  }

  private async enhanceWithMemory(result: ProcessingResult): Promise<ProcessingResult> {
    // Implement response enhancement with memory context
    return result;
  }

  private checkRequirements(requirements: IntentProcessor['requirements']): boolean {
    // Implement requirements checking
    return true;
  }

  private handleMissingRequirements(requirements: IntentProcessor['requirements']): ProcessingResult {
    return {
      response: 'Missing required services or permissions',
      confidence: 0,
      actions: [{
        type: 'request_requirements',
        data: requirements
      }]
    };
  }

  private handleUnknownIntent(input: string, intent: {type: IntentType; confidence: number}): ProcessingResult {
    return {
      response: 'I\'m not sure how to handle this request',
      confidence: intent.confidence,
      actions: [{
        type: 'unknown_intent',
        data: { input, intent }
      }]
    };
  }

  private handleError(error: any): ProcessingResult {
    return {
      response: 'An error occurred while processing your request',
      confidence: 0,
      actions: [{
        type: 'error',
        data: error
      }]
    };
  }

  private updateMetrics(metrics: {
    processingTime: number;
    memoryHits: number;
    confidenceScore: number;
    intentAccuracy: number;
  }) {
    // Implement metrics updating
  }

  registerProcessor(processor: IntentProcessor) {
    this.processors.set(processor.type, processor);
  }
} 
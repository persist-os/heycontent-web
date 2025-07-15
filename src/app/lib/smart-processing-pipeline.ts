import { AdvancedMemorySystem } from "./memory/advanced-memory-system";
import { EmailContextManager } from "@/app/lib/agent/email-context-manager";
import { PlatformStatus } from "./chat-agent/types";

// Add interfaces for memory and email types
interface Memory {
  content?: string;
  toString(): string;
}

interface Email {
  subject?: string;
  snippet?: string;
}

interface SmartProcessingConfig {
  userId: string;
  platformStatus: PlatformStatus[];
  emailMemoryManager: EmailContextManager;
  memorySystem: AdvancedMemorySystem;
}

interface ProcessingResult {
  response: string;
  confidence: number;
  metadata: {
    processingPath: string[];
    contextUsed: string[];
    confidenceFactors: {
      factor: string;
      score: number;
    }[];
  };
}

export class SmartProcessingPipeline {
  private config: SmartProcessingConfig;
  private memorySystem: AdvancedMemorySystem;

  constructor(config: SmartProcessingConfig, memorySystem: AdvancedMemorySystem) {
    this.config = config;
    this.memorySystem = memorySystem;
  }

  async process(query: string): Promise<ProcessingResult> {
    const processingPath: string[] = [];
    const contextUsed: string[] = [];
    const confidenceFactors: { factor: string; score: number }[] = [];

    // Step 1: Query Enhancement with Memory Context
    const memoryContext = await this.memorySystem.retrieveMemory('conversation_history', query);
    let enhancedQuery = query;
    
    if (memoryContext.length > 0) {
      contextUsed.push('memory');
      confidenceFactors.push({ factor: 'memory_match', score: 0.8 });
      processingPath.push('memory_enhancement');
      
      // Enhanced memory context processing
      const relevantMemoryContext = memoryContext
        .slice(0, 3)  // Take top 3 most relevant memories
        .map((memory: Memory) => {
          if (typeof memory === 'object' && memory.content) {
            return {
              content: memory.content,
              timestamp: (memory as any).timestamp || Date.now(),
              type: (memory as any).type || 'conversation'
            };
          }
          return {
            content: memory.toString(),
            timestamp: Date.now(),
            type: 'conversation'
          };
        })
        .sort((a, b) => b.timestamp - a.timestamp)  // Most recent first
        .map(m => m.content);
      
      // Store the current interaction in memory
      await this.memorySystem.storeMemory('conversation_history', {
        content: query,
        timestamp: Date.now(),
        type: 'user_query',
        context: {
          processingPath,
          contextUsed
        }
      });
      
      // Construct enhanced query with temporal context
      enhancedQuery = this.constructEnhancedQueryWithContext(query, relevantMemoryContext);
    } else {
      // Even if no relevant memory found, store the current interaction
      await this.memorySystem.storeMemory('conversation_history', {
        content: query,
        timestamp: Date.now(),
        type: 'user_query'
      });
    }

    // Step 2: Email Context Integration
    const emailContext = await this.config.emailMemoryManager.getRelevantEmails(query);
    if (emailContext.length > 0) {
      contextUsed.push('email');
      confidenceFactors.push({ factor: 'email_context', score: 0.7 });
      processingPath.push('email_context_integration');
      
      // Add email context
      const emailSummary = emailContext
        .slice(0, 2)  // Take top 2 most relevant emails
        .map((email: { subject?: string; snippet?: string }) => 
          `${email.subject || 'Email'}: ${email.snippet || ''}`
        )
        .join(' ');
      
      enhancedQuery = `${enhancedQuery} (Related email context: ${emailSummary})`;
    }

    // Step 3: Platform-Specific Processing
    const connectedPlatforms = this.config.platformStatus
      .filter(p => p.isConnected)
      .map(p => p.platform);
    
    if (connectedPlatforms.length > 0) {
      contextUsed.push('platforms');
      confidenceFactors.push({ 
        factor: 'platform_integration', 
        score: 0.6 
      });
      processingPath.push('platform_context_integration');
      
      // Add platform context
      enhancedQuery = `${enhancedQuery} (Available platforms: ${connectedPlatforms.join(', ')})`;
    }

    // Step 4: Query Classification and Enhancement
    const queryType = this.classifyQuery(query);
    processingPath.push(`query_classification_${queryType}`);
    
    if (queryType === 'question') {
      confidenceFactors.push({ factor: 'question_handling', score: 0.9 });
    } else if (queryType === 'command') {
      confidenceFactors.push({ factor: 'command_handling', score: 0.85 });
    } else {
      confidenceFactors.push({ factor: 'general_query', score: 0.7 });
    }

    // Calculate overall confidence
    const confidence = confidenceFactors.reduce((acc, factor) => 
      acc + factor.score, 0) / confidenceFactors.length;

    return {
      response: enhancedQuery,
      confidence,
      metadata: {
        processingPath,
        contextUsed,
        confidenceFactors
      }
    };
  }

  private classifyQuery(query: string): 'question' | 'command' | 'statement' {
    if (query.trim().endsWith('?') || /^(what|who|where|when|why|how)/i.test(query)) {
      return 'question';
    }
    if (/^(find|search|get|show|list|create|update|delete)/i.test(query)) {
      return 'command';
    }
    return 'statement';
  }

  private isFollowUpQuestion(query: string): boolean {
    const queryLower = query.toLowerCase().trim();
    
    // 1. Common follow-up patterns
    const followUpPatterns = [
      // Questions
      /^(what|who|where|when|why|how|which|whose|whom)/i,
      /^(is|are|was|were|do|does|did|has|have|had|can|could|should|would|will)/i,
      
      // Pronouns and references
      /(^|\s)(it|they|them|those|these|this|that|he|she|his|her|their|its)(\s|$)/i,
      
      // Clarifying phrases
      /(^|\s)(and|but|so|then|also|what about|how about)(\s|$)/i,
      
      // Continuation markers
      /^(and|but|so|then|also|okay|ok|well|right|alright)(\s|[,])/i,
      
      // Implicit references
      /(^|\s)(the|this|that|these|those|such)(\s|$)/i,
      
      // Action continuations
      /^(can you|could you|would you|will you|please)/i,
      
      // Time-based follow-ups
      /(^|\s)(now|then|after|before|during|while)(\s|$)/i,
      
      // Comparative references
      /(^|\s)(same|similar|different|other|another|instead)(\s|$)/i
    ];

    // 2. Check for any follow-up pattern
    if (followUpPatterns.some(pattern => pattern.test(queryLower))) {
      return true;
    }

    // 3. Check for contextual continuity
    const contextualContinuity = [
      // Short queries (likely contextual)
      query.split(' ').length <= 3,
      
      // Starts with preposition
      /^(in|on|at|by|for|from|with|about|to)/i.test(queryLower),
      
      // Incomplete sentences
      !/[.!?]$/.test(query) && query.split(' ').length < 5,
      
      // Starts with conjunction
      /^(and|or|but|because|since|although|though|unless)/i.test(queryLower)
    ];

    if (contextualContinuity.some(Boolean)) {
      return true;
    }

    // 4. Check for semantic relationships
    const semanticIndicators = [
      // Relationship indicators
      /(related|similar|same|like|about|regarding)/i,
      
      // Clarification seekers
      /(mean|explain|elaborate|clarify|specify)/i,
      
      // Continuation markers
      /(continue|proceed|go on|more|else|other|another)/i,
      
      // Comparison markers
      /(better|worse|different|instead|rather|compare)/i
    ];

    return semanticIndicators.some(pattern => pattern.test(queryLower));
  }

  private constructEnhancedQueryWithContext(query: string, relevantContext: string[]): string {
    const isFollowUp = this.isFollowUpQuestion(query);
    
    if (isFollowUp) {
      // For follow-ups, include more context but prioritize recent
      const recentContext = relevantContext[0];
      const additionalContext = relevantContext.slice(1).join(' ');
      
      return `${query} (Immediate context: ${recentContext}${
        additionalContext ? ` | Additional context: ${additionalContext}` : ''
      })`;
    }
    
    // For new topics, include all context but mark it as background
    return `${query} (Background context: ${relevantContext.join(' | ')})`;
  }
} 
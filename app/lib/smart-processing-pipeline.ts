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
    const memoryContext = await this.memorySystem.retrieveMemory('memory', query);
    let enhancedQuery = query;
    
    if (memoryContext.length > 0) {
      contextUsed.push('memory');
      confidenceFactors.push({ factor: 'memory_match', score: 0.8 });
      processingPath.push('memory_enhancement');
      
      // Enhance query with memory context
      const relevantMemoryContext = memoryContext
        .slice(0, 3)  // Take top 3 most relevant memories
        .map((memory: any) => memory.content || memory.toString())
        .join(' ');
      
      enhancedQuery = `${query} (Context from previous interactions: ${relevantMemoryContext})`;
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
} 
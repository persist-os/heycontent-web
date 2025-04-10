import { BaseAgent } from './base-agent';
import { ChatAgentContext } from './chat-agent';
import { Message } from '@/app/types/conversation';
import { RAGSystem } from '../rag';
import { AdvancedMemorySystem } from '../memory/advanced-memory-system';
import { SmartProcessingPipeline } from './smart-processing-pipeline';
import { EmailProcessor } from './processors/email-processor';
import { VideoProcessor } from './processors/video-processor';
import { EmailMemoryManagerImpl } from '../memory/email-memory-manager';
import { YouTubeMemoryManagerImpl } from '../memory/youtube-memory-manager';
import { EmailContextManager } from './email-context-manager';
import { ProcessingResult } from './types';

export class SmartChatAgent extends BaseAgent {
  private pipeline: SmartProcessingPipeline;
  private context: ChatAgentContext;
  private memorySystem: AdvancedMemorySystem;
  private emailMemoryManager: EmailMemoryManagerImpl;
  private youtubeMemoryManager: YouTubeMemoryManagerImpl;
  private emailContextManager: EmailContextManager;

  constructor(
    rag: RAGSystem,
    userId: string,
    platformStatus: any[]
  ) {
    super(userId, rag, 'chat');
    
    this.context = {
      userId,
      conversationId: this.getConversationId(),
      currentTopic: 'general',
      contextStack: [],
      pendingActions: [],
      lastResponseType: 'answer',
      emotionalState: {
        primary: 'neutral',
        intensity: 0,
        context: ''
      },
      userIntent: {
        type: 'direct_inquiry',
        confidence: 1
      },
      focusMetrics: {
        topicChanges: 0,
        clarificationRequests: 0,
        followUpCount: 0,
        contextDepth: 0,
        emotionalShifts: 0,
        intentShifts: 0
      },
      conversationFlow: {
        naturalBreaks: 0,
        topicTransitions: [],
        depthProgression: [],
        engagementSignals: []
      }
    };
    this.memorySystem = new AdvancedMemorySystem(rag);
    this.emailMemoryManager = new EmailMemoryManagerImpl(this.memorySystem);
    this.youtubeMemoryManager = new YouTubeMemoryManagerImpl(this.memorySystem);
    this.emailContextManager = new EmailContextManager(userId);
    
    // Initialize processing pipeline
    this.pipeline = new SmartProcessingPipeline(this.context, this.memorySystem);
    
    // Register processors
    this.registerProcessors(userId);
  }

  private registerProcessors(userId: string) {
    // Email processor
    const emailProcessor = new EmailProcessor(
      userId,
      this.emailMemoryManager,
      this.emailContextManager
    );
    this.pipeline.registerProcessor(emailProcessor);

    // Video processor
    const videoProcessor = new VideoProcessor(
      userId,
      this.youtubeMemoryManager
    );
    this.pipeline.registerProcessor(videoProcessor);

    // Add more processors as needed...
  }

  async process(input: string, context?: ChatAgentContext): Promise<{
    output: any;
    error?: Error;
  }> {
    try {
      // Update context if provided, otherwise use existing context
      if (context) {
        this.context = {
          ...this.context,
          ...context
        };
      }

      // Process through pipeline
      const result = await this.pipeline.process(input);
      
      // Format response
      const response = this.formatResponse(result);
      
      // Handle any actions
      if (result.actions) {
        await this.handleActions(result.actions);
      }

      return {
        output: {
          response: response,
          confidence: result.confidence,
          metadata: result.metadata
        }
      };

    } catch (error) {
      console.error('Error in smart chat agent:', error);
      return {
        output: 'I encountered an error processing your request.',
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }

  private formatResponse(result: ProcessingResult): string {
    // If confidence is low, add a disclaimer
    const disclaimer = result.confidence < 0.7 
      ? '\n\nNote: I\'m not entirely certain about this response. Please verify the information.'
      : '';

    // Add source attribution if available
    const source = result.metadata?.source
      ? `\n\nSource: ${result.metadata.source}`
      : '';

    return `${result.response}${disclaimer}${source}`;
  }

  private async handleActions(actions: Array<{type: string; data: any}>) {
    for (const action of actions) {
      switch (action.type) {
        case 'update_email_context':
          await this.emailContextManager.updateContext(action.data);
          break;
        case 'update_video_context':
          if (this.context.youtubeData) {
            this.context.youtubeData.searchResults = action.data;
          } else {
            this.context.youtubeData = {
              searchResults: action.data
            };
          }
          break;
        // Add more action handlers as needed...
      }
    }
  }
} 
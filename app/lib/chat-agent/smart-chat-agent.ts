import { BaseAgent } from '../agent/base-agent';
import { SmartProcessingPipeline } from './processing/smart-processing-pipeline';
import { ChatAgentContext, PlatformStatus } from './types';
import { AdvancedMemorySystem } from '../memory/advanced-memory-system';
import { EmailMemoryManagerImpl } from '../memory/email-memory-manager';
import { YouTubeMemoryManagerImpl } from '../memory/youtube-memory-manager';
import { EmailContextManager } from '../context/email-context-manager';
import { RAGSystem } from '../rag';

interface ProcessResult {
  output: any;
  error?: Error;
  conversationState: {
    currentIntent: string;
    mood: string;
    contextualMemory: any[];
    tone: 'excited' | 'confused' | 'frustrated' | 'neutral' | 'curious' | 'reflective' | 'sad' | 'greeting' | 'confident' | 'uncertain';
    intent: 'direct_inquiry' | 'exploratory' | 'action_needed' | 'reflection' | 'greeting' | 'emotional' | 'strategic' | 'validation' | 'problem_solving' | 'unknown';
    needsClarification: boolean;
    isQuestion: boolean;
    topicFocus: string[];
    complexity: 'simple' | 'moderate' | 'complex';
    emotionalState: {
      valence: number;
      intensity: number;
      confidence: number;
    };
    contextualFactors: {
      timeReference: string | null;
      urgency: 'low' | 'medium' | 'high';
      decisionStage: string | null;
    };
  };
  suggestions: string[];
  persona: {
    tone: string;
    style: string;
  };
}

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
    platformStatus: PlatformStatus[]
  ) {
    super(userId, rag, 'chat');
    this.memorySystem = new AdvancedMemorySystem(rag);
    this.emailMemoryManager = new EmailMemoryManagerImpl(this.memorySystem);
    this.youtubeMemoryManager = new YouTubeMemoryManagerImpl(this.memorySystem);
    this.emailContextManager = new EmailContextManager(userId);
    
    this.context = {
      userId,
      platformStatus,
      emailMemoryManager: this.emailMemoryManager,
      youtubeMemoryManager: this.youtubeMemoryManager,
      emailContextManager: this.emailContextManager
    };

    this.pipeline = new SmartProcessingPipeline(
      this.context,
      this.memorySystem
    );
  }

  async process(input: string): Promise<ProcessResult> {
    try {
      const result = await this.pipeline.process(input);
      
      return {
        output: result.output,
        conversationState: {
          currentIntent: result.intent,
          mood: result.emotionalState || 'neutral',
          contextualMemory: result.contextualMemory || [],
          tone: (result.emotionalState || 'neutral') as 'excited' | 'confused' | 'frustrated' | 'neutral' | 'curious' | 'reflective' | 'sad' | 'greeting' | 'confident' | 'uncertain',
          intent: (result.intent || 'direct_inquiry') as 'direct_inquiry' | 'exploratory' | 'action_needed' | 'reflection' | 'greeting' | 'emotional' | 'strategic' | 'validation' | 'problem_solving' | 'unknown',
          needsClarification: false,
          isQuestion: false,
          topicFocus: result.contextualMemory?.map(m => m.topic || '').filter(Boolean) || [],
          complexity: 'moderate' as const,
          emotionalState: {
            valence: 0,
            intensity: 0.5,
            confidence: 1.0
          },
          contextualFactors: {
            timeReference: null,
            urgency: 'medium' as const,
            decisionStage: null
          }
        },
        suggestions: result.suggestions || [],
        persona: {
          tone: result.tone || 'professional',
          style: result.style || 'helpful'
        }
      };
    } catch (error) {
      return {
        output: null,
        error: error instanceof Error ? error : new Error(String(error)),
        conversationState: {
          currentIntent: 'error',
          mood: 'neutral',
          contextualMemory: [],
          tone: 'neutral' as const,
          intent: 'problem_solving' as const,
          needsClarification: true,
          isQuestion: false,
          topicFocus: ['error_handling'],
          complexity: 'simple' as const,
          emotionalState: {
            valence: 0,
            intensity: 0.5,
            confidence: 1.0
          },
          contextualFactors: {
            timeReference: 'present' as const,
            urgency: 'high' as const,
            decisionStage: 'awareness' as const
          }
        },
        suggestions: [],
        persona: {
          tone: 'professional',
          style: 'helpful'
        }
      };
    }
  }
} 
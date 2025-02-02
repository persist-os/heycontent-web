import { EmailMemoryManagerImpl } from '../memory/email-memory-manager';
import { YouTubeMemoryManagerImpl } from '../memory/youtube-memory-manager';
import { EmailContextManager } from '../context/email-context-manager';

export interface ConversationCues {
  tone: string;
  intent: string;
  needsClarification: boolean;
  isQuestion: boolean;
  emotionalState: string;
  contextualMemory: any[];
  currentIntent: string;
}

export interface PlatformStatus {
  platform: string;
  isConnected: boolean;
  lastSync?: Date;
  features: string[];
  errors?: string[];
}

export interface ChatAgentContext {
  userId: string;
  platformStatus: PlatformStatus[];
  emailMemoryManager: EmailMemoryManagerImpl;
  youtubeMemoryManager: YouTubeMemoryManagerImpl;
  emailContextManager: EmailContextManager;
}

export interface ProcessResult {
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
      timeReference: 'past' | 'present' | 'future' | null;
      urgency: 'low' | 'medium' | 'high';
      decisionStage: 'awareness' | 'consideration' | 'decision' | null;
    };
  };
  suggestions: string[];
  persona: {
    tone: string;
    style: string;
  };
} 
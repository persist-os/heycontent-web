import { SocialPlatform } from '@/app/types/social-platforms';
import { ContentInsight, InsightContext } from '../../types/insights';
import { ChatAgentContext } from './chat-agent';
import { Message } from '@/app/types/conversation';
import { EmailMessage } from '../types/email';

export interface ProcessMetrics {
  youtube?: {
    views: number;
    subscribers: number;
    engagement: number;
  };
  gmail?: {
    totalEmails: number;
    partnerships: number;
  };
  [key: string]: any;
}

export interface ProcessContext {
  metrics?: ProcessMetrics;
  persona?: {
    currentPersona: string;
    futureVision: string;
    timestamp: string;
  };
  userId: string;
  connectedPlatforms: SocialPlatform[];
  existingInsights?: ContentInsight[];
  insightContext?: InsightContext;
  platformStatus: PlatformStatus[];
  emailContext?: EmailContext;
}

export type IntentType = 
  | 'email_search' 
  | 'video_analysis' 
  | 'social_metrics' 
  | 'partnership' 
  | 'content_strategy'
  | 'general';

export type ProcessorType =
  | 'email'
  | 'social_media'
  | 'analytics'
  | 'partnership'
  | 'content_strategy';

export interface ProcessingResult {
  response: string;
  actions?: Array<{
    type: string;
    data: any;
  }>;
  nextSteps?: string[];
  confidence: number;
  metadata?: {
    source: string;
    timestamp: number;
    processingTime: number;
  };
}

export interface IntentProcessor {
  type: ProcessorType;
  confidence: number;
  subProcessors: {
    [key: string]: (input: string, context: ChatAgentContext) => Promise<ProcessingResult>;
  };
  requirements: {
    services: string[];
    permissions: string[];
    data: string[];
  };
}

export interface Pattern {
  id: string;
  type: string;
  keywords: string[];
  regex?: RegExp;
  confidence: number;
  lastUpdated: number;
  usageCount: number;
}

export interface Interaction {
  id: string;
  timestamp: number;
  input: string;
  intent: IntentType;
  context: ChatAgentContext;
  result: ProcessingResult;
  userFeedback?: {
    helpful: boolean;
    comments?: string;
  };
}

export interface ResponseTemplate {
  id: string;
  type: string;
  template: string;
  variables: string[];
  conditions?: {
    confidence: number;
    context?: string[];
    intent?: IntentType[];
  };
  style: 'formal' | 'casual' | 'technical' | 'friendly';
}

export interface MemoryResult {
  data: any;
  confidence: number;
  timestamp: number;
  source: string;
  relevance: number;
}

export interface UserPreference {
  id: string;
  type: string;
  value: any;
  confidence: number;
  lastUpdated: number;
  source: 'explicit' | 'implicit';
}

export interface ProcessingMetrics {
  processingTime: number;
  memoryHits: number;
  confidenceScore: number;
  intentAccuracy: number;
  userSatisfaction?: number;
}

export interface ConversationCues {
  currentIntent: string;
  emotionalState: string;
  contextualMemory: any[];
  tone: string;
  intent: string;
  needsClarification: boolean;
  isQuestion: boolean;
  style: string;
  suggestions: string[];
  persona: {
    tone: string;
    style: string;
  };
}

export interface EmailContext {
  recentEmails: EmailMessage[];
  searchResults: EmailMessage[];
  lastSync?: Date;
}

export interface PlatformStatus {
  platform: string;
  isConnected: boolean;
  lastSync?: Date;
  features: string[];
  errors?: string[];
} 
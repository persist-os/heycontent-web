import { AgentContext } from './base-agent';
import { SearchResult, RAGStats } from '../memory/types';

export type EngagementLevel = 'high' | 'medium' | 'low';

export type DisplayedContentType = 
  | 'rag_result'
  | 'memory_recall'
  | 'direct_response'
  | 'system_message'
  | 'error_message'
  | 'suggestion'
  | 'clarification';

export interface DisplayedContent {
  id: string;
  content: any;
  timestamp: number;
  type: DisplayedContentType;
  source: 'rag' | 'memory' | 'direct';
  context?: string;
  metadata?: {
    confidence?: number;
    relevance?: number;
    query?: string;
    messageId?: string;
  };
  displayStatus: {
    shown: boolean;
    shownAt?: number;
    acknowledged?: boolean;
    acknowledgedAt?: number;
  };
}

export interface DisplayTrackingStats {
  totalDisplayed: number;
  byType: Record<DisplayedContentType, number>;
  bySource: Record<'rag' | 'memory' | 'direct', number>;
  lastDisplayTimestamp?: number;
  averageConfidence?: number;
}

export interface ConversationFlow {
  naturalBreaks: number;
  topicTransitions: string[];
  depthProgression: number[];
  engagementSignals: EngagementLevel[];
}

export interface UserIntent {
  type: 'direct_inquiry' | 'email_search' | 'follow_up' | 'clarification' |
        'exploratory' | 'action_needed' | 'reflection' | 'validation' |
        'creative' | 'strategic' | 'emotional_support' | 'greeting';
  confidence: number;
  sender?: string;
  date?: string;
  subtype?: string;
  query?: string;
}

export interface ConversationState {
  currentTopic: string;
  lastTopic: string;
  topicDepth: number;
  contextStack: string[];
  pendingActions: string[];
  lastResponseType: 'answer' | 'clarification' | 'followUp' | 'suggestion';
  emotionalState: {
    primary: 'neutral' | 'excited' | 'frustrated' | 'uncertain' | 'curious' | 'reflective' | 'stressed' | 'optimistic';
    intensity: number;
    context: string;
  };
  userIntent: UserIntent;
  focusMetrics: {
    topicChanges: number;
    clarificationRequests: number;
    followUpCount: number;
    contextDepth: number;
    emotionalShifts: number;
    intentShifts: number;
  };
  conversationFlow: ConversationFlow;
  mentionedEntities?: {
    names: Set<string>;
    dates: Set<string>;
    topics: Set<string>;
  };
  queryContext?: Array<{
    timestamp: number;
    intent: UserIntent;
    entities: {
      names: string[];
      dates: string[];
      topics: string[];
    };
    topic: string;
  }>;
}

export interface ChatAgentContext extends AgentContext {
  userId: string;
  conversationId: string;
  currentTopic?: string;
  lastTopic?: string;
  topicDepth?: number;
  contextStack: string[];
  pendingActions: string[];
  lastResponseType: 'answer' | 'clarification' | 'followUp' | 'suggestion';
  emotionalState: {
    primary: 'neutral' | 'excited' | 'frustrated' | 'uncertain' | 'curious' | 'reflective' | 'stressed' | 'optimistic';
    intensity: number;
    context: string;
  };
  userIntent: UserIntent;
  focusMetrics: {
    topicChanges: number;
    clarificationRequests: number;
    followUpCount: number;
    contextDepth: number;
    emotionalShifts: number;
    intentShifts: number;
  };
  conversationFlow: ConversationFlow;
  conversationState?: ConversationState;
  lastMessage?: {
    content: string;
    timestamp: number;
    type: 'user' | 'agent';
  };
  metadata?: {
    source: string;
    sessionId: string;
    clientInfo?: {
      platform: string;
      version: string;
    };
  };
  mentionedEntities?: {
    names: Set<string>;
    dates: Set<string>;
    topics: Set<string>;
  };
  queryContext?: Array<{
    timestamp: number;
    intent: UserIntent;
    entities: {
      names: string[];
      dates: string[];
      topics: string[];
    };
    topic: string;
  }>;
  // Enhanced RAG tracking
  ragResults?: {
    current: SearchResult[];
    history: Array<{
      results: SearchResult[];
      query: string;
      timestamp: number;
      displayed: boolean;
    }>;
    stats: RAGStats;
  };
  // Enhanced displayed information tracking
  displayedInfo?: Map<string, DisplayedContent>;
  displayStats?: DisplayTrackingStats;
  // Flag to prevent recursion in displayed context processing
  isProcessingDisplayedContext?: boolean;
}

export type MessageIntent = UserIntent; 
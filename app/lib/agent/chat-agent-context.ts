import { AgentContext } from './base-agent';

export type EngagementLevel = 'high' | 'medium' | 'low';

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
}

export type MessageIntent = UserIntent; 
import { EmailMessage } from '../../types/social-platforms';
import { YouTubeMetrics, InstagramMetrics, TikTokMetrics } from '../../lib/types/social';
import { MEMORY_TYPES, PATTERN_TYPES } from './config';

export type SituationType = 
  | 'content_creation'
  | 'content_analysis'
  | 'user_interaction'
  | 'partnership_discussion'
  | 'performance_review'
  | 'trend_analysis'
  | 'audience_engagement'
  | 'strategy_planning'
  | 'feedback_processing'
  | 'system_learning';

export type ExternalFactor = 
  | 'market_trend'
  | 'platform_update'
  | 'algorithm_change'
  | 'competitor_action'
  | 'audience_shift'
  | 'seasonal_event'
  | 'technical_issue'
  | 'content_viral'
  | 'partnership_opportunity'
  | 'industry_news';

export interface InputContext {
  situation: SituationType;
  external_factors: ExternalFactor[];
  timestamp: number;
}

export interface ExtractInput {
  content: string;
  type: string;
  context: InputContext;
}

export interface MemoryNodeState {
  content: string | Record<string, unknown>;
  metadata?: Record<string, unknown>;
  timestamp: number;
  engagement?: number;
}

export type BaseMemoryType = 'short_term' | 'working' | 'long_term' | 'context';

export type PlatformMemoryType = 
  | 'email_context'
  | 'youtube_video' | 'youtube_comment' | 'youtube_analytics'
  | 'instagram_post' | 'instagram_story' | 'instagram_reel' | 'instagram_analytics'
  | 'tiktok_video' | 'tiktok_comment' | 'tiktok_analytics';

export type MemoryNodeType = BaseMemoryType | PlatformMemoryType;

export type RelationshipType = 
  | 'related_to'
  | 'part_of'
  | 'follows'
  | 'follows_up'
  | 'precedes'
  | 'similar_to'
  | 'references'
  | 'contradicts'
  | 'supports'
  | 'influences'
  | 'depends_on'
  | 'related_topic'
  | `custom_${string}`;

export interface EmotionalStateValue {
  primary: 
    | 'neutral'
    | 'positive'
    | 'negative'
    | 'excited'
    | 'frustrated'
    | 'curious'
    | 'confused'
    | 'satisfied'
    | 'uncertain'
    | 'engaged'
    | 'disengaged'
    | `custom_${string}`;  // Allow custom emotions
  intensity: number;  // 0-1 scale for intensity
  secondary?: string;  // Allow any secondary emotion
  context?: string;   // Allow free-form context
  confidence: number; // How confident we are in this assessment
}

export type EmotionalState = EmotionalStateValue['primary'];

export type EvolutionTrigger = 
  | 'user_interaction'
  | 'system_update'
  | 'pattern_detected'
  | 'confidence_change'
  | 'context_update'
  | 'relationship_change'
  | 'external_event'
  | 'consolidation'
  | 'validation'
  | 'correction'
  | 'initial_creation'
  | 'new_information'
  | 'processing'
  | 'email_received'
  | 'user_input'
  | `custom_${string}`;  // Allow custom triggers

export interface MemoryNode {
  id: string;
  type: MemoryNodeType;
  content: string | Record<string, unknown>;
  confidence: number;
  timestamp: number;
  relationships: Map<string, {
    type: RelationshipType;
    strength: number;
    evidence: string[];
  }>;
  context: {
    situation: SituationType | `custom_${string}`;  // Allow custom situations
    emotional_state: EmotionalStateValue;
    external_factors: (ExternalFactor | `custom_${string}`)[];  // Allow custom factors
    success_metrics?: {
      engagement?: number;
      reach?: number;
      conversion?: number;
      impact?: number;
      confidence?: number;
      views?: number;
      likes?: number;
      comments?: number;
      shares?: number;
      [key: string]: number | undefined;  // Allow custom metrics
    };
  };
  evolution: {
    history: Array<{
      state: MemoryNodeState;
      timestamp: number;
      trigger: EvolutionTrigger | `custom_${string}`;  // Allow custom triggers
    }>;
    trend: 'improving' | 'declining' | 'stable' | string;  // Allow custom trends
    stability: number;
  };
}

export interface KnowledgeGraph {
  nodes: Map<string, MemoryNode>;
  relationships: Map<string, Map<string, {
    type: RelationshipType;
    strength: number;
    evidence: string[];
  }>>;
}

export type UserInsightContext = 
  | 'content_interaction'
  | 'email_communication'
  | 'platform_usage'
  | 'feature_interaction'
  | 'partnership_engagement'
  | 'feedback_session'
  | 'performance_review'
  | 'strategy_discussion'
  | 'support_interaction'
  | 'preference_setting';

export type UserInsightType = 
  | 'preference'
  | 'feedback'
  | 'concern'
  | 'interest'
  | 'dislike'
  | 'topic'
  | 'action'
  | `custom_${string}`;  // Allow custom insight types

export interface SentimentValue {
  primary: 'positive' | 'negative' | 'neutral' | 'unsure' | `custom_${string}`;
  intensity: number;  // 0-1 scale
  nuance?: string;    // Additional sentiment context
  confidence: number;
}

export interface UserInsight {
  type: UserInsightType;
  subject: string;
  sentiment: SentimentValue;
  confidence: number;
  context: UserInsightContext | `custom_${string}`;  // Allow custom contexts
  timestamp: number;
  mentions: number;
  lastMentioned: number;
  metadata?: Record<string, unknown>;  // Allow additional flexible data
}

export interface PreferenceValue {
  value: string | number | boolean | Record<string, unknown>;
  confidence: number;
  lastUpdated: number;
  context?: string;
  strength?: number;  // How strongly held is this preference (0-1)
  flexibility?: number;  // How open to change is this preference (0-1)
  source?: string;  // Where this preference came from
  history?: Array<{
    value: string | number | boolean | Record<string, unknown>;
    timestamp: number;
    trigger?: string;
  }>;
  conditions?: Record<string, unknown>;  // When this preference applies
  alternatives?: Array<{
    value: string | number | boolean | Record<string, unknown>;
    weight: number;
  }>;
}

export type CommunicationStyle = 
  | 'direct'
  | 'exploratory'
  | 'collaborative'
  | 'formal'
  | 'casual'
  | 'technical'
  | `custom_${string}`;  // Allow custom communication styles

export interface TopicEntry {
  topic: string;
  timestamp: number;
  sentiment: number;
  context: string;
  engagement?: number;
  duration?: number;
  related_topics?: string[];
  key_points?: string[];
  follow_ups?: string[];
}

export interface InteractionPatterns {
  responseTypes: Map<string, number>;
  preferredDetails: string[];
  communicationStyle: CommunicationStyle;
  engagementLevel: number;
  adaptability?: number;  // How easily they adapt to different styles
  consistency?: number;  // How consistent their patterns are
  timeOfDay?: Record<string, number>;  // When they tend to interact
  customPatterns?: Record<string, unknown>;  // Any other observed patterns
}

export interface ConversationMemory {
  userInsights: UserInsight[];
  topicHistory: TopicEntry[];
  preferences: Map<string, PreferenceValue>;
  interactionPatterns: InteractionPatterns;
  contextualFactors?: {
    environment?: string;
    mood?: EmotionalStateValue;
    external_influences?: string[];
    time_sensitivity?: number;
  };
  dynamicAdjustments?: {
    style_shifts: Array<{
      from: CommunicationStyle;
      to: CommunicationStyle;
      timestamp: number;
      trigger?: string;
    }>;
    engagement_changes: Array<{
      level: number;
      timestamp: number;
      context?: string;
    }>;
  };
}

export interface PatternRecognitionResult {
  type: keyof typeof PATTERN_TYPES | `custom_${string}`;  // Allow custom pattern types
  confidence: number;
  pattern: {
    description: string;
    frequency: number;
    strength: number;
    context: Array<{  // Make context always structured for consistency
      type: string;
      value: string;
      confidence: number;
    }>;
    evidence: Array<{
      timestamp: number;
      observation: string | Record<string, unknown>;  // Allow structured observations
      context: string;
      confidence?: number;  // Confidence in this piece of evidence
      significance?: number;  // How important this evidence is
      related_factors?: string[];  // Other factors that might have influenced this
    }>;
    variations?: Array<{  // Track pattern variations
      description: string;
      frequency: number;
      context: Array<{  // Make context consistent with main pattern
        type: string;
        value: string;
        confidence: number;
      }>;
    }>;
    stability?: number;  // How stable/consistent this pattern is
    adaptability?: number;  // How much this pattern changes over time
  };
  temporalAspects: TemporalAspects;
  relatedPatterns: Array<{
    id: string;
    relationship: RelationshipType | `custom_${string}`;  // Allow custom relationships
    strength: number;
  }>;
  metadata?: Record<string, unknown>;  // Allow any additional pattern data
}

export interface TemporalAspects {
  periodicity?: number;
  seasonality?: string;
  timeOfDay?: string;
  dayOfWeek?: string;
  monthlyPattern?: string;
}

export interface TemporalObservation {
  timestamp: number;
  value: string | number | Record<string, unknown>;
  context: string;
}

export type TemporalPatternType = 
  | 'recurring' 
  | 'seasonal' 
  | 'periodic' 
  | 'cyclic' 
  | 'trend' 
  | 'spike' 
  | 'decay'
  | 'daily'
  | 'weekly'
  | 'monthly'
  | 'sequence'
  | `custom_${string}`;  // Allow custom temporal pattern types

export interface TemporalPattern {
  type: TemporalPatternType;
  cycle: number;
  confidence: number;
  observations: Array<{  // Make observations more structured
    timestamp: number;
    value: string | number | Record<string, unknown>;
    context: {
      type: string;
      description: string;
      confidence: number;
      metadata?: Record<string, unknown>;
    };
    confidence?: number;
    significance?: number;
  }>;
  trends: Array<{
    direction: 'improving' | 'declining' | 'stable' | `custom_${string}`;  // Allow custom trend directions
    strength: number;
    period: {
      start: number;
      end: number;
    };
    confidence?: number;
    factors?: string[];  // What might be influencing this trend
    metadata?: Record<string, unknown>;
  }>;
  temporalAspects: TemporalAspects & {  // Extend TemporalAspects
    intensity?: number;  // How strong the temporal pattern is
    regularity?: number;  // How regular/predictable the pattern is
    adaptability?: number;  // How much the pattern changes over time
    metadata?: Record<string, unknown>;
  };
  metadata?: Record<string, unknown>;  // Allow any additional pattern data
}

export interface TemporalAnalysis {
  timeframe: {
    start: number;
    end: number;
    duration: number;
  };
  patterns: TemporalPattern[];
  anomalies: Array<{
    timestamp: number;
    expected: string;
    actual: string;
    significance: number;
    context: string;
  }>;
}

export interface MemoryConsolidation {
  strategy: 'merge' | 'summarize' | 'abstract' | 'prune';
  criteria: {
    ageThreshold: number;
    relevanceThreshold: number;
    confidenceThreshold: number;
    usageFrequency: number;
  };
  result: {
    originalSize: number;
    consolidatedSize: number;
    retainedInformation: number;
    lostInformation: number;
  };
  metadata: {
    timestamp: number;
    trigger: 'scheduled' | 'threshold' | 'manual';
    affectedNodes: string[];
  };
}

export interface ErrorHandling {
  type: 'memory_operation' | 'pattern_recognition' | 'consolidation' | 'retrieval';
  severity: 'low' | 'medium' | 'high' | 'critical';
  error: Error;
  context: Record<string, any>;
  recovery: {
    strategy: 'retry' | 'fallback' | 'compensate' | 'ignore';
    success: boolean;
    alternativeAction?: string;
  };
  logging: {
    timestamp: number;
    affectedComponents: string[];
    stackTrace?: string;
  };
}

export interface MemorySystemMetrics {
  operationType: string;
  duration: number;
  timestamp: number;
  success: boolean;
  errorCount?: number;
  memoryUsage?: {
    heapUsed: number;
    heapTotal: number;
  };
}

export interface EmailMetadata {
  category: 'primary' | 'social' | 'promotions' | 'updates' | 'forums' | 'custom';
  priority: 'high' | 'medium' | 'low';
  status: 'read' | 'unread' | 'archived' | 'deleted';
  flags: Set<'important' | 'starred' | 'snoozed' | 'spam' | 'draft'>;
  customLabels: Set<string>;
}

export interface EmailThreadContext {
  depth: number;  // Position in thread
  totalMessages: number;
  lastMessageTimestamp: number;
  participants: Set<string>;
  summary: string;
  topic: string;
  status: 'active' | 'resolved' | 'pending' | 'archived';
}

export interface EmailAnalysisMetrics {
  relevanceScore: number;
  importanceScore: number;
  urgencyScore: number;
  engagementScore: number;
  completenessScore: number;
}

export interface EmailMemoryNode extends MemoryNode {
  type: 'email_context';
  content: {
    messageId: string;
    threadId: string;
    subject: string;
    participants: string[];
    cc: string[];
    bcc: string[];
    topics: string[];
    key_points: string[];
    sentiment: 'positive' | 'negative' | 'neutral';
    importance: number;
    thread_context: string;
    timestamp: number;
    snippet: string;
    isRead: boolean;
    isStarred: boolean;
    labels: string[];
    hasAttachments: boolean;
    lastReferencedAt: number;
    useCount: number;
    fullContent: string;
    summary: string;
    
    metadata: EmailMetadata;
    threadContext: EmailThreadContext;
    metrics: EmailAnalysisMetrics;
    analysis: {
      key_points: string[];
      topics: string[];
      participants: string[];
      timeline: { date: string; event: string }[];
      sentiment: string;
      action_items: string[];
      summary: string;
      entities: {
        people: string[];
        organizations: string[];
        locations: string[];
        dates: string[];
        urls: string[];
      };
      intent: {
        primary: 'request' | 'inform' | 'question' | 'response' | 'followup' | 'other';
        confidence: number;
        details: string;
      };
      context: {
        previousReferences: string[];
        relatedTopics: string[];
        externalContext: string[];
      };
    };
    
    relationships: {
      inReplyTo?: string;
      references: string[];
      forwards: string[];
      mentions: {
        people: string[];
        emails: string[];
        threads: string[];
      };
    };
  };
}

export interface EmailMemorySearchResult {
  nodes: EmailMemoryNode[];
  confidence: number;
  needsRefresh: boolean;
  lastUpdated: number;
}

export interface EmailMemoryManager {
  storeEmail(email: EmailMessage, context: string): Promise<void>;
  findRelevantEmails(query: string, context?: string): Promise<EmailMemorySearchResult>;
  updateEmailReference(messageId: string): Promise<void>;
  getEmailInsights(messageId: string): Promise<UserInsight[]>;
}

export interface YouTubeMemoryNode extends MemoryNode {
  type: 'youtube_video' | 'youtube_comment' | 'youtube_analytics';
  content: {
    videoId: string;
    title: string;
    description?: string;
    publishedAt: string;
    metrics: Partial<YouTubeMetrics>;
    topics: string[];
    key_points: string[];
    sentiment: string;
    lastReferencedAt: number;
    useCount: number;
    engagement: {
      likes: number;
      comments: number;
      shares: number;
      averageViewPercentage: number;
    };
    analysis: {
      mainTopics: string[];
      contentType: string[];
      performanceInsights: string[];
      audienceRetention?: number;
      engagementPatterns?: string[];
    };
  };
}

export interface YouTubeMemorySearchResult {
  nodes: YouTubeMemoryNode[];
  confidence: number;
  needsRefresh: boolean;
}

export interface YouTubeMemoryManager {
  storeVideo(videoId: string, metrics: YouTubeMetrics, context: string): Promise<void>;
  findRelevantVideos(query: string, context: string): Promise<YouTubeMemorySearchResult>;
  getVideoInsights(videoId: string): Promise<string[]>;
  updateVideoReference(videoId: string): Promise<void>;
  analyzeVideoTrends(timeframe: string): Promise<{
    topPerforming: YouTubeMemoryNode[];
    trends: {
      views: number[];
      engagement: number[];
      topics: { topic: string; count: number }[];
    };
  }>;
}

export interface InstagramMemoryNode extends MemoryNode {
  type: 'instagram_post' | 'instagram_story' | 'instagram_reel' | 'instagram_analytics';
  content: {
    postId: string;
    mediaType: 'image' | 'video' | 'carousel' | 'story' | 'reel';
    caption?: string;
    url: string;
    publishedAt: string;
    metrics: Partial<InstagramMetrics>;
    topics: string[];
    key_points: string[];
    sentiment: string;
    lastReferencedAt: number;
    useCount: number;
    engagement: {
      likes: number;
      comments: number;
      saves: number;
      shares: number;
      storyReplies?: number;
      reelPlays?: number;
    };
    analysis: {
      mainTopics: string[];
      contentType: string[];
      performanceInsights: string[];
      audienceRetention?: number;
      engagementPatterns?: string[];
      hashtagPerformance?: Array<{
        hashtag: string;
        engagement: number;
        reach: number;
      }>;
    };
  };
}

export interface InstagramMemorySearchResult {
  nodes: InstagramMemoryNode[];
  confidence: number;
  needsRefresh: boolean;
}

export interface InstagramMemoryManager {
  storePost(postId: string, metrics: InstagramMetrics, context: string): Promise<void>;
  findRelevantPosts(query: string, context: string): Promise<InstagramMemorySearchResult>;
  getPostInsights(postId: string): Promise<string[]>;
  updatePostReference(postId: string): Promise<void>;
  analyzeContentTrends(timeframe: string): Promise<{
    topPerforming: InstagramMemoryNode[];
    trends: {
      engagement: number[];
      reach: number[];
      topics: { topic: string; count: number }[];
      hashtags: { hashtag: string; performance: number }[];
    };
  }>;
}

export interface TikTokMemoryNode extends MemoryNode {
  type: 'tiktok_video' | 'tiktok_comment' | 'tiktok_analytics';
  content: {
    videoId: string;
    caption: string;
    soundId?: string;
    soundName?: string;
    challengeIds?: string[];
    challengeNames?: string[];
    url: string;
    publishedAt: string;
    metrics: Partial<TikTokMetrics>;
    topics: string[];
    key_points: string[];
    sentiment: string;
    lastReferencedAt: number;
    useCount: number;
    engagement: {
      likes: number;
      comments: number;
      shares: number;
      views: number;
      completionRate: number;
      watchTime: number;
    };
    analysis: {
      mainTopics: string[];
      contentType: string[];
      performanceInsights: string[];
      audienceRetention?: number;
      engagementPatterns?: string[];
      soundPerformance?: {
        views: number;
        engagement: number;
        completionRate: number;
      };
      challengePerformance?: Array<{
        challengeName: string;
        views: number;
        engagement: number;
        trend: 'rising' | 'stable' | 'declining';
      }>;
    };
  };
}

export interface TikTokMemorySearchResult {
  nodes: TikTokMemoryNode[];
  confidence: number;
  needsRefresh: boolean;
}

export interface TikTokMemoryManager {
  storeVideo(videoId: string, metrics: TikTokMetrics, context: string): Promise<void>;
  findRelevantVideos(query: string, context: string): Promise<TikTokMemorySearchResult>;
  getVideoInsights(videoId: string): Promise<string[]>;
  updateVideoReference(videoId: string): Promise<void>;
  analyzeContentTrends(timeframe: string): Promise<{
    topPerforming: TikTokMemoryNode[];
    trends: {
      views: number[];
      engagement: number[];
      topics: { topic: string; count: number }[];
      sounds: { soundId: string; performance: number }[];
      challenges: { challengeName: string; performance: number }[];
      completionRates: number[];
    };
  }>;
}

export type MemoryType = keyof typeof MEMORY_TYPES;
export type PatternType = keyof typeof PATTERN_TYPES;

export interface SearchResult {
  id: string;
  content: string | Record<string, any>;
  metadata?: Record<string, any>;
  confidence?: number;
  timestamp?: number;
  type?: string;
}

export interface BaseSearchParams {
  type?: string;
  query: string;
  context?: string;
}

export interface SearchNodeOptions extends BaseSearchParams {
  filters?: {
    embedding_similarity?: {
      vector: number[];
      threshold: number;
    };
    temporal?: boolean;
    [key: string]: any;
  };
  limit?: number;
}

export interface MemoryContext {
  relevantMemories: string[];
  memoryScore: number;
  lastAccessTime: Date;
}

export interface AdvancedMemorySystemInterface {
  searchNodes(params: SearchNodeOptions | BaseSearchParams): Promise<MemoryNode[]>;
  getOrCreateEmbedding(content: string): Promise<number[]>;
  addNode(node: MemoryNode): Promise<void>;
  processNewInformation(input: { content: string; type: string; context: any }): Promise<void>;
  updateNode(node: MemoryNode): Promise<void>;
  searchMemory(type: string, query: string, options?: { limit?: number; filters?: any }): Promise<SearchResult[]>;
  retrieveMemory(type: string, query: string): Promise<any[]>;
  addRelationship(
    sourceNode: MemoryNode,
    targetNode: MemoryNode,
    type: string,
    strength: number,
    evidence: string[]
  ): Promise<void>;
}

export interface ConversationFlow {
  naturalBreaks: number;
  topicTransitions: string[];
  depthProgression: number[];
  engagementSignals: string[];
} 
import { AdvancedMemorySystem } from './advanced-memory-system';
import { Message } from '@/app/types/conversation';
import { ChatAgentContext, EngagementLevel, ConversationFlow, UserIntent, DisplayedContent, DisplayedContentType, DisplayTrackingStats } from '../agent/chat-agent-context';
import { 
  MemoryNode, 
  PatternRecognitionResult, 
  TemporalAnalysis,
  TemporalPattern,
  SearchResult as BaseSearchResult,
  PlatformMemoryType,
  SituationType,
  RelationshipType,
  BaseMemoryType,
  EmotionalStateValue,
  EvolutionTrigger,
  AdvancedMemorySystemInterface,
  SearchNodeOptions,
  MemoryContext,
  BaseSearchParams
} from './types';
import { RAGSystem } from '../rag';
import { OpenAI } from 'openai';
import { PrismaClient, Prisma, ConversationState } from '@prisma/client';
import { MEMORY_TYPES, PATTERN_TYPES } from './config';
import { nanoid } from 'nanoid';
import prisma from '../prisma';
import { SearchResult, RAGStats } from '../memory/types';

// Type definitions using Prisma types
type PrismaJsonValue = Prisma.JsonValue;
type PrismaJsonArray = Prisma.JsonArray;

interface TopicHistoryItem {
  topic: string;
  timestamp: Date;
  context: PrismaJsonArray;
}

// Define interfaces for memory content types
interface SystemResponse {
  type: 'system_response';
  input: string;
  response: Prisma.JsonValue;
  suggestions: Prisma.JsonValue[];
}

interface InteractionResult {
  type: 'successful_interaction';
  input: string;
  response: Prisma.JsonValue;
  pattern: Prisma.JsonValue;
}

// Add Prisma type extensions
declare module '@prisma/client' {
  interface Prisma {
    ConversationUpdateInput: {
      state?: {
        upsert: {
          create: {
            currentTopic: string;
            lastTopic: string;
            topicDepth: number;
            contextStack: Prisma.JsonValue;
            pendingActions: Prisma.JsonValue;
            lastResponseType: string;
            emotionalState: Prisma.JsonValue;
            userIntent: Prisma.JsonValue;
            focusMetrics: Prisma.JsonValue;
            conversationFlow: Prisma.JsonValue;
            mentionedEntities?: Prisma.JsonValue;
            queryContext?: Prisma.JsonValue;
            conversationId: string;
          };
          update: {
            currentTopic?: string;
            lastTopic?: string;
            topicDepth?: number;
            contextStack?: Prisma.JsonValue;
            pendingActions?: Prisma.JsonValue;
            lastResponseType?: string;
            emotionalState?: Prisma.JsonValue;
            userIntent?: Prisma.JsonValue;
            focusMetrics?: Prisma.JsonValue;
            conversationFlow?: Prisma.JsonValue;
            mentionedEntities?: Prisma.JsonValue;
            queryContext?: Prisma.JsonValue;
            updatedAt?: Date;
          };
        };
      };
    };

    ConversationInclude: {
      state?: boolean;
    };

    Conversation: {
      state?: ConversationState | null;
    };
  }
}

// Helper type for JSON serialization
type SerializedUserIntent = {
  type: string;
  confidence: number;
  sender?: string;
  date?: string;
  subtype?: string;
  query?: string;
};

type SerializedQueryContext = {
  timestamp: number;
  intent: SerializedUserIntent;
  entities: {
    names: string[];
    dates: string[];
    topics: string[];
  };
  topic: string;
};

interface EmotionalState {
  primary: "neutral" | "excited" | "frustrated" | "uncertain" | "curious" | "reflective" | "stressed" | "optimistic";
  intensity: number;
  context: string;
}

interface FocusMetrics {
  topicChanges: number;
  clarificationRequests: number;
  followUpCount: number;
  contextDepth: number;
  emotionalShifts: number;
  intentShifts: number;
}

interface MentionedEntities {
  names: Set<string>;
  dates: Set<string>;
  topics: Set<string>;
}

interface QueryContext {
  timestamp: number;
  intent: UserIntent;
  entities: {
    names: string[];
    dates: string[];
    topics: string[];
  };
  topic: string;
  searchResults?: BaseSearchResult[];
  displayedInfo?: Map<string, DisplayedContent>;
  isProcessingDisplayedContext?: boolean;
}

interface ConversationStateData {
  conversationId: string;
  currentTopic: string;
  lastTopic: string;
  topicDepth: number;
  contextStack: any[];
  pendingActions: any[];
  lastResponseType: 'answer' | 'clarification' | 'followUp' | 'suggestion';
  emotionalState: EmotionalStateValue;
  userIntent: UserIntent;
  focusMetrics: {
    topicChanges: number;
    clarificationRequests: number;
    followUpCount: number;
    contextDepth: number;
    emotionalShifts: number;
    intentShifts: number;
  };
  conversationFlow: {
    naturalBreaks: number;
    topicTransitions: string[];
    depthProgression: number[];
    engagementSignals: string[];
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
  displayedInfo?: Map<string, DisplayedContent>;
  displayStats?: DisplayTrackingStats;
}

type MemoryContent = SystemResponse | InteractionResult;

// Add type definition for memory node types
type MemoryNodeType = BaseMemoryType | PlatformMemoryType;

// Keep our enhanced search result with confidence, extending the imported type
interface EnhancedSearchResult extends BaseSearchResult {
  content: string;  // Narrow the type to string only
  confidence: number;  // Make required in enhanced version
  displayed: boolean;
  displayTimestamp?: number;
  acknowledgement?: {
    status: boolean;
    timestamp?: number;
  };
  usage: {
    displayCount: number;
    lastUsed?: number;
    contexts: string[];
  };
}

// Update the module declaration to use the imported type
declare module '../agent/chat-agent-context' {
  interface ChatAgentContext {
    searchResults?: BaseSearchResult[];
    displayedInfo?: Map<string, DisplayedContent>;
    isProcessingDisplayedContext?: boolean;
    ragResults?: {
      current: BaseSearchResult[];
      history: {
        results: BaseSearchResult[];
        query: string;
        timestamp: number;
        displayed: boolean;
      }[];
      stats: {
        totalQueries: number;
        totalResults: number;
        lastQueryTimestamp?: number;
        averageConfidence?: number;
        successRate: number;
        queryTypes: Record<string, number>;
      };
    };
  }
}

// Internal interface for our enhanced RAG functionality
interface EnhancedRAGContext {
  current: EnhancedSearchResult[];
  history: {
    results: EnhancedSearchResult[];
    query: string;
    timestamp: number;
    displayed: boolean;
  }[];
  stats: EnhancedRAGStats;
}

// Type guard to check if a result is enhanced
function isEnhancedSearchResult(result: BaseSearchResult): result is EnhancedSearchResult {
  return 'confidence' in result && 
         'displayed' in result && 
         'usage' in result;
}

// Helper to convert SearchResult to EnhancedSearchResult
function enhanceSearchResult(result: BaseSearchResult): EnhancedSearchResult {
  // Ensure content is string
  const content = typeof result.content === 'string' 
    ? result.content 
    : JSON.stringify(result.content);

  return {
    ...result,
    content,  // Use the string content
    confidence: result.confidence || 0,
    displayed: result.displayed || false,
    usage: {
      displayCount: 0,
      contexts: []
    }
  };
}

// Extend ChatAgentContext with new properties
declare module '../agent/chat-agent-context' {
  interface ChatAgentContext {
    searchResults?: BaseSearchResult[];
    displayedInfo?: Map<string, DisplayedContent>;
    isProcessingDisplayedContext?: boolean;
    ragResults?: {
      current: BaseSearchResult[];
      history: {
        results: BaseSearchResult[];
        query: string;
        timestamp: number;
        displayed: boolean;
      }[];
      stats: {
        totalQueries: number;
        totalResults: number;
        lastQueryTimestamp?: number;
        averageConfidence?: number;
        successRate: number;
        queryTypes: Record<string, number>;
      };
    };
  }
}

interface TemporalNodeContent {
  type: 'temporal_context';
  conversationId: string;
  relatedConversations: Array<{
    id: string;
    topic: string;
    timestamp: Date;
    confidence: number;  // Updated from similarity
  }>;
  patterns: TemporalPattern[];
  metadata: {
    timeframe: string;
    totalRelated: number;
    topicClusters: Array<{
      topic: string;
      count: number;
      relatedTopics: string[];
    }>;
    temporalDensity: {
      overall: number;
      hourly: Record<number, number>;
      daily: Record<number, number>;
    };
  };
}

interface ValidationResult {
  isValid: boolean;
  reason?: string;
  suggestedFix?: any;
}

interface ContextValidationRules {
  maxTopicDepth: number;
  maxContextStackSize: number;
  maxPendingActions: number;
  minConfidenceThreshold: number;
  maxDisplayedInfoAge: number; // in milliseconds
}

// Base stats interface matching the original type
interface BaseRAGStats {
  totalQueries: number;
  totalResults: number;
  lastQueryTimestamp?: number;
  averageConfidence?: number;
  successRate: number;  // Added this required field
  queryTypes: Record<string, number>;  // Added this required field
}

// Extended stats interface with our additional tracking features
interface EnhancedRAGStats extends BaseRAGStats {
  // All required fields are now in BaseRAGStats
}

interface RAGTrackingStats extends BaseRAGStats {}

interface RAGQueryContext {
  results: BaseSearchResult[];
  query: string;
  timestamp: number;
  displayed: boolean;
}

interface RAGState {
  current: BaseSearchResult[];
  history: RAGQueryContext[];
  stats: RAGTrackingStats;
}

interface EnhancedRAGResult extends BaseSearchResult {
  displayed: boolean;
  displayTimestamp?: number;
  acknowledgement?: {
    status: boolean;
    timestamp?: number;
  };
  usage: {
    displayCount: number;
    lastUsed?: number;
    contexts: string[];
  };
}

// Update the original ragResults type in ChatAgentContext
interface EnhancedRagResults {
  current: BaseSearchResult[];
  history: RAGQueryContext[];
  stats: RAGTrackingStats;
}

// Time analysis related interfaces
interface TimeSegment {
  start: number;
  end: number;
  label: string;
}

interface ActivityPattern {
  segment: string;
  count: number;
  intensity: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface SeasonalPattern {
  season: string;
  activityLevel: number;
  confidence: number;
}

interface TimeAnalysisResult {
  confidence: number;
  data: {
    preferredHours: number[];
    hourlyDistribution: Record<number, number>;
    periodDistribution: Record<string, number>;
    segments: ActivityPattern[];
    seasonal: SeasonalPattern[];
    timezone: string;
    peakPeriods: Array<{
      start: number;
      end: number;
      intensity: number;
    }>;
  };
}

// Add new interfaces at the top of the file after existing interfaces
interface InteractionFrequencyPattern {
  interval: string;
  count: number;
  trend: 'increasing' | 'decreasing' | 'stable';
}

interface InteractionFrequencyResult {
  confidence: number;
  patterns: InteractionFrequencyPattern[];
  reliability: number;
}

// Add the missing TopicEvolutionResult interface
interface TopicEvolutionResult {
  confidence: number;
  data: {
    patterns: Array<{
      from: string;
      to: string;
      frequency: number;
      timeGap: number;
    }>;
  };
}

interface TopicCluster {
  topic: string;
  count: number;
  relatedTopics: string[];
  semanticScore?: number;
  hierarchyLevel?: number;
  parentTopic?: string;
  childTopics?: string[];
  contextualScore?: number;
}

interface TopicSimilarity {
  topic1: string;
  topic2: string;
  score: number;
  confidence: number;
}

interface TopicHierarchy {
  parent: string;
  children: string[];
  level: number;
  confidence: number;
}

interface TemporalDensityPattern {
  type: 'increasing' | 'decreasing' | 'cyclic' | 'stable';
  confidence: number;
  period?: number;  // for cyclic patterns
  magnitude?: number;  // strength of the pattern
}

interface DensityVariation {
  timeframe: 'hourly' | 'daily';
  patterns: TemporalDensityPattern[];
  anomalies: Array<{
    timestamp: number;
    expected: number;
    actual: number;
    deviation: number;
  }>;
}

interface EnhancedTemporalDensity {
  overall: number;
  hourly: Record<number, number>;
  daily: Record<number, number>;
  patterns: DensityVariation[];
  userBehavior: {
    peakHours: number[];
    activeTimeRanges: Array<{
      start: number;
      end: number;
      intensity: number;
    }>;
    consistency: number;
  };
}

interface StateVersion {
  major: number;
  minor: number;
  patch: number;
}

interface StateValidationError {
  field: string;
  error: string;
  suggestedFix?: any;
}

interface StateValidationResult {
  isValid: boolean;
  errors: StateValidationError[];
  version: StateVersion;
  needsMigration: boolean;
}

interface StateMigrationResult {
  success: boolean;
  migratedState: ConversationStateData;
  appliedMigrations: string[];
  errors: string[];
}

interface DisplayedInfoReference {
  id: string;
  content: any;
  confidence: number;
  timestamp: number;
  type: DisplayedContentType;
  query?: string;
}

interface MemoryAwareResponse {
  content: string;
  insights?: any;
  suggestions: any[];
}

export class MemoryAwareChatSystem {
  private advancedMemory: AdvancedMemorySystemInterface;
  private systemPrompt: string;
  private prisma: PrismaClient;
  private readonly DEFAULT_CONTEXT_WINDOW_SIZE = 5;
  private readonly MAX_CONTEXT_WINDOW_SIZE = 20;
  private contextWindowSize: number;
  private readonly DEFAULT_VALIDATION_RULES: ContextValidationRules = {
    maxTopicDepth: 5,
    maxContextStackSize: 20,
    maxPendingActions: 10,
    minConfidenceThreshold: 0.3,
    maxDisplayedInfoAge: 24 * 60 * 60 * 1000 // 24 hours
  };
  private readonly REFERENCE_RULES = {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    minConfidence: 0.3,
    maxReferences: 5
  };

  constructor(rag: RAGSystem, contextWindowSize?: number) {
    this.advancedMemory = new AdvancedMemorySystem(rag);
    this.systemPrompt = this.getBasePrompt();
    this.prisma = prisma; // Use the singleton instance
    this.contextWindowSize = this.validateContextWindowSize(contextWindowSize);
  }

  private validateContextWindowSize(size?: number): number {
    if (!size) return this.DEFAULT_CONTEXT_WINDOW_SIZE;
    return Math.min(Math.max(1, size), this.MAX_CONTEXT_WINDOW_SIZE);
  }

  // Add method to calculate interaction importance with enhanced metrics
  private calculateInteractionImportance(interaction: QueryContext): number {
    let importance = 0;
    const now = Date.now();

    // Base importance from intent confidence (0-0.3)
    importance += interaction.intent.confidence * 0.3;

    // Entity importance (0-0.2)
    const entityScore = (
      interaction.entities.names.length * 0.04 +
      interaction.entities.dates.length * 0.03 +
      interaction.entities.topics.length * 0.03
    );
    importance += Math.min(0.2, entityScore);

    // Search results importance (0-0.15)
    if (interaction.searchResults?.length) {
      const avgConfidence = interaction.searchResults.reduce((sum, r) => sum + (r.confidence || 0), 0) / interaction.searchResults.length;
      importance += avgConfidence * 0.15;
    }

    // Display information importance (0-0.15)
    if (interaction.displayedInfo?.size) {
      const displayedCount = Array.from(interaction.displayedInfo.values())
        .filter(content => content.displayStatus.acknowledged)
        .length;
      importance += Math.min(0.15, displayedCount * 0.03);
    }

    // Recency importance with exponential decay (0-0.2)
    const hoursSinceInteraction = (now - interaction.timestamp) / (1000 * 60 * 60);
    const recencyScore = Math.exp(-hoursSinceInteraction / 24); // Decay over 24 hours
    importance += recencyScore * 0.2;

    return Math.min(1, importance);
  }

  // Update prepareStateUpdate to use importance-based retention
  private prepareStateUpdate(context: ChatAgentContext, input: string, response: any): any {
    // Create new interaction
    const newInteraction: QueryContext = {
      timestamp: Date.now(),
      intent: context.userIntent,
      entities: this.extractEntities(input),
      topic: context.currentTopic || 'general',
      searchResults: context.searchResults || [],
      displayedInfo: context.displayedInfo || new Map<string, DisplayedContent>()
    };

    // Get existing context and add new interaction
    let queryContext = [...(context.queryContext || []), newInteraction];

    // Track RAG results with enhanced tracking
    const currentRagResults = context.ragResults?.current || [];
    if (currentRagResults.length > 0) {
      this.integrateRAGResults(
        currentRagResults,
        context,
        input
      ).then(enhancedResults => {
        // Update context with enhanced results
        if (context.ragResults) {
          context.ragResults.current = enhancedResults;
        }
      }).catch(error => {
        console.error('Error integrating RAG results:', error);
      });
    }

    // If we're over the window size, filter based on importance
    if (queryContext.length > this.contextWindowSize) {
      // Calculate importance for all interactions
      const withImportance = queryContext.map(interaction => ({
        interaction,
        importance: this.calculateInteractionImportance(interaction)
      }));

      // Sort by importance and keep most important ones
      queryContext = withImportance
        .sort((a, b) => b.importance - a.importance)
        .slice(0, this.contextWindowSize)
        .map(item => item.interaction);

      // Always keep the most recent interaction
      if (!queryContext.includes(newInteraction)) {
        queryContext[queryContext.length - 1] = newInteraction;
      }
    }

    // Merge entities from current interaction with existing ones
    const mergedEntities = this.mergeEntities(
      context.mentionedEntities || { names: new Set(), dates: new Set(), topics: new Set() },
      this.extractEntities(input)
    );

    // Track conversation flow
    const conversationFlow = {
      ...(context.conversationFlow || {}),
      naturalBreaks: (context.conversationFlow?.naturalBreaks || 0) + (this.isNaturalBreak(input) ? 1 : 0),
      topicTransitions: [
        ...(context.conversationFlow?.topicTransitions || []),
        ...(this.isTopicTransition(context.currentTopic, context.lastTopic) && context.currentTopic ? [context.currentTopic] : [])
      ],
      depthProgression: [
        ...(context.conversationFlow?.depthProgression || []),
        context.topicDepth || 0
      ],
      engagementSignals: [
        ...(context.conversationFlow?.engagementSignals || []),
        this.calculateEngagementLevel(input, response)
      ]
    };

    // Validate state transition
    const validationResult = this.validateContextTransition(context, {
      userId: context.userId,
      conversationId: context.conversationId,
      currentTopic: context.currentTopic || 'general',
      lastTopic: context.lastTopic || 'general',
      topicDepth: context.topicDepth || 0,
      contextStack: context.contextStack || [],
      pendingActions: context.pendingActions || [],
      lastResponseType: context.lastResponseType || 'answer',
      emotionalState: context.emotionalState || {},
      userIntent: context.userIntent || {},
      focusMetrics: context.focusMetrics || {},
      conversationFlow,
      mentionedEntities: mergedEntities,
      queryContext,
      displayedInfo: context.displayedInfo,
      displayStats: context.displayStats,
      ragResults: context.ragResults
    });
    if (!validationResult.isValid && validationResult.suggestedFix) {
      return validationResult.suggestedFix;
    }

    // Validate displayed content
    if (context.displayedInfo) {
      for (const [id, content] of context.displayedInfo.entries()) {
        const contentValidation = this.validateDisplayedContent(content);
        if (!contentValidation.isValid) {
          context.displayedInfo.delete(id);
        }
      }
    }

    // Validate RAG results if present
    if (context.ragResults?.current) {
      const ragValidation = this.validateRAGResults(context.ragResults.current);
      if (!ragValidation.isValid && ragValidation.suggestedFix) {
        context.ragResults.current = ragValidation.suggestedFix;
      }
    }

    return {
      currentTopic: context.currentTopic || 'general',
      lastTopic: context.lastTopic || 'general',
      topicDepth: context.topicDepth || 0,
      contextStack: context.contextStack || [],
      pendingActions: context.pendingActions || [],
      lastResponseType: context.lastResponseType || 'answer',
      emotionalState: context.emotionalState || {},
      userIntent: context.userIntent || {},
      focusMetrics: context.focusMetrics || {},
      conversationFlow,
      mentionedEntities: mergedEntities,
      queryContext,
      displayedInfo: context.displayedInfo,
      displayStats: context.displayStats,
      ragResults: context.ragResults
    };
  }

  private calculateAverageConfidence(results: (BaseSearchResult | EnhancedSearchResult)[]): number {
    if (!results || results.length === 0) return 0;
    
    const confidences = results.map(r => {
      if (isEnhancedSearchResult(r)) {
        return r.confidence;  // Always defined for enhanced results
      }
      return r.confidence || 0;  // Fallback for base results
    }).filter(c => c > 0);
    
    if (confidences.length === 0) return 0;
    return confidences.reduce((a, b) => a + b, 0) / confidences.length;
  }

  private mergeEntities(
    existing: { names: Set<string>; dates: Set<string>; topics: Set<string>; },
    newEntities: { names: string[]; dates: string[]; topics: string[]; }
  ): { names: Set<string>; dates: Set<string>; topics: Set<string>; } {
    return {
      names: new Set([...Array.from(existing.names), ...newEntities.names]),
      dates: new Set([...Array.from(existing.dates), ...newEntities.dates]),
      topics: new Set([...Array.from(existing.topics), ...newEntities.topics])
    };
  }

  private isNaturalBreak(input: string): boolean {
    return /^(ok|alright|thanks|thank you|great|got it|i see|understood)\b/i.test(input.trim());
  }

  private isTopicTransition(current?: string, last?: string): boolean {
    if (!current || !last) return false;
    if (current === last) return false;

    // Check if it's a significant topic change
    const currentWords = new Set(current.toLowerCase().split(/\s+/).filter(w => !this.isStopWord(w)));
    const lastWords = new Set(last.toLowerCase().split(/\s+/).filter(w => !this.isStopWord(w)));

    // Calculate Jaccard similarity
    const intersection = new Set([...currentWords].filter(x => lastWords.has(x)));
    const union = new Set([...currentWords, ...lastWords]);
    
    const similarity = intersection.size / union.size;
    
    // Consider it a transition if similarity is less than 0.3
    return similarity < 0.3;
  }

  private calculateEngagementLevel(input: string, response: any): EngagementLevel {
    const metrics = {
      inputLength: input.length,
      hasQuestion: /\?/.test(input),
      hasFollowUp: /\b(more|details|explain|elaborate|why|how)\b/i.test(input),
      hasEmphasis: /[!]|(\b(very|really|absolutely|definitely)\b)/i.test(input),
      hasAcknowledgment: /\b(thanks|thank you|got it|i see|understand|makes sense)\b/i.test(input),
      hasReasoning: /\b(because|since|therefore|hence|so|as|due to)\b/i.test(input)
    };

    // Calculate engagement score
    let score = 0;
    score += metrics.inputLength > 100 ? 0.4 : metrics.inputLength > 50 ? 0.2 : 0;
    score += metrics.hasQuestion ? 0.2 : 0;
    score += metrics.hasFollowUp ? 0.15 : 0;
    score += metrics.hasEmphasis ? 0.1 : 0;
    score += metrics.hasAcknowledgment ? 0.05 : 0;
    score += metrics.hasReasoning ? 0.1 : 0;

    // Map score to engagement level
    if (score >= 0.5) return 'high';
    if (score >= 0.25) return 'medium';
    return 'low';
  }

  // Helper method to extract entities from input
  private extractEntities(input: string): { names: string[]; dates: string[]; topics: string[]; } {
    // Simple entity extraction (can be enhanced with NLP libraries)
    const names = input.match(/[A-Z][a-z]+(?:\s[A-Z][a-z]+)*/)?.map(n => n.trim()) || [];
    const dates = input.match(/\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4}/)?.map(d => d.trim()) || [];
    const topics = input.match(/\b(?:email|meeting|project|task|goal|problem|solution)\b/gi)?.map(t => t.toLowerCase()) || [];
    
    return { names, dates, topics };
  }

  // Add method to get the underlying memory system
  getMemorySystem(): AdvancedMemorySystemInterface {
    return this.advancedMemory;
  }

  // Add method to process new information
  async processNewInformation(input: {
    content: string;
    type: string;
    context: any;
  }): Promise<{
    response: string;
    suggestions: any[];
  }> {
    const memoryNode: MemoryNode = {
      id: Date.now().toString(),
      type: 'context',
      content: input.content,
      confidence: 1,
      timestamp: Date.now(),
      relationships: new Map(),
      context: {
        situation: 'user_interaction',
        emotional_state: {
          primary: 'neutral',
          intensity: 0.5,
          confidence: 1.0
        },
        external_factors: []
      },
      evolution: {
        history: [{
          state: {
            content: 'created',
            timestamp: Date.now()
          },
          timestamp: Date.now(),
          trigger: 'initial_creation'
        }],
        trend: 'stable',
        stability: 1
      }
    };

    await this.advancedMemory.processNewInformation({
      content: input.content,
      type: input.type,
      context: input.context
    });

    const baseResponse = await this.generateBaseResponse(input.content, this.systemPrompt);
    return {
      response: baseResponse.content,
      suggestions: []
    };
  }

  // Add method to get insights
  async getInsights(params: {
    currentInput: string;
    context: any;
  }): Promise<{
    patterns: PatternRecognitionResult[];
    contradictions: any[];
    temporalInsights: TemporalAnalysis;
  }> {
    // Create a memory node for the current input
    const memoryNode: MemoryNode = {
      id: Date.now().toString(),
      type: 'context',
      content: params.currentInput,
      confidence: 1,
      timestamp: Date.now(),
      relationships: new Map(),
      context: {
        situation: 'user_interaction',
        emotional_state: {
          primary: 'neutral',
          intensity: 0.5,
          confidence: 1.0
        },
        external_factors: []
      },
      evolution: {
        history: [{
          state: {
            content: 'created',
            timestamp: Date.now()
          },
          timestamp: Date.now(),
          trigger: 'user_input'
        }],
        trend: 'stable',
        stability: 1
      }
    };

    // Process the current input
    await this.advancedMemory.processNewInformation({
      content: params.currentInput,
      type: 'context',
      context: params.context
    });

    // Return insights
    return {
      patterns: [],
      contradictions: [],
      temporalInsights: {
        timeframe: {
          start: Date.now() - (24 * 60 * 60 * 1000), // Last 24 hours
          end: Date.now(),
          duration: 24 * 60 * 60 * 1000
        },
        patterns: [],
        anomalies: []
      }
    };
  }

  // Add type guards for each complex type
  private isEmotionalState(obj: unknown): obj is EmotionalState {
    if (!obj || typeof obj !== 'object') return false;
    const state = obj as any;
    return (
      typeof state.primary === 'string' &&
      typeof state.intensity === 'number' &&
      typeof state.context === 'string'
    );
  }

  private isUserIntent(obj: unknown): obj is UserIntent {
    if (!obj || typeof obj !== 'object') return false;
    const intent = obj as any;
    return (
      typeof intent.type === 'string' &&
      typeof intent.confidence === 'number'
    );
  }

  private isFocusMetrics(obj: unknown): obj is FocusMetrics {
    if (!obj || typeof obj !== 'object') return false;
    const metrics = obj as any;
    return (
      typeof metrics.topicChanges === 'number' &&
      typeof metrics.clarificationRequests === 'number' &&
      typeof metrics.followUpCount === 'number' &&
      typeof metrics.contextDepth === 'number' &&
      typeof metrics.emotionalShifts === 'number' &&
      typeof metrics.intentShifts === 'number'
    );
  }

  // Update the state retrieval to use type guards
  private async deserializeState(state: any): Promise<ConversationStateData> {
    try {
      // Validate state
      const validationResult = this.validateStateFields(state);
      
      // Handle validation errors
      if (!validationResult.isValid) {
        console.warn('State validation errors:', validationResult.errors);
        // Apply suggested fixes where available
        validationResult.errors.forEach(error => {
          if (error.suggestedFix !== undefined) {
            state[error.field] = error.suggestedFix;
          }
        });
      }

      // Handle migration if needed
      if (validationResult.needsMigration) {
        const migrationResult = await this.migrateState(state, validationResult.version);
        if (migrationResult.success) {
          state = migrationResult.migratedState;
        } else {
          console.error('State migration errors:', migrationResult.errors);
        }
      }

      // Ensure required fields with defaults
      const currentTopic = state.currentTopic || 'general';
      const lastTopic = state.lastTopic || currentTopic;

      return {
        conversationId: state.conversationId,
        currentTopic,
        lastTopic,
        topicDepth: typeof state.topicDepth === 'number' ? state.topicDepth : 0,
        contextStack: Array.isArray(state.contextStack) ? state.contextStack : [],
        pendingActions: Array.isArray(state.pendingActions) ? state.pendingActions : [],
        lastResponseType: state.lastResponseType || 'answer',
        emotionalState: this.validateEmotionalState(state.emotionalState),
        userIntent: state.userIntent 
          ? this.deserializeUserIntent(state.userIntent as SerializedUserIntent)
          : {
              type: 'direct_inquiry',
              confidence: 0.8
            },
        focusMetrics: state.focusMetrics || {
          topicChanges: 0,
          clarificationRequests: 0,
          followUpCount: 0,
          contextDepth: 0,
          emotionalShifts: 0,
          intentShifts: 0
        },
        conversationFlow: state.conversationFlow || {
          naturalBreaks: 0,
          topicTransitions: [],
          depthProgression: [],
          engagementSignals: []
        },
        mentionedEntities: state.mentionedEntities ? {
          names: new Set(state.mentionedEntities.names || []),
          dates: new Set(state.mentionedEntities.dates || []),
          topics: new Set(state.mentionedEntities.topics || [])
        } : undefined,
        queryContext: state.queryContext 
          ? this.deserializeQueryContext(state.queryContext)
          : undefined
      };
    } catch (error) {
      console.error('Error deserializing state:', error);
      throw new Error(`Failed to deserialize state: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private validateStateFields(state: any): StateValidationResult {
    const errors: StateValidationError[] = [];
    const version = this.detectStateVersion(state);
    
    // Required fields validation
    const requiredFields = ['conversationId', 'contextStack', 'pendingActions'];
    requiredFields.forEach(field => {
      if (!state[field]) {
        errors.push({
          field,
          error: `Missing required field: ${field}`,
          suggestedFix: field === 'contextStack' ? [] : 
                       field === 'pendingActions' ? [] :
                       undefined
        });
      }
    });

    // Type validation
    if (state.topicDepth !== undefined && typeof state.topicDepth !== 'number') {
      errors.push({
        field: 'topicDepth',
        error: 'topicDepth must be a number',
        suggestedFix: 0
      });
    }

    if (state.emotionalState && typeof state.emotionalState !== 'object') {
      errors.push({
        field: 'emotionalState',
        error: 'emotionalState must be an object',
        suggestedFix: {
          primary: 'neutral' as const,
          intensity: 0.5,
          confidence: 0.8
        } as EmotionalStateValue
      });
    }

    // Array validation
    if (state.contextStack && !Array.isArray(state.contextStack)) {
      errors.push({
        field: 'contextStack',
        error: 'contextStack must be an array',
        suggestedFix: []
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      version,
      needsMigration: this.needsStateMigration(version)
    };
  }

  private detectStateVersion(state: any): StateVersion {
    // Version detection logic based on state structure
    if (!state.focusMetrics) {
      return { major: 1, minor: 0, patch: 0 };
    }
    if (!state.conversationFlow) {
      return { major: 1, minor: 1, patch: 0 };
    }
    return { major: 2, minor: 0, patch: 0 }; // Current version
  }

  private needsStateMigration(version: StateVersion): boolean {
    const currentVersion = { major: 2, minor: 0, patch: 0 };
    return version.major < currentVersion.major;
  }

  private async migrateState(
    state: any, 
    fromVersion: StateVersion
  ): Promise<StateMigrationResult> {
    const appliedMigrations: string[] = [];
    const errors: string[] = [];
    let migratedState = { ...state };

    try {
      // Migrate from v1.0.0 to v1.1.0
      if (this.compareVersions(fromVersion, { major: 1, minor: 0, patch: 0 }) === 0) {
        migratedState = await this.migrateV1ToV1_1(migratedState);
        appliedMigrations.push('v1.0.0 -> v1.1.0');
      }

      // Migrate from v1.1.0 to v2.0.0
      if (this.compareVersions(fromVersion, { major: 1, minor: 1, patch: 0 }) <= 0) {
        migratedState = await this.migrateV1_1ToV2(migratedState);
        appliedMigrations.push('v1.1.0 -> v2.0.0');
      }

      return {
        success: true,
        migratedState: migratedState as ConversationStateData,
        appliedMigrations,
        errors
      };
    } catch (error) {
      errors.push(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return {
        success: false,
        migratedState: state as ConversationStateData,
        appliedMigrations,
        errors
      };
    }
  }

  private compareVersions(v1: StateVersion, v2: StateVersion): number {
    if (v1.major !== v2.major) return v1.major - v2.major;
    if (v1.minor !== v2.minor) return v1.minor - v2.minor;
    return v1.patch - v2.patch;
  }

  private async migrateV1ToV1_1(state: any): Promise<any> {
    return {
      ...state,
      focusMetrics: {
        topicChanges: 0,
        clarificationRequests: 0,
        followUpCount: 0,
        contextDepth: 0,
        emotionalShifts: 0,
        intentShifts: 0
      }
    };
  }

  private async migrateV1_1ToV2(state: any): Promise<any> {
    return {
      ...state,
      conversationFlow: {
        naturalBreaks: 0,
        topicTransitions: [],
        depthProgression: [],
        engagementSignals: []
      }
    };
  }

  /**
   * Enhanced message processing with better context awareness
   */
  async processMessage(
    input: string,
    context: ChatAgentContext
  ): Promise<{
    response: string;
    insights: any;
    suggestions: any[];
  }> {
    try {
      // Initialize RAG tracking if not present
      if (!context.ragResults) {
        context.ragResults = {
          current: [],
          history: [],
          stats: {
            totalQueries: 0,
            totalResults: 0,
            lastQueryTimestamp: undefined,
            averageConfidence: undefined,
            successRate: 0,
            queryTypes: {}
          }
        };
      }

      // Initialize displayed info tracking if not present
      if (!context.displayedInfo) {
        context.displayedInfo = new Map<string, DisplayedContent>();
      }

      // Get insights first to understand context
      const insights = await this.getInsights({
        currentInput: input,
        context
      });

      // Process with displayed context first
      const result = await this.processWithDisplayedContext(input, context);
      
      // If we got a response from displayed context, return it
      if (result.response) {
        // Update memory with the response
        await this.updateMemoryWithResponse(result, input, context);
        return result;
      }

      // Otherwise, proceed with normal processing
      const analysis = await this.analyzeQuery(input, context);
      
      // If it's a contextual query, handle it differently
      if (analysis.isContextual) {
        const contextualResult = await this.processContextualQuery(
          input,
          analysis,
          context
        );

        // Track any RAG results from contextual processing
        if (contextualResult.insights?.ragResults) {
          await this.integrateRAGResults(
            contextualResult.insights.ragResults,
            context,
            input
          );
        }

        // Update memory with the response
        await this.updateMemoryWithResponse(contextualResult, input, context);
        return contextualResult;
      }

      // Generate memory-aware response
      const prompt = await this.buildMemoryAwarePrompt(input, insights, context);
      const response = await this.generateMemoryAwareResponse(
        input,
        prompt,
        insights,
        context
      );

      // Track displayed information
      if (response.content) {
        const displayedContent: DisplayedContent = {
          id: nanoid(),
          content: response.content,
          timestamp: Date.now(),
          type: 'direct_response',
          source: 'direct',
          displayStatus: {
            shown: true,
            shownAt: Date.now()
          }
        };
        context.displayedInfo.set(displayedContent.id, displayedContent);
      }

      // Update memory with the response
      await this.updateMemoryWithResponse(response, input, context);

      // Clean up old displayed info
      this.cleanupDisplayedInfo(context.displayedInfo);

      return {
        response: response.content,
        insights: response.insights || {},
        suggestions: response.suggestions
      };
    } catch (error) {
      console.error('Error in processMessage:', error);
      throw error;
    }
  }

  /**
   * Check if the input is a follow-up question about displayed information
   */
  private async isFollowUpQuestion(
    input: string,
    displayedInfo: DisplayedContent[],
    context: ChatAgentContext
  ): Promise<boolean> {
    // No previous display = not a follow-up
    if (!displayedInfo.length) return false;

    // Check for follow-up indicators in the input
    const followUpIndicators = [
      'what about',
      'and',
      'how about',
      'what else',
      'tell me more',
      'can you explain',
      'why',
      'when',
      'who',
      'where',
      'which'
    ];

    const normalizedInput = input.toLowerCase();
    const hasFollowUpPhrase = followUpIndicators.some(indicator => 
      normalizedInput.includes(indicator)
    );

    if (!hasFollowUpPhrase) return false;

    // Check temporal proximity to last displayed info
    const mostRecentDisplay = Math.max(
      ...displayedInfo.map(info => info.timestamp)
    );
    const timeSinceDisplay = Date.now() - mostRecentDisplay;
    const isRecent = timeSinceDisplay < 5 * 60 * 1000; // Within 5 minutes

    return isRecent;
  }

  /**
   * Restore conversation state with proper type checking
   */
  private async restoreConversationState(
    context: ChatAgentContext,
    persistedState: ConversationStateData
  ): Promise<void> {
    context.currentTopic = persistedState.currentTopic;
    context.lastTopic = persistedState.lastTopic;
    context.topicDepth = persistedState.topicDepth;
    context.contextStack = persistedState.contextStack;
    context.pendingActions = persistedState.pendingActions;
    context.lastResponseType = persistedState.lastResponseType;
    
    if (this.isEmotionalState(persistedState.emotionalState)) {
      context.emotionalState = this.mergeEmotionalState(
        context.emotionalState,
        persistedState.emotionalState
      );
    }
    
    if (this.isUserIntent(persistedState.userIntent)) {
      context.userIntent = this.mergeUserIntent(
        context.userIntent,
        persistedState.userIntent
      );
    }
    
    if (this.isFocusMetrics(persistedState.focusMetrics)) {
      context.focusMetrics = this.mergeFocusMetrics(
        context.focusMetrics,
        persistedState.focusMetrics
      );
    }
    
    context.conversationFlow = this.mergeConversationFlow(
      context.conversationFlow,
      persistedState.conversationFlow
    );
    
    context.mentionedEntities = persistedState.mentionedEntities;
    
    if (persistedState.queryContext) {
      context.queryContext = persistedState.queryContext.map(query => ({
        timestamp: query.timestamp,
        intent: this.mergeUserIntent(null, query.intent),
        entities: {
          names: query.entities.names,
          dates: query.entities.dates,
          topics: query.entities.topics
        },
        topic: query.topic
      }));
    }

    await this.restoreMemorySystemState(persistedState);
  }

  // Add type guard for conversation state
  private isValidConversationState(state: any): state is ConversationStateData {
    return (
      typeof state === 'object' &&
      state !== null &&
      typeof state.currentTopic === 'string' &&
      typeof state.lastTopic === 'string' &&
      typeof state.topicDepth === 'number' &&
      Array.isArray(state.contextStack) &&
      Array.isArray(state.pendingActions) &&
      typeof state.lastResponseType === 'string' &&
      this.isEmotionalState(state.emotionalState) &&
      this.isUserIntent(state.userIntent) &&
      this.isFocusMetrics(state.focusMetrics) &&
      typeof state.conversationFlow === 'object'
    );
  }

  // Helper method to create memory node
  private createMemoryNode(
    type: MemoryNodeType,
    content: string | Record<string, unknown>,
    situation: SituationType | `custom_${string}`,
    confidence: number = 0.8
  ): MemoryNode {
    return {
      id: `node_${nanoid()}`,
      type,
      content,
      confidence,
      timestamp: Date.now(),
      relationships: new Map(),
      context: {
        situation,
        emotional_state: {
          primary: 'neutral',
          intensity: 0.5,
          confidence: 0.8
        } as EmotionalStateValue,
        external_factors: []
      },
      evolution: {
        history: [{
          state: {
            content: 'created',
            timestamp: Date.now()
          },
          timestamp: Date.now(),
          trigger: 'initial_creation'
        }],
        trend: 'stable',
        stability: 1
      }
    };
  }

  // Helper methods to merge state components
  private mergeEmotionalState(current: any, persisted: any): any {
    if (!persisted) return current;
    return {
      primary: persisted.primary || current?.primary || 'neutral',
      intensity: persisted.intensity || current?.intensity || 0,
      context: persisted.context || current?.context || ''
    };
  }

  private mergeUserIntent(current: any, persisted: any): UserIntent {
    if (!persisted) return current;
    
    // Define valid types exactly as in UserIntent interface
    const validTypes = [
      'direct_inquiry',
      'email_search',
      'follow_up',
      'clarification',
      'exploratory',
      'action_needed',
      'reflection',
      'validation',
      'creative',
      'strategic',
      'emotional_support',
      'greeting'
    ] as const;
    
    type ValidIntentType = typeof validTypes[number];
    
    // Validate and cast the type
    const type = validTypes.includes(persisted.type as ValidIntentType)
      ? (persisted.type as ValidIntentType)
      : (current?.type as ValidIntentType || 'direct_inquiry');

    // Construct a valid UserIntent object
    const userIntent: UserIntent = {
      type,
      confidence: persisted.confidence || current?.confidence || 0.5
    };

    // Add optional fields if they exist
    if (persisted.sender || current?.sender) {
      userIntent.sender = persisted.sender || current?.sender;
    }
    if (persisted.date || current?.date) {
      userIntent.date = persisted.date || current?.date;
    }
    if (persisted.subtype || current?.subtype) {
      userIntent.subtype = persisted.subtype || current?.subtype;
    }
    if (persisted.query || current?.query) {
      userIntent.query = persisted.query || current?.query;
    }

    return userIntent;
  }

  private mergeFocusMetrics(current: any, persisted: any): any {
    if (!persisted) return current;
    return {
      topicChanges: persisted.topicChanges || current?.topicChanges || 0,
      clarificationRequests: persisted.clarificationRequests || current?.clarificationRequests || 0,
      followUpCount: persisted.followUpCount || current?.followUpCount || 0,
      contextDepth: persisted.contextDepth || current?.contextDepth || 0,
      emotionalShifts: persisted.emotionalShifts || current?.emotionalShifts || 0,
      intentShifts: persisted.intentShifts || current?.intentShifts || 0
    };
  }

  private mergeConversationFlow(current: any, persisted: any): any {
    if (!persisted) return current;
    return {
      naturalBreaks: persisted.naturalBreaks || current?.naturalBreaks || 0,
      topicTransitions: [...(current?.topicTransitions || []), ...(persisted.topicTransitions || [])],
      depthProgression: [...(current?.depthProgression || []), ...(persisted.depthProgression || [])],
      engagementSignals: [...(current?.engagementSignals || []), ...(persisted.engagementSignals || [])]
    };
  }

  // Helper method to restore memory system state
  private async restoreMemorySystemState(state: ConversationStateData): Promise<void> {
    if (!state) {
      console.warn('No state provided for restoration');
      return;
    }

    try {
      // First, restore the basic state
      await this.restoreBasicState(state);

      // Find and link related conversations
      await this.linkRelatedConversations(state.conversationId, state);

      // Get related conversation states with situation
      const relatedStates = await this.getRelatedConversationStates(
        state.conversationId,
        state.currentTopic,
        'user_interaction'
      );

      // Inherit context from related conversations
      const enhancedState = await this.inheritConversationContext(state, relatedStates);

      // Update temporal relationships
      await this.updateTemporalRelationships(state.conversationId, enhancedState);

      // Update the state with inherited context
      await this.persistConversationState(state.conversationId, enhancedState);

    } catch (error) {
      console.error('Error in restoreMemorySystemState:', error);
      this.logStateRestorationError(error, state);
    }
  }

  private async findExistingEntityNode(type: string, entity: string): Promise<MemoryNode | null> {
    try {
      const results = await this.advancedMemory.searchNodes({
        type: 'entity',
        query: entity,
        context: type
      });
      return results.length > 0 ? results[0] : null;
    } catch (error) {
      console.error('Error finding existing entity:', error);
      return null;
    }
  }

  /**
   * Links related conversations based on shared context, topics, or entities
   */
  private async linkRelatedConversations(
    currentConversationId: string,
    state: ConversationStateData
  ): Promise<void> {
    if (!state.currentTopic) {
      console.warn('No current topic in state');
      return;
    }

    try {
      // Find conversations with similar topics or entities
      const relatedConversations = await this.prisma.conversationState.findMany({
        where: {
          AND: [
            { conversationId: { not: currentConversationId } },
            {
              OR: [
                { currentTopic: state.currentTopic },
                { lastTopic: state.currentTopic }
              ]
            }
          ]
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
      });

      // Create relationship nodes for related conversations
      for (const relatedConv of relatedConversations) {
        const relationshipNode = this.createMemoryNode(
          MEMORY_TYPES.WORKING,
          {
            type: 'conversation_link',
            sourceId: currentConversationId,
            targetId: relatedConv.conversationId,
            sharedTopic: state.currentTopic
          },
          'user_interaction' as SituationType,
          0.8
        );

        await this.advancedMemory.addNode(relationshipNode);
      }
    } catch (error) {
      console.error('Error linking related conversations:', error);
    }
  }

  /**
   * Inherits context from related conversations
   */
  private async inheritConversationContext(
    currentState: ConversationStateData,
    relatedStates: ConversationStateData[]
  ): Promise<ConversationStateData> {
    const updatedState = { ...currentState };

    try {
      // Combine mentioned entities
      if (!updatedState.mentionedEntities) {
        updatedState.mentionedEntities = {
          names: new Set<string>(),
          dates: new Set<string>(),
          topics: new Set<string>()
        };
      }

      for (const relatedState of relatedStates) {
        if (relatedState.mentionedEntities) {
          updatedState.mentionedEntities.names = new Set([
            ...Array.from(updatedState.mentionedEntities.names),
            ...Array.from(relatedState.mentionedEntities.names)
          ]);
          updatedState.mentionedEntities.dates = new Set([
            ...Array.from(updatedState.mentionedEntities.dates),
            ...Array.from(relatedState.mentionedEntities.dates)
          ]);
          updatedState.mentionedEntities.topics = new Set([
            ...Array.from(updatedState.mentionedEntities.topics),
            ...Array.from(relatedState.mentionedEntities.topics)
          ]);
        }

        // Inherit relevant focus metrics
        updatedState.focusMetrics = {
          ...updatedState.focusMetrics,
          contextDepth: Math.max(
            updatedState.focusMetrics.contextDepth,
            relatedState.focusMetrics.contextDepth
          )
        };

        // Update conversation flow with inherited patterns
        updatedState.conversationFlow = {
          ...updatedState.conversationFlow,
          topicTransitions: [
            ...updatedState.conversationFlow.topicTransitions,
            ...relatedState.conversationFlow.topicTransitions.filter(
              topic => topic === currentState.currentTopic
            )
          ]
        };
      }
    } catch (error) {
      console.error('Error inheriting conversation context:', error);
    }

    return updatedState;
  }

  /**
   * Tracks temporal relationships between conversations with enhanced pattern recognition
   */
  private async updateTemporalRelationships(
    currentConversationId: string,
    state: ConversationStateData
  ): Promise<void> {
    try {
      const recentConversations = await this.prisma.conversationState.findMany({
        where: {
          AND: [
            { conversationId: { not: currentConversationId } },
            { updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
          ]
        },
        orderBy: [
          { updatedAt: 'desc' },
          { currentTopic: 'asc' }
        ],
        take: 20
      });

      const patterns = await this.analyzeTemporalPatterns(recentConversations, state);
      const timeBasedPatterns = this.analyzeTimeOfDayPattern(
        recentConversations.map(conv => conv.updatedAt.getTime())
      );

      const topicEvolution = this.analyzeTopicEvolution(
        recentConversations.map(conv => ({
          topic: conv.currentTopic || '',
          timestamp: conv.updatedAt,
          context: (conv.contextStack as PrismaJsonArray) || []
        }))
      );

      const interactionPatterns = this.calculateInteractionFrequency(recentConversations);

      const temporalNode = this.createMemoryNode(
        MEMORY_TYPES.WORKING,
        {
          type: 'temporal_context',
          conversationId: currentConversationId,
          relatedConversations: recentConversations.map(conv => ({
            id: conv.conversationId,
            topic: typeof conv.currentTopic === 'string' ? conv.currentTopic : '',
            timestamp: conv.updatedAt,
            confidence: this.calculateRelationshipStrength(
              state.currentTopic || '',
              typeof conv.currentTopic === 'string' ? conv.currentTopic : '',
              conv.updatedAt,
              (state.contextStack as PrismaJsonArray) || [],
              (conv.contextStack as PrismaJsonArray) || []
            ),
            lastActive: conv.updatedAt,
            contextOverlap: this.calculateContextOverlap(
              (state.contextStack as PrismaJsonArray) || [],
              (conv.contextStack as PrismaJsonArray) || []
            )
          })),
          patterns: [
            ...patterns,
            {
              type: 'time_of_day',
              confidence: timeBasedPatterns.confidence,
              data: timeBasedPatterns.data,
              reliability: this.calculatePatternReliability(timeBasedPatterns)
            },
            {
              type: 'topic_evolution',
              confidence: topicEvolution.confidence,
              data: topicEvolution.data,
              reliability: this.calculatePatternReliability(topicEvolution)
            },
            {
              type: 'interaction_frequency',
              confidence: interactionPatterns.confidence,
              data: interactionPatterns.patterns,
              reliability: interactionPatterns.reliability
            }
          ],
          metadata: {
            timeframe: '30d',
            totalRelated: recentConversations.length,
            topicClusters: this.identifyTopicClusters(recentConversations),
            temporalDensity: this.calculateTemporalDensity(recentConversations),
            activityMetrics: {
              averageMessagesPerConversation: this.calculateAverageMessages(recentConversations),
              peakActivityPeriods: this.identifyPeakActivityPeriods(recentConversations),
              topicChangeFrequency: this.calculateTopicChangeFrequency(recentConversations),
              interactionGaps: this.analyzeInteractionGaps(recentConversations),
              contextualContinuity: this.calculateContextualContinuity(recentConversations)
            }
          }
        },
        'user_interaction' as SituationType,
        this.calculateEnhancedNodeConfidence(patterns, timeBasedPatterns, topicEvolution, interactionPatterns)
      );

      await this.advancedMemory.addNode(temporalNode);
      await this.updateExistingTemporalRelationships(temporalNode, recentConversations);

    } catch (error) {
      console.error('Error updating temporal relationships:', error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new Error(`Database error while updating temporal relationships: ${error.message}`);
      } else if (error instanceof TypeError) {
        throw new Error(`Type error in temporal relationship processing: ${error.message}`);
      } else {
      throw new Error(`Failed to update temporal relationships: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  // New helper method for calculating relationship strength
  private calculateRelationshipStrength(
    currentTopic: string,
    relatedTopic: string,
    timestamp: Date,
    currentContext: PrismaJsonArray,
    relatedContext: PrismaJsonArray
  ): number {
    const topicSimilarity = this.calculateTopicSimilarity(currentTopic, relatedTopic);
    const contextSimilarity = this.calculateContextOverlap(
      Array.isArray(currentContext) ? currentContext : [],
      Array.isArray(relatedContext) ? relatedContext : []
    );
    const recency = this.calculateRecencyScore(timestamp);
    
    // Weighted combination of factors
    return (
      topicSimilarity * 0.4 +
      contextSimilarity * 0.3 +
      recency * 0.3
    );
  }

  // New helper method for calculating context overlap
  private calculateContextOverlap(context1: PrismaJsonArray, context2: PrismaJsonArray): number {
    if (!Array.isArray(context1) || !Array.isArray(context2) || !context1.length || !context2.length) return 0;

    const set1 = new Set(context1.map(item => JSON.stringify(item)));
    const set2 = new Set(context2.map(item => JSON.stringify(item)));

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return intersection.size / union.size;
  }

  // New helper method for calculating interaction frequency patterns
  private calculateInteractionFrequency(conversations: ConversationState[]): InteractionFrequencyResult {
    if (!conversations.length) {
      return { confidence: 0, patterns: [], reliability: 0 };
    }

    const timestamps = conversations.map(c => c.updatedAt.getTime()).sort();
    const intervals: number[] = [];
    
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }

    const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const stdDev = Math.sqrt(
      intervals.reduce((sq, n) => sq + Math.pow(n - averageInterval, 2), 0) / intervals.length
    );

    const patterns = this.categorizeIntervals(intervals);
    const trend = this.calculateIntervalTrend(intervals);
    const reliability = this.calculateIntervalReliability(intervals, stdDev);

    return {
      confidence: Math.min(1, conversations.length / 20),
      patterns,
      reliability
    };
  }

  // New helper method for calculating pattern reliability
  private calculatePatternReliability(pattern: { confidence: number; data: any }): number {
    const dataPoints = Array.isArray(pattern.data) ? pattern.data.length : 
                      typeof pattern.data === 'object' ? Object.keys(pattern.data).length : 0;
    
    return Math.min(1, (dataPoints / 10) * pattern.confidence);
  }

  // New helper method for calculating enhanced node confidence
  private calculateEnhancedNodeConfidence(
    patterns: TemporalPattern[],
    timePatterns: { confidence: number },
    topicEvolution: { confidence: number },
    interactionPatterns: { confidence: number; reliability: number }
  ): number {
    const weights = {
      patterns: 0.3,
      timePatterns: 0.25,
      topicEvolution: 0.25,
      interactionPatterns: 0.2
    };

    return Math.min(1, (
      (patterns.reduce((sum, p) => sum + (p.confidence || 0), 0) / patterns.length) * weights.patterns +
      timePatterns.confidence * weights.timePatterns +
      topicEvolution.confidence * weights.topicEvolution +
      (interactionPatterns.confidence * interactionPatterns.reliability) * weights.interactionPatterns
    ));
  }

  // New helper method for analyzing interaction gaps
  private analyzeInteractionGaps(conversations: ConversationState[]): {
    averageGap: number;
    maxGap: number;
    gapDistribution: Record<string, number>;
  } {
    if (conversations.length < 2) {
      return { averageGap: 0, maxGap: 0, gapDistribution: {} };
    }

    const timestamps = conversations.map(c => c.updatedAt.getTime()).sort();
    const gaps: number[] = [];
    
    for (let i = 1; i < timestamps.length; i++) {
      gaps.push(timestamps[i] - timestamps[i - 1]);
    }

    const gapDistribution = this.categorizeGaps(gaps);
    
    return {
      averageGap: gaps.reduce((a, b) => a + b, 0) / gaps.length,
      maxGap: Math.max(...gaps),
      gapDistribution
    };
  }

  // New helper method for calculating contextual continuity
  private calculateContextualContinuity(conversations: ConversationState[]): {
    score: number;
    transitions: Array<{
      from: string;
      to: string;
      smoothness: number;
    }>;
  } {
    if (conversations.length < 2) {
      return { score: 0, transitions: [] };
    }

    const transitions: Array<{
      from: string;
      to: string;
      smoothness: number;
    }> = [];

    for (let i = 1; i < conversations.length; i++) {
      const prev = conversations[i - 1];
      const curr = conversations[i];
      
      const smoothness = this.calculateTransitionSmoothness(prev, curr);
      transitions.push({
        from: prev.currentTopic || '',
        to: curr.currentTopic || '',
        smoothness
      });
    }

    const averageSmoothness = transitions.reduce((sum, t) => sum + t.smoothness, 0) / transitions.length;

    return {
      score: averageSmoothness,
      transitions
    };
  }

  // New helper method for calculating transition smoothness
  private calculateTransitionSmoothness(
    prev: ConversationState,
    curr: ConversationState
  ): number {
    const topicSimilarity = this.calculateTopicSimilarity(
      prev.currentTopic || '',
      curr.currentTopic || ''
    );
    
    const timeGap = curr.updatedAt.getTime() - prev.updatedAt.getTime();
    const timeScore = Math.min(1, 24 * 60 * 60 * 1000 / timeGap); // Normalize to 24 hours

    const contextContinuity = this.calculateContextOverlap(
      Array.isArray(prev.contextStack) ? prev.contextStack : [],
      Array.isArray(curr.contextStack) ? curr.contextStack : []
    );

    return (topicSimilarity * 0.4 + timeScore * 0.3 + contextContinuity * 0.3);
  }

  // New helper method for categorizing time intervals
  private categorizeIntervals(intervals: number[]): Array<{
    interval: string;
    count: number;
    trend: 'increasing' | 'decreasing' | 'stable';
  }> {
    const categories = {
      immediate: 0,      // < 1 minute
      short: 0,         // 1-5 minutes
      medium: 0,        // 5-30 minutes
      long: 0,          // 30-120 minutes
      extended: 0       // > 120 minutes
    };

    intervals.forEach(interval => {
      const minutes = interval / (60 * 1000);
      if (minutes < 1) categories.immediate++;
      else if (minutes < 5) categories.short++;
      else if (minutes < 30) categories.medium++;
      else if (minutes < 120) categories.long++;
      else categories.extended++;
    });

    return Object.entries(categories).map(([interval, count]) => ({
      interval,
      count,
      trend: this.calculateCategoryTrend(interval, intervals)
    }));
  }

  // New helper method for calculating interval trends
  private calculateIntervalTrend(intervals: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (intervals.length < 3) return 'stable';

    const changes = intervals.slice(1).map((interval, i) => interval - intervals[i]);
    const increasingCount = changes.filter(change => change > 0).length;
    const decreasingCount = changes.filter(change => change < 0).length;

    if (increasingCount > decreasingCount * 1.5) return 'increasing';
    if (decreasingCount > increasingCount * 1.5) return 'decreasing';
    return 'stable';
  }

  // New helper method for calculating interval reliability
  private calculateIntervalReliability(intervals: number[], stdDev: number): number {
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const coefficientOfVariation = stdDev / mean;
    
    // Lower coefficient of variation indicates more reliable patterns
    return Math.max(0, 1 - Math.min(1, coefficientOfVariation));
  }

  // New helper method for categorizing interaction gaps
  private categorizeGaps(gaps: number[]): Record<string, number> {
    const categories = {
      short: 0,     // < 1 hour
      medium: 0,    // 1-6 hours
      long: 0,      // 6-24 hours
      extended: 0   // > 24 hours
    };

    gaps.forEach(gap => {
      const hours = gap / (60 * 60 * 1000);
      if (hours < 1) categories.short++;
      else if (hours < 6) categories.medium++;
      else if (hours < 24) categories.long++;
      else categories.extended++;
    });

    return categories;
  }

  // New helper method for calculating category trends
  private calculateCategoryTrend(
    category: string,
    intervals: number[]
  ): 'increasing' | 'decreasing' | 'stable' {
    const categoryThresholds = {
      immediate: 60 * 1000,
      short: 5 * 60 * 1000,
      medium: 30 * 60 * 1000,
      long: 120 * 60 * 1000
    };

    const threshold = categoryThresholds[category as keyof typeof categoryThresholds];
    if (!threshold) return 'stable';

    const categoryIntervals = intervals.filter(interval => interval <= threshold);
    if (categoryIntervals.length < 3) return 'stable';

    const changes = categoryIntervals.slice(1).map((interval, i) => interval - categoryIntervals[i]);
    const increasingCount = changes.filter(change => change > 0).length;
    const decreasingCount = changes.filter(change => change < 0).length;

    if (increasingCount > decreasingCount * 1.5) return 'increasing';
    if (decreasingCount > increasingCount * 1.5) return 'decreasing';
    return 'stable';
  }

  // Helper method to analyze topic evolution patterns
  private analyzeTopicEvolution(
    topicHistory: TopicHistoryItem[]
  ): TopicEvolutionResult {
    const patterns: Map<string, { count: number; totalGap: number }> = new Map();
    let totalTransitions = 0;

    // Analyze topic transitions
    for (let i = 1; i < topicHistory.length; i++) {
      const current = topicHistory[i];
      const previous = topicHistory[i - 1];
      
      if (current.topic && previous.topic && current.topic !== previous.topic) {
        const transitionKey = `${previous.topic}=>${current.topic}`;
        const timeGap = current.timestamp.getTime() - previous.timestamp.getTime();
        
        const existing = patterns.get(transitionKey) || { count: 0, totalGap: 0 };
        patterns.set(transitionKey, {
          count: existing.count + 1,
          totalGap: existing.totalGap + timeGap
        });
        
        totalTransitions++;
      }
    }

    // Convert to array of patterns with frequencies
    const result = Array.from(patterns.entries()).map(([key, data]) => {
      const [from, to] = key.split('=>');
      return {
        from,
        to,
        frequency: data.count / totalTransitions,
        timeGap: data.totalGap / data.count // average time gap
      };
    });

    // Calculate confidence based on pattern consistency
    const confidence = totalTransitions > 0 
      ? Math.min(1, result.length / totalTransitions)
      : 0;

    return {
      confidence,
      data: {
        patterns: result
      }
    };
  }

  // Helper method to calculate node confidence
  private calculateNodeConfidence(
    patterns: TemporalPattern[],
    timePatterns: { confidence: number },
    topicEvolution: { confidence: number }
  ): number {
    const patternConfidence = patterns.reduce((sum, p) => sum + (p.confidence || 0), 0) / patterns.length;
    
    return Math.min(1, (
      patternConfidence * 0.4 +
      timePatterns.confidence * 0.3 +
      topicEvolution.confidence * 0.3
    ));
  }

  /**
   * Analyzes temporal patterns in conversations
   */
  private analyzeTemporalPatterns(
    conversations: ConversationState[],
    currentState: ConversationStateData
  ): TemporalPattern[] {
    const patterns: TemporalPattern[] = [];

    // Topic progression pattern
    const topicSequence = conversations
      .map(conv => typeof conv.currentTopic === 'string' ? conv.currentTopic : undefined)
      .filter((topic): topic is string => typeof topic === 'string');
    
    if (topicSequence.length >= 2) {
      const topicTransitions = this.analyzeTopicTransitions(topicSequence);
      if (topicTransitions.confidence > 0.7) {
        patterns.push({
          type: PATTERN_TYPES.TOPIC_PROGRESSION,
          confidence: topicTransitions.confidence,
          data: topicTransitions.data
        });
      }
    }

    // Time-based patterns
    const timeBasedPatterns = this.analyzeTimeBasedPatterns(conversations);
    patterns.push(...timeBasedPatterns);

    // Engagement patterns
    if (currentState.conversationFlow?.engagementSignals) {
      const engagementPattern = this.analyzeEngagementPattern(
        currentState.conversationFlow.engagementSignals
      );
      if (engagementPattern.confidence > 0.6) {
        patterns.push({
          type: PATTERN_TYPES.ENGAGEMENT,
          confidence: engagementPattern.confidence,
          data: engagementPattern.data
        });
      }
    }

    return patterns;
  }

  /**
   * Analyzes topic transitions for patterns
   */
  private analyzeTopicTransitions(topics: string[]): {
    confidence: number;
    data: {
      transitions: Array<[string, string]>;
      commonSequences: string[];
    };
  } {
    const transitions: Array<[string, string]> = [];
    const sequences: string[] = [];
    let confidence = 0;

    // Analyze consecutive topic pairs
    for (let i = 0; i < topics.length - 1; i++) {
      transitions.push([topics[i], topics[i + 1]]);
    }

    // Find common sequences (3 or more topics)
    for (let i = 0; i < topics.length - 2; i++) {
      const sequence = topics.slice(i, i + 3);
      if (this.isSignificantSequence(sequence)) {
        sequences.push(sequence.join(' → '));
      }
    }

    // Calculate confidence based on pattern strength
    const uniqueTransitions = new Set(transitions.map(t => t.join('→')));
    const repetitionScore = 1 - (uniqueTransitions.size / transitions.length);
    const sequenceScore = sequences.length > 0 ? 0.3 : 0;
    confidence = Math.min(1, repetitionScore * 0.7 + sequenceScore);

    return {
      confidence,
      data: {
        transitions,
        commonSequences: sequences
      }
    };
  }

  /**
   * Analyzes time-based conversation patterns
   */
  private analyzeTimeBasedPatterns(conversations: ConversationState[]): TemporalPattern[] {
    const patterns: TemporalPattern[] = [];
    const timestamps = conversations.map(c => new Date(c.updatedAt).getTime());
    
    if (timestamps.length < 3) return patterns;

    // Analyze time intervals
    const intervals = timestamps.slice(1).map((t, i) => t - timestamps[i]);
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const stdDev = Math.sqrt(
      intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length
    );

    // Check for regular timing pattern
    const regularityScore = 1 - (stdDev / avgInterval);
    if (regularityScore > 0.7) {
      patterns.push({
        type: PATTERN_TYPES.REGULAR_TIMING,
        confidence: regularityScore,
        data: {
          averageInterval: avgInterval,
          standardDeviation: stdDev
        }
      });
    }

    // Check for time-of-day patterns
    const timeOfDayPattern = this.analyzeTimeOfDayPattern(timestamps);
    if (timeOfDayPattern.confidence > 0.6) {
      patterns.push({
        type: PATTERN_TYPES.TIME_OF_DAY,
        confidence: timeOfDayPattern.confidence,
        data: timeOfDayPattern.data
      });
    }

    return patterns;
  }

  /**
   * Analyzes time-of-day patterns in conversations
   */
  private analyzeTimeOfDayPattern(timestamps: number[]): TimeAnalysisResult {
    if (!timestamps.length) {
      return {
        confidence: 0,
    data: {
          preferredHours: [],
          hourlyDistribution: {},
          periodDistribution: {},
          segments: [],
          seasonal: [],
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          peakPeriods: []
        }
      };
    }

    // Initialize counters
    const hourlyDistribution: Record<number, number> = {};
    const periodDistribution: Record<string, { count: number; timestamps: number[] }> = {
      earlyMorning: { count: 0, timestamps: [] },  // 5-8
      morning: { count: 0, timestamps: [] },       // 8-11
      earlyAfternoon: { count: 0, timestamps: [] },// 11-14
      afternoon: { count: 0, timestamps: [] },     // 14-17
      evening: { count: 0, timestamps: [] },       // 17-20
      lateEvening: { count: 0, timestamps: [] },   // 20-23
      night: { count: 0, timestamps: [] }          // 23-5
    };

    // Define time segments for more granular analysis
    const timeSegments: TimeSegment[] = [
      { start: 5, end: 8, label: 'earlyMorning' },
      { start: 8, end: 11, label: 'morning' },
      { start: 11, end: 14, label: 'earlyAfternoon' },
      { start: 14, end: 17, label: 'afternoon' },
      { start: 17, end: 20, label: 'evening' },
      { start: 20, end: 23, label: 'lateEvening' },
      { start: 23, end: 5, label: 'night' }
    ];

    // Process timestamps
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    timestamps.forEach(ts => {
      const date = new Date(ts);
      const hour = date.getHours();
      
      // Update hourly distribution
      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;

      // Update period distribution
      for (const segment of timeSegments) {
        if (segment.start <= segment.end) {
          if (hour >= segment.start && hour < segment.end) {
            periodDistribution[segment.label].count++;
            periodDistribution[segment.label].timestamps.push(ts);
            break;
          }
        } else {
          // Handle overnight periods (e.g., night: 23-5)
          if (hour >= segment.start || hour < segment.end) {
            periodDistribution[segment.label].count++;
            periodDistribution[segment.label].timestamps.push(ts);
            break;
          }
        }
      }
    });

    // Calculate preferred hours (hours with above-average activity)
    const avgHourlyCount = timestamps.length / 24;
    const preferredHours = Object.entries(hourlyDistribution)
      .filter(([_, count]) => count > avgHourlyCount * 1.2) // 20% above average threshold
      .map(([hour]) => parseInt(hour));

    // Analyze activity patterns for each segment
    const segments: ActivityPattern[] = Object.entries(periodDistribution).map(([segment, data]) => {
      const intensity = data.count / timestamps.length;
      const trend = this.calculateActivityTrend(data.timestamps);
      
      return {
        segment,
        count: data.count,
        intensity,
        trend
      };
    });

    // Find peak periods
    const peakPeriods = this.identifyPeakPeriods(hourlyDistribution);

    // Analyze seasonal patterns
    const seasonal = this.analyzeSeasonalPatterns(timestamps);

    // Calculate confidence based on multiple factors
    const confidence = this.calculateTimePatternConfidence({
      totalSamples: timestamps.length,
      peakStrength: Math.max(...Object.values(hourlyDistribution)) / timestamps.length,
      patternConsistency: this.calculatePatternConsistency(segments),
      seasonalStrength: Math.max(...seasonal.map(s => s.confidence))
    });

    return {
      confidence,
      data: {
        preferredHours,
        hourlyDistribution,
        periodDistribution: Object.fromEntries(
          Object.entries(periodDistribution).map(([k, v]) => [k, v.count])
        ),
        segments,
        seasonal,
        timezone,
        peakPeriods
      }
    };
  }

  private calculateActivityTrend(
    timestamps: number[]
  ): 'increasing' | 'decreasing' | 'stable' {
    if (timestamps.length < 2) return 'stable';

    // Sort timestamps
    const sorted = [...timestamps].sort();
    
    // Calculate intervals between activities
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      intervals.push(sorted[i] - sorted[i - 1]);
    }

    // Calculate trend using linear regression
    const xValues = Array.from({ length: intervals.length }, (_, i) => i);
    const yValues = intervals;
    
    const { slope } = this.calculateLinearRegression(xValues, yValues);
    
    // Determine trend based on slope
    const THRESHOLD = 0.1;
    if (slope > THRESHOLD) return 'increasing';
    if (slope < -THRESHOLD) return 'decreasing';
    return 'stable';
  }

  private calculateLinearRegression(x: number[], y: number[]): {
    slope: number;
    intercept: number;
  } {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  private identifyPeakPeriods(
    hourlyDistribution: Record<number, number>
  ): Array<{ start: number; end: number; intensity: number }> {
    const peaks: Array<{ start: number; end: number; intensity: number }> = [];
    const avgActivity = Object.values(hourlyDistribution)
      .reduce((sum, count) => sum + count, 0) / 24;
    
    let currentPeak: { start: number; end: number; sum: number } | null = null;

    // Identify continuous periods of above-average activity
    for (let hour = 0; hour < 24; hour++) {
      const activity = hourlyDistribution[hour] || 0;
      
      if (activity > avgActivity * 1.2) { // 20% above average threshold
        if (!currentPeak) {
          currentPeak = { start: hour, end: hour, sum: activity };
        } else {
          currentPeak.end = hour;
          currentPeak.sum += activity;
        }
      } else if (currentPeak) {
        // End of peak period
        peaks.push({
          start: currentPeak.start,
          end: currentPeak.end,
          intensity: currentPeak.sum / ((currentPeak.end - currentPeak.start + 1) * avgActivity)
        });
        currentPeak = null;
      }
    }

    // Handle peak period that wraps around midnight
    if (currentPeak) {
      peaks.push({
        start: currentPeak.start,
        end: currentPeak.end,
        intensity: currentPeak.sum / ((currentPeak.end - currentPeak.start + 1) * avgActivity)
      });
    }

    return peaks;
  }

  private analyzeSeasonalPatterns(timestamps: number[]): SeasonalPattern[] {
    const seasonalActivity: Record<string, { count: number; total: number }> = {
      spring: { count: 0, total: 0 },
      summer: { count: 0, total: 0 },
      fall: { count: 0, total: 0 },
      winter: { count: 0, total: 0 }
    };

    timestamps.forEach(ts => {
      const date = new Date(ts);
      const month = date.getMonth();
      
      // Determine season (Northern Hemisphere)
      const season =
        month >= 2 && month <= 4 ? 'spring' :
        month >= 5 && month <= 7 ? 'summer' :
        month >= 8 && month <= 10 ? 'fall' : 'winter';
      
      seasonalActivity[season].count++;
      seasonalActivity[season].total++;
    });

    const totalActivity = timestamps.length;
    
    return Object.entries(seasonalActivity).map(([season, data]) => ({
      season,
      activityLevel: data.count / totalActivity,
      confidence: this.calculateSeasonalConfidence(data.count, data.total)
    }));
  }

  private calculateSeasonalConfidence(count: number, total: number): number {
    if (total === 0) return 0;
    
    // Base confidence from sample size
    const sampleConfidence = Math.min(1, total / 100); // Normalize up to 100 samples
    
    // Distribution confidence
    const distributionConfidence = count / total;
    
    // Combine confidences with weights
    return (sampleConfidence * 0.4) + (distributionConfidence * 0.6);
  }

  private calculatePatternConsistency(patterns: ActivityPattern[]): number {
    if (patterns.length === 0) return 0;

    // Calculate variance in intensities
    const intensities = patterns.map(p => p.intensity);
    const avgIntensity = intensities.reduce((sum, i) => sum + i, 0) / intensities.length;
    const variance = intensities.reduce((sum, i) => sum + Math.pow(i - avgIntensity, 2), 0) / intensities.length;
    
    // Lower variance indicates more consistent patterns
    return 1 / (1 + variance);
  }

  private calculateTimePatternConfidence(factors: {
    totalSamples: number;
    peakStrength: number;
    patternConsistency: number;
    seasonalStrength: number;
  }): number {
    // Sample size confidence (0.3 weight)
    const sampleConfidence = Math.min(1, factors.totalSamples / 100);
    
    // Combine all factors with weights
    return Math.min(1,
      (sampleConfidence * 0.3) +
      (factors.peakStrength * 0.3) +
      (factors.patternConsistency * 0.2) +
      (factors.seasonalStrength * 0.2)
    );
  }

  private isSignificantSequence(sequence: string[]): boolean {
    if (sequence.length < 3) return false;
    
    // Check if topics are sufficiently different
    const uniqueTopics = new Set(sequence);
    if (uniqueTopics.size < sequence.length * 0.7) return false;

    // Check if topics have meaningful progression
    for (let i = 1; i < sequence.length; i++) {
      const similarity = this.calculateTopicSimilarity(sequence[i], sequence[i - 1]);
      if (similarity > 0.8) return false; // Too similar to be a meaningful progression
    }

    return true;
  }

  // Enhanced topic similarity calculation
  private calculateTopicSimilarity(topic1: string, topic2: string): number {
    // Handle empty strings
    if (!topic1 || !topic2 || topic1 === '' || topic2 === '') return 0;
    
    // Normalize topics
    const normalizedTopic1 = topic1.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
    const normalizedTopic2 = topic2.toLowerCase().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
    
    // Get word arrays (excluding stop words)
    const words1 = normalizedTopic1.split(/\s+/).filter(w => !this.isStopWord(w));
    const words2 = normalizedTopic2.split(/\s+/).filter(w => !this.isStopWord(w));
    
    if (words1.length === 0 || words2.length === 0) return 0;
    
    // Calculate word overlap (Jaccard similarity)
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    const jaccardSimilarity = intersection.size / union.size;
    
    // Calculate word order similarity
    let orderMatches = 0;
    const minLength = Math.min(words1.length, words2.length);
    for (let i = 0; i < minLength; i++) {
      if (words1[i] === words2[i]) orderMatches++;
    }
    const orderSimilarity = orderMatches / Math.max(words1.length, words2.length);
    
    // Calculate length similarity
    const lengthRatio = Math.min(words1.length, words2.length) / Math.max(words1.length, words2.length);
    
    // Combine scores with weights
    return Math.min(1, Math.max(0,
      (jaccardSimilarity * 0.5) +    // Word overlap importance
      (orderSimilarity * 0.3) +      // Word order importance
      (lengthRatio * 0.2)            // Length similarity importance
    ));
  }

  // Helper to calculate word sequence similarity
  private calculateWordSequenceSimilarity(words1: string[], words2: string[]): number {
    const maxLength = Math.max(words1.length, words2.length);
    if (maxLength === 0) return 0;
    
    let matchCount = 0;
    const minLength = Math.min(words1.length, words2.length);
    
    // Count words in same relative position
    for (let i = 0; i < minLength; i++) {
      if (words1[i] === words2[i]) {
        matchCount++;
      }
    }
    
    return matchCount / maxLength;
  }

  /**
   * Gets related conversation states based on topic
   */
  private async getRelatedConversationStates(
    currentConversationId: string,
    topic: string,
    situation: SituationType = 'user_interaction'
  ): Promise<ConversationStateData[]> {
    try {
      const relatedStates = await this.prisma.conversationState.findMany({
        where: {
          AND: [
            { conversationId: { not: currentConversationId } },
            {
              OR: [
                { currentTopic: topic },
                { lastTopic: topic }
              ]
            }
          ]
        },
        orderBy: { updatedAt: 'desc' },
        take: 5
      });

      const deserializedStates = await Promise.all(
        relatedStates.map(state => this.deserializeState(state))
      );

      return deserializedStates;
    } catch (error) {
      console.error('Error getting related conversation states:', error);
      return [];
    }
  }

  /**
   * Restores basic state with enhanced context validation and inheritance
   */
  private async restoreBasicState(state: ConversationStateData): Promise<void> {
    if (!state.currentTopic) {
      state.currentTopic = 'general';
    }

    try {
      // Validate and restore context stack
      if (state.contextStack) {
        const nodeMap = new Map<string, MemoryNode>();
        const validationErrors: string[] = [];
        const validationResults = new Map<string, {
          isValid: boolean;
          error?: string;
          dependencies?: string[];
        }>();
        
        // First pass: Validate all nodes and track dependencies
        for (const nodeData of state.contextStack) {
          try {
            const validationResult = await this.validateMemoryNode(nodeData);
            validationResults.set(nodeData.id, validationResult);
            
            if (!validationResult.isValid) {
              validationErrors.push(`Invalid node ${nodeData.id}: ${validationResult.error}`);
              continue;
            }

            const node = await this.createMemoryNodeFromState(nodeData);
            if (node) {
              nodeMap.set(node.id, node);
            }
          } catch (error) {
            validationErrors.push(`Failed to process node: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        
        // Second pass: Restore nodes in dependency order
        const processedNodes = new Set<string>();
        const processingStack = new Set<string>();
        
        const processNode = async (nodeId: string): Promise<void> => {
          if (processedNodes.has(nodeId)) return;
          if (processingStack.has(nodeId)) {
            validationErrors.push(`Circular dependency detected for node ${nodeId}`);
            return;
          }
          
          processingStack.add(nodeId);
          const node = nodeMap.get(nodeId);
          const validationResult = validationResults.get(nodeId);
          
          if (node && validationResult?.dependencies) {
            for (const depId of validationResult.dependencies) {
              await processNode(depId);
            }
          }
          
          if (node) {
            try {
              await this.advancedMemory.addNode(node);
              processedNodes.add(nodeId);
            } catch (error) {
              validationErrors.push(`Failed to add node ${nodeId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
          
          processingStack.delete(nodeId);
        };

        // Process all nodes
        for (const nodeId of nodeMap.keys()) {
          await processNode(nodeId);
        }
        
        if (validationErrors.length > 0) {
          console.warn('State restoration validation errors:', validationErrors);
        }
      }

      // Restore display information with validation
      if (state.displayedInfo) {
        const validDisplayInfo = new Map<string, DisplayedContent>();
        for (const [id, content] of state.displayedInfo.entries()) {
          if (this.validateDisplayedContent(content)) {
            validDisplayInfo.set(id, content);
          }
        }
        state.displayedInfo = validDisplayInfo;
      }

      // Restore and validate display stats
      if (state.displayStats) {
        state.displayStats = this.initializeDisplayStats(state.displayStats);
      }

    } catch (error) {
      console.error('Error during state restoration:', error);
      throw new Error(`State restoration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validates a memory node and its dependencies
   */
  private async validateMemoryNode(data: any): Promise<{
    isValid: boolean;
    error?: string;
    dependencies?: string[];
  }> {
    if (!data || typeof data !== 'object') {
      return { isValid: false, error: 'Invalid node data structure' };
    }

    if (!data.id || !data.content) {
      return { isValid: false, error: 'Missing required fields' };
    }

    const dependencies: string[] = [];

    // Validate relationships if present
    if (data.relationships) {
      if (!(data.relationships instanceof Map) && !Array.isArray(data.relationships)) {
        return { isValid: false, error: 'Invalid relationships structure' };
      }

      const rels = Array.isArray(data.relationships) ? data.relationships : Array.from(data.relationships.values());
      for (const rel of rels) {
        if (rel.targetId) {
          dependencies.push(rel.targetId);
        }
      }
    }

    // Validate evolution history
    if (data.evolution?.history) {
      if (!Array.isArray(data.evolution.history)) {
        return { isValid: false, error: 'Invalid evolution history structure' };
      }

      for (const entry of data.evolution.history) {
        if (!entry.timestamp || !entry.state) {
          return { isValid: false, error: 'Invalid evolution history entry' };
        }
      }
    }

    return {
      isValid: true,
      dependencies: dependencies.length > 0 ? dependencies : undefined
    };
  }

  private logStateRestorationError(error: unknown, state: ConversationStateData): void {
    const errorDetails = {
          timestamp: Date.now(),
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : 'Unknown error',
      stateSnapshot: {
        contextStackSize: state.contextStack?.length || 0,
        hasEntities: !!state.mentionedEntities,
        queryContextSize: state.queryContext?.length || 0
      }
    };
    console.error('State restoration error details:', errorDetails);
  }

  private async createMemoryNodeFromState(data: any): Promise<MemoryNode | null> {
    if (!data || !data.content) {
      console.warn('Invalid memory node data:', data);
      return null;
    }

    try {
      return this.createMemoryNode(
        MEMORY_TYPES.WORKING,
        data.content,
        'system_learning',
        data.confidence || 0.8
      );
    } catch (error) {
      console.error('Error creating memory node from state:', error);
      return null;
    }
  }

  private async createMemoryNodeFromEntity(
    type: string,
    entity: string,
    currentTopic: string
  ): Promise<MemoryNode | null> {
    if (!type || !entity || !currentTopic) {
      console.warn('Missing required parameters for entity node creation');
      return null;
    }

    try {
      return this.createMemoryNode(
        MEMORY_TYPES.LONG_TERM,
        { type, value: entity },
        `custom_${currentTopic}`,
        0.9
      );
    } catch (error) {
      console.error('Error creating memory node from entity:', error);
      return null;
    }
  }

  private async createMemoryNodeFromQuery(query: any): Promise<MemoryNode | null> {
    if (!query) {
      console.warn('Invalid query data for node creation');
      return null;
    }

    try {
      return this.createMemoryNode(
        MEMORY_TYPES.WORKING,
        query,
        'user_interaction',
        0.8
      );
    } catch (error) {
      console.error('Error creating memory node from query:', error);
      return null;
    }
  }

  private isValidMemoryNodeData(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      (typeof data.content === 'string' || typeof data.content === 'object') &&
      (!data.confidence || typeof data.confidence === 'number') &&
      (!data.timestamp || typeof data.timestamp === 'number')
    );
  }

  private validateEmotionalState(state: any): EmotionalStateValue {
    if (!state || typeof state !== 'object') {
      return {
        primary: 'neutral' as const,
        intensity: 0.5,
        confidence: 0.8
      };
    }

    // Validate primary emotion
    const validEmotions = [
      'neutral',
      'excited',
      'frustrated',
      'uncertain',
      'curious',
      'positive',
      'negative',
      'confused',
      'satisfied',
      'engaged',
      'disengaged'
    ] as const;

    const primary = validEmotions.includes(state.primary as any)
      ? state.primary
      : 'neutral';

    return {
      primary,
      intensity: typeof state.intensity === 'number' ? Math.max(0, Math.min(1, state.intensity)) : 0.5,
      confidence: typeof state.confidence === 'number' ? Math.max(0, Math.min(1, state.confidence)) : 0.8
    };
  }

  private getBasePrompt(): string {
    return `You are an AI assistant with advanced memory capabilities. You can:
- Remember and reference past conversations
- Recognize patterns in user behavior
- Make contextually relevant suggestions
- Maintain conversation continuity
- Acknowledge and adapt to user preferences`;
  }

  private async buildMemoryAwarePrompt(
    input: string,
    insights: any,
    context: ChatAgentContext
  ): Promise<string> {
    let enhancedPrompt = this.systemPrompt;

    // Add relevant memory context
    enhancedPrompt += '\n\nRelevant User Context:';

    // Add pattern-based insights
    if (insights.patterns.length > 0) {
      enhancedPrompt += '\nObserved Patterns:';
      insights.patterns.forEach((pattern: any) => {
        enhancedPrompt += `\n- ${this.formatPattern(pattern)}`;
      });
    }

    // Add known preferences and contradictions
    if (insights.contradictions.length > 0) {
      enhancedPrompt += '\nNote Previous Preferences:';
      insights.contradictions.forEach((contradiction: any) => {
        enhancedPrompt += `\n- ${this.formatContradiction(contradiction)}`;
      });
    }

    // Add temporal awareness
    const temporalContext = this.getTemporalContext(insights);
    if (temporalContext) {
      enhancedPrompt += `\n\nTemporal Context:\n${temporalContext}`;
    }

    // Add behavioral patterns
    const behavioralContext = this.getBehavioralContext(insights);
    if (behavioralContext) {
      enhancedPrompt += `\n\nBehavioral Context:\n${behavioralContext}`;
    }

    // Add interaction guidelines
    enhancedPrompt += this.getInteractionGuidelines(insights);

    return enhancedPrompt;
  }

  private formatPattern(pattern: any): string {
    if (pattern.type === 'temporal') {
      return `User tends to ${pattern.description} (confidence: ${pattern.confidence})`;
    }
    if (pattern.type === 'behavioral') {
      return `When discussing ${pattern.topic}, user prefers ${pattern.preference}`;
    }
    return `${pattern.description} (relevance: ${pattern.relevance})`;
  }

  private formatContradiction(contradiction: any): string {
    return `Previously expressed ${contradiction.type} about ${contradiction.subject} (${contradiction.context})`;
  }

  private getTemporalContext(insights: any): string {
    const temporalPatterns = insights.patterns.filter((p: any) => p.type === 'temporal');
    if (temporalPatterns.length === 0) return '';

    return temporalPatterns
      .map((p: any) => this.formatTemporalPattern(p))
      .join('\n');
  }

  private formatTemporalPattern(pattern: any): string {
    return `${pattern.description} (confidence: ${pattern.confidence})`;
  }

  private getBehavioralContext(insights: any): string {
    const behaviors = insights.patterns.filter((p: any) => p.type === 'behavioral');
    if (behaviors.length === 0) return '';

    return behaviors
      .map((b: any) => this.formatBehavioralPattern(b))
      .join('\n');
  }

  private formatBehavioralPattern(pattern: any): string {
    return `${pattern.description} (confidence: ${pattern.confidence})`;
  }

  private getInteractionGuidelines(insights: any): string {
    return `

Key Interaction Guidelines:
1. Consider the user's historical preferences and patterns
2. Acknowledge but don't overemphasize past preferences
3. Be aware of potential contradictions and handle them gracefully
4. Maintain context continuity while allowing for preference evolution
5. Use insights to inform but not restrict responses`;
  }

  /**
   * Generate a memory-aware response with insights
   */
  private async generateMemoryAwareResponse(
    input: string,
    prompt: string,
    insights: any,
    context: ChatAgentContext
  ): Promise<MemoryAwareResponse> {
    // Generate base response
    const response = await this.generateBaseResponse(input, prompt);

    // Enhance response with memory context
    const enhancedResponse = await this.enhanceResponseWithMemory(response.content, insights, context);

    // Generate suggestions
    const suggestions = await this.generateContextualSuggestions(input, context);

    // Combine base response insights with any additional insights
    const combinedInsights = {
      ...(response.insights || {}),
      ...(insights || {})
    };

    return {
      content: enhancedResponse,
      insights: combinedInsights,
      suggestions
    };
  }

  /**
   * Generate base response with insights
   */
  private async generateBaseResponse(input: string, prompt: string): Promise<{ content: string; insights?: any }> {
    try {
      // Search for relevant context using RAG
      const searchResults = await this.advancedMemory.searchMemory('conversation_history', input, {
        limit: 5
      });

      // Build context from search results
      const context = searchResults.map(result => {
        const content = typeof result.content === 'string' ? result.content : JSON.stringify(result.content);
        return `Previous interaction: ${content}`;
      }).join('\n');

      // Combine context with prompt
      const fullPrompt = `${context}\n\n${prompt}\n\nUser input: ${input}`;

      // Use OpenAI to generate response
      const response = await this.generateAIResponse(fullPrompt);

      // Return both the response and insights
      return {
        content: response,
        insights: {
          searchResults,
          baseResponse: true,
          timestamp: Date.now()
        }
      };
    } catch (error) {
      console.error('Error generating base response:', error);
      return {
        content: 'I apologize, but I encountered an error while processing your request. Could you please rephrase or try again?',
        insights: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now()
        }
      };
    }
  }

  private async generateAIResponse(prompt: string): Promise<string> {
    try {
      const openai = new OpenAI();
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: this.systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      return completion.choices[0]?.message?.content || '';
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      throw error;
    }
  }

  private async enhanceResponseWithMemory(
    response: string,
    insights: any,
    context: ChatAgentContext
  ): Promise<string> {
    let enhanced = response;

    // Add preference acknowledgments
    if (insights.contradictions.length > 0) {
      enhanced = await this.handlePreferenceAcknowledgments(
        enhanced,
        insights.contradictions
      );
    }

    // Add pattern-based suggestions
    if (insights.patterns.length > 0) {
      enhanced = await this.handlePatternBasedSuggestions(
        enhanced,
        insights.patterns
      );
    }

    // Ensure continuity with previous interactions
    enhanced = await this.handleConversationContinuity(
      enhanced,
      context
    );

    return enhanced;
  }

  private async handlePreferenceAcknowledgments(
    response: string,
    contradictions: any[]
  ): Promise<string> {
    let enhanced = response;
    
    // Group contradictions by type
    const groupedContradictions = contradictions.reduce((acc: { [key: string]: any[] }, curr) => {
      const type = curr.type || 'general';
      if (!acc[type]) acc[type] = [];
      acc[type].push(curr);
      return acc;
    }, {});

    // Add acknowledgments for each type of contradiction
    Object.entries(groupedContradictions).forEach(([type, items]) => {
      const acknowledgment = this.generatePreferenceAcknowledgment(type, items);
      if (acknowledgment) {
        enhanced = `${acknowledgment}\n\n${enhanced}`;
      }
    });

    return enhanced;
  }

  private async handlePatternBasedSuggestions(
    response: string,
    patterns: any[]
  ): Promise<string> {
    if (patterns.length === 0) return response;

    let enhanced = response;
    const relevantPatterns = patterns.filter(p => p.confidence > 0.7);

    if (relevantPatterns.length === 0) return response;

    // Add pattern-based insights
    const suggestions = relevantPatterns.map(pattern => {
      const { type, pattern: { description, evidence } } = pattern;
      
      switch (type) {
        case 'behavioral':
          return this.generateBehavioralSuggestion(description, evidence);
        case 'temporal':
          return this.generateTemporalSuggestion(description, evidence);
        case 'causal':
          return this.generateCausalSuggestion(description, evidence);
        case 'preference':
          return this.generatePreferenceSuggestion(description, evidence);
        default:
          return null;
      }
    }).filter(Boolean);

    if (suggestions.length > 0) {
      enhanced += "\n\nBased on our previous interactions:";
      suggestions.forEach(suggestion => {
        enhanced += `\n• ${suggestion}`;
      });
    }

    return enhanced;
  }

  private async handleConversationContinuity(
    response: string,
    context: ChatAgentContext
  ): Promise<string> {
    let enhanced = response;
    
    // Add topic transition if needed
    if (context.lastTopic && context.currentTopic && context.currentTopic !== context.lastTopic) {
      enhanced = this.addTopicTransition(enhanced, context.lastTopic, context.currentTopic);
    }

    // Add context depth indicators
    if (typeof context.topicDepth === 'number' && context.topicDepth > 2) {
      enhanced = this.addDepthIndicators(enhanced, context);
    }

    // Add engagement prompts based on conversation flow
    if (context.conversationFlow) {
      enhanced = this.addEngagementPrompts(enhanced, context.conversationFlow);
    }

    return enhanced;
  }

  private addTopicTransition(response: string, lastTopic: string, currentTopic: string): string {
    const transitions = [
      `Moving from our discussion about ${lastTopic} to ${currentTopic}...`,
      `While we were talking about ${lastTopic}, this brings up an interesting point about ${currentTopic}.`,
      `That connects with our current focus on ${currentTopic}.`,
      `Building on what we discussed about ${lastTopic}...`
    ];
    
    const transition = transitions[Math.floor(Math.random() * transitions.length)];
    return `${transition}\n\n${response}`;
  }

  private addDepthIndicators(response: string, context: ChatAgentContext): string {
    const depth = typeof context.topicDepth === 'number' ? context.topicDepth : 0;
    let enhanced = response;

    if (depth > 4) {
      enhanced += "\n\nWe've explored this topic quite deeply. Would you like to:\n" +
                 "1. Continue diving deeper\n" +
                 "2. Summarize what we've covered\n" +
                 "3. Explore a related topic";
    } else if (depth > 2) {
      enhanced += "\n\nWould you like to explore this aspect further?";
    }

    return enhanced;
  }

  private addEngagementPrompts(response: string, flow: ConversationFlow): string {
    const engagementSignals = flow.engagementSignals || [];
    const recentEngagement = engagementSignals.slice(-3);
    
    if (recentEngagement.every(signal => signal === 'low')) {
      return response + "\n\nLet me know if you'd like to explore a different aspect or approach.";
    }
    
    return response;
  }

  // Update searchNodes to handle undefined context while preserving type safety
  private async searchNodes(options: SearchNodeOptions & { 
    context?: string | ConversationFlow 
  }): Promise<MemoryNode[]> {
    const searchOptions: SearchNodeOptions = {
      ...options,
      context: options.context ? 
        (typeof options.context === 'string' ? 
          options.context : 
          JSON.stringify({
            type: 'conversation_flow',
            naturalBreaks: (options.context as ConversationFlow).naturalBreaks,
            topicTransitions: (options.context as ConversationFlow).topicTransitions,
            depthProgression: (options.context as ConversationFlow).depthProgression,
            engagementSignals: (options.context as ConversationFlow).engagementSignals
          })) 
        : undefined
    };
    return this.advancedMemory.searchNodes(searchOptions);
  }

  async generateContextualSuggestions(
    input: string,
    context: ChatAgentContext
  ): Promise<any[]> {
    const patterns = await this.searchNodes({
      type: 'pattern',
      query: input,
      context: context.currentTopic || ''
    });

    const preferences = await this.searchNodes({
      type: 'preference',
      query: input,
      context: context.currentTopic || ''
    });

    const suggestions = await this.generateSuggestions(
      input,
      patterns,
      preferences,
      context
    );

    return suggestions.map(s => ({
      type: 'contextual_suggestion',
      content: s.content,
      confidence: s.confidence
    }));
  }

  async addPatternBasedSuggestions(context: ChatAgentContext): Promise<string[]> {
    const recentPatterns = await this.searchNodes({
      type: 'pattern',
      query: context.currentTopic || '',
      context: context.conversationFlow ? 
        `flow:${JSON.stringify(context.conversationFlow)}` : 
        undefined
    });

    const suggestions: string[] = [];
    
    for (const pattern of recentPatterns) {
      if (pattern.confidence > 0.7) {
        const suggestion = await this.generateSuggestionFromPattern(pattern);
        if (suggestion) {
          suggestions.push(suggestion);
        }
      }
    }

    return suggestions;
  }

  async ensureConversationContinuity(
    currentInput: string,
    context: ChatAgentContext
  ): Promise<{
    contextualPrompt: string;
    relevantHistory: MemoryNode[];
  }> {
    const state = await this.getConversationState(context.conversationId);
    
    const relevantHistory = await this.searchNodes({
      type: 'context',
      query: currentInput,
      context: state?.currentTopic || '',
    });

    const contextualPrompt = await this.buildContextualPrompt(
      currentInput,
      relevantHistory,
      state
    );

    return {
      contextualPrompt,
      relevantHistory
    };
  }

  // Private helper methods
  private async extractPreferences(input: string): Promise<string[]> {
    const extracted = await this.advancedMemory.searchMemory('preference', input, {
      limit: 5,
      filters: {
        confidence: { min: 0.6 }
      }
    });

    return extracted.map(result => 
      typeof result.content === 'string' ? result.content : JSON.stringify(result.content)
    );
  }

  private async generateSuggestionFromPattern(pattern: MemoryNode): Promise<string | null> {
    if (!pattern.content || pattern.confidence < 0.7) {
      return null;
    }

    try {
      const contentStr = typeof pattern.content === 'string' ? pattern.content : JSON.stringify(pattern.content);
      const suggestion = await this.advancedMemory.retrieveMemory(
        'suggestion',
        contentStr
      );

      return suggestion.length > 0 ? suggestion[0] : null;
    } catch (error) {
      console.error('Error generating suggestion from pattern:', error);
      return null;
    }
  }

  private async buildContextualPrompt(
    currentInput: string,
    relevantHistory: MemoryNode[],
    state: ConversationStateData | null
  ): Promise<string> {
    let prompt = this.getBasePrompt();

    if (state) {
      prompt += `\nCurrent topic: ${state.currentTopic}`;
      prompt += `\nTopic depth: ${state.topicDepth}`;
      prompt += `\nConversation flow: ${JSON.stringify(state.conversationFlow)}`;
    }

    if (relevantHistory.length > 0) {
      prompt += '\nRelevant context:';
      relevantHistory.forEach(node => {
        if (node.confidence > 0.6) {
          prompt += `\n- ${node.content}`;
        }
      });
    }

    return prompt;
  }

  private async generateSuggestions(
    input: string,
    patterns: MemoryNode[],
    preferences: MemoryNode[],
    context: ChatAgentContext
  ): Promise<Array<{ content: string; confidence: number }>> {
    const suggestions: Array<{ content: string; confidence: number }> = [];

    for (const pattern of patterns) {
      if (pattern.confidence > 0.7) {
        const suggestion = await this.generateSuggestionFromPattern(pattern);
        if (suggestion) {
          suggestions.push({
            content: suggestion,
            confidence: pattern.confidence
          });
        }
      }
    }

    for (const pref of preferences) {
      if (pref.confidence > 0.6) {
        suggestions.push({
          content: `Based on your preference: ${pref.content}`,
          confidence: pref.confidence
        });
      }
    }

    return suggestions;
  }

  private async updateMemoryWithResponse(
    response: any,
    input: string,
    context: ChatAgentContext
  ): Promise<void> {
    // Update memory with interaction results
    const memoryContent: MemoryContent = {
      type: 'system_response',
      input,
      response: response.content,
      suggestions: response.suggestions
    };

    await this.advancedMemory.processNewInformation({
      content: JSON.stringify(memoryContent),
      type: 'interaction_result',
      context: {
        ...context,
        userInput: input
      }
    });

    // Update interaction patterns
    await this.updateInteractionPatterns(response, input);
  }

  private async updateInteractionPatterns(
    response: any,
    input: string
  ): Promise<void> {
    // Track successful interaction patterns
    if (response.wasHelpful) {
      const interactionContent: MemoryContent = {
        type: 'successful_interaction',
        input,
        response: response.content,
        pattern: this.extractInteractionPattern(input, response)
      };

      await this.advancedMemory.processNewInformation({
        content: JSON.stringify(interactionContent),
        type: 'interaction_pattern',
        context: {
          success: true,
          timestamp: Date.now()
        }
      });
    }
  }

  private extractInteractionPattern(
    input: string,
    response: any
  ): any {
    return {
      inputType: this.classifyInput(input),
      responseType: this.classifyResponse(response),
      context: this.extractContextPattern(input, response),
      success: response.wasHelpful
    };
  }

  private classifyInput(input: string): string {
    // Implement input classification logic
    return 'query';
  }

  private classifyResponse(response: any): string {
    // Implement response classification logic
    return 'answer';
  }

  private extractContextPattern(input: string, response: any): any {
    // Implement context pattern extraction logic
    return {};
  }

  private generatePreferenceAcknowledgment(type: string, items: any[]): string | null {
    if (items.length === 0) return null;

    const transitions = {
      general: "I notice some changes in your preferences. ",
      topic: "Your interests seem to have evolved. ",
      style: "Your preferred communication style has shifted. ",
      detail: "Your preference for detail level has changed. ",
      approach: "Your approach to this topic has developed. "
    };

    const baseTransition = transitions[type as keyof typeof transitions] || transitions.general;
    const context = items.map(item => item.context || '').filter(Boolean).join('; ');

    return context ? `${baseTransition}Based on our previous interactions (${context}), I'll adjust accordingly.` : baseTransition;
  }

  private generateBehavioralSuggestion(description: string, evidence: any[]): string | null {
    if (!description) return null;
    return `I notice you tend to ${description.toLowerCase()}. Would you like to explore this further?`;
  }

  private generateTemporalSuggestion(description: string, evidence: any[]): string | null {
    if (!description) return null;
    return `There seems to be a pattern in ${description.toLowerCase()}. Should we consider this timing?`;
  }

  private generateCausalSuggestion(description: string, evidence: any[]): string | null {
    if (!description) return null;
    return `I've observed that ${description.toLowerCase()}. Would you like to discuss this relationship?`;
  }

  private generatePreferenceSuggestion(description: string, evidence: any[]): string | null {
    if (!description) return null;
    return `Based on your preferences, you might be interested in ${description.toLowerCase()}.`;
  }

  // Restore the addPreferenceAcknowledgments method
  async addPreferenceAcknowledgments(input: string, context: ChatAgentContext): Promise<void> {
    const preferences = await this.extractPreferences(input);
    
    for (const pref of preferences) {
      const memoryNode: MemoryNode = {
        id: Date.now().toString(),
        type: MEMORY_TYPES.LONG_TERM,
        content: pref,
        confidence: 0.8,
        timestamp: Date.now(),
        relationships: new Map(),
        context: {
          situation: context.currentTopic ? `custom_${context.currentTopic}` : 'user_interaction',
          emotional_state: {
            primary: 'neutral',
            intensity: 0.5,
            confidence: 1.0
          },
          external_factors: []
        },
        evolution: {
          history: [{
            state: {
              content: 'created',
              timestamp: Date.now()
            },
            timestamp: Date.now(),
            trigger: 'custom_state_restoration'
          }],
          trend: 'stable',
          stability: 1
        }
      };

      await this.advancedMemory.addNode(memoryNode);
    }
  }

  // Add method to persist conversation state
  private async persistConversationState(conversationId: string, state: ConversationStateData): Promise<void> {
    try {
      const serializedState = {
        currentTopic: state.currentTopic,
        lastTopic: state.lastTopic,
        topicDepth: state.topicDepth,
        contextStack: state.contextStack as Prisma.InputJsonValue,
        pendingActions: state.pendingActions as Prisma.InputJsonValue,
        lastResponseType: state.lastResponseType,
        emotionalState: state.emotionalState as unknown as Prisma.InputJsonValue,
        userIntent: this.serializeUserIntent(state.userIntent) as Prisma.InputJsonValue,
        focusMetrics: state.focusMetrics as Prisma.InputJsonValue,
        conversationFlow: state.conversationFlow as Prisma.InputJsonValue,
        mentionedEntities: state.mentionedEntities 
          ? {
              names: Array.from(state.mentionedEntities.names),
              dates: Array.from(state.mentionedEntities.dates),
              topics: Array.from(state.mentionedEntities.topics)
            } as Prisma.InputJsonValue
          : undefined,
        queryContext: state.queryContext 
          ? this.serializeQueryContext(state.queryContext) as Prisma.InputJsonValue
          : undefined
      };

      const createData = {
        ...serializedState,
        conversation: {
          connect: {
            id: conversationId
          }
        }
      };

      const updateData = {
        ...serializedState,
        updatedAt: new Date()
      };

      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: {
          state: {
            upsert: {
              create: createData,
              update: updateData
            }
          }
        }
      });
    } catch (error) {
      console.error('Error persisting conversation state:', error);
      throw error;
    }
  }

  // Add method to retrieve conversation state
  private async getConversationState(conversationId: string): Promise<ConversationStateData | null> {
    try {
      const state = await this.prisma.conversationState.findUnique({
        where: {
          conversationId
        }
      });

      if (!state) return null;

      return this.deserializeState(state);
    } catch (error) {
      console.error('Error retrieving conversation state:', error);
      return null;
    }
  }

  private async updateEntityNodeContext(node: MemoryNode, currentTopic: string): Promise<void> {
    try {
      const updatedNode = {
        ...node,
        context: {
          ...node.context,
          situation: `custom_${currentTopic}` as SituationType,
          lastUpdated: Date.now()
        }
      };
      await this.advancedMemory.updateNode(updatedNode);
    } catch (error) {
      console.error('Error updating entity node context:', error);
    }
  }

  private async inheritContext(currentNode: MemoryNode, previousNode: MemoryNode): Promise<void> {
    try {
      // Basic validation
      if (!currentNode || !previousNode) {
        console.warn('Missing nodes for context inheritance');
        return;
      }

      // Inherit basic context
      currentNode.context = {
        ...currentNode.context,
        external_factors: [
          ...new Set([
            ...(currentNode.context.external_factors || []),
            ...(previousNode.context.external_factors || [])
          ])
        ]
      };

      // Inherit relationships with proper strength decay
      previousNode.relationships.forEach((relationship, targetId) => {
        const existingRelationship = currentNode.relationships.get(targetId);
        if (existingRelationship) {
          // If relationship exists, strengthen it but respect max strength
          existingRelationship.strength = Math.min(
            1,
            existingRelationship.strength + (relationship.strength * 0.5)
          );
          // Combine evidence
          existingRelationship.evidence = [
            ...new Set([...existingRelationship.evidence, ...relationship.evidence])
          ];
        } else {
          // If new relationship, inherit with reduced strength
          currentNode.relationships.set(targetId, {
            type: relationship.type,
            strength: relationship.strength * 0.7, // Decay factor for inherited relationships
            evidence: [...relationship.evidence]
          });
        }
      });

      // Inherit emotional state with proper merging
      if (previousNode.context.emotional_state) {
        currentNode.context.emotional_state = this.mergeEmotionalStates(
          currentNode.context.emotional_state,
          previousNode.context.emotional_state
        );
      }

      // Track inherited content for RAG context
      if (previousNode.content) {
        const inheritedContent = typeof previousNode.content === 'string' 
          ? previousNode.content 
          : JSON.stringify(previousNode.content);

        // Add relationship to track inherited RAG content
        currentNode.relationships.set(`rag_${previousNode.id}`, {
          type: 'inherits_rag',
          strength: 0.8,
          evidence: [`Inherited RAG content from node ${previousNode.id}`]
        });
      }

      // Update evolution to track inheritance
      currentNode.evolution.history.push({
        state: {
          content: 'inherited_context',
          timestamp: Date.now(),
          metadata: {
            inherited_from: previousNode.id,
            inheritance_type: 'full_context'
          }
        },
        timestamp: Date.now(),
        trigger: 'context_inheritance'
      });

      // Calculate and update confidence based on inheritance
      currentNode.confidence = this.calculateInheritedConfidence(
        currentNode.confidence,
        previousNode.confidence
      );

    } catch (error) {
      console.error('Error in inheritContext:', error);
      throw error;
    }
  }

  /**
   * Merges emotional states with proper weighting and confidence
   */
  private mergeEmotionalStates(
    current: EmotionalStateValue,
    previous: EmotionalStateValue
  ): EmotionalStateValue {
    if (!current || !previous) {
      return current || previous || {
        primary: 'neutral',
        intensity: 0.5,
        confidence: 0.5
      };
    }

    // Weight recent emotional state more heavily
    const currentWeight = 0.7;
    const previousWeight = 0.3;

    return {
      primary: current.intensity > previous.intensity ? current.primary : previous.primary,
      intensity: (current.intensity * currentWeight) + (previous.intensity * previousWeight),
      confidence: Math.min(1, (current.confidence * currentWeight) + (previous.confidence * previousWeight)),
      context: current.context || previous.context
    };
  }

  /**
   * Calculates confidence for inherited context
   */
  private calculateInheritedConfidence(
    currentConfidence: number,
    previousConfidence: number
  ): number {
    // Weight current confidence more heavily
    const currentWeight = 0.7;
    const previousWeight = 0.3;

    // Calculate combined confidence with decay
    return Math.min(
      1,
      (currentConfidence * currentWeight) + (previousConfidence * previousWeight)
    );
  }

  private async addRelationship(
    sourceNode: MemoryNode,
    targetNode: MemoryNode,
    type: RelationshipType,
    strength: number = 0.8,
    evidence: string[] = []
  ): Promise<void> {
    await this.advancedMemory.addRelationship(
      sourceNode,
      targetNode,
      type,
      strength,
      evidence
    );
  }

  private async addTopicRelationships(node: MemoryNode, topic: string): Promise<void> {
    try {
      const topicNodes = await this.advancedMemory.searchNodes({
        type: MEMORY_TYPES.LONG_TERM,
        query: topic
      });

      for (const topicNode of topicNodes) {
        await this.addRelationship(
          node,
          topicNode,
          'related_topic',
          0.8,
          []
        );
      }
    } catch (error) {
      console.error('Error adding topic relationships:', error);
    }
  }

  async updateContextualMemory(params: {
    conversationId: string;
    entities: {
      names: string[];
      dates: string[];
      topics: string[];
    };
    currentTopic: string;
    timestamp: number;
  }): Promise<void> {
    try {
      // Update conversation state in database
      await this.prisma.conversation.update({
        where: { id: params.conversationId },
        data: {
          state: {
            upsert: {
              create: {
                currentTopic: params.currentTopic,
                lastTopic: params.currentTopic, // Initially same as current
                topicDepth: 1,
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
                },
                mentionedEntities: params.entities,
                updatedAt: new Date(params.timestamp)
              },
              update: {
                currentTopic: params.currentTopic,
                mentionedEntities: params.entities,
                updatedAt: new Date(params.timestamp)
              }
            }
          }
        }
      });

      // Store in memory system
      const memoryNode: MemoryNode = {
        id: nanoid(),
        type: 'context' as BaseMemoryType,
        content: {
          entities: params.entities,
          topic: params.currentTopic,
          timestamp: params.timestamp,
          conversationId: params.conversationId,
          importance: this.calculateContextImportance(params.entities)
        },
        confidence: this.calculateContextImportance(params.entities),
        timestamp: params.timestamp,
        relationships: new Map(),
        context: {
          situation: 'conversation' as SituationType,
          emotional_state: {
            primary: 'neutral',
            intensity: 0,
            context: '',
            confidence: 1
          },
          external_factors: []
        },
        evolution: {
          history: [],
          trend: 'stable',
          stability: 1
        }
      };

      await this.advancedMemory.addNode(memoryNode);
    } catch (error) {
      console.error('Error updating contextual memory:', error);
      // Don't throw - we want to continue even if memory update fails
    }
  }

  private calculateContextImportance(entities: { names: string[]; dates: string[]; topics: string[]; }): number {
    // Calculate importance based on entity counts and uniqueness
    const importance = (
      entities.names.length * 0.4 +  // Names are most important
      entities.dates.length * 0.3 +  // Dates are second most important
      entities.topics.length * 0.3   // Topics are equally important as dates
    ) / 10; // Normalize to 0-1 range

    return Math.min(1, Math.max(0, importance)); // Ensure between 0 and 1
  }

  // Helper functions for serialization
  private serializeUserIntent(intent: UserIntent): SerializedUserIntent {
    return {
      type: intent.type,
      confidence: intent.confidence,
      ...(intent.sender && { sender: intent.sender }),
      ...(intent.date && { date: intent.date }),
      ...(intent.subtype && { subtype: intent.subtype }),
      ...(intent.query && { query: intent.query })
    };
  }

  private deserializeUserIntent(serialized: SerializedUserIntent): UserIntent {
    return this.mergeUserIntent(null, serialized);
  }

  private serializeQueryContext(queryContext: Array<{
    timestamp: number;
    intent: UserIntent;
    entities: {
      names: string[];
      dates: string[];
      topics: string[];
    };
    topic: string;
  }>): SerializedQueryContext[] {
    return queryContext.map(query => ({
      timestamp: query.timestamp,
      intent: this.serializeUserIntent(query.intent),
      entities: {
        names: query.entities.names,
        dates: query.entities.dates,
        topics: query.entities.topics
      },
      topic: query.topic
    }));
  }

  private deserializeQueryContext(serialized: SerializedQueryContext[]): Array<{
    timestamp: number;
    intent: UserIntent;
    entities: {
      names: string[];
      dates: string[];
      topics: string[];
    };
    topic: string;
  }> {
    return serialized.map(query => ({
      timestamp: query.timestamp,
      intent: this.deserializeUserIntent(query.intent),
      entities: {
        names: query.entities.names,
        dates: query.entities.dates,
        topics: query.entities.topics
      },
      topic: query.topic
    }));
  }

  private async getMemoryContext(query: string): Promise<MemoryContext> {
    try {
      // Get direct relevant memories
      const directMemories = await this.advancedMemory.searchNodes({
        type: 'context',
        query: query,
        limit: 5
      });

      // Get semantically related memories
      const semanticMemories = await this.findSemanticallySimilarMemories(query);

      // Get temporally related memories
      const temporalMemories = await this.findTemporallyRelatedMemories(query);

      // Combine and deduplicate memories
      const allMemories = this.combineAndDeduplicateMemories([
        ...directMemories,
        ...semanticMemories,
        ...temporalMemories
      ]);

      // Calculate memory score based on multiple factors
      const memoryScore = this.calculateEnhancedMemoryScore(allMemories, query);

      return {
        relevantMemories: allMemories.map(memory => 
          typeof memory.content === 'string' ? memory.content : JSON.stringify(memory.content)
        ),
        memoryScore,
        lastAccessTime: new Date()
      };
    } catch (error) {
      console.error('Error getting memory context:', error);
      return {
        relevantMemories: [],
        memoryScore: 0.2,
        lastAccessTime: new Date()
      };
    }
  }

  private async findSemanticallySimilarMemories(query: string): Promise<MemoryNode[]> {
    try {
      // Get semantic embeddings for the query
      const queryEmbedding = await this.advancedMemory.getOrCreateEmbedding(query);
      
      // Find memories with similar embeddings
      const similarMemories = await this.advancedMemory.searchNodes({
        type: 'context',
        query: query,
        filters: {
          embedding_similarity: {
            vector: queryEmbedding,
            threshold: 0.7
          }
        },
        limit: 5
      });

      return similarMemories;
    } catch (error) {
      console.error('Error finding semantically similar memories:', error);
      return [];
    }
  }

  private async findTemporallyRelatedMemories(query: string): Promise<MemoryNode[]> {
    try {
      // Extract temporal markers from query
      const temporalMarkers = this.extractTemporalMarkers(query);
      if (!temporalMarkers.length) return [];

      // Find memories with matching temporal context
      const temporalMemories = await Promise.all(
        temporalMarkers.map(marker =>
          this.advancedMemory.searchNodes({
            type: 'context',
            query: marker,
            filters: {
              temporal: true
            },
            limit: 3
          })
        )
      );

      return temporalMemories.flat();
    } catch (error) {
      console.error('Error finding temporally related memories:', error);
      return [];
    }
  }

  private extractTemporalMarkers(text: string): string[] {
    const markers: string[] = [];
    
    // Regular expressions for different temporal patterns
    const patterns = {
      date: /\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2}\/\d{1,2}\/\d{4}\b/,
      time: /\b\d{1,2}:\d{2}\b/,
      relative: /\b(yesterday|today|tomorrow|last week|next week|last month|next month)\b/i,
      duration: /\b(\d+\s+)?(second|minute|hour|day|week|month|year)s?\b/i,
      periodic: /\b(daily|weekly|monthly|yearly|annually)\b/i
    };

    // Extract all temporal markers
    Object.entries(patterns).forEach(([type, pattern]) => {
      const matches = text.match(new RegExp(pattern, 'g'));
      if (matches) {
        markers.push(...matches);
      }
    });

    return markers;
  }

  private combineAndDeduplicateMemories(memories: MemoryNode[]): MemoryNode[] {
    // Create a Map to store unique memories by ID
    const uniqueMemories = new Map<string, MemoryNode & { score?: number }>();

    // Process each memory
    memories.forEach(memory => {
      if (uniqueMemories.has(memory.id)) {
        // If memory already exists, update its score
        const existing = uniqueMemories.get(memory.id)!;
        existing.score = (existing.score || 0) + (memory.confidence || 0);
      } else {
        // Add new memory with initial score
        uniqueMemories.set(memory.id, {
          ...memory,
          score: memory.confidence || 0
        });
      }
    });

    // Convert back to array and sort by score
    return Array.from(uniqueMemories.values())
      .sort((a, b) => (b.score || 0) - (a.score || 0))
      .slice(0, 5); // Keep top 5 memories
  }

  private calculateEnhancedMemoryScore(memories: MemoryNode[], query: string): number {
    if (!memories.length) return 0.2;

    const factors = {
      relevance: this.calculateMemoryRelevanceScore(memories, query),
      recency: this.calculateRecencyScore(memories),
      confidence: this.calculateConfidenceScore(memories),
      contextMatch: this.calculateContextMatchScore(memories, query)
    };

    // Weighted average of all factors
    return (
      factors.relevance * 0.4 +
      factors.recency * 0.2 +
      factors.confidence * 0.2 +
      factors.contextMatch * 0.2
    );
  }

  // Change the memory nodes version
  private calculateMemoryRelevanceScore(memories: MemoryNode[], query: string): number {
    const queryWords = new Set(query.toLowerCase().split(/\s+/));
    
    return memories.reduce((score, memory) => {
      const content = typeof memory.content === 'string' 
        ? memory.content 
        : JSON.stringify(memory.content);
      
      const contentWords = new Set(content.toLowerCase().split(/\s+/));
      const commonWords = Array.from(queryWords)
        .filter(word => contentWords.has(word) && !this.isStopWord(word));
      
      return score + (commonWords.length / queryWords.size);
    }, 0);
  }

  // Change the displayed content version
  private calculateDisplayedContentRelevance(query: string, content: DisplayedContent): number {
    let score = 0;
    
    // Base confidence score (0-0.4)
    score += (content.metadata?.confidence || 0) * 0.4;
    
    // Recency score (0-0.3)
    const ageInHours = (Date.now() - content.timestamp) / (60 * 60 * 1000);
    score += Math.max(0, 0.3 * (1 - ageInHours / 24));
    
    // Content type relevance (0-0.3)
    switch (content.type) {
      case 'rag_result':
        score += 0.3;
        break;
      case 'memory_recall':
        score += 0.25;
        break;
      case 'direct_response':
        score += 0.2;
        break;
      default:
        score += 0.1;
    }
    
    return score;
  }

  private calculateRecencyScore(input: Date | number | MemoryNode[]): number {
    const now = Date.now();
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    
    if (Array.isArray(input)) {
      if (!input.length) return 0;
      return input.reduce((score, memory) => {
      const age = now - memory.timestamp;
        return score + Math.max(0, 1 - age / maxAge);
      }, 0) / input.length;
    } else {
      const timestamp = input instanceof Date ? input.getTime() : 
                       typeof input === 'number' ? input : Date.now();
      const age = now - timestamp;
      return Math.max(0, 1 - age / maxAge);
    }
  }

  private calculateConfidenceScore(memories: MemoryNode[]): number {
    return memories.reduce((score, memory) => 
      score + (memory.confidence || 0.5)
    , 0) / memories.length;
  }

  private calculateContextMatchScore(memories: MemoryNode[], query: string): number {
    return memories.reduce((score, memory) => {
      if (!memory.context) return score;

      const contextRelevance = [
        this.matchSituation(memory.context.situation, query),
        this.matchEmotionalState(memory.context.emotional_state, query),
        this.matchExternalFactors(memory.context.external_factors, query)
      ];

      return score + (contextRelevance.reduce((a, b) => a + b, 0) / contextRelevance.length);
    }, 0) / memories.length;
  }

  private matchSituation(situation: string, query: string): number {
    const situationWords = situation.toLowerCase().split(/[_\s]+/);
    const queryWords = query.toLowerCase().split(/\s+/);
    
    const matches = queryWords.filter(word => 
      situationWords.some(sw => sw.includes(word) || word.includes(sw))
    );
    
    return matches.length / queryWords.length;
  }

  private matchEmotionalState(state: any, query: string): number {
    if (!state || !state.primary) return 0;
    
    const emotionWords = [
      state.primary.toLowerCase(),
      ...(state.context ? state.context.toLowerCase().split(/\s+/) : [])
    ];
    
    const queryWords = query.toLowerCase().split(/\s+/);
    const matches = queryWords.filter(word => 
      emotionWords.some(ew => ew.includes(word) || word.includes(ew))
    );
    
    return matches.length / queryWords.length;
  }

  private matchExternalFactors(factors: string[], query: string): number {
    if (!factors || !factors.length) return 0;
    
    const factorWords = factors.join(' ').toLowerCase().split(/\s+/);
    const queryWords = query.toLowerCase().split(/\s+/);
    
    const matches = queryWords.filter(word => 
      factorWords.some(fw => fw.includes(word) || word.includes(fw))
    );
    
    return matches.length / queryWords.length;
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have',
      'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you',
      'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they',
      'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one',
      'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out',
      'if', 'about', 'who', 'get', 'which', 'go', 'me'
    ]);
    return stopWords.has(word.toLowerCase());
  }

  // Helper method to initialize display stats
  private initializeDisplayStats(existing?: DisplayTrackingStats): DisplayTrackingStats {
    return {
      totalDisplayed: existing?.totalDisplayed || 0,
      byType: {
        rag_result: existing?.byType?.rag_result || 0,
        memory_recall: existing?.byType?.memory_recall || 0,
        direct_response: existing?.byType?.direct_response || 0,
        system_message: existing?.byType?.system_message || 0,
        error_message: existing?.byType?.error_message || 0,
        suggestion: existing?.byType?.suggestion || 0,
        clarification: existing?.byType?.clarification || 0
      },
      bySource: {
        rag: existing?.bySource?.rag || 0,
        memory: existing?.bySource?.memory || 0,
        direct: existing?.bySource?.direct || 0
      },
      lastDisplayTimestamp: existing?.lastDisplayTimestamp,
      averageConfidence: existing?.averageConfidence
    };
  }

  // Helper method to calculate updated average confidence
  private calculateUpdatedAverageConfidence(
    currentAverage: number | undefined,
    newConfidence: number | undefined,
    totalCount: number
  ): number {
    if (!newConfidence) return currentAverage || 0;
    if (!currentAverage) return newConfidence;
    
    return ((currentAverage * (totalCount - 1)) + (newConfidence || 0)) / totalCount;
  }

  // Helper method to clean up old displayed information
  private cleanupDisplayedInfo(displayedInfo: Map<string, DisplayedContent>): void {
    const now = Date.now();
    const TWO_HOURS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
    const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;
    
    for (const [id, content] of displayedInfo.entries()) {
      // Remove invalid content
      if (!this.validateDisplayedContent(content)) {
        displayedInfo.delete(id);
        continue;
      }

      // Remove old content based on different criteria
      if (
        // Remove content older than 2 hours if it's low confidence
        (now - content.timestamp > TWO_HOURS && 
         content.metadata?.confidence && 
         content.metadata.confidence < 0.5) ||
        // Remove acknowledged content after 2 hours
        (content.displayStatus.acknowledged && 
         content.displayStatus.acknowledgedAt && 
         now - content.displayStatus.acknowledgedAt > TWO_HOURS) ||
        // Remove any content older than a week
        now - content.timestamp > ONE_WEEK
      ) {
        displayedInfo.delete(id);
      }
    }
  }

  // Helper method to validate displayed content
  private validateDisplayedContent(content: DisplayedContent): ValidationResult {
    if (!content.id || !content.content || !content.type || !content.source) {
      return { isValid: false, reason: 'Missing required display content fields' };
    }

    // Validate content age
    const age = Date.now() - content.timestamp;
    if (age > this.DEFAULT_VALIDATION_RULES.maxDisplayedInfoAge) {
      return { isValid: false, reason: 'Content too old' };
    }

    // Validate confidence if available
    if (content.metadata?.confidence !== undefined) {
      if (content.metadata.confidence < this.DEFAULT_VALIDATION_RULES.minConfidenceThreshold) {
        return { isValid: false, reason: 'Confidence below threshold' };
      }
    }

    return { isValid: true };
  }

  // Helper method to update display status
  private updateDisplayStatus(content: DisplayedContent, acknowledged: boolean = false): void {
    const now = Date.now();
    
    if (!content.displayStatus.shown) {
      content.displayStatus.shown = true;
      content.displayStatus.shownAt = now;
    }
    
    if (acknowledged && !content.displayStatus.acknowledged) {
      content.displayStatus.acknowledged = true;
      content.displayStatus.acknowledgedAt = now;
    }
  }

  private identifyTopicClusters(conversations: ConversationState[]): Array<TopicCluster> {
    const topicFrequency = new Map<string, number>();
    const topicRelations = new Map<string, Set<string>>();
    const topicContexts = new Map<string, string[]>();

    // Count topic frequencies, track relations and gather context
    conversations.forEach(conv => {
      const currentTopic = typeof conv.currentTopic === 'string' ? conv.currentTopic : 'general';
      topicFrequency.set(currentTopic, (topicFrequency.get(currentTopic) || 0) + 1);

      // Store context for semantic analysis
      if (Array.isArray(conv.contextStack)) {
        const contexts = topicContexts.get(currentTopic) || [];
        contexts.push(...conv.contextStack.map(c => String(c)));
        topicContexts.set(currentTopic, contexts);
      }

      if (conv.lastTopic) {
        const relatedTopics = topicRelations.get(currentTopic) || new Set();
        relatedTopics.add(conv.lastTopic);
        topicRelations.set(currentTopic, relatedTopics);
      }
    });

    // Calculate semantic similarities between topics
    const similarities: TopicSimilarity[] = [];
    const topics = Array.from(topicFrequency.keys());
    
    for (let i = 0; i < topics.length; i++) {
      for (let j = i + 1; j < topics.length; j++) {
        const topic1 = topics[i];
        const topic2 = topics[j];
        const similarity = this.calculateTopicSimilarity(topic1, topic2);
        const contexts1 = topicContexts.get(topic1) || [];
        const contexts2 = topicContexts.get(topic2) || [];
        
        // Calculate contextual similarity
        const contextSimilarity = this.calculateWordSequenceSimilarity(
          contexts1,
          contexts2
        );

        similarities.push({
          topic1,
          topic2,
          score: (similarity + contextSimilarity) / 2,
          confidence: Math.min(
            topicFrequency.get(topic1) || 0,
            topicFrequency.get(topic2) || 0
          ) / Math.max(...topicFrequency.values())
        });
      }
    }

    // Build topic hierarchy based on similarities
    const hierarchies: TopicHierarchy[] = [];
    const processedTopics = new Set<string>();

    // Sort similarities by score to process strongest relationships first
    similarities.sort((a, b) => b.score - a.score);

    similarities.forEach(sim => {
      if (sim.score > 0.7) { // Threshold for hierarchical relationship
        const parent = sim.topic1;
        const child = sim.topic2;
        
        if (!processedTopics.has(child)) {
          hierarchies.push({
            parent,
            children: [child],
            level: processedTopics.has(parent) ? 2 : 1,
            confidence: sim.confidence
          });
          processedTopics.add(child);
        }
      }
    });

    // Create enhanced topic clusters
    return Array.from(topicFrequency.entries())
      .map(([topic, count]): TopicCluster => {
        const hierarchy = hierarchies.find(h => h.parent === topic || h.children.includes(topic));
        const semanticScores = similarities
          .filter(s => s.topic1 === topic || s.topic2 === topic)
          .map(s => s.score);
        
        return {
          topic,
          count,
          relatedTopics: Array.from(topicRelations.get(topic) || []),
          semanticScore: semanticScores.length 
            ? semanticScores.reduce((a, b) => a + b, 0) / semanticScores.length 
            : undefined,
          hierarchyLevel: hierarchy?.level,
          parentTopic: hierarchy?.children.includes(topic) ? hierarchy.parent : undefined,
          childTopics: hierarchy?.parent === topic ? hierarchy.children : undefined,
          contextualScore: topicContexts.get(topic)?.length 
            ? this.calculateContextScore(topic) 
            : undefined
        };
      })
      .sort((a, b) => b.count - a.count);
  }

  private calculateTemporalDensity(conversations: ConversationState[]): EnhancedTemporalDensity {
    const timestamps = conversations.map(c => new Date(c.updatedAt).getTime());
    const msPerHour = 3600000;
    const msPerDay = msPerHour * 24;

    // Calculate overall density (conversations per day)
    const timeSpan = Math.max(...timestamps) - Math.min(...timestamps);
    const daysSpan = timeSpan / msPerDay;
    const overall = conversations.length / (daysSpan || 1);

    // Calculate hourly and daily density
    const hourly: Record<number, number> = {};
    const daily: Record<number, number> = {};

    timestamps.forEach(ts => {
      const hour = new Date(ts).getHours();
      const day = Math.floor(ts / msPerDay);
      
      hourly[hour] = (hourly[hour] || 0) + 1;
      daily[day] = (daily[day] || 0) + 1;
    });

    // Analyze patterns in hourly density
    const hourlyPatterns = this.analyzeDensityPatterns(hourly, 'hourly');
    const dailyPatterns = this.analyzeDensityPatterns(daily, 'daily');

    // Analyze user behavior
    const userBehavior = this.analyzeUserBehavior(hourly, timestamps);

    return {
      overall,
      hourly,
      daily,
      patterns: [hourlyPatterns, dailyPatterns],
      userBehavior
    };
  }

  private analyzeDensityPatterns(
    distribution: Record<number, number>,
    timeframe: 'hourly' | 'daily'
  ): DensityVariation {
    const values = Object.values(distribution);
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const stdDev = Math.sqrt(
      values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
    );

    const patterns: TemporalDensityPattern[] = [];
    const anomalies: DensityVariation['anomalies'] = [];

    // Detect trend pattern
    const trend = this.calculateLinearRegression(
      Object.keys(distribution).map(Number),
      Object.values(distribution)
    );

    if (Math.abs(trend.slope) > 0.1) {
      patterns.push({
        type: trend.slope > 0 ? 'increasing' : 'decreasing',
        confidence: Math.min(1, Math.abs(trend.slope) * 2),
        magnitude: Math.abs(trend.slope)
      });
    } else {
      patterns.push({
        type: 'stable',
        confidence: 0.8,
        magnitude: Math.abs(trend.slope)
      });
    }

    // Detect cyclic patterns
    const cyclicPattern = this.detectCyclicPattern(Object.values(distribution));
    if (cyclicPattern) {
      patterns.push(cyclicPattern);
    }

    // Detect anomalies (values more than 2 standard deviations from mean)
    Object.entries(distribution).forEach(([time, value]) => {
      const deviation = Math.abs(value - mean) / stdDev;
      if (deviation > 2) {
        anomalies.push({
          timestamp: Number(time),
          expected: mean,
          actual: value,
          deviation
        });
      }
    });

    return {
      timeframe,
      patterns,
      anomalies
    };
  }

  private analyzeUserBehavior(
    hourlyDistribution: Record<number, number>,
    timestamps: number[]
  ): EnhancedTemporalDensity['userBehavior'] {
    // Find peak hours (hours with activity above 75th percentile)
    const values = Object.values(hourlyDistribution);
    const percentile75 = this.calculatePercentile(values, 75);
    const peakHours = Object.entries(hourlyDistribution)
      .filter(([_, value]) => value > percentile75)
      .map(([hour]) => Number(hour));

    // Find active time ranges
    const activeTimeRanges = this.findActiveTimeRanges(hourlyDistribution);

    // Calculate consistency score based on regular patterns
    const consistency = this.calculateBehaviorConsistency(timestamps);

    return {
      peakHours,
      activeTimeRanges,
      consistency
    };
  }

  private detectCyclicPattern(values: number[]): TemporalDensityPattern | null {
    const autocorr = this.calculateAutocorrelation(values);
    const peaks = this.findPeaks(autocorr);
    
    if (peaks.length >= 2) {
      const period = peaks[1] - peaks[0];
      const confidence = autocorr[peaks[1]] / autocorr[peaks[0]];
      
      if (confidence > 0.3) {
        return {
          type: 'cyclic',
          confidence,
          period,
          magnitude: Math.max(...values) - Math.min(...values)
        };
      }
    }
    
    return null;
  }

  private calculatePercentile(values: number[], percentile: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }

  private findActiveTimeRanges(
    hourlyDistribution: Record<number, number>
  ): Array<{ start: number; end: number; intensity: number }> {
    const ranges: Array<{ start: number; end: number; intensity: number }> = [];
    const threshold = Object.values(hourlyDistribution)
      .reduce((sum, val) => sum + val, 0) / 24 * 1.2; // 20% above average

    let currentRange: { start: number; sum: number } | null = null;

    for (let hour = 0; hour < 24; hour++) {
      const activity = hourlyDistribution[hour] || 0;
      
      if (activity > threshold) {
        if (!currentRange) {
          currentRange = { start: hour, sum: 0 };
        }
        currentRange.sum += activity;
      } else if (currentRange) {
        ranges.push({
          start: currentRange.start,
          end: hour - 1,
          intensity: currentRange.sum / (hour - currentRange.start)
        });
        currentRange = null;
      }
    }

    // Handle range that wraps around midnight
    if (currentRange) {
      ranges.push({
        start: currentRange.start,
        end: 23,
        intensity: currentRange.sum / (24 - currentRange.start)
      });
    }

    return ranges;
  }

  private calculateBehaviorConsistency(timestamps: number[]): number {
    if (timestamps.length < 2) return 1;

    // Calculate intervals between activities
    const intervals: number[] = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }

    // Calculate coefficient of variation (lower means more consistent)
    const mean = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const stdDev = Math.sqrt(
      intervals.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / intervals.length
    );

    // Convert to a 0-1 score (1 being most consistent)
    return Math.max(0, 1 - (stdDev / mean / 2));
  }

  private calculateAutocorrelation(values: number[]): number[] {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const normalized = values.map(v => v - mean);
    const result: number[] = [];

    for (let lag = 0; lag < Math.floor(values.length / 2); lag++) {
      let numerator = 0;
      let denominator = 0;

      for (let i = 0; i < values.length - lag; i++) {
        numerator += normalized[i] * normalized[i + lag];
        denominator += normalized[i] * normalized[i];
      }

      result[lag] = numerator / denominator;
    }

    return result;
  }

  private findPeaks(values: number[]): number[] {
    const peaks: number[] = [];
    
    for (let i = 1; i < values.length - 1; i++) {
      if (values[i] > values[i - 1] && values[i] > values[i + 1]) {
        peaks.push(i);
      }
    }
    
    return peaks;
  }

  private async updateExistingTemporalRelationships(
    newNode: MemoryNode,
    recentConversations: ConversationState[]
  ): Promise<void> {
    try {
      // Find existing temporal nodes
      const searchOptions: SearchNodeOptions = {
        type: MEMORY_TYPES.WORKING,
        query: 'type:temporal_context',
        filters: {
          temporal: true
        }
      };
      const existingNodes = await this.advancedMemory.searchNodes(searchOptions);

      // Update relationships with new node
      for (const existing of existingNodes) {
        const similarity = this.calculateTemporalSimilarity(
          existing.content,
          newNode.content
        );

        if (similarity > 0.3) {
          const relationshipType: RelationshipType = 'temporal_correlation';
          const metadata = [
            `similarity:${similarity}`,
            `timestamp:${Date.now()}`
          ];
          
          await this.advancedMemory.addRelationship(
            newNode,
            existing,
            relationshipType,
            similarity,
            metadata // metadata is already in the correct string[] format for evidence
          );
        }
      }
    } catch (error) {
      console.error('Error updating temporal relationships:', error);
    }
  }

  private isTemporalNodeContent(content: any): content is TemporalNodeContent {
    return (
      content &&
      typeof content === 'object' &&
      content.type === 'temporal_context' &&
      typeof content.conversationId === 'string' &&
      Array.isArray(content.relatedConversations) &&
      Array.isArray(content.patterns) &&
      content.metadata &&
      typeof content.metadata === 'object' &&
      typeof content.metadata.timeframe === 'string' &&
      typeof content.metadata.totalRelated === 'number' &&
      Array.isArray(content.metadata.topicClusters) &&
      content.metadata.temporalDensity &&
      typeof content.metadata.temporalDensity === 'object'
    );
  }

  private calculateTemporalSimilarity(content1: unknown, content2: unknown): number {
    if (!this.isTemporalNodeContent(content1) || !this.isTemporalNodeContent(content2)) return 0;
    
    let similarity = 0;
    let factors = 0;

    // Compare topics from the first related conversation
    if (content1.relatedConversations?.[0]?.topic && content2.relatedConversations?.[0]?.topic) {
      similarity += this.calculateTopicSimilarity(
        content1.relatedConversations[0].topic,
        content2.relatedConversations[0].topic
      );
      factors++;
    }

    // Compare time patterns
    if (content1.patterns && content2.patterns) {
      const commonPatterns = content1.patterns.filter((p1: TemporalPattern) =>
        content2.patterns.some((p2: TemporalPattern) =>
          p1.type === p2.type && Math.abs(p1.confidence - p2.confidence) < 0.3
        )
      ).length;

      if (commonPatterns > 0) {
        similarity += commonPatterns / Math.max(content1.patterns.length, content2.patterns.length);
        factors++;
      }
    }

    // Compare temporal density
    if (content1.metadata?.temporalDensity && content2.metadata?.temporalDensity) {
      const densityDiff = Math.abs(
        content1.metadata.temporalDensity.overall - content2.metadata.temporalDensity.overall
      );
      similarity += Math.max(0, 1 - densityDiff);
      factors++;
    }

    return factors > 0 ? similarity / factors : 0;
  }

  private analyzeEngagementPattern(
    engagementSignals: string[]
  ): {
    confidence: number;
    data: {
      trend: 'increasing' | 'decreasing' | 'stable';
      distribution: Record<EngagementLevel, number>;
    };
  } {
    const distribution: Record<EngagementLevel, number> = {
      high: 0,
      medium: 0,
      low: 0
    };

    // Calculate distribution
    engagementSignals.forEach(level => {
      if (level in distribution) {
        distribution[level as EngagementLevel]++;
      }
    });

    // Calculate trend
    const trend = this.calculateEngagementTrend(engagementSignals);

    // Calculate confidence based on sample size and consistency
    const totalSignals = engagementSignals.length;
    const maxCount = Math.max(...Object.values(distribution));
    const consistency = maxCount / totalSignals;
    const confidence = Math.min(1, (totalSignals / 10) * consistency);

    return {
      confidence,
      data: {
        trend,
        distribution
      }
    };
  }

  private calculateEngagementTrend(
    signals: string[]
  ): 'increasing' | 'decreasing' | 'stable' {
    if (signals.length < 3) return 'stable';

    const scores = signals.map(level => {
      switch (level) {
        case 'high': return 3;
        case 'medium': return 2;
        case 'low': return 1;
        default: return 0;
      }
    });

    let increasing = 0;
    let decreasing = 0;

    for (let i = 1; i < scores.length; i++) {
      const diff = scores[i] - scores[i - 1];
      if (diff > 0) increasing++;
      else if (diff < 0) decreasing++;
    }

    if (increasing > decreasing * 1.5) return 'increasing';
    if (decreasing > increasing * 1.5) return 'decreasing';
    return 'stable';
  }

  private validateContextTransition(current: ChatAgentContext, next: ChatAgentContext): ValidationResult {
    // Validate basic structure
    if (!next.conversationId || !next.userId) {
      return { isValid: false, reason: 'Missing required context fields' };
    }

    // Validate topic transition
    if (next.topicDepth && next.topicDepth > this.DEFAULT_VALIDATION_RULES.maxTopicDepth) {
      return {
        isValid: false,
        reason: 'Topic depth exceeds maximum',
        suggestedFix: { ...next, topicDepth: this.DEFAULT_VALIDATION_RULES.maxTopicDepth }
      };
    }

    // Validate context stack
    if (next.contextStack.length > this.DEFAULT_VALIDATION_RULES.maxContextStackSize) {
      return {
        isValid: false,
        reason: 'Context stack exceeds maximum size',
        suggestedFix: {
          ...next,
          contextStack: next.contextStack.slice(-this.DEFAULT_VALIDATION_RULES.maxContextStackSize)
        }
      };
    }

    // Validate pending actions
    if (next.pendingActions.length > this.DEFAULT_VALIDATION_RULES.maxPendingActions) {
      return {
        isValid: false,
        reason: 'Too many pending actions',
        suggestedFix: {
          ...next,
          pendingActions: next.pendingActions.slice(-this.DEFAULT_VALIDATION_RULES.maxPendingActions)
        }
      };
    }

    return { isValid: true };
  }

  private validateRAGResults(results: BaseSearchResult[]): ValidationResult {
    if (!Array.isArray(results)) {
      return { isValid: false, reason: 'Invalid RAG results format' };
    }

    // Check each result with enhanced validation
    const invalidResults = results.filter(result => {
      // Required fields check
      if (!result.id || !result.content) return true;

      // Enhanced result validation
      if (isEnhancedSearchResult(result)) {
        // Enhanced results must have valid confidence and usage data
        if (result.confidence < this.DEFAULT_VALIDATION_RULES.minConfidenceThreshold) return true;
        if (!result.usage || typeof result.usage.displayCount !== 'number') return true;
        return false;
      }

      // Base result validation
      if (result.confidence && result.confidence < this.DEFAULT_VALIDATION_RULES.minConfidenceThreshold) return true;
      
      return false;
    });

    if (invalidResults.length > 0) {
      // Create suggested fix by filtering out invalid results and enhancing valid ones
      const validResults = results
        .filter(r => !invalidResults.includes(r))
        .map(r => isEnhancedSearchResult(r) ? r : enhanceSearchResult(r));

      return {
        isValid: false,
        reason: 'Invalid RAG results found',
        suggestedFix: validResults
      };
    }

    return { isValid: true };
  }

  // Restore the RAG integration with enhanced features
  private async integrateRAGResults(
    results: BaseSearchResult[],
    context: ChatAgentContext,
    query: string
  ): Promise<BaseSearchResult[]> {
    // Initialize if needed
    if (!context.ragResults) {
      context.ragResults = {
        current: [],
        history: [],
        stats: this.initializeRAGStats()
      };
    }

    // Validate results before processing
    const validationResult = this.validateRAGResults(results);
    const resultsToProcess = validationResult.isValid 
      ? results 
      : (validationResult.suggestedFix || []);

    // Convert to enhanced results and track usage
    const enhancedResults = resultsToProcess.map((result: BaseSearchResult) => {
      const enhanced = isEnhancedSearchResult(result) ? result : enhanceSearchResult(result);
      enhanced.usage.displayCount = (enhanced.usage.displayCount || 0) + 1;
      enhanced.usage.lastUsed = Date.now();
      enhanced.usage.contexts = [...(enhanced.usage.contexts || []), query];
      return enhanced;
    });
    
    // Update stats with enhanced tracking
    const stats = context.ragResults.stats as EnhancedRAGStats;
    stats.totalQueries++;
    stats.totalResults += enhancedResults.length;
    stats.lastQueryTimestamp = Date.now();

    if (enhancedResults.length > 0) {
      // Calculate confidence using our enhanced calculation
      const avgConfidence = this.calculateAverageConfidence(enhancedResults);
      stats.averageConfidence = this.calculateUpdatedAverage(
        stats.averageConfidence || 0,
        avgConfidence,
        stats.totalQueries
      );
      
      // Update success metrics
      stats.successRate = this.calculateSuccessRate(
        stats.totalResults,
        stats.totalQueries,
        avgConfidence
      );
    }

    // Track query patterns
    const queryType = this.classifyRAGQuery(query);
    if ('queryTypes' in stats) {
      stats.queryTypes[queryType] = (stats.queryTypes[queryType] || 0) + 1;
    }

    // Create enhanced query context with full tracking
    const queryContext: RAGQueryContext = {
      query,
      timestamp: Date.now(),
      results: enhancedResults,
      displayed: false
    };

    // Update context while maintaining history limit
    const MAX_HISTORY_SIZE = 50;
    context.ragResults.history = [
      queryContext,
      ...context.ragResults.history.slice(0, MAX_HISTORY_SIZE - 1)
    ];
    context.ragResults.current = enhancedResults;

    return enhancedResults;
  }

  // Helper method to calculate success rate with enhanced metrics
  private calculateSuccessRate(
    totalResults: number,
    totalQueries: number,
    avgConfidence: number,
    recentResults: BaseSearchResult[] = []
  ): number {
    // Base success rate from result/query ratio
    const baseRate = totalResults / totalQueries || 0;
    
    // Enhanced success factors
    const confidenceWeight = 0.3;  // Weight for confidence impact
    const recencyWeight = 0.2;     // Weight for recent results
    const baseWeight = 0.5;        // Weight for base success rate

    // Calculate recency bonus based on recent results
    const recencyBonus = recentResults.length > 0
      ? recentResults.reduce((sum, result) => {
          if (isEnhancedSearchResult(result)) {
            // Enhanced results get full weight
            return sum + (result.usage.displayCount > 0 ? 1 : 0);
          }
          // Base results get partial weight
          return sum + (result.displayed ? 0.5 : 0);
        }, 0) / recentResults.length
      : 0;

    // Combine all factors with weights
    const weightedScore = 
      (baseRate * baseWeight) +
      (avgConfidence * confidenceWeight) +
      (recencyBonus * recencyWeight);

    // Ensure final rate is between 0 and 1
    return Math.min(1, Math.max(0, weightedScore));
  }

  // Update the stats initialization to include enhanced features
  private initializeRAGStats(existing?: EnhancedRAGStats): EnhancedRAGStats {
    return {
      totalQueries: existing?.totalQueries || 0,
      totalResults: existing?.totalResults || 0,
      lastQueryTimestamp: existing?.lastQueryTimestamp || Date.now(),
      averageConfidence: existing?.averageConfidence || 0,
      successRate: existing?.successRate || 0,  // Initialize with 0
      queryTypes: existing?.queryTypes || {}    // Initialize with empty object
    };
  }

  private calculateQueryConfidence(query: string, results: BaseSearchResult[]): number {
    if (results.length === 0) return 0;

    // Calculate base confidence from result confidences, handling both types
    const avgConfidence = results.reduce((sum, result) => {
      if (isEnhancedSearchResult(result)) {
        // Enhanced results always have confidence
        return sum + result.confidence;
      }
      // Base results might have undefined confidence
      return sum + (result.confidence || 0);
    }, 0) / results.length;
    
    // Adjust based on query quality
    const queryQuality = this.assessQueryQuality(query);
    
    // Additional confidence boost for enhanced results
    const enhancedBoost = results.some(isEnhancedSearchResult) ? 0.1 : 0;
    
    // Combine factors with enhanced boost
    return Math.min(1, (avgConfidence * 0.6) + (queryQuality * 0.3) + enhancedBoost);
  }

  private assessQueryQuality(query: string): number {
    let score = 0;
    const queryLength = query.trim().length;
    const words = query.split(/\s+/);
    
    // Length factors (0.0 - 0.25)
    const lengthScore = Math.min(0.25, words.length / 12);  // Optimal length around 8-12 words
    score += lengthScore;
    
    // Specificity factors (0.0 - 0.35)
    const specificityScore = this.calculateSpecificityScore(query);
    score += specificityScore;
    
    // Context richness (0.0 - 0.25)
    const contextScore = this.calculateContextScore(query);
    score += contextScore;
    
    // Query structure (0.0 - 0.15)
    const structureScore = this.calculateQueryStructureScore(query);
    score += structureScore;
    
    return Math.min(1, score);
  }

  // Helper method to calculate query specificity
  private calculateSpecificityScore(query: string): number {
    let score = 0;
    
    // Question words (up to 0.15)
    if (/\b(who|what|when|where|why|how)\b/i.test(query)) score += 0.15;
    
    // Action verbs (up to 0.1)
    if (/\b(explain|describe|compare|analyze|define|find|show|tell)\b/i.test(query)) score += 0.1;
    
    // Technical or domain-specific terms (up to 0.1)
    if (/\b(algorithm|function|method|api|database|system|framework)\b/i.test(query)) score += 0.1;
    
    return Math.min(0.35, score);
  }

  // Helper method to calculate context richness
  private calculateContextScore(query: string): number {
    let score = 0;
    
    // Context indicators (up to 0.15)
    if (/\b(regarding|about|concerning|related to|in|for|with)\b/i.test(query)) score += 0.15;
    
    // Time references (up to 0.05)
    if (/\b(before|after|during|while|when|recent|latest)\b/i.test(query)) score += 0.05;
    
    // Scope qualifiers (up to 0.05)
    if (/\b(all|any|each|every|most|some|few|only)\b/i.test(query)) score += 0.05;
    
    return Math.min(0.25, score);
  }

  // Helper method to calculate query structure quality
  private calculateQueryStructureScore(query: string): number {
    let score = 0;
    
    // Proper capitalization (0.05)
    if (/^[A-Z]/.test(query)) score += 0.05;
    
    // Proper punctuation (0.05)
    if (/[?.!]$/.test(query)) score += 0.05;
    
    // Complex structure (0.05)
    if (/\b(and|or|but|however|although|unless|if|then)\b/i.test(query)) score += 0.05;
    
    return Math.min(0.15, score);
  }

  // Classify RAG query type
  private classifyRAGQuery(query: string): string {
    if (/\b(who|what|where|when)\b/i.test(query)) return 'factual';
    if (/\b(why|how)\b/i.test(query)) return 'explanatory';
    if (/\b(compare|difference|similar|between)\b/i.test(query)) return 'comparative';
    if (/\b(should|could|would|recommend)\b/i.test(query)) return 'advisory';
    return 'general';
  }

  private calculateUpdatedAverage(
    currentAvg: number,
    newValue: number,
    totalCount: number
  ): number {
    return ((currentAvg * (totalCount - 1)) + newValue) / totalCount;
  }

  // Helper method to calculate average messages per conversation
  private calculateAverageMessages(conversations: ConversationState[]): number {
    if (conversations.length === 0) return 0;
    const totalMessages = conversations.reduce((sum, conv) => {
      const stack = conv.contextStack;
      return sum + (Array.isArray(stack) ? stack.length : 0);
    }, 0);
    return totalMessages / conversations.length;
  }

  // Helper method to identify peak activity periods
  private identifyPeakActivityPeriods(conversations: ConversationState[]): Array<{
    period: string;
    count: number;
    confidence: number;
  }> {
    const hourlyActivity: Record<number, number> = {};
    
    // Count activity by hour
    conversations.forEach(conv => {
      const hour = new Date(conv.updatedAt).getHours();
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
    });

    // Calculate average activity
    const totalActivity = Object.values(hourlyActivity).reduce((sum, count) => sum + count, 0);
    const avgActivity = totalActivity / 24; // 24 hours

    // Identify peaks (periods with above-average activity)
    return Object.entries(hourlyActivity)
      .filter(([_, count]) => count > avgActivity)
      .map(([hour, count]) => ({
        period: `${hour}:00-${hour}:59`,
        count,
        confidence: Math.min(1, count / (avgActivity * 2)) // Normalize confidence
      }))
      .sort((a, b) => b.count - a.count);
  }

  // Helper method to calculate topic change frequency
  private calculateTopicChangeFrequency(conversations: ConversationState[]): {
    frequency: number;
    confidence: number;
  } {
    const topicChanges = conversations.reduce((count, conv, index) => {
      if (index === 0) return 0;
      return count + (conv.currentTopic !== conversations[index - 1].currentTopic ? 1 : 0);
    }, 0);

    const frequency = topicChanges / (conversations.length - 1);
    const confidence = Math.min(1, conversations.length / 10); // More conversations = higher confidence

    return { frequency, confidence };
  }

  // Add new method for tracking displayed information references
  private async trackDisplayedReference(
    content: DisplayedContent,
    context: ChatAgentContext
  ): Promise<void> {
    if (!context.displayedInfo) {
      context.displayedInfo = new Map();
    }
    
    const reference: DisplayedInfoReference = {
      id: content.id,
      content: content.content,
      confidence: content.metadata?.confidence || 0,
      timestamp: Date.now(),
      type: content.type,
      query: content.metadata?.query
    };
    
    context.displayedInfo.set(content.id, {
      ...content,
      displayStatus: {
        ...content.displayStatus,
        shown: true,
        shownAt: Date.now()
      }
    });

    // Update display stats
    if (!context.displayStats) {
      context.displayStats = {
        totalDisplayed: 0,
        byType: {} as Record<DisplayedContentType, number>,
        bySource: {} as Record<'rag' | 'memory' | 'direct', number>
      };
    }
    
    context.displayStats.totalDisplayed++;
    context.displayStats.byType[content.type] = (context.displayStats.byType[content.type] || 0) + 1;
    context.displayStats.bySource[content.source] = (context.displayStats.bySource[content.source] || 0) + 1;
    context.displayStats.lastDisplayTimestamp = Date.now();
  }

  // Add new method for finding relevant displayed information
  private async findRelevantDisplayedInfo(
    query: string,
    context: ChatAgentContext
  ): Promise<DisplayedContent[]> {
    if (!context.displayedInfo) {
      return [];
    }

    const now = Date.now();
    const relevantInfo: DisplayedContent[] = [];

    for (const [_, content] of context.displayedInfo) {
      // Skip if too old
      if (now - content.timestamp > this.REFERENCE_RULES.maxAge) {
        continue;
      }

      // Skip if confidence too low
      if ((content.metadata?.confidence || 0) < this.REFERENCE_RULES.minConfidence) {
        continue;
      }

      // Calculate relevance score using the specific function
      const score = this.calculateDisplayedContentRelevance(query, content);
      if (score > 0.3) { // Minimum relevance threshold
        relevantInfo.push(content);
      }
    }

    // Sort by relevance and limit
    return relevantInfo
      .sort((a, b) => (b.metadata?.confidence || 0) - (a.metadata?.confidence || 0))
      .slice(0, this.REFERENCE_RULES.maxReferences);
  }

  /**
   * Process a message with awareness of previously displayed information
   * @param input The user's input message
   * @param context The current chat agent context
   * @returns ProcessedMessageResult containing the processed response and suggestions
   */
  private async processWithDisplayedContext(
    input: string,
    context: ChatAgentContext
  ): Promise<{
    response: string;
    insights: any;
    suggestions: any[];
  }> {
    // Guard against recursive processing
    if (context.isProcessingDisplayedContext) {
      return {
        response: "I'm currently processing your previous request. Please wait a moment.",
        insights: {},
        suggestions: []
      };
    }

    try {
      context.isProcessingDisplayedContext = true;

      // Input validation
      if (!input?.trim()) {
        return {
          response: "I couldn't process an empty message. Please provide some input.",
          insights: {},
          suggestions: []
        };
      }

      // Get relevant displayed content with comprehensive search
      const relevantContent = await this.findRelevantDisplayedContent(input, context);
      
      if (!relevantContent?.length) {
        const baseResponse = await this.generateBaseResponse(input, this.getBasePrompt());
        return {
          response: baseResponse.content,
          insights: {},
          suggestions: []
        };
      }

      // Calculate overall confidence using weighted calculation
      const confidence = this.calculateDisplayedContentConfidence(relevantContent);

      // If confidence is high enough, prepare a response
      if (confidence >= this.DEFAULT_VALIDATION_RULES.minConfidenceThreshold) {
        const response = await this.prepareResponseFromDisplayedContent(
          input,
          relevantContent,
          context
        );

        if (!response) {
          const baseResponse = await this.generateBaseResponse(input, this.getBasePrompt());
          return {
            response: baseResponse.content,
            insights: {
              confidence,
              enhancedContext: false
            },
            suggestions: await this.generateContextualSuggestions(input, context)
          };
        }

        // Generate contextual suggestions
        const suggestions = await this.generateContextualSuggestions(input, context);

        return {
          response,
          insights: {
            relevantContent,
            confidence,
            enhancedContext: true,
            displayStats: context.displayStats
          },
          suggestions
        };
      }

      // Fall back to base response if confidence is too low
      const baseResponse = await this.generateBaseResponse(input, this.getBasePrompt());
      return {
        response: baseResponse.content,
        insights: {
          confidence,
          enhancedContext: false
        },
        suggestions: await this.generateContextualSuggestions(input, context)
      };

    } catch (error) {
      console.error('Error processing displayed context:', error);
      return {
        response: "I encountered an error while processing your request. Let me try a different approach.",
        insights: {
          error: error instanceof Error ? error.message : 'Unknown error'
        },
        suggestions: []
      };
    } finally {
      context.isProcessingDisplayedContext = false;
    }
  }

  /**
   * Find relevant previously displayed content based on the current input
   */
  private async findRelevantDisplayedContent(
    input: string,
    context: ChatAgentContext
  ): Promise<DisplayedContent[]> {
    if (!context.displayedInfo || context.displayedInfo.size === 0) {
      return [];
    }

    const now = Date.now();
    const relevantContent: DisplayedContent[] = [];

    // Get all displayed content as an array
    const displayedContent = Array.from(context.displayedInfo.values());

    // Filter out old content based on maxDisplayedInfoAge
    const recentContent = displayedContent.filter(content => 
      (now - content.timestamp) <= this.DEFAULT_VALIDATION_RULES.maxDisplayedInfoAge
    );

    // Calculate relevance scores for recent content
    const contentWithScores = await Promise.all(
      recentContent.map(async content => {
        const score = await this.calculateContentRelevance(input, content);
        return { content, score };
      })
    );

    // Sort by relevance score and take the most relevant items
    const sortedContent = contentWithScores
      .filter(item => item.score >= this.DEFAULT_VALIDATION_RULES.minConfidenceThreshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5); // Limit to top 5 most relevant items

    return sortedContent.map(item => item.content);
  }

  /**
   * Calculate the overall confidence for a set of relevant content
   */
  private calculateDisplayedContentConfidence(relevantContent: DisplayedContent[]): number {
    if (relevantContent.length === 0) return 0;

    // Calculate weighted average confidence
    const totalWeight = relevantContent.reduce((sum, content, index) => {
      // More recent items get higher weight
      const positionWeight = 1 / (index + 1);
      return sum + positionWeight;
    }, 0);

    const weightedConfidence = relevantContent.reduce((sum, content, index) => {
      const positionWeight = 1 / (index + 1);
      const itemConfidence = content.metadata?.confidence || 0.5;
      return sum + (itemConfidence * positionWeight);
    }, 0);

    return weightedConfidence / totalWeight;
  }

  /**
   * Prepare a response based on relevant displayed content
   */
  private async prepareResponseFromDisplayedContent(
    input: string,
    relevantContent: DisplayedContent[],
    context: ChatAgentContext
  ): Promise<string | undefined> {
    // Only prepare a response if we have high-confidence content
    const highConfidenceContent = relevantContent.filter(
      content => (content.metadata?.confidence || 0) >= this.DEFAULT_VALIDATION_RULES.minConfidenceThreshold
    );

    if (highConfidenceContent.length === 0) {
      return undefined;
    }

    // Update display stats
    if (context.displayStats) {
      context.displayStats.totalDisplayed++;
      highConfidenceContent.forEach(content => {
        if (content.type) {
          context.displayStats!.byType[content.type] = 
            (context.displayStats!.byType[content.type] || 0) + 1;
        }
        if (content.source) {
          context.displayStats!.bySource[content.source] = 
            (context.displayStats!.bySource[content.source] || 0) + 1;
        }
      });
      context.displayStats.lastDisplayTimestamp = Date.now();
      
      // Update average confidence
      const confidences = highConfidenceContent
        .map(content => content.metadata?.confidence || 0)
        .filter(conf => conf > 0);
      if (confidences.length > 0) {
        context.displayStats.averageConfidence = 
          confidences.reduce((a, b) => a + b, 0) / confidences.length;
      }
    }

    // Build enhanced prompt with all relevant content
    const enhancedPrompt = this.buildEnhancedPrompt(input, highConfidenceContent);
    
    // Generate response using the enhanced prompt
    return this.generateAIResponse(enhancedPrompt);
  }

  // Add helper for building enhanced prompts
  private buildEnhancedPrompt(input: string, displayedRefs: DisplayedContent[]): string {
    const referencesContext = displayedRefs
      .map(ref => `Previously shown ${ref.type}: ${JSON.stringify(ref.content)}`)
      .join('\n');
      
    return `
Context from previously displayed information:
${referencesContext}

User input:
${input}
`;
  }

  /**
   * Calculate the relevance score between input query and displayed content
   */
  private async calculateContentRelevance(
    input: string,
    content: DisplayedContent
  ): Promise<number> {
    let score = 0;

    // Text similarity score (0-0.4)
    const textSimilarity = await this.calculateTextSimilarity(
      input,
      typeof content.content === 'string' ? content.content : JSON.stringify(content.content)
    );
    score += textSimilarity * 0.4;

    // Metadata confidence (0-0.3)
    if (content.metadata?.confidence) {
      score += content.metadata.confidence * 0.3;
    }

    // Recency score (0-0.2)
    const ageInHours = (Date.now() - content.timestamp) / (60 * 60 * 1000);
    score += Math.max(0, 0.2 * (1 - ageInHours / 24)); // Decay over 24 hours

    // Context match score (0-0.1)
    if (content.context) {
      const memoryNode = this.createMemoryNode(
        'displayed_content' as MemoryNodeType,
        content.content,
        'user_interaction' as SituationType,
        content.metadata?.confidence || 0.5
      );
      memoryNode.context = {
        situation: 'user_interaction',
        emotional_state: {
          primary: 'neutral',
          intensity: 0.5,
          context: 'content_display',
          confidence: 0.8
        },
        external_factors: []
      };
      
      const contextMatch = this.calculateContextMatchScore([memoryNode], input);
      score += contextMatch * 0.1;
    }

    return Math.min(1, score); // Normalize to 0-1 range
  }

  /**
   * Calculate text similarity between two strings
   */
  private async calculateTextSimilarity(text1: string, text2: string): Promise<number> {
    // Normalize texts
    const normalize = (text: string) => text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => !this.isStopWord(word));

    const words1 = new Set(normalize(text1));
    const words2 = new Set(normalize(text2));

    // Calculate Jaccard similarity
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Process a query with enhanced context awareness and better handling of follow-ups
   */
  private async processQuery(
    input: string,
    context: ChatAgentContext
  ): Promise<{
    response: string;
    insights: any;
    suggestions: any[];
  }> {
    try {
      // Step 1: Analyze query intent and type
      const queryAnalysis = await this.analyzeQuery(input, context);
      
      // Step 2: Check if this is a contextual query
      if (queryAnalysis.isContextual) {
        // Handle contextual query (e.g., "What about X?", "Tell me more")
        return this.processContextualQuery(input, queryAnalysis, context);
      }

      // Step 3: Check for entity references
      const entityReferences = await this.extractEntityReferences(input, context);
      if (entityReferences.length > 0) {
        // Update context with referenced entities
        const newEntities: MentionedEntities = {
          names: new Set([...(context.mentionedEntities?.names || []), ...entityReferences.filter(e => e.type === 'name').map(e => e.value)]),
          dates: new Set([...(context.mentionedEntities?.dates || []), ...entityReferences.filter(e => e.type === 'date').map(e => e.value)]),
          topics: new Set([...(context.mentionedEntities?.topics || []), ...entityReferences.filter(e => e.type === 'topic').map(e => e.value)])
        };
        context.mentionedEntities = newEntities;
      }

      // Step 4: Maintain query context
      const queryContext: QueryContext = {
        timestamp: Date.now(),
        intent: queryAnalysis.intent,
        entities: {
          names: Array.from(context.mentionedEntities?.names || []),
          dates: Array.from(context.mentionedEntities?.dates || []),
          topics: Array.from(context.mentionedEntities?.topics || [])
        },
        topic: queryAnalysis.topic
      };

      // Add to query context history
      context.queryContext = [
        queryContext,
        ...(context.queryContext || []).slice(0, this.DEFAULT_CONTEXT_WINDOW_SIZE - 1)
      ];

      // Step 5: Process with context-aware response generation
      const response = await this.generateContextAwareResponse(input, queryAnalysis, context);

      return {
        response: response.content,
        insights: {
          queryAnalysis,
          entityReferences,
          contextualInfo: response.contextualInfo
        },
        suggestions: response.suggestions
      };
    } catch (error) {
      console.error('Error processing query:', error);
      throw error;
    }
  }

  /**
   * Analyze query to determine intent and type
   */
  private async analyzeQuery(
    input: string,
    context: ChatAgentContext
  ): Promise<{
    intent: UserIntent;
    isContextual: boolean;
    topic: string;
    confidence: number;
  }> {
    // Basic intent detection
    const intent: UserIntent = {
      type: 'direct_inquiry',
      confidence: 0.8
    };

    // Check for contextual indicators
    const contextualIndicators = [
      'what about',
      'tell me more',
      'and',
      'also',
      'related to',
      'regarding',
      'speaking of',
      'on that note',
      'in that case',
      'then'
    ];

    const normalizedInput = input.toLowerCase();
    const isContextual = contextualIndicators.some(indicator => 
      normalizedInput.includes(indicator)
    );

    // Determine topic
    let topic = context.currentTopic || '';
    if (!topic) {
      // Extract topic from input or use a default
      const extractedTopics = await this.extractTopics(input);
      topic = extractedTopics[0] || 'general';
    }

    return {
      intent,
      isContextual,
      topic,
      confidence: isContextual ? 0.9 : 0.7
    };
  }

  /**
   * Process a contextual query that references previous context
   */
  private async processContextualQuery(
    input: string,
    analysis: {
      intent: UserIntent;
      isContextual: boolean;
      topic: string;
      confidence: number;
    },
    context: ChatAgentContext
  ): Promise<{
    response: string;
    insights: any;
    suggestions: any[];
  }> {
    // Get recent context
    const recentContext = context.queryContext?.[0];
    if (!recentContext) {
      // Fall back to normal processing if no context available
      return this.processMessage(input, context);
    }

    // Enhance the query with context
    const enhancedInput = this.buildContextualQuery(input, recentContext);
    
    // Process with enhanced input
    return this.processMessage(enhancedInput, {
      ...context,
      currentTopic: analysis.topic,
      topicDepth: (context.topicDepth || 0) + 1
    });
  }

  /**
   * Extract entity references from input
   */
  private async extractEntityReferences(
    input: string,
    context: ChatAgentContext
  ): Promise<Array<{
    type: 'name' | 'date' | 'topic';
    value: string;
    confidence: number;
  }>> {
    const references: Array<{
      type: 'name' | 'date' | 'topic';
      value: string;
      confidence: number;
    }> = [];

    // Extract from current context
    if (context.mentionedEntities) {
      const { names, dates, topics } = context.mentionedEntities;
      
      // Check for references to previously mentioned entities
      names.forEach(name => {
        if (input.toLowerCase().includes(name.toLowerCase())) {
          references.push({ type: 'name', value: name, confidence: 0.9 });
        }
      });

      dates.forEach(date => {
        if (input.toLowerCase().includes(date.toLowerCase())) {
          references.push({ type: 'date', value: date, confidence: 0.9 });
        }
      });

      topics.forEach(topic => {
        if (input.toLowerCase().includes(topic.toLowerCase())) {
          references.push({ type: 'topic', value: topic, confidence: 0.9 });
        }
      });
    }

    return references;
  }

  /**
   * Build a contextual query by combining input with context
   */
  private buildContextualQuery(
    input: string,
    recentContext: {
      intent: UserIntent;
      entities: {
        names: string[];
        dates: string[];
        topics: string[];
      };
      topic: string;
    }
  ): string {
    const contextParts: string[] = [];

    // Add topic context
    if (recentContext.topic) {
      contextParts.push(`Regarding ${recentContext.topic}`);
    }

    // Add entity context
    const { names, dates, topics } = recentContext.entities;
    if (names.length > 0) {
      contextParts.push(`About ${names.join(', ')}`);
    }
    if (dates.length > 0) {
      contextParts.push(`On ${dates.join(', ')}`);
    }
    if (topics.length > 0) {
      contextParts.push(`Related to ${topics.join(', ')}`);
    }

    // Combine context with input
    return contextParts.length > 0
      ? `${contextParts.join('. ')}. ${input}`
      : input;
  }

  /**
   * Extract topics from input text
   */
  private async extractTopics(input: string): Promise<string[]> {
    // For now, use a simple approach of extracting capitalized phrases
    const matches = input.match(/[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
    return matches;
  }

  /**
   * Generate a context-aware response
   */
  private async generateContextAwareResponse(
    input: string,
    analysis: {
      intent: UserIntent;
      isContextual: boolean;
      topic: string;
      confidence: number;
    },
    context: ChatAgentContext
  ): Promise<{
    content: string;
    contextualInfo: any;
    suggestions: any[];
  }> {
    // Use existing memory-aware response generation
    const response = await this.generateMemoryAwareResponse(
      input,
      await this.buildMemoryAwarePrompt(input, {}, context),
      { queryAnalysis: analysis },
      context
    );

    return {
      content: response.content,
      contextualInfo: response.insights || {}, // Preserve insights if available
      suggestions: response.suggestions
    };
  }

  private async checkConversationContext(
    input: string,
    context: ChatAgentContext
  ): Promise<{
    hasAnswer: boolean;
    answer?: string;
    entities?: {
      names: string[];
      dates: string[];
      topics: string[];
    };
  }> {
    try {
      // Step 1: Check displayed information first
      if (context.displayedInfo && context.displayedInfo.size > 0) {
        const relevantDisplayed = await this.findRelevantDisplayedContent(input, context);
        
        if (relevantDisplayed.length > 0) {
          // Calculate confidence in using displayed info
          const confidence = this.calculateDisplayedContentConfidence(relevantDisplayed);
          
          if (confidence > 0.7) {  // High confidence threshold
            const answer = await this.prepareResponseFromDisplayedContent(
              input,
              relevantDisplayed,
              context
            );
            
            if (answer) {
              // Track this usage of displayed info
              for (const content of relevantDisplayed) {
                await this.trackDisplayedReference(content, context);
              }
              
              return {
                hasAnswer: true,
                answer,
                entities: this.extractEntities(input)
              };
            }
          }
        }
      }

      // Step 2: Check RAG results history
      if (context.ragResults?.history.length) {
        const relevantResults = await this.findRelevantRAGResults(
          input,
          context.ragResults.history.flatMap(h => h.results)
        );

        if (relevantResults.length > 0) {
          const answer = await this.prepareResponseFromRAGResults(
            input,
            relevantResults,
            context
          );

          if (answer) {
            // Update RAG stats
            if (context.ragResults.stats) {
              context.ragResults.stats.successRate = this.calculateSuccessRate(
                context.ragResults.stats.totalResults,
                context.ragResults.stats.totalQueries,
                context.ragResults.stats.averageConfidence || 0,
                relevantResults
              );
            }

            return {
              hasAnswer: true,
              answer,
              entities: this.extractEntities(input)
            };
          }
        }
      }

      // Step 3: Check conversation memory
      const memoryContext = await this.getMemoryContext(input);
      if (memoryContext.relevantMemories.length > 0 && memoryContext.memoryScore > 0.7) {
        const memories = await this.findSemanticallySimilarMemories(input);
        if (memories.length > 0) {
          const enhancedScore = this.calculateEnhancedMemoryScore(memories, input);
          if (enhancedScore > 0.8) {  // High confidence threshold
            const combinedMemories = this.combineAndDeduplicateMemories(memories);
            const answer = await this.prepareResponseFromMemories(combinedMemories, input);
            
            if (answer) {
              return {
                hasAnswer: true,
                answer,
                entities: this.extractEntities(input)
              };
            }
          }
        }
      }

      // No definitive answer found
      return {
        hasAnswer: false,
        entities: this.extractEntities(input)
      };

    } catch (error) {
      console.error('Error in checkConversationContext:', error);
      return {
        hasAnswer: false,
        entities: this.extractEntities(input)
      };
    }
  }

  /**
   * Find relevant RAG results for a given query
   */
  private async findRelevantRAGResults(
    query: string,
    results: BaseSearchResult[]
  ): Promise<BaseSearchResult[]> {
    try {
      const relevantResults: BaseSearchResult[] = [];
      
      for (const result of results) {
        const relevance = await this.calculateContentRelevance(
          query,
          {
            id: result.id,
            content: result.content,
            timestamp: result.timestamp || Date.now(),
            type: 'rag_result',
            source: 'rag',
            displayStatus: {
              shown: true,
              shownAt: Date.now()
            }
          }
        );

        if (relevance > 0.7) {  // High relevance threshold
          relevantResults.push(result);
        }
      }

      return relevantResults;
    } catch (error) {
      console.error('Error finding relevant RAG results:', error);
      return [];
    }
  }

  /**
   * Prepare a response using relevant RAG results
   */
  private async prepareResponseFromRAGResults(
    query: string,
    results: BaseSearchResult[],
    context: ChatAgentContext
  ): Promise<string | undefined> {
    try {
      // Sort by relevance if available
      const sortedResults = results.sort((a, b) => 
        (b.confidence || 0) - (a.confidence || 0)
      );

      // Build enhanced prompt with context
      const prompt = this.buildEnhancedPrompt(
        query,
        sortedResults.map(r => ({
          id: r.id,
          content: r.content,
          timestamp: r.timestamp || Date.now(),
          type: 'rag_result',
          source: 'rag',
          displayStatus: {
            shown: true,
            shownAt: Date.now()
          }
        }))
      );

      // Generate response using the enhanced prompt
      const response = await this.generateAIResponse(prompt);
      
      if (response) {
        // Update RAG stats
        if (context.ragResults?.stats) {
          context.ragResults.stats.totalQueries++;
          context.ragResults.stats.lastQueryTimestamp = Date.now();
          
          const avgConfidence = this.calculateAverageConfidence(results);
          if (avgConfidence) {
            context.ragResults.stats.averageConfidence = this.calculateUpdatedAverage(
              context.ragResults.stats.averageConfidence || 0,
              avgConfidence,
              context.ragResults.stats.totalQueries
            );
          }
        }

        return response;
      }

      return undefined;
    } catch (error) {
      console.error('Error preparing response from RAG results:', error);
      return undefined;
    }
  }

  /**
   * Prepare a response from memory nodes
   */
  private async prepareResponseFromMemories(
    memories: MemoryNode[],
    query: string
  ): Promise<string | undefined> {
    try {
      // Sort memories by confidence and recency
      const sortedMemories = memories.sort((a, b) => {
        const scoreA = (a.confidence * 0.7) + (this.calculateRecencyScore(a.timestamp) * 0.3);
        const scoreB = (b.confidence * 0.7) + (this.calculateRecencyScore(b.timestamp) * 0.3);
        return scoreB - scoreA;
      });

      // Combine relevant information from memories as DisplayedContent
      const combinedContent = sortedMemories.map(memory => {
        const content = typeof memory.content === 'string' 
          ? memory.content 
          : JSON.stringify(memory.content);
      
        return {
          id: nanoid(),
          content,
          timestamp: Date.now(),
          type: 'memory_recall' as DisplayedContentType,
          source: 'memory' as const,
          metadata: {
            confidence: memory.confidence,
            relevance: this.calculateRecencyScore(memory.timestamp)
          },
          displayStatus: {
            shown: true,
            shownAt: Date.now()
          }
        };
      });

      // Build response using the combined content
      const prompt = this.buildEnhancedPrompt(query, combinedContent);
      const response = await this.generateAIResponse(prompt);

      return response;
    } catch (error) {
      console.error('Error in prepareResponseFromMemories:', error);
      return undefined;
    }
  }
} 
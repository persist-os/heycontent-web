import { AdvancedMemorySystem } from './advanced-memory-system';
import { Message } from '@/app/types/conversation';
import { ChatAgentContext, EngagementLevel, ConversationFlow, UserIntent } from '../agent/chat-agent-context';
import { 
  MemoryNode, 
  PatternRecognitionResult, 
  TemporalAnalysis,
  TemporalPattern,
  SearchResult,
  PlatformMemoryType,
  SituationType,
  RelationshipType,
  BaseMemoryType,
  EmotionalStateValue,
  EvolutionTrigger,
  AdvancedMemorySystemInterface,
  SearchNodeOptions,
  MemoryContext
} from './types';
import { RAGSystem } from '../rag';
import { OpenAI } from 'openai';
import { PrismaClient, Prisma, ConversationState } from '@prisma/client';
import { MEMORY_TYPES, PATTERN_TYPES } from './config';
import { nanoid } from 'nanoid';
import prisma from '../prisma'; // Import the singleton Prisma instance

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

// Define interfaces for memory content types
interface SystemResponse {
  type: 'system_response';
  input: string;
  response: any;
  suggestions: any[];
}

interface InteractionResult {
  type: 'successful_interaction';
  input: string;
  response: any;
  pattern: any;
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
            contextStack: JsonValue;
            pendingActions: JsonValue;
            lastResponseType: string;
            emotionalState: JsonValue;
            userIntent: JsonValue;
            focusMetrics: JsonValue;
            conversationFlow: JsonValue;
            mentionedEntities?: JsonValue;
            queryContext?: JsonValue;
            conversationId: string;
          };
          update: {
            currentTopic?: string;
            lastTopic?: string;
            topicDepth?: number;
            contextStack?: JsonValue;
            pendingActions?: JsonValue;
            lastResponseType?: string;
            emotionalState?: JsonValue;
            userIntent?: JsonValue;
            focusMetrics?: JsonValue;
            conversationFlow?: JsonValue;
            mentionedEntities?: JsonValue;
            queryContext?: JsonValue;
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
  searchResults?: SearchResult[];
  displayedInfo?: Map<string, { content: any; timestamp: number; type: string }>;
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
  displayedInfo?: Map<string, { content: any; timestamp: number; type: string }>;
}

type MemoryContent = SystemResponse | InteractionResult;

// Add type definition for memory node types
type MemoryNodeType = BaseMemoryType | PlatformMemoryType;

// Extend ChatAgentContext with new properties
declare module '../agent/chat-agent-context' {
  interface ChatAgentContext {
    searchResults?: SearchResult[];
    displayedInfo?: Map<string, { content: any; timestamp: number; type: string }>;
  }
}

export class MemoryAwareChatSystem {
  private advancedMemory: AdvancedMemorySystemInterface;
  private systemPrompt: string;
  private prisma: PrismaClient;
  private readonly DEFAULT_CONTEXT_WINDOW_SIZE = 5;
  private readonly MAX_CONTEXT_WINDOW_SIZE = 20;
  private contextWindowSize: number;

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

  // Add method to calculate interaction importance
  private calculateInteractionImportance(interaction: QueryContext): number {
    let importance = 0;

    // Base importance on intent confidence
    importance += interaction.intent.confidence;

    // Add importance for named entities
    importance += (
      interaction.entities.names.length * 0.2 +
      interaction.entities.dates.length * 0.1 +
      interaction.entities.topics.length * 0.15
    );

    // Add recency factor (more recent = more important)
    const recencyInHours = (Date.now() - interaction.timestamp) / (1000 * 60 * 60);
    importance += Math.max(0, 1 - (recencyInHours / 24)); // Decay over 24 hours

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
      displayedInfo: context.displayedInfo || new Map()
    };

    // Get existing context and add new interaction
    let queryContext = [...(context.queryContext || []), newInteraction];

    // Track displayed information from RAG results
    const searchResults = context.searchResults || [];
    if (searchResults.length > 0) {
      const displayedInfo = context.displayedInfo || new Map();
      searchResults.forEach(result => {
        if (result && result.id) {
          displayedInfo.set(result.id, {
            content: result,
            timestamp: Date.now(),
            type: 'rag_result'
          });
        }
      });
      context.displayedInfo = displayedInfo;
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
        ...(this.isTopicTransition(context.currentTopic, context.lastTopic) ? [context.currentTopic] : [])
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
      displayedInfo: context.displayedInfo
    };
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
    return Boolean(current && last && current !== last);
  }

  private calculateEngagementLevel(input: string, response: any): string {
    const inputLength = input.length;
    const hasQuestion = /\?/.test(input);
    const hasFollowUp = /\b(more|details|explain|elaborate)\b/i.test(input);
    
    if (inputLength > 100 && (hasQuestion || hasFollowUp)) return 'high';
    if (inputLength > 50 || hasQuestion) return 'medium';
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
          trigger: 'user_input'
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

    return {
      response: await this.generateBaseResponse(input.content, this.systemPrompt),
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
    if (!state || !state.conversationId) {
      throw new Error('Missing conversation ID in state');
    }

    const currentTopic = state.currentTopic || 'general';
    const lastTopic = state.lastTopic || currentTopic;

    return {
      conversationId: state.conversationId,
      currentTopic,
      lastTopic,
      topicDepth: state.topicDepth || 0,
      contextStack: state.contextStack || [],
      pendingActions: state.pendingActions || [],
      lastResponseType: state.lastResponseType || 'answer',
      emotionalState: state.emotionalState || {
        primary: 'neutral',
        intensity: 0.5,
        confidence: 0.8
      },
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
        ? this.deserializeQueryContext(state.queryContext as SerializedQueryContext[])
        : []
    };
  }

  // Update processMessage to use persisted state
  async processMessage(
    input: string,
    context: ChatAgentContext
  ): Promise<{
    response: string;
    insights: any;
    suggestions: any[];
  }> {
    try {
      // Get or generate conversation ID
      let conversationId = context.conversationId;
    if (!conversationId) {
        console.warn('No conversation ID provided, generating new one');
        conversationId = `chat_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        context.conversationId = conversationId;
      }

      // Step 1: Load and restore previous state with error handling
      let persistedState: ConversationStateData | null = null;
      try {
        persistedState = await this.getConversationState(conversationId);
      } catch (error) {
        console.error('Error loading conversation state:', error);
        // Continue with empty state rather than failing
      }

    if (persistedState) {
        try {
          // Type-safe state restoration
          if (this.isValidConversationState(persistedState)) {
            context.currentTopic = persistedState.currentTopic;
            context.lastTopic = persistedState.lastTopic;
            context.topicDepth = persistedState.topicDepth;
            context.contextStack = persistedState.contextStack;
            context.pendingActions = persistedState.pendingActions;
            context.lastResponseType = persistedState.lastResponseType;
            
            // Use type-checked merge functions
            if (this.isEmotionalState(persistedState.emotionalState)) {
      context.emotionalState = this.mergeEmotionalState(context.emotionalState, persistedState.emotionalState);
            }
            if (this.isUserIntent(persistedState.userIntent)) {
      context.userIntent = this.mergeUserIntent(context.userIntent, persistedState.userIntent);
            }
            if (this.isFocusMetrics(persistedState.focusMetrics)) {
      context.focusMetrics = this.mergeFocusMetrics(context.focusMetrics, persistedState.focusMetrics);
            }
            
      context.conversationFlow = this.mergeConversationFlow(context.conversationFlow, persistedState.conversationFlow);
            context.mentionedEntities = persistedState.mentionedEntities;
            
            // Safely type and assign queryContext
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
            } else {
              context.queryContext = undefined;
            }

      // Restore memory system state
      await this.restoreMemorySystemState(persistedState);
          } else {
            console.warn('Invalid persisted state format, using default context');
          }
        } catch (error) {
          console.error('Error restoring conversation state:', error);
          // Continue with current context rather than failing
        }
    }

    // Step 2: Process new information with context
      const memoryNode = this.createMemoryNode(
        MEMORY_TYPES.WORKING,
        input,
        context.currentTopic ? `custom_${context.currentTopic}` : 'user_interaction',
        0.8
      );
    await this.advancedMemory.addNode(memoryNode);

    // Step 3: Get insights with restored context
    const insights = await this.getInsights({
      currentInput: input,
      context: {
        ...context,
        memoryNode
      }
    });

    // Step 4: Build enhanced prompt with memory context
    const enhancedPrompt = await this.buildMemoryAwarePrompt(
      input,
      insights,
      context
    );

    // Step 5: Generate response with enhanced understanding
    const response = await this.generateMemoryAwareResponse(
      input,
      enhancedPrompt,
      insights,
      context
    );

    // Step 6: Update memory with interaction results
    await this.updateMemoryWithResponse(response, input, context);

      // Step 7: Update and persist conversation state with error handling
      try {
    const updatedState = this.prepareStateUpdate(context, input, response);
    await this.persistConversationState(conversationId, updatedState);
      } catch (error) {
        console.error('Error persisting conversation state:', error);
        // Continue rather than failing the whole interaction
      }

    return {
      response: response.content,
      insights,
      suggestions: response.suggestions
    };
    } catch (error) {
      console.error('Error in processMessage:', error);
      throw error;
    }
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
   * Tracks temporal relationships between conversations
   */
  private async updateTemporalRelationships(
    currentConversationId: string,
    state: ConversationStateData
  ): Promise<void> {
    try {
      const recentConversations = await this.prisma.conversationState.findMany({
        where: {
          conversationId: { not: currentConversationId }
        },
        orderBy: { updatedAt: 'desc' },
        take: 10
      });

      const temporalNode = this.createMemoryNode(
        MEMORY_TYPES.WORKING,
        {
          type: 'temporal_context',
          conversationId: currentConversationId,
          relatedConversations: recentConversations.map(conv => ({
            id: conv.conversationId,
            topic: conv.currentTopic || '',
            timestamp: conv.updatedAt
          }))
        },
        'user_interaction' as SituationType,
        0.9
      );

      await this.advancedMemory.addNode(temporalNode);
    } catch (error) {
      console.error('Error updating temporal relationships:', error);
    }
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
   * Restores basic state without cross-conversation context
   */
  private async restoreBasicState(state: ConversationStateData): Promise<void> {
    if (!state.currentTopic) {
      state.currentTopic = 'general';
    }

    try {
      // Restore context stack
    if (state.contextStack) {
        const nodeMap = new Map<string, MemoryNode>();
        const validationErrors: string[] = [];
        
        // First pass: Create and validate nodes
      for (const nodeData of state.contextStack) {
          try {
            const node = await this.createMemoryNodeFromState(nodeData);
            if (node) {
              if (!this.isValidMemoryNodeData(node)) {
                validationErrors.push(`Invalid node structure for ID: ${node.id}`);
                continue;
              }
              nodeMap.set(node.id, node);
        await this.advancedMemory.addNode(node);
            }
          } catch (error) {
            validationErrors.push(`Failed to create node: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }
        
        if (validationErrors.length > 0) {
          console.warn('State restoration validation errors:', validationErrors);
        }
      }

      // Restore mentioned entities
    if (state.mentionedEntities) {
        const entityNodes: MemoryNode[] = [];
        const entityErrors: string[] = [];

      for (const [type, entities] of Object.entries(state.mentionedEntities)) {
          for (const entity of Array.from(entities)) {
            try {
              const existingNode = await this.findExistingEntityNode(type, entity);
              if (existingNode) {
                entityNodes.push(existingNode);
                await this.updateEntityNodeContext(existingNode, state.currentTopic);
              } else {
                const node = await this.createMemoryNodeFromEntity(type, entity, state.currentTopic);
                if (node) {
                  entityNodes.push(node);
          await this.advancedMemory.addNode(node);
        }
              }
            } catch (error) {
              entityErrors.push(`Failed to process entity ${type}:${entity}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
          }
        }

        if (entityErrors.length > 0) {
          console.warn('Entity restoration errors:', entityErrors);
        }
      }

      // Restore query context
      if (state.queryContext) {
        let previousNode: MemoryNode | null = null;
        const queryErrors: string[] = [];
        
        for (const query of state.queryContext) {
          try {
            const node = await this.createMemoryNodeFromQuery(query);
            if (node) {
              await this.advancedMemory.addNode(node);
              
              if (previousNode) {
                await this.addRelationship(
                  node,
                  previousNode,
                  'follows',
                  0.8,
                  []
                );
                await this.inheritContext(node, previousNode);
              }
              
              await this.addTopicRelationships(node, query.topic);
              
              previousNode = node;
            }
          } catch (error) {
            queryErrors.push(`Failed to process query: ${error instanceof Error ? error.message : 'Unknown error'}`);
          }
        }

        if (queryErrors.length > 0) {
          console.warn('Query context restoration errors:', queryErrors);
        }
      }
    } catch (error) {
      console.error('Error in restoreBasicState:', error);
      throw error;
    }
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

  private validateEmotionalState(state: any): {
    primary: string;
    intensity: number;
    confidence: number;
  } {
    if (!state || typeof state !== 'object') {
    return {
          primary: 'neutral',
          intensity: 0.5,
          confidence: 1.0
      };
    }

    return {
      primary: typeof state.primary === 'string' ? state.primary : 'neutral',
      intensity: typeof state.intensity === 'number' ? state.intensity : 0.5,
      confidence: typeof state.confidence === 'number' ? state.confidence : 1.0
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

  private async generateMemoryAwareResponse(
    input: string,
    prompt: string,
    insights: any,
    context: ChatAgentContext
  ): Promise<{
    content: string;
    suggestions: any[];
  }> {
    // Generate base response
    const response = await this.generateBaseResponse(input, prompt);

    // Enhance response with memory awareness
    const enhancedResponse = await this.enhanceResponseWithMemory(
      response,
      insights,
      context
    );

    // Generate contextual suggestions
    const suggestions = await this.generateContextualSuggestions(
      input,
      context
    );

    return {
      content: enhancedResponse,
      suggestions
    };
  }

  private async generateBaseResponse(input: string, prompt: string): Promise<string> {
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

      return response;
    } catch (error) {
      console.error('Error generating base response:', error);
      return 'I apologize, but I encountered an error while processing your request. Could you please rephrase or try again?';
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
      currentNode.context = {
        ...currentNode.context,
        external_factors: [...previousNode.context.external_factors],
        emotional_state: {
          ...previousNode.context.emotional_state,
          confidence: Math.max(0.5, previousNode.context.emotional_state.confidence - 0.1)
        }
      };
      await this.advancedMemory.updateNode(currentNode);
    } catch (error) {
      console.error('Error inheriting context:', error);
    }
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
      relevance: this.calculateRelevanceScore(memories, query),
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

  private calculateRelevanceScore(memories: MemoryNode[], query: string): number {
    const queryWords = new Set(query.toLowerCase().split(/\s+/));
    
    return memories.reduce((score, memory) => {
      const content = typeof memory.content === 'string' 
        ? memory.content 
        : JSON.stringify(memory.content);
      
      const contentWords = new Set(content.toLowerCase().split(/\s+/));
      const commonWords = Array.from(queryWords)
        .filter(word => contentWords.has(word) && !this.isStopWord(word));
      
      return score + (commonWords.length / queryWords.size);
    }, 0) / memories.length;
  }

  private calculateRecencyScore(memories: MemoryNode[]): number {
    const now = Date.now();
    const DAY_MS = 24 * 60 * 60 * 1000;
    
    return memories.reduce((score, memory) => {
      const age = now - memory.timestamp;
      return score + Math.max(0, 1 - age / (7 * DAY_MS)); // Decay over 7 days
    }, 0) / memories.length;
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
} 
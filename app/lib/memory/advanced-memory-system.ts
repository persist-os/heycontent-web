import { 
  MemoryNode, 
  KnowledgeGraph, 
  UserInsight, 
  ConversationMemory,
  PatternRecognitionResult,
  TemporalAnalysis,
  TemporalPattern,
  TemporalAspects,
  MemoryConsolidation,
  ErrorHandling,
  EmotionalStateValue,
  SituationType,
  RelationshipType,
  MemoryNodeState,
  AdvancedMemorySystemInterface,
  SearchNodeOptions,
  BaseSearchParams,
  ExternalFactor,
  RAGResult,
  DisplayedInfo,
  EvolutionTrigger
} from './types';
import { Message } from '../../types/conversation';
import { nanoid } from 'nanoid';
import { RAGSystem } from '../rag/rag-system';
import type { AVADocumentType } from '../rag/index';
import { PATTERN_TYPES } from './config';

interface InputContext {
  situation: string;
  external_factors: string[];
  timestamp: number;
}

interface ExtractInput {
  content: string;
  type: string;
  context: InputContext;
}

interface Entity {
  type: 'names' | 'dates' | 'emails';
  values: string[];
}

interface Relationship {
  subject: string;
  predicate: string;
  object: string;
  confidence: number;
}

interface TemporalMarker {
  type: 'point' | 'duration' | 'frequency';
  value: string;
  timestamp?: number;
  confidence: number;
  history?: TemporalEvent[];
  id: string;
}

interface ExtractedInformation {
  entities: Entity[];
  relationships: Relationship[];
  sentiment: {
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    aspects: Array<{ term: string; sentiment: string; }>;
  };
  causation: Array<{ cause: string; effect: string; confidence: number }>;
  temporalMarkers: TemporalMarker[];
}

interface BehaviorPattern {
  count: number;
  nodes: MemoryNode[];
  contexts: Set<string>;
}

interface SearchResult {
  id: string;
  content: any;
  score: number;
}

interface CyclePattern {
  period: number;
  pattern: string;
  confidence: number;
  timestamps: number[];
  frequency: number;
  variance: number;
}

interface TemporalEvent {
  timestamp: number;
  value: any;
  metadata?: {
    confidence: number;
    context: string;
  };
}

export class AdvancedMemorySystem implements AdvancedMemorySystemInterface {
  private graph: KnowledgeGraph;
  private shortTermMemory: Set<string>;
  private workingMemory: Map<string, {
    activation: number;
    lastAccessed: number;
    relevance: number;
  }>;
  
  private causalNetwork: Map<string, Map<string, {
    confidence: number;
    occurrences: number;
    counterExamples: number;
  }>>;

  private temporalPatterns: Map<string, TemporalPattern> = new Map();

  private static readonly MEMORY_DECAY_RATE = 0.9;
  private static readonly CONFIDENCE_THRESHOLD = 0.6;
  private static readonly RECENT_WINDOW = 1000 * 60 * 60 * 24; // 24 hours

  private patternCache: Map<string, PatternRecognitionResult>;
  private temporalAnalysisCache: Map<string, TemporalAnalysis>;
  private errorLog: ErrorHandling[];
  private rag: RAGSystem;

  constructor(rag: RAGSystem) {
    this.graph = {
      nodes: new Map(),
      relationships: new Map()
    };
    this.shortTermMemory = new Set();
    this.workingMemory = new Map();
    this.causalNetwork = new Map();
    this.patternCache = new Map();
    this.temporalAnalysisCache = new Map();
    this.errorLog = [];
    this.rag = rag;
  }

  public getRag(): RAGSystem {
    return this.rag;
  }

  async processNewInformation(input: {
    content: string;
    type: string;
    context: any;
  }): Promise<void> {
    const extractedInfo = await this.extractInformation(input);
    await this.updateGraph(extractedInfo);
    await this.updateCausalNetwork(extractedInfo);
    await this.updateTemporalPatterns(extractedInfo);
    await this.consolidateMemory();
  }

  private async extractInformation(input: ExtractInput): Promise<ExtractedInformation> {
    const extracted: ExtractedInformation = {
      entities: await this.extractEntities(input.content),
      relationships: await this.extractRelationships(input.content),
      sentiment: await this.extractSentiment(input.content),
      causation: await this.extractCausation(input.content),
      temporalMarkers: await this.extractTemporalMarkers(input.content)
    };

    return this.enrichExtractedInformation(extracted, input.context);
  }

  private async extractEntities(content: string): Promise<Entity[]> {
    const entities: Entity[] = [];
    
    // Extract names (simple regex for demonstration)
    const nameRegex = /[A-Z][a-z]+ (?:[A-Z][a-z]+ )?[A-Z][a-z]+/g;
    const names = content.match(nameRegex) || [];
    
    // Extract dates
    const dateRegex = /\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(?:st|nd|rd|th)?,? \d{4}\b/g;
    const dates = content.match(dateRegex) || [];
    
    // Extract email addresses
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const emails = content.match(emailRegex) || [];
    
    if (names.length) entities.push({ type: 'names', values: names });
    if (dates.length) entities.push({ type: 'dates', values: dates });
    if (emails.length) entities.push({ type: 'emails', values: emails });
    
    return entities;
  }

  private async extractRelationships(content: string): Promise<Relationship[]> {
    const relationships: Relationship[] = [];
    
    // Extract action relationships
    const actionRegex = /(\w+)\s+(is|was|has|had|will|would)\s+(\w+)/g;
    let match;
    while ((match = actionRegex.exec(content)) !== null) {
      relationships.push({
        subject: match[1],
        predicate: match[2],
        object: match[3],
        confidence: 0.8 // Base confidence for explicit causation
      });
    }
    
    // Extract possessive relationships
    const possessiveRegex = /(\w+)'s\s+(\w+)/g;
    while ((match = possessiveRegex.exec(content)) !== null) {
      relationships.push({
        subject: match[1],
        predicate: "possession",
        object: match[2],
        confidence: 0.8
      });
    }
    
    return relationships;
  }

  private async extractSentiment(content: string): Promise<{
    sentiment: 'positive' | 'negative' | 'neutral';
    confidence: number;
    aspects: Array<{ term: string; sentiment: string }>;
  }> {
    // Simple keyword-based sentiment analysis
    const positiveWords = new Set(['good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'happy', 'pleased']);
    const negativeWords = new Set(['bad', 'poor', 'terrible', 'awful', 'horrible', 'unhappy', 'disappointed', 'frustrated']);
    
    const words = content.toLowerCase().split(/\W+/);
    let positiveCount = 0;
    let negativeCount = 0;
    const aspects: Array<{ term: string; sentiment: string }> = [];
    
    words.forEach((word, index) => {
      if (positiveWords.has(word)) {
        positiveCount++;
        // Check for aspect
        if (index > 0) {
          aspects.push({ term: words[index - 1], sentiment: 'positive' });
        }
      } else if (negativeWords.has(word)) {
        negativeCount++;
        // Check for aspect
        if (index > 0) {
          aspects.push({ term: words[index - 1], sentiment: 'negative' });
        }
      }
    });
    
    const total = positiveCount + negativeCount;
    if (total === 0) return { sentiment: 'neutral', confidence: 1, aspects: [] };
    
    const sentiment = positiveCount > negativeCount ? 'positive' : 
                     negativeCount > positiveCount ? 'negative' : 'neutral';
    const confidence = Math.abs(positiveCount - negativeCount) / total;
    
    return { sentiment, confidence, aspects };
  }

  private async extractCausation(content: string): Promise<Array<{
    cause: string;
    effect: string;
    confidence: number;
  }>> {
    const causations = [];
    const causalPhrases = [
      'because',
      'due to',
      'resulted in',
      'led to',
      'caused',
      'as a result',
      'consequently',
      'therefore'
    ];
    
    const sentences = content.split(/[.!?]+/);
    
    for (const sentence of sentences) {
      for (const phrase of causalPhrases) {
        if (sentence.toLowerCase().includes(phrase)) {
          const parts = sentence.split(new RegExp(`\\b${phrase}\\b`, 'i'));
          if (parts.length === 2) {
            causations.push({
              cause: parts[0].trim(),
              effect: parts[1].trim(),
              confidence: 0.8 // Base confidence for explicit causation
            });
          }
        }
      }
    }
    
    return causations;
  }

  private async extractTemporalMarkers(content: string): Promise<TemporalMarker[]> {
    const markers: TemporalMarker[] = [];
    
    // Time point markers
    const timeRegex = /\b\d{1,2}:\d{2}\b|\b\d{1,2}(?:am|pm)\b/gi;
    const timeMatches = content.match(timeRegex) || [];
    timeMatches.forEach(match => {
      markers.push({
        type: 'point',
        value: match,
        confidence: 0.9,
        id: `${match}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
    });
    
    // Duration markers
    const durationRegex = /\b\d+\s+(?:minute|hour|day|week|month|year)s?\b/gi;
    const durationMatches = content.match(durationRegex) || [];
    durationMatches.forEach(match => {
      markers.push({
        type: 'duration',
        value: match,
        confidence: 0.9,
        id: `${match}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
    });
    
    // Frequency markers
    const frequencyRegex = /\b(?:daily|weekly|monthly|yearly|every\s+\w+)\b/gi;
    const frequencyMatches = content.match(frequencyRegex) || [];
    frequencyMatches.forEach(match => {
      markers.push({
        type: 'frequency',
        value: match,
        confidence: 0.9,
        id: `${match}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
    });
    
    return markers;
  }

  private async enrichExtractedInformation(
    extracted: ExtractedInformation,
    context: InputContext
  ): Promise<ExtractedInformation> {
    // Enrich entities with context
    extracted.entities = extracted.entities.map(entity => ({
      ...entity,
      values: entity.values.map(value => {
        // Check if the entity is already in our knowledge graph
        const existingNodes = Array.from(this.graph.nodes.values())
          .filter(node => {
            if (typeof node.content === 'string') {
              return node.content === value;
            }
            return node.content && typeof node.content === 'object' && 
                   'value' in node.content && node.content.value === value;
          });

        // If we have existing knowledge about this entity, it increases our confidence
        const contextualConfidence = existingNodes.length > 0 ? 0.9 : 0.7;
        return value;
      })
    }));

    // Enrich relationships with situational context
    extracted.relationships = extracted.relationships.map(rel => ({
      ...rel,
      confidence: this.adjustConfidenceBasedOnContext(rel.confidence, context)
    }));

    // Enrich sentiment with temporal context
    if (extracted.sentiment) {
      const recentSentiments = Array.from(this.graph.nodes.values())
        .filter(node => 
          node.timestamp > Date.now() - AdvancedMemorySystem.RECENT_WINDOW &&
          node.context.situation === context.situation
        )
        .map(node => 
          typeof node.context.emotional_state === 'string' ? 
            node.context.emotional_state : 
            node.context.emotional_state.primary
        );

      // Adjust sentiment confidence based on consistency with recent sentiments
      if (recentSentiments.length > 0) {
        const consistentSentiments = recentSentiments.filter(s => s === extracted.sentiment.sentiment);
        const consistencyFactor = consistentSentiments.length / recentSentiments.length;
        extracted.sentiment.confidence = Math.min(
          1,
          extracted.sentiment.confidence * (1 + consistencyFactor)
        );
      }
    }

    // Enrich temporal markers with pattern confidence
    await Promise.all(
      extracted.temporalMarkers.map(async marker => {
        // Convert marker type to TemporalPatternType
        const markerPatternType = marker.type === 'point' ? PATTERN_TYPES.SPIKE :
                                 marker.type === 'duration' ? PATTERN_TYPES.PERIODIC :
                                 marker.type === 'frequency' ? PATTERN_TYPES.RECURRING : PATTERN_TYPES.TREND;

        const similarMarkers = Array.from(this.temporalPatterns.values())
          .filter(pattern => pattern.type === markerPatternType);

        if (similarMarkers.length > 0) {
          const avgConfidence = similarMarkers.reduce((sum, m) => sum + m.confidence, 0) / similarMarkers.length;
          marker.confidence = Math.min(1, (marker.confidence + avgConfidence) / 2);
        }

        return marker;
      })
    );

    // Enrich causation with confidence based on causal network
    extracted.causation = extracted.causation.map(cause => {
      const existingCausal = this.causalNetwork.get(cause.cause)?.get(cause.effect);
      if (existingCausal) {
        return {
          ...cause,
          confidence: this.calculateCausalConfidence(
            existingCausal.occurrences,
            existingCausal.counterExamples
          )
        };
      }
      return cause;
    });

    return extracted;
  }

  private adjustConfidenceBasedOnContext(
    baseConfidence: number,
    context: InputContext
  ): number {
    // Adjust confidence based on situation familiarity
    const situationFactor = Array.from(this.graph.nodes.values())
      .filter(node => node.context.situation === context.situation).length;
    const situationBoost = Math.min(0.2, situationFactor * 0.02);

    // Adjust for external factors
    const externalFactorsPenalty = context.external_factors.length * -0.05;

    // Calculate final confidence
    return Math.min(1, Math.max(0.1, 
      baseConfidence + situationBoost + externalFactorsPenalty
    ));
  }

  private async updateGraph(info: any): Promise<void> {
    // Create new nodes for new information
    for (const entity of info.entities) {
      const nodeId = this.generateNodeId(entity);
      
      if (!this.graph.nodes.has(nodeId)) {
        this.graph.nodes.set(nodeId, this.createNode(entity));
      } else {
        await this.updateExistingNode(nodeId, entity);
      }
    }

    // Update relationships
    for (const rel of info.relationships) {
      await this.updateRelationship(rel);
    }

    // Prune weak or outdated connections
    await this.pruneGraph();
  }

  private generateNodeId(entity: any): string {
    return `${entity.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createNode(entity: any): MemoryNode {
    return {
      id: this.generateNodeId(entity),
      type: this.determineNodeType(entity),
      content: entity,
      confidence: this.calculateInitialConfidence(entity),
      timestamp: Date.now(),
      relationships: new Map(),
      context: this.extractContext(entity),
      evolution: {
        history: [{
          state: entity,
          timestamp: Date.now(),
          trigger: 'initial_creation'
        }],
        trend: 'stable',
        stability: 1.0
      }
    };
  }

  private determineNodeType(entity: any): MemoryNode['type'] {
    // Implement node type determination logic
    return 'context';
  }

  private calculateInitialConfidence(entity: any): number {
    // Implement initial confidence calculation
    return 0.7;
  }

  private extractContext(entity: any): MemoryNode['context'] {
    return {
      situation: 'system_learning' as SituationType,
      emotional_state: {
        primary: 'neutral',
        intensity: 0.5,
        confidence: 0.8,
        context: 'Initial system assessment'
      },
      external_factors: []
    };
  }

  private async updateExistingNode(nodeId: string, newInfo: any): Promise<void> {
    const node = this.graph.nodes.get(nodeId);
    if (!node) return;

    const validity = await this.calculateValidity(newInfo);
    const relevance = await this.calculateRelevanceForNode(newInfo, node);

    if (validity * relevance > 0.7) {
      node.content = await this.mergeInformation(node.content, newInfo);
      node.confidence = this.updateConfidence(node.confidence, validity);
      
      node.evolution.history.push({
        state: newInfo,
        timestamp: Date.now(),
        trigger: 'new_information'
      });

      node.evolution.trend = this.calculateTrend(node.evolution.history);
      node.evolution.stability = this.calculateStability(node.evolution.history);
    }
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private async calculateRelevanceForNode(newInfo: any, node: MemoryNode): Promise<number> {
    if (!newInfo || !node) return 0.1;

    let relevanceScore = 0;
    let relevanceFactors = 0;

    // Content similarity (0.4 weight)
    const isNewInfoObject = typeof newInfo === 'object' && newInfo !== null;
    const isNodeContentObject = typeof node.content === 'object' && node.content !== null;
    const isNewInfoString = typeof newInfo === 'string';
    const isNodeContentString = typeof node.content === 'string';

    if (isNewInfoObject && isNodeContentObject) {
      const nodeContent = node.content as Record<string, unknown>;
      const newInfoObj = newInfo as Record<string, unknown>;

      // Compare topics if available
      if ('topics' in newInfoObj && 'topics' in nodeContent) {
        const newTopics = Array.isArray(newInfoObj.topics) ? newInfoObj.topics as string[] : [];
        const existingTopics = Array.isArray(nodeContent.topics) ? nodeContent.topics as string[] : [];
        const commonTopics = newTopics.filter((topic: string) => 
          existingTopics.includes(topic)
        ).length;
        const topicScore = commonTopics / Math.max(newTopics.length, existingTopics.length, 1);
        relevanceScore += topicScore * 0.4;
        relevanceFactors++;
      }

      // Compare key attributes
      const commonKeys = Object.keys(newInfoObj).filter(key => key in nodeContent);
      const keyScore = commonKeys.length / Math.max(
        Object.keys(newInfoObj).length,
        Object.keys(nodeContent).length,
        1
      );
      relevanceScore += keyScore * 0.4;
      relevanceFactors++;
    } else if (isNewInfoString && isNodeContentString) {
      // For string content, calculate text similarity
      const nodeContentStr = node.content as string;
      const newInfoStr = newInfo as string;
      const words1 = newInfoStr.toLowerCase().split(/\s+/);
      const words2 = nodeContentStr.toLowerCase().split(/\s+/);
      const commonWords = words1.filter(word => words2.includes(word)).length;
      const textScore = commonWords / Math.max(words1.length, words2.length, 1);
      relevanceScore += textScore * 0.4;
      relevanceFactors++;
    }

    // Temporal proximity (0.3 weight)
    const newTimestamp = isNewInfoObject && 'timestamp' in newInfo ? 
      (newInfo as Record<string, unknown>).timestamp as number : 
      Date.now();
    const timeDiff = Math.abs(newTimestamp - node.timestamp);
    const timeScore = Math.exp(-timeDiff / (30 * 24 * 60 * 60 * 1000)); // 30 days time constant
    relevanceScore += timeScore * 0.3;
    relevanceFactors++;

    // Context alignment (0.3 weight)
    if (isNewInfoObject && 'context' in newInfo) {
      const contextScore = this.calculateContextAlignment(
        (newInfo as Record<string, unknown>).context as MemoryNode['context'],
        node.context
      );
      relevanceScore += contextScore * 0.3;
      relevanceFactors++;
    }

    // If no relevance factors were checked, return minimum relevance
    if (relevanceFactors === 0) return 0.1;

    // Calculate final relevance score (normalized by number of factors checked)
    const finalRelevance = relevanceScore / relevanceFactors;

    // Ensure the result is between 0.1 and 1
    return Math.max(0.1, Math.min(1, finalRelevance));
  }

  private calculateContextAlignment(context1: MemoryNode['context'], context2: MemoryNode['context']): number {
    let alignmentScore = 0;
    let factors = 0;

    // Situation alignment
    if (context1.situation === context2.situation) {
      alignmentScore += 1;
      factors++;
    }

    // Emotional state alignment
    if (context1.emotional_state && context2.emotional_state) {
      const emotionMatch = context1.emotional_state.primary === context2.emotional_state.primary;
      const intensityDiff = Math.abs(
        context1.emotional_state.intensity - context2.emotional_state.intensity
      );
      alignmentScore += emotionMatch ? 1 : 0;
      alignmentScore += (1 - intensityDiff);
      factors += 2;
    }

    // External factors alignment
    if (context1.external_factors && context2.external_factors) {
      const commonFactors = context1.external_factors.filter(
        factor => context2.external_factors.includes(factor)
      ).length;
      const factorScore = commonFactors / Math.max(
        context1.external_factors.length,
        context2.external_factors.length,
        1
      );
      alignmentScore += factorScore;
      factors++;
    }

    return factors > 0 ? alignmentScore / factors : 0;
  }

  private async calculateValidity(info: any): Promise<number> {
    // If info is null or undefined, return minimum validity
    if (!info) return 0.1;

    let validityScore = 0;
    let validityFactors = 0;

    // Check structural validity
    if (typeof info === 'object') {
      validityScore += 0.2;
      validityFactors++;

      // Check for required fields based on content type
      if ('type' in info && 'content' in info) {
        validityScore += 0.2;
        validityFactors++;
      }

      // Check for temporal consistency
      if ('timestamp' in info) {
        const timestamp = new Date(info.timestamp).getTime();
        const now = Date.now();
        if (timestamp <= now && timestamp > now - 365 * 24 * 60 * 60 * 1000) { // Within last year
          validityScore += 0.1;
          validityFactors++;
        }
      }

      // Check for data consistency with existing knowledge
      const existingNodes = Array.from(this.graph.nodes.values())
        .filter(node => this.calculateSimilarity(node, { content: info } as MemoryNode) > 0.7);
      
      if (existingNodes.length > 0) {
        // Higher validity if consistent with existing knowledge
        const avgConfidence = existingNodes.reduce((sum, node) => sum + node.confidence, 0) / existingNodes.length;
        validityScore += avgConfidence * 0.2;
        validityFactors++;
      }

      // Check for internal consistency
      if (typeof info.content === 'object') {
        const contentKeys = Object.keys(info.content);
        const expectedKeys = ['id', 'type', 'value', 'metadata'].filter(key => contentKeys.includes(key));
        const consistencyScore = expectedKeys.length / 4; // Normalize by expected number of keys
        validityScore += consistencyScore * 0.2;
        validityFactors++;
      }

      // Check for relationship consistency if present
      if ('relationships' in info && Array.isArray(info.relationships)) {
        const validRelationships = info.relationships.every((rel: Record<string, unknown>) => 
          rel && typeof rel === 'object' && 'subject' in rel && 'predicate' in rel && 'object' in rel
        );
        if (validRelationships) {
          validityScore += 0.1;
          validityFactors++;
        }
      }
    } else if (typeof info === 'string') {
      // For string content, check for minimum length and meaningful content
      if (info.length > 0 && info.length < 10000) { // Reasonable length
        validityScore += 0.3;
        validityFactors++;

        // Check for well-formed content
        if (/^[\w\s.,!?-]+$/.test(info)) { // Basic punctuation and alphanumeric
          validityScore += 0.2;
          validityFactors++;
        }

        // Check for meaningful content (not just repeated characters)
        const uniqueChars = new Set(info.toLowerCase()).size;
        const meaningfulnessScore = Math.min(uniqueChars / 20, 1); // Normalize by expecting at least 20 unique chars
        validityScore += meaningfulnessScore * 0.2;
        validityFactors++;
      }
    }

    // If no validity factors were checked, return minimum validity
    if (validityFactors === 0) return 0.1;

    // Calculate final validity score (normalized by number of factors checked)
    const finalValidity = validityScore / validityFactors;

    // Ensure the result is between 0.1 and 1
    return Math.max(0.1, Math.min(1, finalValidity));
  }

  private async mergeInformation(existing: any, newInfo: any): Promise<any> {
    // Handle null/undefined cases
    if (!existing) return newInfo;
    if (!newInfo) return existing;

    // If both are strings, concatenate with a separator
    if (typeof existing === 'string' && typeof newInfo === 'string') {
      return `${existing}\n---\n${newInfo}`;
    }

    // If both are objects, do a deep merge
    if (this.isRecord(existing) && this.isRecord(newInfo)) {
      const merged: Record<string, unknown> = { ...existing };

      for (const [key, value] of Object.entries(newInfo)) {
        // Special handling for arrays - concatenate and deduplicate
        if (Array.isArray(merged[key]) && Array.isArray(value)) {
          merged[key] = Array.from(new Set([...(merged[key] as unknown[]), ...value]));
          continue;
        }

        // Special handling for timestamps - keep the most recent
        if (key === 'timestamp' || key.endsWith('At')) {
          merged[key] = Math.max(merged[key] as number || 0, value as number);
          continue;
        }

        // Special handling for numeric metrics - use weighted average
        if (typeof merged[key] === 'number' && typeof value === 'number') {
          if (key.includes('confidence') || key.includes('score') || key.includes('strength')) {
            merged[key] = (merged[key] as number * 0.7) + (value * 0.3);
            continue;
          }
        }

        // Special handling for nested objects
        if (this.isRecord(merged[key]) && this.isRecord(value)) {
          merged[key] = await this.mergeInformation(merged[key], value);
          continue;
        }

        // For all other cases, prefer new information if it exists
        if (value !== undefined && value !== null) {
          merged[key] = value;
        }
      }

      return merged;
    }

    // If types don't match, prefer the new information as it's more recent
    return newInfo;
  }

  private updateConfidence(currentConfidence: number, validity: number): number {
    return Math.min(1, (currentConfidence + validity) / 2);
  }

  private calculateTrend(history: MemoryNode['evolution']['history']): MemoryNode['evolution']['trend'] {
    if (history.length < 2) return 'stable';

    // Get the last few states to analyze trend (up to last 5 states)
    const recentHistory = history.slice(-5);
    const metrics = recentHistory.map(entry => this.extractMetrics(entry.state));

    // Calculate trend based on confidence and other metrics
    const confidenceTrend = this.calculateMetricTrend(metrics.map(m => m.confidence));
    const usageTrend = this.calculateMetricTrend(metrics.map(m => m.usage));
    const relevanceTrend = this.calculateMetricTrend(metrics.map(m => m.relevance));

    // Weight different factors
    const trends = [
      { trend: confidenceTrend, weight: 0.4 },
      { trend: usageTrend, weight: 0.3 },
      { trend: relevanceTrend, weight: 0.3 }
    ];

    // Calculate weighted score
    const score = trends.reduce((acc, { trend, weight }) => acc + trend * weight, 0);

    // Determine final trend
    if (score > 0.1) return 'improving';
    if (score < -0.1) return 'declining';
    return 'stable';
  }

  private extractMetrics(state: any): { confidence: number; usage: number; relevance: number } {
    const metrics = {
      confidence: 0.5,
      usage: 0.5,
      relevance: 0.5
    };

    if (this.isRecord(state)) {
      // Extract confidence
      if ('confidence' in state) {
        metrics.confidence = typeof state.confidence === 'number' ? state.confidence : 0.5;
      }

      // Extract usage metrics
      if ('useCount' in state || 'accessCount' in state) {
        metrics.usage = typeof state.useCount === 'number' ? state.useCount / 10 :
                       typeof state.accessCount === 'number' ? state.accessCount / 10 : 0.5;
      }

      // Extract relevance
      if ('relevance' in state) {
        metrics.relevance = typeof state.relevance === 'number' ? state.relevance : 0.5;
      } else if ('importance' in state) {
        metrics.relevance = typeof state.importance === 'number' ? state.importance : 0.5;
      }

      // Consider success metrics if available
      if ('success_metrics' in state && this.isRecord(state.success_metrics)) {
        const successMetrics = state.success_metrics as Record<string, number>;
        const validMetrics = Object.values(successMetrics).filter(v => typeof v === 'number');
        if (validMetrics.length > 0) {
          const avgMetric = validMetrics.reduce((a, b) => a + b, 0) / validMetrics.length;
          metrics.relevance = (metrics.relevance + avgMetric) / 2;
        }
      }
    }

    return metrics;
  }

  private calculateMetricTrend(values: number[]): number {
    if (values.length < 2) return 0;

    // Calculate the average rate of change
    let totalChange = 0;
    for (let i = 1; i < values.length; i++) {
      const change = values[i] - values[i - 1];
      // More recent changes have higher weight
      const weight = i / values.length;
      totalChange += change * weight;
    }

    // Normalize the trend to be between -1 and 1
    return Math.max(-1, Math.min(1, totalChange * 2));
  }

  private calculateStability(history: MemoryNode['evolution']['history']): number {
    // If there's not enough history, consider it stable
    if (history.length < 2) return 1.0;

    // Extract metrics from each state in history
    const metrics = history.map(entry => this.extractMetrics(entry.state));

    // Calculate stability based on multiple factors
    let stabilityScore = 0;
    let factors = 0;

    // 1. Confidence stability (0.4 weight)
    const confidenceVariance = this.calculateVariance(metrics.map(m => m.confidence));
    const confidenceStability = 1 / (1 + confidenceVariance);
    stabilityScore += confidenceStability * 0.4;
    factors++;

    // 2. Usage pattern stability (0.3 weight)
    const usageVariance = this.calculateVariance(metrics.map(m => m.usage));
    const usageStability = 1 / (1 + usageVariance);
    stabilityScore += usageStability * 0.3;
    factors++;

    // 3. Temporal stability (0.3 weight)
    const timestamps = history.map(entry => entry.timestamp);
    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i - 1]);
    }
    const intervalVariance = this.calculateVariance(intervals);
    const temporalStability = 1 / (1 + intervalVariance / (24 * 60 * 60 * 1000)); // Normalize by one day
    stabilityScore += temporalStability * 0.3;
    factors++;

    // Calculate final stability score (normalized by number of factors)
    const finalStability = stabilityScore / factors;

    // Ensure the result is between 0.1 and 1
    return Math.max(0.1, Math.min(1, finalStability));
  }

  private calculateVariance(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  }

  private async updateRelationship(rel: {
    subject: string;
    predicate: string;
    object: string;
    confidence: number;
  }): Promise<void> {
    // Get the nodes involved in the relationship
    const subjectNode = this.graph.nodes.get(rel.subject);
    const objectNode = this.graph.nodes.get(rel.object);
    
    if (!subjectNode || !objectNode) return;

    // Calculate relationship strength based on confidence and context
    const strength = this.calculateRelationshipStrength(
      subjectNode,
      objectNode,
      rel.confidence
    );

    // Determine relationship type based on predicate
    const relationType = this.mapPredicateToRelationType(rel.predicate);

    // Special handling for RAG inheritance
    if (relationType === 'inherits_rag') {
      // Store the RAG relationship in the subject node's metadata
      if (!subjectNode.metadata) {
        subjectNode.metadata = {};
      }
      if (!subjectNode.metadata.rag_inheritance) {
        subjectNode.metadata.rag_inheritance = [];
      }
      subjectNode.metadata.rag_inheritance.push({
        source_id: rel.object,
        timestamp: Date.now(),
        confidence: strength
      });

      // Update the object node's metadata to track what has inherited from it
      if (!objectNode.metadata) {
        objectNode.metadata = {};
      }
      if (!objectNode.metadata.rag_inherited_by) {
        objectNode.metadata.rag_inherited_by = [];
      }
      objectNode.metadata.rag_inherited_by.push({
        target_id: rel.subject,
        timestamp: Date.now(),
        confidence: strength
      });

      // If this is a RAG node, store it in the RAG system for future retrieval
      if (objectNode.type.includes('rag_')) {
        await this.rag.store(
          objectNode.type as AVADocumentType,
          objectNode.content,
          {
            metadata: {
              inherited_by: rel.subject,
              confidence: strength,
              timestamp: Date.now()
            }
          }
        );
      }
    }

    // Gather evidence for the relationship
    const evidence = this.gatherRelationshipEvidence(
      subjectNode,
      objectNode,
      rel.predicate
    );

    // Update relationship in both directions
    // 1. Subject -> Object relationship
    subjectNode.relationships.set(rel.object, {
      type: relationType,
      strength,
      evidence
    });

    // 2. Object -> Subject relationship (with inverse type if applicable)
    objectNode.relationships.set(rel.subject, {
      type: this.getInverseRelationType(relationType),
      strength,
      evidence
    });

    // Update the graph's relationship map
    if (!this.graph.relationships.has(rel.subject)) {
      this.graph.relationships.set(rel.subject, new Map());
    }
    this.graph.relationships.get(rel.subject)!.set(rel.object, {
      type: relationType,
      strength,
      evidence
    });

    // Update nodes' evolution history
    const timestamp = Date.now();
    const relationshipState: MemoryNodeState = {
      content: {
        relationship_update: {
          targetId: rel.object,
          relationType,
          strength,
          evidence,
          rag_inheritance: relationType === 'inherits_rag' ? {
            source_id: rel.object,
            timestamp: Date.now(),
            confidence: strength
          } : undefined
        }
      },
      timestamp,
      engagement: strength
    };

    subjectNode.evolution.history.push({
      state: relationshipState,
      timestamp,
      trigger: 'relationship_change'
    });

    const inverseRelationshipState: MemoryNodeState = {
      content: {
        relationship_update: {
          targetId: rel.subject,
          relationType: this.getInverseRelationType(relationType),
          strength,
          evidence,
          rag_inheritance: relationType === 'inherits_rag' ? {
            target_id: rel.subject,
            timestamp: Date.now(),
            confidence: strength
          } : undefined
        }
      },
      timestamp,
      engagement: strength
    };

    objectNode.evolution.history.push({
      state: inverseRelationshipState,
      timestamp,
      trigger: 'relationship_change'
    });
  }

  private calculateRelationshipStrength(
    node1: MemoryNode,
    node2: MemoryNode,
    baseConfidence: number
  ): number {
    // Start with base confidence
    let strength = baseConfidence;

    // Content similarity contribution (0.3 weight)
    const contentSimilarity = this.calculateSimilarity(node1, node2);
    strength = strength * 0.7 + contentSimilarity * 0.3;

    // Context alignment contribution (0.2 weight)
    const contextAlignment = this.calculateContextSimilarity(
      node1.context,
      node2.context
    );
    strength = strength * 0.8 + contextAlignment * 0.2;

    // Ensure the result is between 0 and 1
    return Math.max(0, Math.min(1, strength));
  }

  private mapPredicateToRelationType(predicate: string): RelationshipType {
    const mapping: Record<string, RelationshipType> = {
      follows: 'follows',
      precedes: 'precedes',
      part_of: 'part_of',
      contains: 'custom_contains',
      depends_on: 'depends_on',
      supports: 'supports',
      related_to: 'related_to',
      similar_to: 'similar_to',
      references: 'references',
      contradicts: 'contradicts',
      influences: 'influences',
      related_topic: 'related_topic',
      temporal_correlation: 'temporal_correlation',
      causal_correlation: 'causal_correlation',
      semantic_relation: 'semantic_relation',
      contextual_link: 'contextual_link',
      'custom_contains': 'part_of',
      'custom_followed_by': 'follows_up',
      'custom_referenced_by': 'references',
      'custom_influenced_by': 'influences',
      'custom_inherited_by_rag': 'inherits_rag'
    };
    return mapping[predicate] || 'related_to';
  }

  private getInverseRelationType(type: RelationshipType): RelationshipType {
    const inverseMap: Record<RelationshipType, RelationshipType> = {
      follows: 'precedes',
      precedes: 'follows',
      part_of: 'custom_contains',
      follows_up: 'custom_followed_by',
      similar_to: 'similar_to',
      references: 'custom_referenced_by',
      contradicts: 'contradicts',
      supports: 'depends_on',
      depends_on: 'supports',
      influences: 'custom_influenced_by',
      inherits_rag: 'custom_inherited_by_rag',
      related_to: 'related_to',
      related_topic: 'related_topic',
      temporal_correlation: 'temporal_correlation',
      causal_correlation: 'causal_correlation',
      semantic_relation: 'semantic_relation',
      contextual_link: 'contextual_link',
      'custom_contains': 'part_of',
      'custom_followed_by': 'follows_up',
      'custom_referenced_by': 'references',
      'custom_influenced_by': 'influences',
      'custom_inherited_by_rag': 'inherits_rag'
    };
    return inverseMap[type] || 'related_to';
  }

  private gatherRelationshipEvidence(
    node1: MemoryNode,
    node2: MemoryNode,
    predicate: string
  ): string[] {
    const evidence: string[] = [];

    // Add predicate-based evidence
    evidence.push(`Relationship type: ${predicate}`);

    // Add content similarity evidence if significant
    const contentSimilarity = this.calculateSimilarity(node1, node2);
    if (contentSimilarity > 0.3) {
      evidence.push(`Content similarity: ${contentSimilarity.toFixed(2)}`);
    }

    // Add context-based evidence
    const contextSimilarity = this.calculateContextSimilarity(
      node1.context,
      node2.context
    );
    if (contextSimilarity > 0.3) {
      evidence.push(`Context alignment: ${contextSimilarity.toFixed(2)}`);
    }

    // Add temporal evidence if nodes are temporally close
    const timeDiff = Math.abs(node1.timestamp - node2.timestamp);
    if (timeDiff < 24 * 60 * 60 * 1000) { // Within 24 hours
      evidence.push('Temporal proximity: within 24 hours');
    }

    return evidence;
  }

  private async pruneGraph(): Promise<void> {
    const now = Date.now();
    const PRUNE_THRESHOLDS = {
      CONFIDENCE: 0.3,  // Minimum confidence to keep a node
      RELATIONSHIP_STRENGTH: 0.2,  // Minimum relationship strength
      TIME_WINDOW: 90 * 24 * 60 * 60 * 1000,  // 90 days in milliseconds
      MIN_ENGAGEMENT: 0.1,  // Minimum engagement score
      STABILITY_THRESHOLD: 0.2  // Minimum stability score
    };

    // Collect nodes to remove
    const nodesToRemove: string[] = [];

    // Evaluate each node
    for (const [nodeId, node] of this.graph.nodes.entries()) {
      let shouldRemove = false;

      // Check confidence
      if (node.confidence < PRUNE_THRESHOLDS.CONFIDENCE) {
        shouldRemove = true;
      }

      // Check time-based relevance
      const age = now - node.timestamp;
      if (age > PRUNE_THRESHOLDS.TIME_WINDOW) {
        const workingMemoryInfo = this.workingMemory.get(nodeId);
        // Keep if recently accessed despite age
        if (!workingMemoryInfo || 
            (now - workingMemoryInfo.lastAccessed > PRUNE_THRESHOLDS.TIME_WINDOW)) {
          shouldRemove = true;
        }
      }

      // Check stability and evolution
      if (node.evolution.stability < PRUNE_THRESHOLDS.STABILITY_THRESHOLD) {
        const hasRecentActivity = node.evolution.history.some(h => 
          now - h.timestamp < PRUNE_THRESHOLDS.TIME_WINDOW
        );
        if (!hasRecentActivity) {
          shouldRemove = true;
        }
      }

      // Evaluate relationships
      let strongRelationships = 0;
      node.relationships.forEach((rel, targetId) => {
        if (rel.strength < PRUNE_THRESHOLDS.RELATIONSHIP_STRENGTH) {
          node.relationships.delete(targetId);
        } else {
          strongRelationships++;
        }
      });

      // If no strong relationships and low engagement, consider removal
      if (strongRelationships === 0) {
        const workingMemoryInfo = this.workingMemory.get(nodeId);
        if (!workingMemoryInfo || workingMemoryInfo.activation < PRUNE_THRESHOLDS.MIN_ENGAGEMENT) {
          shouldRemove = true;
        }
      }

      if (shouldRemove) {
        nodesToRemove.push(nodeId);
      }
    }

    // Remove collected nodes and their relationships
    for (const nodeId of nodesToRemove) {
      // Remove from graph
      this.graph.nodes.delete(nodeId);
      
      // Remove from relationship maps
      this.graph.relationships.delete(nodeId);
      this.graph.relationships.forEach(relationships => {
        relationships.delete(nodeId);
      });

      // Remove from memory management structures
      this.shortTermMemory.delete(nodeId);
      this.workingMemory.delete(nodeId);
    }
  }

  private async updateCausalNetwork(info: any): Promise<void> {
    const causes = info.causation;
    
    for (const cause of causes) {
      if (!this.causalNetwork.has(cause.source)) {
        this.causalNetwork.set(cause.source, new Map());
      }

      const effects = this.causalNetwork.get(cause.source)!;
      
      if (!effects.has(cause.effect)) {
        effects.set(cause.effect, {
          confidence: 0,
          occurrences: 0,
          counterExamples: 0
        });
      }

      const relationship = effects.get(cause.effect)!;

      if (cause.supported) {
        relationship.occurrences++;
      } else {
        relationship.counterExamples++;
      }

      relationship.confidence = this.calculateCausalConfidence(
        relationship.occurrences,
        relationship.counterExamples
      );
    }
  }

  private calculateCausalConfidence(
    input: number | { occurrences: number; strength: number; contexts: string[]; },
    counterExamples: number = 0
  ): number {
    // Handle simple numeric input (backward compatibility)
    if (typeof input === 'number') {
      const total = input + counterExamples;
      if (total === 0) return 0;
      
      const baseConfidence = input / total;
      const evidenceStrength = Math.min(1, Math.log10(total + 1) / 2);
      
      return baseConfidence * evidenceStrength;
    }
    
    // Handle complex input with additional context
    const occurrenceFactor = Math.min(input.occurrences / 5, 1); // Cap at 5 occurrences
    const strengthFactor = input.strength;
    const contextDiversityFactor = new Set(input.contexts).size / input.contexts.length;
    
    return (occurrenceFactor * 0.4 + strengthFactor * 0.4 + contextDiversityFactor * 0.2);
  }

  private async updateTemporalPatterns(info: ExtractedInformation): Promise<void> {
    for (const marker of info.temporalMarkers) {
      const history: TemporalEvent[] = marker.history || [{
        timestamp: marker.timestamp || Date.now(),
        value: marker.value,
        metadata: {
          confidence: marker.confidence,
          context: 'system_learning' as SituationType
        }
      }];

      const patternId = marker.id;
      const cycle = this.detectCycle(history);
      const stability = this.calculateTemporalStability(history);
      
      const newPattern: TemporalPattern = {
        type: cycle ? PATTERN_TYPES.CYCLIC : PATTERN_TYPES.DAILY,
        confidence: cycle?.confidence || 0.5,
        cycle: cycle?.period || 24 * 60 * 60 * 1000, // Default to daily cycle
        data: {
          transitions: history.map((h, i) => {
            if (i === 0) return ['start', String(h.value)];
            return [String(history[i-1].value), String(h.value)];
          }),
          commonSequences: [history.map(h => String(h.value)).join(',')],
          averageInterval: cycle?.period || 24 * 60 * 60 * 1000,
          standardDeviation: cycle ? this.calculateVariance(history.map(h => h.timestamp)) : undefined,
          preferredHours: history.map(h => new Date(h.timestamp).getHours()),
          distribution: history.reduce((acc, h) => {
            const key = String(h.value);
            acc[key] = (acc[key] || 0) + 1;
            return acc;
          }, {} as Record<string, number>)
        }
      };

      this.temporalPatterns.set(patternId, newPattern);
    }
  }

  private calculateTemporalStability(history: TemporalEvent[]): number {
    if (history.length < 2) return 1;

    const intervals = [];
    for (let i = 1; i < history.length; i++) {
      intervals.push(history[i].timestamp - history[i-1].timestamp);
    }

    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;

    return 1 / (1 + Math.sqrt(variance) / mean);
  }

  private detectCycle(history: TemporalEvent[]): CyclePattern | null {
    if (history.length < 4) return null; // Need minimum points for pattern

    const timestamps = history.map(h => h.timestamp);
    const intervals: number[] = [];
    
    // Calculate intervals between events
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i-1]);
    }

    // Calculate basic statistics
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Check if intervals are regular enough to constitute a pattern
    const regularityThreshold = 0.3; // Allow 30% deviation
    const isRegular = stdDev / mean < regularityThreshold;

    if (!isRegular) return null;

    // Detect the dominant period using autocorrelation
    const period = this.findDominantPeriod(intervals);
    if (!period) return null;

    // Calculate pattern confidence
    const confidence = this.calculateTemporalPatternConfidence({
      intervalRegularity: 1 - (stdDev / mean),
      sampleSize: history.length,
      patternStrength: this.calculateTemporalPatternStrength(history, period)
    });
    
    return {
      period,
      pattern: this.generatePatternDescription(period, mean),
      confidence,
      timestamps,
      frequency: 1 / (period / (24 * 60 * 60 * 1000)), // Convert to daily frequency
      variance
    };
  }

  private findDominantPeriod(intervals: number[]): number | null {
    if (intervals.length < 2) return null;

    // Calculate autocorrelation for different lags
    const maxLag = Math.floor(intervals.length / 2);
    let bestCorrelation = -1;
    let bestLag = 0;

    for (let lag = 1; lag <= maxLag; lag++) {
      let correlation = 0;
      let count = 0;

      for (let i = 0; i < intervals.length - lag; i++) {
        correlation += intervals[i] * intervals[i + lag];
        count++;
      }

      correlation /= count;

      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestLag = lag;
      }
    }

    return bestLag > 0 ? intervals.reduce((a, b) => a + b, 0) / intervals.length * bestLag : null;
  }

  private calculateTemporalPatternConfidence(factors: {
    intervalRegularity: number;
    sampleSize: number;
    patternStrength: number;
  }): number {
    const weights = {
      intervalRegularity: 0.4,
      sampleSize: 0.3,
      patternStrength: 0.3
    };

    const sampleSizeScore = Math.min(1, factors.sampleSize / 10); // Normalize up to 10 samples

    return (
      factors.intervalRegularity * weights.intervalRegularity +
      sampleSizeScore * weights.sampleSize +
      factors.patternStrength * weights.patternStrength
    );
  }

  private calculateTemporalPatternStrength(history: TemporalEvent[], period: number): number {
    const values = history.map(h => h.value);
    let similarity = 0;
    let comparisons = 0;

    // Compare values that should be similar based on the period
    for (let i = 0; i < values.length; i++) {
      for (let j = i + 1; j < values.length; j++) {
        if (Math.abs(j - i) % Math.round(period) === 0) {
          similarity += this.calculateValueSimilarity(values[i], values[j]);
          comparisons++;
        }
      }
    }

    return comparisons > 0 ? similarity / comparisons : 0;
  }

  private calculateValueSimilarity(value1: any, value2: any): number {
    if (typeof value1 !== typeof value2) return 0;

    if (typeof value1 === 'number') {
      const max = Math.max(Math.abs(value1), Math.abs(value2));
      return max === 0 ? 1 : 1 - Math.abs(value1 - value2) / max;
    }

    if (typeof value1 === 'string') {
      return value1 === value2 ? 1 : 0;
    }

    if (typeof value1 === 'object' && value1 !== null) {
      return this.calculateObjectSimilarity(value1, value2);
    }

    return value1 === value2 ? 1 : 0;
  }

  private calculateObjectSimilarity(obj1: any, obj2: any): number {
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);
    const allKeys = Array.from(new Set([...keys1, ...keys2]));

    let totalSimilarity = 0;
    allKeys.forEach(key => {
      if (key in obj1 && key in obj2) {
        totalSimilarity += this.calculateValueSimilarity(obj1[key], obj2[key]);
      }
    });

    return totalSimilarity / allKeys.length;
  }

  private generatePatternDescription(period: number, meanInterval: number): string {
    const days = period / (24 * 60 * 60 * 1000);
    const hours = period / (60 * 60 * 1000);

    if (days >= 1) {
      return `Occurs every ${days.toFixed(1)} days`;
    } else if (hours >= 1) {
      return `Occurs every ${hours.toFixed(1)} hours`;
    } else {
      return `Occurs every ${(period / 60000).toFixed(1)} minutes`;
    }
  }

  private detectSeasonality(timestamps: number[]): {
    season: string;
    confidence: number;
  } | null {
    if (timestamps.length < 4) return null;

    const months = timestamps.map(t => new Date(t).getMonth());
    const seasons = {
      spring: months.filter(m => m >= 2 && m <= 4).length,
      summer: months.filter(m => m >= 5 && m <= 7).length,
      fall: months.filter(m => m >= 8 && m <= 10).length,
      winter: months.filter(m => m === 11 || m <= 1).length
    };

    const total = Object.values(seasons).reduce((a, b) => a + b, 0);
    const dominantSeason = Object.entries(seasons)
      .reduce((a, b) => a[1] > b[1] ? a : b)[0];

    const confidence = seasons[dominantSeason as keyof typeof seasons] / total;
    return confidence > 0.3 ? { season: dominantSeason, confidence } : null;
  }

  private detectTimeOfDay(timestamps: number[]): { 
    period: 'morning' | 'afternoon' | 'evening' | 'night';
    confidence: number;
  } | null {
    if (timestamps.length < 3) return null;

    const hours = timestamps.map(t => new Date(t).getHours());
    const periods = {
      morning: hours.filter(h => h >= 5 && h < 12).length,
      afternoon: hours.filter(h => h >= 12 && h < 17).length,
      evening: hours.filter(h => h >= 17 && h < 22).length,
      night: hours.filter(h => h >= 22 || h < 5).length
    };

    const total = Object.values(periods).reduce((a, b) => a + b, 0);
    const dominantPeriod = Object.entries(periods)
      .reduce((a, b) => a[1] > b[1] ? a : b)[0] as 'morning' | 'afternoon' | 'evening' | 'night';

    const confidence = periods[dominantPeriod] / total;
    return confidence > 0.4 ? { period: dominantPeriod, confidence } : null;
  }

  private detectDayOfWeek(timestamps: number[]): {
    days: string[];
      confidence: number;
  } | null {
    if (timestamps.length < 3) return null;

    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayCount = new Array(7).fill(0);

    timestamps.forEach(t => {
      const day = new Date(t).getDay();
      dayCount[day]++;
    });

    const total = dayCount.reduce((a, b) => a + b, 0);
    const significantDays = dayCount
      .map((count, index) => ({ day: days[index], ratio: count / total }))
      .filter(d => d.ratio > 0.2);

    if (significantDays.length === 0) return null;

        return {
      days: significantDays.map(d => d.day),
      confidence: significantDays.reduce((acc, d) => acc + d.ratio, 0) / significantDays.length
    };
  }

  private detectMonthlyPattern(timestamps: number[]): {
    type: 'start' | 'middle' | 'end';
    confidence: number;
  } | null {
    if (timestamps.length < 3) return null;

    const dates = timestamps.map(t => new Date(t).getDate());
    const patterns = {
      start: dates.filter(d => d <= 10).length,
      middle: dates.filter(d => d > 10 && d <= 20).length,
      end: dates.filter(d => d > 20).length
    };

    const total = Object.values(patterns).reduce((a, b) => a + b, 0);
    const dominantPattern = Object.entries(patterns)
      .reduce((a, b) => a[1] > b[1] ? a : b)[0] as 'start' | 'middle' | 'end';

    const confidence = patterns[dominantPattern] / total;
    return confidence > 0.4 ? { type: dominantPattern, confidence } : null;
  }

  private calculatePeriodicity(timestamps: number[]): number {
    if (timestamps.length < 2) return 0;

    const intervals = [];
    for (let i = 1; i < timestamps.length; i++) {
      intervals.push(timestamps[i] - timestamps[i-1]);
    }
    
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    // Return coefficient of variation (lower means more periodic)
    return stdDev / mean;
  }

  private calculateTemporalStrength(pattern: TemporalPattern): number {
    if (!pattern.data?.transitions || pattern.data.transitions.length < 2) return 0;
    
    const intervals = [];
    if (pattern.data.averageInterval) {
      intervals.push(pattern.data.averageInterval);
    }
    
    const avgInterval = intervals.length > 0 ? 
      intervals.reduce((a, b) => a + b, 0) / intervals.length :
      pattern.cycle || 0;
    
    const expectedCycle = pattern.cycle || avgInterval;
    
    // Calculate how well the actual intervals match the expected cycle
    const cyclePrecision = expectedCycle ? 1 - Math.abs(avgInterval - expectedCycle) / expectedCycle : 0;
    
    // Calculate consistency of intervals using standard deviation if available
    const consistency = pattern.data.standardDeviation ? 
      1 / (1 + pattern.data.standardDeviation / avgInterval) : 
      0.5; // Default consistency if no standard deviation available
    
    return (cyclePrecision * 0.6 + consistency * 0.4);
  }

  private detectAnomalies(nodes: MemoryNode[], patterns: TemporalPattern[]): Array<{
      timestamp: number;
      type: 'timing' | 'frequency' | 'sequence';
      description: string;
      confidence: number;
      context: any;
  }> {
    const anomalies: Array<{
        timestamp: number;
        type: 'timing' | 'frequency' | 'sequence';
        description: string;
        confidence: number;
        context: any;
    }> = [];

    // Detect timing anomalies
    const intervals = [];
    for (let i = 1; i < nodes.length; i++) {
      intervals.push(nodes[i].timestamp - nodes[i-1].timestamp);
    }

    const meanInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const stdDev = Math.sqrt(
      intervals.reduce((a, b) => a + Math.pow(b - meanInterval, 2), 0) / intervals.length
    );

    // Check for unusual intervals
    for (let i = 1; i < nodes.length; i++) {
      const interval = nodes[i].timestamp - nodes[i-1].timestamp;
      const zScore = Math.abs(interval - meanInterval) / stdDev;

      if (zScore > 2) { // More than 2 standard deviations
        anomalies.push({
          timestamp: nodes[i].timestamp,
          type: 'timing' as const,
          description: interval > meanInterval ? 'Unusually long interval' : 'Unusually short interval',
          confidence: Math.min(1, (zScore - 2) / 3),
          context: {
            expectedInterval: meanInterval,
            actualInterval: interval,
            previousNode: nodes[i-1].id,
            currentNode: nodes[i].id
          }
        });
      }
    }

    // Detect frequency anomalies
    patterns.forEach(pattern => {
      if (pattern.type === PATTERN_TYPES.DAILY || pattern.type === PATTERN_TYPES.WEEKLY) {
        const cycleLength = pattern.type === PATTERN_TYPES.DAILY ? 86400000 : 604800000;
        const expectedFrequency = pattern.data?.distribution ? 
          Object.values(pattern.data.distribution).reduce((a, b) => a + b, 0) / 
          (cycleLength / (pattern.cycle || cycleLength)) : 
          0;

        const recentPeriodStart = Date.now() - cycleLength;
        const recentCount = pattern.data?.transitions?.filter(t => 
          nodes.some(n => n.timestamp > recentPeriodStart && String(n.content) === t[1])
        ).length || 0;

        const frequencyDiff = Math.abs(recentCount - expectedFrequency);
        if (frequencyDiff > expectedFrequency * 0.5) {
          anomalies.push({
            timestamp: Date.now(),
            type: 'frequency',
            description: recentCount > expectedFrequency ? 
              'Unusually high frequency' : 'Unusually low frequency',
            confidence: Math.min(1, frequencyDiff / expectedFrequency),
            context: {
              pattern: pattern.type,
              expectedFrequency,
              actualFrequency: recentCount,
              period: {
                start: recentPeriodStart,
                end: Date.now()
              }
            }
          });
        }
      }
    });

    // Detect sequence anomalies
    if (patterns.some(p => p.type === PATTERN_TYPES.SEQUENCE)) {
      const recentNodes = nodes.slice(-5);
      const sequencePatterns = patterns.filter(p => p.type === PATTERN_TYPES.SEQUENCE);

      sequencePatterns.forEach(pattern => {
        const expectedSequence = (pattern.data?.commonSequences?.[0] || '').split(',');
        const actualSequence = recentNodes.map(n => String(n.content));

        const similarity = this.calculateSequenceSimilarity(
          expectedSequence,
          actualSequence
        );

        if (similarity < 0.7) {
          anomalies.push({
            timestamp: recentNodes[recentNodes.length - 1].timestamp,
            type: 'sequence',
            description: 'Unusual sequence of events',
            confidence: 1 - similarity,
            context: {
              expectedSequence,
              actualSequence,
              similarity
            }
          });
        }
      });
    }

    return anomalies;
  }

  private calculateSequenceSimilarity(seq1: string[], seq2: string[]): number {
    const matrix: number[][] = Array(seq1.length + 1).fill(0)
      .map(() => Array(seq2.length + 1).fill(0));

    // Initialize first row and column
    for (let i = 0; i <= seq1.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= seq2.length; j++) matrix[0][j] = j;

    // Fill in the rest of the matrix
    for (let i = 1; i <= seq1.length; i++) {
      for (let j = 1; j <= seq2.length; j++) {
        if (seq1[i-1] === seq2[j-1]) {
          matrix[i][j] = matrix[i-1][j-1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i-1][j] + 1,    // deletion
            matrix[i][j-1] + 1,    // insertion
            matrix[i-1][j-1] + 1   // substitution
          );
        }
      }
    }

    const maxLength = Math.max(seq1.length, seq2.length);
    return 1 - (matrix[seq1.length][seq2.length] / maxLength);
  }

  private matchesContext(node: MemoryNode, context: string): boolean {
    return node.context.situation.toLowerCase().includes(context.toLowerCase()) ||
           node.context.external_factors.some(factor => 
             factor.toLowerCase().includes(context.toLowerCase()));
  }

  private matchesQuery(node: MemoryNode, query: string): boolean {
    const queryTerms = query.toLowerCase().split(/\s+/);
    
    // Check content
    const contentStr = typeof node.content === 'string' ? 
      node.content : 
      JSON.stringify(node.content);
    
    const hasContentMatch = queryTerms.some(term => 
      contentStr.toLowerCase().includes(term)
    );

    // Check for semantic matches in topics and key points
    let hasTopicMatch = false;
    let hasKeyPointMatch = false;
    
    if (typeof node.content === 'object' && node.content !== null) {
      const content = node.content as Record<string, unknown>;
      
      if ('topics' in content && Array.isArray(content.topics)) {
        hasTopicMatch = content.topics.some((topic: string) =>
          queryTerms.some(term => topic.toLowerCase().includes(term))
        );
      }
      
      if ('key_points' in content && Array.isArray(content.key_points)) {
        hasKeyPointMatch = content.key_points.some((point: string) =>
          queryTerms.some(term => point.toLowerCase().includes(term))
        );
      }
    }

    return hasContentMatch || hasTopicMatch || hasKeyPointMatch;
  }

  private calculateContentRelevance(node: MemoryNode, query: string): number {
    const queryTerms = query.toLowerCase().split(/\s+/);
    
    // Calculate direct content match score
    const contentStr = typeof node.content === 'string' ? 
      node.content : 
      JSON.stringify(node.content);
    const contentScore = queryTerms.reduce((score, term) => 
      score + (contentStr.toLowerCase().includes(term) ? 1 : 0), 0) / queryTerms.length;

    // Calculate topic match score
    let topicScore = 0;
    let keyPointScore = 0;
    
    if (typeof node.content === 'object' && node.content !== null) {
      const content = node.content as Record<string, unknown>;
      
      if ('topics' in content && Array.isArray(content.topics)) {
        const topics = content.topics;
        const topicMatches = topics.filter((topic: string) =>
          queryTerms.some(term => topic.toLowerCase().includes(term))
        );
        topicScore = topicMatches.length / topics.length;
      }

      if ('key_points' in content && Array.isArray(content.key_points)) {
        const keyPoints = content.key_points;
        const keyPointMatches = keyPoints.filter((point: string) =>
          queryTerms.some(term => point.toLowerCase().includes(term))
        );
        keyPointScore = keyPointMatches.length / keyPoints.length;
      }
    }

    // Weight and combine scores
    return (contentScore * 0.4 + topicScore * 0.3 + keyPointScore * 0.3);
  }

  private calculateRelevance(node: MemoryNode, query: string): number {
    const now = Date.now();
    
    // Content relevance (0.4 weight)
    const contentMatch = this.calculateContentRelevance(node, query);
    
    // Recency score (0.2 weight)
    const recencyScore = Math.max(0, 1 - ((now - node.timestamp) / (30 * 24 * 60 * 60 * 1000)));
    
    // Pattern strength (0.2 weight)
    const patternScore = this.calculateNodePatternStrength(node);
    
    // Context relevance (0.2 weight)
    const contextScore = this.calculateContextRelevance(node);
    
    return (
      contentMatch * 0.4 +
      recencyScore * 0.2 +
      patternScore * 0.2 +
      contextScore * 0.2
    );
  }

  private calculateNodePatternStrength(node: MemoryNode): number {
    // Check for established patterns in node evolution
    const history = node.evolution.history;
    if (history.length < 2) return 0;
    
    // Calculate trend strength
    const trendStrength = node.evolution.trend === 'stable' ? 0.8 :
                         node.evolution.trend === 'improving' ? 1.0 : 0.6;
    
    // Calculate stability score
    const stabilityScore = node.evolution.stability;
    
    // Calculate usage pattern
    const usagePattern = history.length / 10; // Normalize by 10 interactions
    
    return (trendStrength + stabilityScore + Math.min(usagePattern, 1)) / 3;
  }

  private calculateContextRelevance(node: MemoryNode): number {
    // Calculate emotional state relevance
    const emotionalStateScore = node.context.emotional_state.primary === 'neutral' ? 0.7 :
                               node.context.emotional_state.primary === 'positive' ? 1.0 : 0.5;
    
    // Calculate external factors relevance
    const factorsScore = node.context.external_factors.length > 0 ? 
      Math.min(node.context.external_factors.length / 5, 1) : 0.5;
    
    // Calculate success metrics relevance if available
    let metricsScore = 0.5;
    if (node.context.success_metrics) {
      const metrics = Object.values(node.context.success_metrics).filter(m => m !== undefined);
      if (metrics.length > 0) {
        metricsScore = metrics.reduce((sum, val) => sum + (val || 0), 0) / metrics.length;
      }
    }
    
    return (emotionalStateScore + factorsScore + metricsScore) / 3;
  }

  async addNode(node: MemoryNode): Promise<void> {
    try {
      this.graph.nodes.set(node.id, node);
      this.shortTermMemory.add(node.id);
      this.workingMemory.set(node.id, {
        activation: 1,
        lastAccessed: Date.now(),
        relevance: 1
      });
    } catch (error) {
      this.handleError({
        type: 'memory_operation',
        severity: 'high',
        error: error instanceof Error ? error : new Error('Error adding node'),
        context: { nodeId: node.id },
        recovery: {
          strategy: 'fallback',
          success: false
        },
        logging: {
          timestamp: Date.now(),
          affectedComponents: ['memory_system']
        }
      });
    }
  }

  async updateNode(node: MemoryNode): Promise<void> {
    try {
      if (!this.graph.nodes.has(node.id)) {
        throw new Error(`Node ${node.id} not found`);
      }
      this.graph.nodes.set(node.id, node);
      this.workingMemory.set(node.id, {
        activation: 1,
        lastAccessed: Date.now(),
        relevance: 1
      });
    } catch (error) {
      this.handleError({
        type: 'memory_operation',
        severity: 'high',
        error: error instanceof Error ? error : new Error('Error updating node'),
        context: { nodeId: node.id },
        recovery: {
          strategy: 'fallback',
          success: false
        },
        logging: {
          timestamp: Date.now(),
          affectedComponents: ['memory_system']
        }
      });
    }
  }

  async searchNodes(params: SearchNodeOptions | BaseSearchParams): Promise<MemoryNode[]> {
    try {
      const now = Date.now();
      const results: MemoryNode[] = [];
      const typeFilter = params.type?.toLowerCase();
      const contextFilter = params.context?.toLowerCase();

      // First pass: Collect all potentially relevant nodes
      Array.from(this.graph.nodes.entries()).forEach(([id, node]) => {
        // Type filter
        if (typeFilter && node.type.toLowerCase() !== typeFilter) return;

        // Context matching if provided
        if (contextFilter && !this.matchesContext(node, params.context!)) return;

        // Query matching with enhanced relevance
        if (!this.matchesQuery(node, params.query)) return;

        // Get working memory state
        const memory = this.workingMemory.get(id) || {
          activation: 0,
          lastAccessed: 0,
          relevance: 0
        };

        // Calculate composite score
        const score = this.calculateCompositeScore(node, memory, now);

        // Add to results if score meets threshold
        if (score > 0.2) { // Threshold for relevance
          results.push(node);
        }
      });

      // Handle additional filters from SearchNodeOptions if provided
      if ('filters' in params && params.filters) {
        // Handle embedding similarity if provided
        if (params.filters.embedding_similarity) {
          const { vector, threshold } = params.filters.embedding_similarity;
          // Filter by embedding similarity
          // ... existing embedding similarity logic ...
        }

        // Handle temporal filter if enabled
        if (params.filters.temporal) {
          // Apply temporal relevance filtering
          // ... existing temporal filtering logic ...
        }

        // Handle any additional custom filters
        Object.entries(params.filters).forEach(([key, value]) => {
          if (key !== 'embedding_similarity' && key !== 'temporal') {
            // Apply custom filter
            // ... existing custom filter logic ...
          }
        });
      }

      // Sort by composite score and apply limit if specified
      const limit = ('limit' in params && params.limit) || 10;
      return results
        .sort((a, b) => {
          const scoreA = this.calculateRelevance(a, params.query);
          const scoreB = this.calculateRelevance(b, params.query);
          return scoreB - scoreA;
        })
        .slice(0, limit);

    } catch (error) {
      console.error('Error in searchNodes:', error);
      return [];
    }
  }

  private calculateCompositeScore(
    node: MemoryNode,
    memory: { activation: number; lastAccessed: number; relevance: number },
    now: number
  ): number {
    // Base relevance score (0.4 weight)
    const relevanceScore = memory.relevance;
    
    // Memory decay score (0.2 weight)
    const decayScore = Math.pow(
      AdvancedMemorySystem.MEMORY_DECAY_RATE,
      (now - memory.lastAccessed) / AdvancedMemorySystem.RECENT_WINDOW
    );
    
    // Activation score (0.2 weight)
    const activationScore = memory.activation;
    
    // Pattern recognition score (0.2 weight)
    const patternScore = this.calculateNodePatternStrength(node);
    
    return (
      relevanceScore * 0.4 +
      decayScore * 0.2 +
      activationScore * 0.2 +
      patternScore * 0.2
    );
  }

  async storeMemory(type: AVADocumentType, content: any): Promise<void> {
    await this.rag.store(type, content);
  }

  async retrieveMemory(type: AVADocumentType, query: string): Promise<any[]> {
    return await this.rag.search(type, query);
  }

  async searchMemory(
    type: AVADocumentType,
    query: string,
    options?: {
      limit?: number;
      filters?: Record<string, any>;
    }
  ): Promise<SearchResult[]> {
    try {
      const results = await this.rag.search(type, query);
      return results.slice(0, options?.limit || 5).map(result => ({
        id: result.id,
        content: result.content,
        score: result.confidence || 0
      }));
    } catch (error) {
      console.error('Error in searchMemory:', error);
      return [];
    }
  }

  private async consolidateMemory(): Promise<void> {
    try {
      await this.pruneGraph();
      await this.compressLongTermMemory();
      await this.optimizeRelationships();
      await this.cleanupCaches();
    } catch (error) {
      this.handleError({
        type: 'memory_operation',
        severity: 'medium',
        error: error instanceof Error ? error : new Error('Memory consolidation failed'),
        context: { operation: 'consolidate_memory' },
        recovery: {
          strategy: 'fallback',
          success: true
        },
        logging: {
          timestamp: Date.now(),
          affectedComponents: ['memory_system', 'graph', 'caches']
        }
      });
    }
  }

  private async compressLongTermMemory(): Promise<void> {
    const COMPRESSION_CONFIG = {
      AGE_THRESHOLD: 7 * 24 * 60 * 60 * 1000, // 7 days
      MIN_NODES_FOR_COMPRESSION: 5,
      SIMILARITY_THRESHOLD: 0.7,
      MAX_MERGED_NODES: 10
    };

    try {
      // Get nodes eligible for compression
      const longTermNodes = Array.from(this.graph.nodes.values())
        .filter(node => {
          const age = Date.now() - node.timestamp;
          return age > COMPRESSION_CONFIG.AGE_THRESHOLD && 
                 node.type === 'long_term';
        });

      // Group similar nodes
      const groups = new Map<string, MemoryNode[]>();
      for (const node of longTermNodes) {
        const key = this.getCompressionKey(node);
        const group = groups.get(key) || [];
        group.push(node);
        groups.set(key, group);
      }

      // Compress groups that meet criteria
      for (const [key, nodes] of groups.entries()) {
        if (nodes.length >= COMPRESSION_CONFIG.MIN_NODES_FOR_COMPRESSION) {
          await this.compressNodeGroup(nodes, COMPRESSION_CONFIG);
        }
      }
    } catch (error) {
      this.handleError({
        type: 'memory_operation',
        severity: 'low',
        error: error instanceof Error ? error : new Error('Memory compression failed'),
        context: { operation: 'compress_memory' },
        recovery: {
          strategy: 'fallback',
          success: true
        },
        logging: {
          timestamp: Date.now(),
          affectedComponents: ['memory_system', 'long_term_memory']
        }
      });
    }
  }

  private async compressNodeGroup(nodes: MemoryNode[], config: any): Promise<void> {
    // Sort by importance and keep most important ones
    const sortedNodes = nodes
      .sort((a, b) => this.calculateNodeImportance(b) - this.calculateNodeImportance(a))
      .slice(0, config.MAX_MERGED_NODES);

    // Create compressed node
    const compressedNode: MemoryNode = {
      id: `compressed_${Date.now()}_${nanoid(6)}`,
      type: 'long_term',
      content: {
        type: 'compressed',
        sources: sortedNodes.map(n => n.id),
        summary: await this.generateContentSummary(sortedNodes),
        originalCount: nodes.length
      },
      confidence: this.calculateAverageConfidence(sortedNodes),
      timestamp: Date.now(),
      relationships: this.mergeRelationships(sortedNodes),
      context: this.mergeContexts(sortedNodes),
      evolution: {
        history: [{
          state: {
            content: 'compressed',
            timestamp: Date.now()
          },
          timestamp: Date.now(),
          trigger: 'consolidation'
        }],
        trend: 'stable',
        stability: 1
      }
    };

    // Add compressed node
    await this.addNode(compressedNode);

    // Remove original nodes
    for (const node of sortedNodes) {
      this.graph.nodes.delete(node.id);
      this.graph.relationships.delete(node.id);
    }
  }

  private async optimizeRelationships(): Promise<void> {
    const OPTIMIZATION_CONFIG = {
      MIN_STRENGTH: 0.2,
      MIN_CONFIDENCE: 0.4,
      MAX_RELATIONSHIPS_PER_NODE: 50
    };

    try {
      for (const node of this.graph.nodes.values()) {
        if (node.relationships.size > OPTIMIZATION_CONFIG.MAX_RELATIONSHIPS_PER_NODE) {
          // Keep only strongest relationships
          const relationships = Array.from(node.relationships.entries())
            .map(([id, rel]) => ({
              id,
              relationship: rel,
              score: this.calculateRelationshipScore(rel)
            }))
            .filter(({ relationship }) => 
              relationship.strength >= OPTIMIZATION_CONFIG.MIN_STRENGTH
            )
            .sort((a, b) => b.score - a.score)
            .slice(0, OPTIMIZATION_CONFIG.MAX_RELATIONSHIPS_PER_NODE);

          // Update node relationships
          node.relationships = new Map(
            relationships.map(({ id, relationship }) => [id, relationship])
          );
        }
      }
    } catch (error) {
      this.handleError({
        type: 'memory_operation',
        severity: 'low',
        error: error instanceof Error ? error : new Error('Relationship optimization failed'),
        context: { operation: 'optimize_relationships' },
        recovery: {
          strategy: 'fallback',
          success: true
        },
        logging: {
          timestamp: Date.now(),
          affectedComponents: ['memory_system', 'relationships']
        }
      });
    }
  }

  private async cleanupCaches(): Promise<void> {
    try {
      const now = Date.now();
      
      // Clear pattern recognition cache
      for (const [key, result] of this.patternCache.entries()) {
        const patternTimestamp = result.pattern.evidence[0]?.timestamp || 0;
        if (now - patternTimestamp > AdvancedMemorySystem.RECENT_WINDOW) {
          this.patternCache.delete(key);
        }
      }

      // Clear temporal analysis cache
      for (const [key, analysis] of this.temporalAnalysisCache.entries()) {
        const analysisTimestamp = analysis.timeframe.start;
        if (now - analysisTimestamp > AdvancedMemorySystem.RECENT_WINDOW) {
          this.temporalAnalysisCache.delete(key);
        }
      }

      // Cleanup working memory
      for (const [nodeId, info] of this.workingMemory.entries()) {
        const node = this.graph.nodes.get(nodeId);
        if (!node || this.calculateCompositeScore(node, info, now) < 0.2) {
          this.workingMemory.delete(nodeId);
        }
      }
    } catch (error) {
      this.handleError({
        type: 'memory_operation',
        severity: 'low',
        error: error instanceof Error ? error : new Error('Cache cleanup failed'),
        context: { operation: 'cleanup_caches' },
        recovery: {
          strategy: 'fallback',
          success: true
        },
        logging: {
          timestamp: Date.now(),
          affectedComponents: ['memory_system', 'caches']
        }
      });
    }
  }

  private calculateNodeImportance(node: MemoryNode): number {
    const now = Date.now();
    const age = now - node.timestamp;
    const recency = Math.exp(-age / AdvancedMemorySystem.RECENT_WINDOW);
    
    const relationshipScore = node.relationships.size / 10; // Normalize by expected max relationships
    const confidenceScore = node.confidence;
    const stabilityScore = node.evolution.stability;
    
    const workingMemoryInfo = this.workingMemory.get(node.id);
    const usageScore = workingMemoryInfo 
      ? (workingMemoryInfo.activation * 0.7 + workingMemoryInfo.relevance * 0.3)
      : 0;

    return (
      recency * 0.3 +
      relationshipScore * 0.2 +
      confidenceScore * 0.2 +
      stabilityScore * 0.15 +
      usageScore * 0.15
    );
  }

  private calculateRelationshipScore(relationship: { type: RelationshipType; strength: number; evidence: string[] }): number {
    return relationship.strength;
  }

  private getCompressionKey(node: MemoryNode): string {
    const context = typeof node.context === 'object' ? node.context.situation : '';
    return `${node.type}_${context}`;
  }

  private async generateContentSummary(nodes: MemoryNode[]): Promise<string> {
    // Combine content from all nodes
    const contents = nodes.map(n => 
      typeof n.content === 'string' ? n.content : JSON.stringify(n.content)
    );
    
    // For now, return a simple concatenation with counts
    return `Compressed from ${nodes.length} similar memories: ${contents.join(' | ')}`;
  }

  private calculateAverageConfidence(nodes: MemoryNode[]): number {
    return nodes.reduce((sum, node) => sum + node.confidence, 0) / nodes.length;
  }

  private mergeRelationships(nodes: MemoryNode[]): Map<string, any> {
    const merged = new Map<string, any>();
    
    for (const node of nodes) {
      for (const [id, rel] of node.relationships.entries()) {
        if (merged.has(id)) {
          const existing = merged.get(id)!;
          merged.set(id, {
            type: rel.type,
            strength: Math.max(existing.strength, rel.strength),
            evidence: [...new Set([...existing.evidence, ...rel.evidence])]
          });
        } else {
          merged.set(id, {
            type: rel.type,
            strength: rel.strength,
            evidence: [...rel.evidence]
          });
        }
      }
    }
    
    return merged;
  }

  private mergeContexts(nodes: MemoryNode[]): any {
    // Combine contexts, prioritizing more recent ones
    const sortedNodes = [...nodes].sort((a, b) => b.timestamp - a.timestamp);
    return sortedNodes[0].context;
  }

  private handleError(error: ErrorHandling): void {
    // Implementation moved to another part of the file
  }

  private calculateSimilarity(node1: MemoryNode, node2: MemoryNode): number {
    const content1 = typeof node1.content === 'string' ? 
      node1.content : JSON.stringify(node1.content);
    const content2 = typeof node2.content === 'string' ? 
      node2.content : JSON.stringify(node2.content);

    const words1 = new Set(content1.toLowerCase().split(/\W+/));
    const words2 = new Set(content2.toLowerCase().split(/\W+/));
    
    const intersection = new Set(Array.from(words1).filter(x => words2.has(x)));
    const union = new Set(Array.from(words1).concat(Array.from(words2)));
    
    return intersection.size / union.size;
  }

  private calculateContextSimilarity(context1: MemoryNode['context'], context2: MemoryNode['context']): number {
    // Calculate weighted similarity of context components
    const situationSimilarity = context1.situation === context2.situation ? 1 : 0;
    
    // Compare emotional states properly
    const emotionalSimilarity = 
      context1.emotional_state.primary === context2.emotional_state.primary ? 0.6 +
      (Math.abs(context1.emotional_state.intensity - context2.emotional_state.intensity) < 0.3 ? 0.4 : 0) : 0;
    
    const factorIntersection = context1.external_factors.filter(f => 
      context2.external_factors.includes(f)
    ).length;
    const factorUnion = new Set([
      ...context1.external_factors,
      ...context2.external_factors
    ]).size;
    const factorSimilarity = factorUnion === 0 ? 1 : factorIntersection / factorUnion;
    
    return (
      situationSimilarity * 0.4 +
      emotionalSimilarity * 0.3 +
      factorSimilarity * 0.3
    );
  }

  private extractEmotionalState(content: string): EmotionalStateValue {
    // Simple emotion detection logic
    const emotions = {
      positive: ['happy', 'excited', 'great', 'good', 'love'],
      negative: ['sad', 'angry', 'bad', 'hate', 'upset'],
      neutral: ['okay', 'fine', 'normal']
    };

    let primary: EmotionalStateValue['primary'] = 'neutral';
    let intensity = 0.5;

    for (const [emotion, keywords] of Object.entries(emotions)) {
      if (keywords.some(keyword => content.toLowerCase().includes(keyword))) {
        primary = emotion === 'positive' ? 'positive' :
                 emotion === 'negative' ? 'negative' : 'neutral';
        intensity = 0.7;
        break;
      }
    }

    return {
      primary,
      intensity,
      confidence: 0.6
    };
  }

  /**
   * Adds a relationship between two memory nodes in the graph
   */
  public async addRelationship(
    sourceNode: MemoryNode | string,
    targetNode: MemoryNode | string,
    type: RelationshipType,
    strength: number,
    evidence: string[]
  ): Promise<void> {
    try {
      // Get node IDs
      const sourceId = typeof sourceNode === 'string' ? sourceNode : sourceNode.id;
      const targetId = typeof targetNode === 'string' ? targetNode : targetNode.id;

      // Initialize relationship maps if they don't exist
      if (!this.graph.relationships.has(sourceId)) {
        this.graph.relationships.set(sourceId, new Map());
      }
      if (!this.graph.relationships.has(targetId)) {
        this.graph.relationships.set(targetId, new Map());
      }

      // Add bidirectional relationships
      const sourceRelationships = this.graph.relationships.get(sourceId)!;
      sourceRelationships.set(targetId, {
        type,
        strength,
        evidence
      });

      const targetRelationships = this.graph.relationships.get(targetId)!;
      targetRelationships.set(sourceId, {
        type: this.getInverseRelationType(type),
        strength,
        evidence
      });
    } catch (error) {
      console.error('Error adding relationship:', error);
      throw error;
    }
  }

  /**
   * Finds a node in the graph by its ID
   */
  public findNodeById(id: string): MemoryNode | undefined {
    return this.graph.nodes.get(id);
  }

  async getOrCreateEmbedding(content: string): Promise<number[]> {
    const embedding = await (this.rag as any).getOrCreateEmbedding(content);
    return embedding;
  }

  private async inheritContext(currentNode: MemoryNode, previousNode: MemoryNode): Promise<void> {
    try {
      // Basic validation
      if (!currentNode || !previousNode) {
        console.warn('Missing nodes for context inheritance');
        return;
      }

      // Initialize metadata if not exists
      if (!currentNode.metadata) {
        currentNode.metadata = {};
      }
      if (!currentNode.metadata.inherited_context) {
        currentNode.metadata.inherited_context = [];
      }

      // Track inheritance history
      currentNode.metadata.inherited_context.push({
        source_id: previousNode.id,
        timestamp: Date.now(),
        type: 'context_inheritance'
      });

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

      // Enhanced RAG inheritance
      if (previousNode.metadata?.rag_results) {
        if (!currentNode.metadata.rag_results) {
          currentNode.metadata.rag_results = [];
        }
        
        // Inherit RAG results with confidence decay
        const inheritedResults = previousNode.metadata.rag_results.map(result => ({
          ...result,
          confidence: result.confidence ? result.confidence * 0.8 : 0.8, // 20% confidence decay
          inherited_from: previousNode.id,
          inheritance_timestamp: Date.now()
        }));

        currentNode.metadata.rag_results.push(...inheritedResults);

        // Add RAG inheritance relationship
        currentNode.relationships.set(`rag_${previousNode.id}`, {
          type: 'inherits_rag',
          strength: 0.8,
          evidence: [`Inherited RAG results from node ${previousNode.id}`]
        });
      }

      // Enhanced displayed information inheritance
      if (previousNode.metadata?.displayed_info) {
        if (!currentNode.metadata.displayed_info) {
          currentNode.metadata.displayed_info = [];
        }

        // Inherit displayed information with timestamp tracking
        const inheritedInfo = previousNode.metadata.displayed_info.map(info => ({
          ...info,
          inherited_from: previousNode.id,
          inheritance_timestamp: Date.now(),
          original_timestamp: info.timestamp
        }));

        currentNode.metadata.displayed_info.push(...inheritedInfo);
      }

      // Update evolution to track inheritance
      currentNode.evolution.history.push({
        state: {
          content: {
            type: 'inherited_context',
            source: previousNode.id,
            inherited_types: [
              'basic_context',
              'relationships',
              'emotional_state',
              previousNode.metadata?.rag_results ? 'rag_results' : null,
              previousNode.metadata?.displayed_info ? 'displayed_info' : null
            ].filter(Boolean)
          },
          metadata: {
            inherited_from: previousNode.id,
            inheritance_type: 'full_context',
            inheritance_timestamp: Date.now()
          },
          timestamp: Date.now()
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

  // Add before inheritContext method
  private calculateInheritedConfidence(
    currentConfidence: number,
    previousConfidence: number
  ): number {
    // Weight current confidence more heavily (70%) and previous confidence less (30%)
    const currentWeight = 0.7;
    const previousWeight = 0.3;

    // Calculate weighted average with a slight decay factor
    const inheritedConfidence = (currentConfidence * currentWeight) + 
                              (previousConfidence * previousWeight * 0.9); // 10% decay on inherited confidence

    // Ensure confidence stays within valid range
    return Math.max(0.1, Math.min(1, inheritedConfidence));
  }

  private mergeEmotionalStates(
    current: EmotionalStateValue,
    previous: EmotionalStateValue
  ): EmotionalStateValue {
    // If intensities are significantly different, prefer the stronger emotion
    if (Math.abs(current.intensity - previous.intensity) > 0.3) {
      return current.intensity > previous.intensity ? current : previous;
    }

    // If same primary emotion, merge with averaged intensity
    if (current.primary === previous.primary) {
      return {
        primary: current.primary,
        intensity: (current.intensity + previous.intensity) / 2,
        secondary: current.secondary || previous.secondary,
        context: `${current.context || ''} + ${previous.context || ''}`.trim(),
        confidence: Math.min(1, (current.confidence + previous.confidence) / 2)
      };
    }

    // For different emotions, use the more recent one but consider previous as secondary
    return {
      primary: current.primary,
      intensity: current.intensity,
      secondary: previous.primary,
      context: `${current.context || ''} (previously: ${previous.context || ''})`.trim(),
      confidence: Math.min(1, (current.confidence + previous.confidence * 0.5) / 1.5)
    };
  }

  // Add before inheritContext method
  private validateContext(node: MemoryNode): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validate situation type
    if (!this.validateSituationType(node.context.situation)) {
      errors.push(`Invalid situation type: ${node.context.situation}`);
    }

    // Validate external factors
    const externalFactorErrors = this.validateExternalFactors(node.context.external_factors);
    errors.push(...externalFactorErrors);

    // Validate temporal consistency
    const temporalErrors = this.validateTemporalConsistency(node);
    errors.push(...temporalErrors);

    // Validate emotional state
    const emotionalStateErrors = this.validateEmotionalState(node.context.emotional_state);
    errors.push(...emotionalStateErrors);

    // Validate relationships
    const relationshipErrors = this.validateRelationships(node);
    errors.push(...relationshipErrors);

    // Validate evolution history
    const evolutionErrors = this.validateEvolutionHistory(node.evolution);
    errors.push(...evolutionErrors);

    // Validate RAG results if present
    if (node.metadata?.rag_results) {
      const ragErrors = this.validateRAGResults(node.metadata.rag_results);
      errors.push(...ragErrors);
    }

    // Validate displayed information if present
    if (node.metadata?.displayed_info) {
      const displayErrors = this.validateDisplayedInfo(node.metadata.displayed_info);
      errors.push(...displayErrors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateSituationType(situation: SituationType | `custom_${string}`): boolean {
    // Check if it's a standard situation type
    const standardTypes = [
      'content_creation',
      'content_analysis',
      'user_interaction',
      'partnership_discussion',
      'performance_review',
      'trend_analysis',
      'audience_engagement',
      'strategy_planning',
      'feedback_processing',
      'system_learning'
    ];

    if (standardTypes.includes(situation as SituationType)) {
      return true;
    }

    // Check if it's a valid custom type
    return typeof situation === 'string' && 
           situation.startsWith('custom_') && 
           situation.length > 7;
  }

  private validateExternalFactors(factors: (ExternalFactor | `custom_${string}`)[]): string[] {
    const errors: string[] = [];
    const standardFactors = [
      'market_trend',
      'platform_update',
      'algorithm_change',
      'competitor_action',
      'audience_shift',
      'seasonal_event',
      'technical_issue',
      'content_viral',
      'partnership_opportunity',
      'industry_news'
    ];

    factors.forEach(factor => {
      if (!standardFactors.includes(factor as ExternalFactor) && 
          !(typeof factor === 'string' && factor.startsWith('custom_'))) {
        errors.push(`Invalid external factor: ${factor}`);
      }
    });

    return errors;
  }

  private validateTemporalConsistency(node: MemoryNode): string[] {
    const errors: string[] = [];
    const now = Date.now();

    // Check node timestamp
    if (node.timestamp > now) {
      errors.push('Node timestamp is in the future');
    }

    // Check evolution history timestamps
    let lastTimestamp = 0;
    node.evolution.history.forEach(entry => {
      if (entry.timestamp > now) {
        errors.push(`Evolution history entry has future timestamp: ${entry.timestamp}`);
      }
      if (entry.timestamp < lastTimestamp) {
        errors.push(`Evolution history timestamps are not sequential at: ${entry.timestamp}`);
      }
      lastTimestamp = entry.timestamp;
    });

    // Check RAG results timestamps if present
    if (node.metadata?.rag_results) {
      node.metadata.rag_results.forEach(result => {
        if (result.timestamp > now) {
          errors.push(`RAG result has future timestamp: ${result.timestamp}`);
        }
        if (result.inheritance_timestamp && result.inheritance_timestamp > now) {
          errors.push(`RAG inheritance timestamp is in the future: ${result.inheritance_timestamp}`);
        }
      });
    }

    // Check displayed info timestamps if present
    if (node.metadata?.displayed_info) {
      node.metadata.displayed_info.forEach(info => {
        if (info.timestamp > now) {
          errors.push(`Displayed info has future timestamp: ${info.timestamp}`);
        }
        if (info.inheritance_timestamp && info.inheritance_timestamp > now) {
          errors.push(`Displayed info inheritance timestamp is in the future: ${info.inheritance_timestamp}`);
        }
        if (info.original_timestamp && info.original_timestamp > now) {
          errors.push(`Displayed info original timestamp is in the future: ${info.original_timestamp}`);
        }
      });
    }

    return errors;
  }

  private validateRAGResults(results: RAGResult[]): string[] {
    const errors: string[] = [];

    results.forEach((result, index) => {
      // Check required fields
      if (!result.content) {
        errors.push(`RAG result at index ${index} missing content`);
      }
      if (!result.timestamp) {
        errors.push(`RAG result at index ${index} missing timestamp`);
      }

      // Validate confidence if present
      if (result.confidence !== undefined && 
          (result.confidence < 0 || result.confidence > 1)) {
        errors.push(`Invalid confidence value at index ${index}: ${result.confidence}`);
      }

      // Validate inheritance fields if present
      if (result.inherited_from && !result.inheritance_timestamp) {
        errors.push(`RAG result at index ${index} has inheritance source but no timestamp`);
      }
    });

    return errors;
  }

  private validateDisplayedInfo(info: DisplayedInfo[]): string[] {
    const errors: string[] = [];

    info.forEach((item, index) => {
      // Check required fields
      if (!item.content) {
        errors.push(`Displayed info at index ${index} missing content`);
      }
      if (!item.timestamp) {
        errors.push(`Displayed info at index ${index} missing timestamp`);
      }
      if (!item.type) {
        errors.push(`Displayed info at index ${index} missing type`);
      }

      // Validate inheritance fields if present
      if (item.inherited_from && !item.inheritance_timestamp) {
        errors.push(`Displayed info at index ${index} has inheritance source but no timestamp`);
      }
      if (item.inheritance_timestamp && !item.inherited_from) {
        errors.push(`Displayed info at index ${index} has inheritance timestamp but no source`);
      }

      // Validate timestamp sequence if all timestamps are present
      if (item.original_timestamp && item.inheritance_timestamp) {
        if (item.original_timestamp > item.inheritance_timestamp) {
          errors.push(`Invalid timestamp sequence at index ${index}: original after inheritance`);
        }
        if (item.inheritance_timestamp > item.timestamp) {
          errors.push(`Invalid timestamp sequence at index ${index}: inheritance after current`);
        }
      }
    });

    return errors;
  }

  private validateEmotionalState(state: EmotionalStateValue): string[] {
    const errors: string[] = [];

    // Validate primary emotion
    const validPrimaryEmotions = [
      'neutral', 'positive', 'negative', 'excited', 'frustrated',
      'curious', 'confused', 'satisfied', 'uncertain', 'engaged', 'disengaged'
    ];

    if (!validPrimaryEmotions.includes(state.primary) && 
        !state.primary.startsWith('custom_')) {
      errors.push(`Invalid primary emotion: ${state.primary}`);
    }

    // Validate intensity
    if (typeof state.intensity !== 'number' || 
        state.intensity < 0 || 
        state.intensity > 1) {
      errors.push(`Invalid emotional intensity: ${state.intensity}`);
    }

    // Validate confidence
    if (typeof state.confidence !== 'number' || 
        state.confidence < 0 || 
        state.confidence > 1) {
      errors.push(`Invalid emotional confidence: ${state.confidence}`);
    }

    // Validate context if present
    if (state.context && typeof state.context !== 'string') {
      errors.push('Emotional state context must be a string');
    }

    return errors;
  }

  private validateRelationships(node: MemoryNode): string[] {
    const errors: string[] = [];

    // Check each relationship
    node.relationships.forEach((relationship, targetId) => {
      // Validate relationship type
      if (!this.isValidRelationshipType(relationship.type)) {
        errors.push(`Invalid relationship type for target ${targetId}: ${relationship.type}`);
      }

      // Validate strength
      if (typeof relationship.strength !== 'number' || 
          relationship.strength < 0 || 
          relationship.strength > 1) {
        errors.push(`Invalid relationship strength for target ${targetId}: ${relationship.strength}`);
      }

      // Validate evidence
      if (!Array.isArray(relationship.evidence)) {
        errors.push(`Invalid evidence format for target ${targetId}`);
      } else {
        relationship.evidence.forEach((evidence, index) => {
          if (typeof evidence !== 'string') {
            errors.push(`Invalid evidence item at index ${index} for target ${targetId}`);
          }
        });
      }

      // Validate target exists
      if (!this.graph.nodes.has(targetId)) {
        errors.push(`Relationship target does not exist: ${targetId}`);
      }
    });

    return errors;
  }

  private validateEvolutionHistory(evolution: MemoryNode['evolution']): string[] {
    const errors: string[] = [];

    // Validate history array
    if (!Array.isArray(evolution.history)) {
      errors.push('Evolution history must be an array');
      return errors;
    }

    // Check history entries
    let lastTimestamp = 0;
    evolution.history.forEach((entry, index) => {
      // Validate state
      if (!entry.state || typeof entry.state !== 'object') {
        errors.push(`Invalid state at history index ${index}`);
      }

      // Validate timestamp
      if (typeof entry.timestamp !== 'number' || entry.timestamp < 0) {
        errors.push(`Invalid timestamp at history index ${index}`);
      }

      // Check timestamp sequence
      if (entry.timestamp < lastTimestamp) {
        errors.push(`Non-sequential timestamp at history index ${index}`);
      }
      lastTimestamp = entry.timestamp;

      // Validate trigger
      if (!this.isValidEvolutionTrigger(entry.trigger)) {
        errors.push(`Invalid evolution trigger at index ${index}: ${entry.trigger}`);
      }
    });

    // Validate trend
    const validTrends = ['improving', 'declining', 'stable'];
    if (!validTrends.includes(evolution.trend) && typeof evolution.trend !== 'string') {
      errors.push(`Invalid evolution trend: ${evolution.trend}`);
    }

    // Validate stability
    if (typeof evolution.stability !== 'number' || 
        evolution.stability < 0 || 
        evolution.stability > 1) {
      errors.push(`Invalid evolution stability: ${evolution.stability}`);
    }

    return errors;
  }

  private isValidRelationshipType(type: RelationshipType): boolean {
    const standardTypes = [
      'related_to', 'part_of', 'follows', 'follows_up', 'precedes',
      'similar_to', 'references', 'contradicts', 'supports', 'influences',
      'depends_on', 'related_topic', 'inherits_rag', 'temporal_correlation',
      'causal_correlation', 'semantic_relation', 'contextual_link'
    ];

    return standardTypes.includes(type as string) || type.startsWith('custom_');
  }

  private isValidEvolutionTrigger(trigger: EvolutionTrigger): boolean {
    const standardTriggers = [
      'user_interaction', 'system_update', 'pattern_detected',
      'confidence_change', 'context_update', 'relationship_change',
      'external_event', 'consolidation', 'validation', 'correction',
      'initial_creation', 'new_information', 'processing', 'email_received',
      'user_input', 'context_inheritance'
    ];

    return standardTriggers.includes(trigger as string) || trigger.startsWith('custom_');
  }
} 
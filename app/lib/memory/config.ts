export interface MemorySystemConfig {
  memoryDecayRate: number;
  confidenceThreshold: number;
  recentWindow: number;
  maxRetries: number;
  cacheTimeout: number;
  patternRecognitionThreshold: number;
  consolidationThreshold: number;
}

export const DEFAULT_CONFIG: MemorySystemConfig = {
  memoryDecayRate: 0.9,
  confidenceThreshold: 0.6,
  recentWindow: 1000 * 60 * 60 * 24, // 24 hours in milliseconds
  maxRetries: 3,
  cacheTimeout: 1000 * 60 * 5, // 5 minutes in milliseconds
  patternRecognitionThreshold: 0.7,
  consolidationThreshold: 0.7
};

export const ERROR_MESSAGES = {
  INVALID_NODE: 'Invalid memory node structure',
  INVALID_INPUT: 'Invalid input data',
  NODE_NOT_FOUND: 'Memory node not found',
  OPERATION_FAILED: 'Memory operation failed',
  PATTERN_RECOGNITION_FAILED: 'Pattern recognition failed',
  CONSOLIDATION_FAILED: 'Memory consolidation failed'
} as const;

export const MEMORY_TYPES = {
  SHORT_TERM: 'short_term',
  WORKING: 'working',
  LONG_TERM: 'long_term',
  CONTEXT: 'context'
} as const;

export const PATTERN_TYPES = {
  // Base patterns
  BEHAVIORAL: 'behavioral',
  TEMPORAL: 'temporal',
  CAUSAL: 'causal',
  PREFERENCE: 'preference',
  // Extended patterns
  TOPIC_PROGRESSION: 'topic_progression',
  REGULAR_TIMING: 'regular_timing',
  TIME_OF_DAY: 'time_of_day',
  ENGAGEMENT: 'engagement',
  // Temporal patterns
  RECURRING: 'recurring',
  PERIODIC: 'periodic',
  TREND: 'trend',
  SPIKE: 'spike',
  CYCLIC: 'cyclic',
  DAILY: 'daily',
  WEEKLY: 'weekly',
  MONTHLY: 'monthly',
  SEQUENCE: 'sequence',
  SEASONAL: 'seasonal',
  DECAY: 'decay',
  // Relationship patterns
  TEMPORAL_CORRELATION: 'temporal_correlation',
  CAUSAL_CORRELATION: 'causal_correlation',
  SEMANTIC_RELATION: 'semantic_relation',
  CONTEXTUAL_LINK: 'contextual_link'
} as const; 
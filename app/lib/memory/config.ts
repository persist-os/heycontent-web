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
  LONG_TERM: 'long_term'
} as const;

export const PATTERN_TYPES = {
  BEHAVIORAL: 'behavioral',
  TEMPORAL: 'temporal',
  CAUSAL: 'causal',
  PREFERENCE: 'preference'
} as const; 
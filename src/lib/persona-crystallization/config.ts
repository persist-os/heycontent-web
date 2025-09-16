/**
 * Configuration and types for persona crystallization
 * 
 * This module provides configuration types and default values for
 * persona crystallization operations.
 */

import { PersonaError } from '@/lib/persona-error-handler';

export interface PersonaCrystallizationConfig {
  autoCrystallizationEnabled: boolean;
  minConfidenceThreshold: number;
  maxRetryAttempts: number;
  retryDelayMs: number;
}

export interface PersonaCrystallizationState {
  isExtracting: boolean;
  isCrystallizing: boolean;
  isHealthChecking: boolean;
  extractionError: PersonaError | null;
  crystallizationError: PersonaError | null;
  healthError: PersonaError | null;
  lastExtraction: any | null;
  lastCrystallization: any | null;
  lastHealthCheck: any | null;
  config: PersonaCrystallizationConfig;
  lastStoredTraceIds: string[];
}

export interface DamStatus {
  isAllowed: boolean;
  damStatus: 'open' | 'approaching' | 'full' | 'blocked';
  reasonBlocked?: string;
  percentageFull: number;
  tokensRemaining: number;
  isLoading: boolean;
}

/**
 * Default configuration for persona crystallization
 */
export const DEFAULT_CONFIG: PersonaCrystallizationConfig = {
  autoCrystallizationEnabled: true,
  minConfidenceThreshold: 0.6,
  maxRetryAttempts: 3,
  retryDelayMs: 1000
};

/**
 * Initial state for persona crystallization
 */
export const INITIAL_STATE: PersonaCrystallizationState = {
  isExtracting: false,
  isCrystallizing: false,
  isHealthChecking: false,
  extractionError: null,
  crystallizationError: null,
  healthError: null,
  lastExtraction: null,
  lastCrystallization: null,
  lastHealthCheck: null,
  config: DEFAULT_CONFIG,
  lastStoredTraceIds: []
};

/**
 * Generate a unique operation ID for logging
 */
export function generateOperationId(): string {
  return Math.random().toString(36).substring(7);
}

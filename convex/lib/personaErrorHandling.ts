/**
 * Error handling utilities for Persona Crystallization System
 * Extracted from personaCrystallizationMutations.ts for better organization
 */

import { PersonaCrystallizationError } from "./personaTypes";

/**
 * Create a standardized error object
 */
export const createPersonaError = (
  code: string,
  message: string,
  details: any = {}
): PersonaCrystallizationError => ({
  code,
  message,
  details,
  timestamp: Date.now()
});

/**
 * Create a batch processing error
 */
export const createBatchError = (
  message: string,
  details: any = {}
): PersonaCrystallizationError => createPersonaError('BATCH_PROCESSING_ERROR', message, details);

/**
 * Create a transaction error
 */
export const createTransactionError = (
  message: string,
  details: any = {}
): PersonaCrystallizationError => createPersonaError('TRANSACTION_ERROR', message, details);

/**
 * Create a critical error
 */
export const createCriticalError = (
  message: string,
  details: any = {}
): PersonaCrystallizationError => createPersonaError('CRITICAL_ERROR', message, details);

/**
 * Generate a unique mutation ID for tracking
 */
export const generateMutationId = (): string => {
  return Math.random().toString(36).substring(7);
};

/**
 * Log mutation start with standardized format
 */
export const logMutationStart = (
  mutationId: string,
  operationType: string,
  details: any = {}
) => {
  console.log(`🔄 [${operationType}:${mutationId}] Starting operation`, {
    ...details,
    timestamp: new Date().toISOString()
  });
};

/**
 * Log mutation completion with standardized format
 */
export const logMutationComplete = (
  mutationId: string,
  operationType: string,
  processingTime: number,
  details: any = {}
) => {
  console.log(`✅ [${operationType}:${mutationId}] Operation completed in ${processingTime}ms`, details);
};

/**
 * Log mutation error with standardized format
 */
export const logMutationError = (
  mutationId: string,
  operationType: string,
  error: Error | PersonaCrystallizationError,
  processingTime?: number
) => {
  const timeInfo = processingTime ? ` after ${processingTime}ms` : '';
  console.error(`❌ [${operationType}:${mutationId}] Operation failed${timeInfo}:`, error);
};

/**
 * Convert a generic error to PersonaCrystallizationError
 */
export const normalizeError = (error: any, defaultCode = 'UNKNOWN_ERROR'): PersonaCrystallizationError => {
  if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
    return error as PersonaCrystallizationError;
  }
  
  return createPersonaError(
    defaultCode,
    error instanceof Error ? error.message : 'Unknown error occurred',
    { originalError: error }
  );
};

/**
 * Standardized result structure for mutations
 */
export interface MutationResult {
  success: boolean;
  errors: PersonaCrystallizationError[];
}

/**
 * Create a successful result
 */
export const createSuccessResult = (additionalData: any = {}): MutationResult & any => ({
  success: true,
  errors: [],
  ...additionalData
});

/**
 * Create a failure result
 */
export const createFailureResult = (
  errors: PersonaCrystallizationError[], 
  additionalData: any = {}
): MutationResult & any => ({
  success: false,
  errors,
  ...additionalData
});

/**
 * Merge multiple error arrays
 */
export const mergeErrors = (...errorArrays: PersonaCrystallizationError[][]): PersonaCrystallizationError[] => {
  return errorArrays.flat();
};

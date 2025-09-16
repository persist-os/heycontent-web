/**
 * Retry and error handling utilities for persona crystallization
 * 
 * This module provides retry mechanisms with exponential backoff and
 * error categorization for crystallization operations.
 */

import { personaErrorHandler, categorizeError, PersonaError } from '@/lib/persona-error-handler';

export interface RetryConfig {
  maxRetryAttempts: number;
  retryDelayMs: number;
}

/**
 * Retry mechanism with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  errorType: PersonaError['type'],
  config: RetryConfig
): Promise<T> {
  const { maxRetryAttempts, retryDelayMs } = config;
  let lastError: Error;
  
  for (let attempt = 0; attempt < maxRetryAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on validation errors
      if (errorType === 'validation') {
        throw lastError;
      }
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetryAttempts - 1) {
        throw lastError;
      }
      
      // Calculate delay with exponential backoff
      const delay = retryDelayMs * Math.pow(2, attempt);
      console.log(`🔄 [RETRY] Attempt ${attempt + 1}/${maxRetryAttempts} failed, retrying in ${delay}ms`, {
        errorType,
        error: lastError.message
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

/**
 * Create a persona error with proper context
 */
export function createPersonaError(
  originalError: Error,
  errorType: PersonaError['type'],
  message: string,
  context: any
): PersonaError {
  return personaErrorHandler.logError(
    categorizeError(originalError, errorType),
    message,
    context,
    originalError
  );
}

/**
 * Error utility functions
 */
export function getErrorMessage(error: PersonaError | null): string | null {
  if (!error) return null;
  return personaErrorHandler.getUserMessage(error);
}

export function canRetry(error: PersonaError | null): boolean {
  if (!error) return false;
  return error.retryable && (error.retryCount || 0) < 3;
}

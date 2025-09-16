/**
 * Token dam checking utilities for persona crystallization operations
 * 
 * This module provides utilities for checking if expensive crystallization
 * operations should proceed based on token dam status.
 */

import { createPersonaError } from './retry-logic';

export interface DamCheckResult {
  isAllowed: boolean;
  damStatus: 'open' | 'approaching' | 'full' | 'blocked';
  reasonBlocked?: string;
  percentageFull: number;
  tokensRemaining: number;
  isLoading: boolean;
}

/**
 * Check if crystallization operations are allowed based on dam status
 */
export function checkCrystallizationAllowed(
  damCheck: DamCheckResult,
  userId: string | undefined,
  operationId: string,
  operationType: 'extraction' | 'crystallization'
): void {
  if (!userId) {
    const validationError = createPersonaError(
      new Error('Missing userId parameter'),
      'validation',
      `User ID is required for ${operationType}`,
      { operation: `${operationType}_validation` }
    );
    throw new Error(`User ID is required for ${operationType}`);
  }

  // Check token dam before expensive operation (only if we have a valid userId and dam check is loaded)
  if (!damCheck.isLoading && userId && !damCheck.isAllowed) {
    console.error(`❌ [${operationId}] Token dam blocking ${operationType}:`, damCheck.reasonBlocked);
    const damError = createPersonaError(
      new Error(`Token dam blocked: ${damCheck.reasonBlocked}`),
      'validation',
      `${operationType} blocked by usage limits: ${damCheck.reasonBlocked}`,
      { 
        operation: `${operationType}_dam_check`, 
        metadata: { damStatus: damCheck.damStatus }
      }
    );
    throw new Error(`Operation blocked by usage limits: ${damCheck.reasonBlocked}. Please wait or upgrade your plan.`);
  }
}

/**
 * Log dam status for debugging
 */
export function logDamStatus(
  damCheck: DamCheckResult,
  operationId: string,
  operationType: 'extraction' | 'crystallization'
): void {
  console.log(`🏥 [${operationId}] Dam status for ${operationType}`, {
    damCheck: {
      isAllowed: damCheck.isAllowed,
      isLoading: damCheck.isLoading,
      damStatus: damCheck.damStatus,
      reasonBlocked: damCheck.reasonBlocked,
      percentageFull: damCheck.percentageFull,
      tokensRemaining: damCheck.tokensRemaining
    }
  });
}

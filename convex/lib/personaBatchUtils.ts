/**
 * Batch processing utilities for Persona Crystallization System
 * Extracted from personaCrystallizationMutations.ts for better organization
 */

import { Id } from "../_generated/dataModel";
import { PersonaCrystallizationError, BatchProcessingResult } from "./personaTypes";
import { createPersonaError, generateMutationId } from "./personaErrorHandling";

/**
 * Create a batch processing result structure
 */
export const createBatchResult = (batchId: string): BatchProcessingResult & {
  batchId: string,
  validationErrors: PersonaCrystallizationError[],
  traceConversionErrors: PersonaCrystallizationError[]
} => ({
  batchId,
  totalProcessed: 0,
  successful: 0,
  failed: 0,
  processingTime: 0,
  errors: [],
  validationErrors: [],
  traceConversionErrors: []
});

/**
 * Generate a unique batch ID
 */
export const generateBatchId = (): string => generateMutationId();

/**
 * Create an existing insights cache for optimization
 */
export const createInsightsCache = (insights: any[]): Map<string, any> => {
  const cache = new Map<string, any>();
  insights.forEach(insight => {
    cache.set(insight.insight_type, insight);
  });
  return cache;
};

/**
 * Process insights in chunks for better performance
 */
export const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

/**
 * Semaphore implementation for controlling concurrency
 */
export class Semaphore {
  private permits: Promise<void>[];
  private resolveArray: (() => void)[];

  constructor(maxConcurrency: number) {
    this.permits = Array(maxConcurrency).fill(null).map(() => Promise.resolve());
    this.resolveArray = [];
  }

  async acquire(): Promise<() => void> {
    let index = -1;
    
    // Find an available permit
    for (let i = 0; i < this.permits.length; i++) {
      if (this.permits[i] === Promise.resolve()) {
        index = i;
        break;
      }
    }

    if (index === -1) {
      // All permits are taken, wait for one to be released
      await Promise.race(this.permits);
      return this.acquire(); // Recursive call to try again
    }

    // Create a new promise for this permit
    let releaseResolve: () => void;
    this.permits[index] = new Promise<void>(resolve => {
      releaseResolve = resolve;
    });

    // Return the release function
    return () => {
      releaseResolve!();
      this.permits[index] = Promise.resolve();
    };
  }
}

/**
 * Parallel processing with controlled concurrency
 */
export const processInParallel = async <T, R>(
  items: T[],
  processor: (item: T, index: number) => Promise<R>,
  maxConcurrency: number = 10
): Promise<R[]> => {
  const semaphore = new Semaphore(maxConcurrency);
  const results: R[] = new Array(items.length);

  await Promise.all(
    items.map(async (item, index) => {
      const release = await semaphore.acquire();
      try {
        results[index] = await processor(item, index);
      } finally {
        release();
      }
    })
  );

  return results;
};

/**
 * Calculate success rate
 */
export const calculateSuccessRate = (successful: number, total: number): string => {
  if (total === 0) return "0.00%";
  return `${((successful / total) * 100).toFixed(2)}%`;
};

/**
 * Log batch progress
 */
export const logBatchProgress = (
  batchId: string,
  operationType: string,
  chunkIndex: number,
  totalChunks: number,
  processed: number,
  successful: number,
  failed: number
) => {
  console.log(`🔄 [${operationType}:${batchId}] Chunk ${chunkIndex}/${totalChunks} completed`, {
    processed,
    successful,
    failed,
    successRate: calculateSuccessRate(successful, processed)
  });
};

/**
 * Log batch completion
 */
export const logBatchCompletion = (
  batchId: string,
  operationType: string,
  result: any,
  processingTime: number
) => {
  console.log(`🎯 [${operationType}:${batchId}] Batch processing completed in ${processingTime}ms`, {
    totalProcessed: result.totalProcessed,
    successful: result.successful,
    failed: result.failed,
    successRate: calculateSuccessRate(result.successful, result.totalProcessed)
  });
};

/**
 * Validate batch arguments
 */
export const validateBatchArgs = (
  userId: string,
  batchSize: number,
  maxConcurrency: number
): PersonaCrystallizationError | null => {
  if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
    return createPersonaError(
      'INVALID_USER_ID',
      'Invalid userId provided for batch processing',
      { userId }
    );
  }

  if (batchSize && (typeof batchSize !== 'number' || batchSize <= 0 || batchSize > 1000)) {
    return createPersonaError(
      'INVALID_BATCH_SIZE',
      'Batch size must be a number between 1 and 1000',
      { batchSize }
    );
  }

  if (maxConcurrency && (typeof maxConcurrency !== 'number' || maxConcurrency <= 0 || maxConcurrency > 50)) {
    return createPersonaError(
      'INVALID_CONCURRENCY',
      'Max concurrency must be a number between 1 and 50',
      { maxConcurrency }
    );
  }

  return null;
};

/**
 * Convex storage operations for persona crystallization
 * 
 * This module provides utilities for storing traces and insights in Convex,
 * with proper error handling and retry logic.
 */

import { ConvexReactClient } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { retryWithBackoff, RetryConfig } from './retry-logic';

/**
 * Store persona traces in Convex
 */
export async function storePersonaTraces(
  convex: ConvexReactClient,
  userId: string,
  conversationId: Id<"conversations">,
  traces: any[],
  retryConfig: RetryConfig
): Promise<void> {
  await retryWithBackoff(
    () => convex.action(api.personaCrystallizationMutations.storePersonaTracesAction, {
      user_id: userId,
      conversation_id: conversationId,
      traces
    }),
    'storage',
    retryConfig
  );
}

/**
 * Store crystallized insights in Convex
 */
export async function storeCrystallizedInsights(
  convex: ConvexReactClient,
  userId: string,
  insights: any[],
  retryConfig: RetryConfig
): Promise<void> {
  await retryWithBackoff(
    () => convex.action(api.personaCrystallizationMutations.storeCrystallizedInsightsAction, {
      user_id: userId,
      insights
    }),
    'storage',
    retryConfig
  );
}

/**
 * Refresh persona data after updates
 */
export async function refreshPersonaData(
  userId: string,
  convex: ConvexReactClient,
  refreshFunction: (userId: string, convex: ConvexReactClient) => Promise<void>,
  retryConfig: RetryConfig
): Promise<void> {
  await retryWithBackoff(
    () => refreshFunction(userId, convex),
    'storage',
    retryConfig
  );
}

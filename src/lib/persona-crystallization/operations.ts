/**
 * Core crystallization operations
 * 
 * This module provides the main crystallization operations including
 * trace extraction, insight crystallization, and auto-crystallization.
 */

import { ConvexReactClient } from 'convex/react';
import { Id } from '@/convex/_generated/dataModel';
import { 
  triggerConversationTraceExtraction, 
  triggerInsightCrystallization, 
  checkPersonaHealth 
} from '@/app/lib/persona-api';

import { validateTraceIds, extractTraceIds, cleanTracesForStorage } from './trace-validation';
import { retryWithBackoff, createPersonaError } from './retry-logic';
import { storePersonaTraces, storeCrystallizedInsights, refreshPersonaData } from './convex-operations';
import { checkCrystallizationAllowed, logDamStatus, DamCheckResult } from './dam-check';
import { PersonaCrystallizationConfig, generateOperationId } from './config';

/**
 * Extract traces from a conversation
 */
export async function extractTracesFromConversation(
  userId: string,
  conversationId: string,
  conversationData: any,
  damCheck: DamCheckResult,
  config: PersonaCrystallizationConfig,
  convex: ConvexReactClient
): Promise<{ result: any; storedTraceIds: string[] }> {
  const hookId = generateOperationId();
  const startTime = Date.now();
  
  console.log(`🪝 [HOOK:${hookId}] Starting trace extraction from conversation`, {
    userId,
    conversationId,
    hasConversationData: !!conversationData,
    autoCrystallizationEnabled: config.autoCrystallizationEnabled,
    timestamp: new Date().toISOString()
  });

  logDamStatus(damCheck, hookId, 'extraction');
  checkCrystallizationAllowed(damCheck, userId, hookId, 'extraction');

  console.log(`🚀 [HOOK:${hookId}] Calling triggerConversationTraceExtraction with retry logic`);
  
  const result = await retryWithBackoff(
    () => triggerConversationTraceExtraction(userId, conversationId, conversationData),
    'extraction',
    config
  );
  
  const duration = Date.now() - startTime;
  console.log(`📊 [HOOK:${hookId}] Trace extraction completed`, {
    duration_ms: duration,
    tracesCount: result.traces?.length || 0,
    hasMetadata: !!result.extraction_metadata
  });
  
  let storedTraceIds: string[] = [];
  
  // Store traces in Convex if they were extracted
  if (result.traces && result.traces.length > 0) {
    console.log(`💾 [HOOK:${hookId}] Storing ${result.traces.length} traces in Convex`);
    try {
      const cleanedTraces = cleanTracesForStorage(result.traces);
      
      await storePersonaTraces(
        convex,
        userId,
        conversationId as Id<"conversations">,
        cleanedTraces,
        config
      );
      
      // Extract and validate trace IDs from the stored traces
      storedTraceIds = extractTraceIds(result);
      
      if (!validateTraceIds(storedTraceIds)) {
        console.warn(`⚠️ [HOOK:${hookId}] Invalid trace IDs detected`, { storedTraceIds });
        storedTraceIds = [];
      }
      
      console.log(`✅ [HOOK:${hookId}] Traces stored in Convex successfully`, {
        storedTraceIds: storedTraceIds.length,
        validTraceIds: storedTraceIds.slice(0, 3) // Log first 3 for debugging
      });
    } catch (convexError) {
      // Don't fail the whole operation if Convex storage fails
      console.warn(`⚠️ [HOOK:${hookId}] Convex storage failed:`, convexError);
    }
  } else {
    console.log(`ℹ️ [HOOK:${hookId}] No traces to store in Convex`);
  }

  return { result, storedTraceIds };
}

/**
 * Crystallize insights from trace IDs
 */
export async function crystallizeUserInsights(
  userId: string,
  traceIds: string[],
  minConfidence: number,
  damCheck: DamCheckResult,
  config: PersonaCrystallizationConfig,
  convex: ConvexReactClient,
  refreshFunction: (userId: string, convex: ConvexReactClient) => Promise<void>
): Promise<any> {
  const crystallizationId = generateOperationId();
  const startTime = Date.now();
  
  console.log(`🔮 [CRYSTALLIZATION:${crystallizationId}] Starting insight crystallization`, {
    userId,
    traceIdsCount: traceIds.length,
    minConfidence,
    timestamp: new Date().toISOString()
  });

  logDamStatus(damCheck, crystallizationId, 'crystallization');
  checkCrystallizationAllowed(damCheck, userId, crystallizationId, 'crystallization');

  console.warn(`⚠️ [CRYSTALLIZATION:${crystallizationId}] STEP 1: Validating ${traceIds.length} trace IDs`, {
    traceIds: traceIds.slice(0, 3),
    totalCount: traceIds.length
  });

  // Validate trace IDs before proceeding
  if (!validateTraceIds(traceIds)) {
    console.error(`❌ [CRYSTALLIZATION:${crystallizationId}] STEP 1 FAILED: Trace ID validation failed`);
    throw createPersonaError(
      new Error('Trace IDs validation failed'),
      'validation',
      'Invalid trace IDs provided for crystallization',
      {
        userId,
        operation: 'crystallize_insights_validation',
        metadata: { traceIds, traceIdsCount: traceIds.length }
      }
    );
  }

  console.warn(`✅ [CRYSTALLIZATION:${crystallizationId}] STEP 1 SUCCESS: Trace IDs validated successfully`);

  console.warn(`⚠️ [CRYSTALLIZATION:${crystallizationId}] STEP 2: Calling backend triggerInsightCrystallization`, {
    userId,
    traceIdsCount: traceIds.length,
    minConfidence
  });
  
  const result = await retryWithBackoff(
    () => triggerInsightCrystallization(userId, traceIds, minConfidence),
    'crystallization',
    config
  );
  
  const duration = Date.now() - startTime;
  console.warn(`✅ [CRYSTALLIZATION:${crystallizationId}] STEP 2 SUCCESS: Backend crystallization completed`, {
    duration_ms: duration,
    insightsCount: result.insights?.length || 0,
    hasMetadata: !!result.crystallization_metadata,
    resultKeys: Object.keys(result || {})
  });

  // Store crystallized insights in Convex if they were created
  if (result.insights && result.insights.length > 0) {
    console.warn(`⚠️ [CRYSTALLIZATION:${crystallizationId}] STEP 3: Storing ${result.insights.length} insights in Convex`, {
      insightsCount: result.insights.length,
      firstInsight: result.insights[0] ? {
        id: result.insights[0].insight_id,
        type: result.insights[0].insight_type,
        confidence: result.insights[0].confidence
      } : null
    });
    
    try {
      await storeCrystallizedInsights(convex, userId, result.insights, config);
      console.warn(`✅ [CRYSTALLIZATION:${crystallizationId}] STEP 3 SUCCESS: Insights stored in Convex successfully`);
      
      console.warn(`⚠️ [CRYSTALLIZATION:${crystallizationId}] STEP 4: Refreshing persona data`);
      await refreshPersonaData(userId, convex, refreshFunction, config);
      console.warn(`✅ [CRYSTALLIZATION:${crystallizationId}] STEP 4 SUCCESS: Persona data refreshed`);
    } catch (convexError) {
      console.error(`❌ [CRYSTALLIZATION:${crystallizationId}] STEP 3/4 FAILED: Convex storage error`, convexError);
      // Don't fail the whole operation if Convex storage fails
      console.warn(`⚠️ [CRYSTALLIZATION:${crystallizationId}] Storage failed but crystallization succeeded`);
    }
  } else {
    console.warn(`⚠️ [CRYSTALLIZATION:${crystallizationId}] STEP 3 SKIPPED: No insights to store (${result.insights?.length || 0} insights returned)`);
  }

  console.warn(`🎉 [CRYSTALLIZATION:${crystallizationId}] FINAL: Crystallization process completed successfully`, {
    totalDuration: Date.now() - startTime,
    insightsGenerated: result.insights?.length || 0,
    hasMetadata: !!result.crystallization_metadata
  });

  return result;
}

/**
 * Auto-crystallization helper function
 */
export async function performAutoCrystallization(
  userId: string,
  traceIds: string[],
  minConfidence: number,
  damCheck: DamCheckResult,
  config: PersonaCrystallizationConfig,
  convex: ConvexReactClient,
  refreshFunction: (userId: string, convex: ConvexReactClient) => Promise<void>
): Promise<void> {
  const crystallizationId = generateOperationId();
  
  if (!userId) {
    console.warn(`⚠️ [AUTO-CRYSTALLIZATION:${crystallizationId}] No userId available`);
    return;
  }

  // Validate trace IDs
  if (!validateTraceIds(traceIds)) {
    console.warn(`⚠️ [AUTO-CRYSTALLIZATION:${crystallizationId}] Invalid trace IDs`, { traceIds });
    return;
  }

  console.log(`🔮 [AUTO-CRYSTALLIZATION:${crystallizationId}] Starting auto-crystallization`, {
    traceIdsCount: traceIds.length,
    minConfidence
  });

  try {
    await crystallizeUserInsights(
      userId,
      traceIds,
      minConfidence,
      damCheck,
      config,
      convex,
      refreshFunction
    );
    
    console.log(`✅ [AUTO-CRYSTALLIZATION:${crystallizationId}] Crystallization completed`);
  } catch (error) {
    console.warn(`⚠️ [AUTO-CRYSTALLIZATION:${crystallizationId}] Failed:`, error);
    throw error;
  }
}

/**
 * Check backend health
 */
export async function checkBackendHealth(config: PersonaCrystallizationConfig): Promise<any> {
  const healthId = generateOperationId();
  const startTime = Date.now();
  
  console.log(`🏥 [HEALTH:${healthId}] Starting backend health check`);

  const result = await retryWithBackoff(
    () => checkPersonaHealth(),
    'network',
    config
  );
  
  const duration = Date.now() - startTime;
  console.log(`✅ [HEALTH:${healthId}] Health check completed`, {
    duration_ms: duration,
    status: result.status
  });

  return result;
}

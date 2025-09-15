/**
 * Trace utilities for Persona Crystallization System
 * Extracted from personaCrystallizationMutations.ts for better organization
 */

import { Id } from "../_generated/dataModel";
import { PersonaCrystallizationError } from "./personaTypes";

/**
 * Robust trace ID conversion and validation
 * Ensures trace IDs are valid and belong to the specified user
 */
export const convertTraceIdsRobustly = async (ctx: any, traceIdStrings: string[], userId: string): Promise<{
  validIds: Id<"persona_traces">[],
  errors: PersonaCrystallizationError[]
}> => {
  const validIds: Id<"persona_traces">[] = [];
  const errors: PersonaCrystallizationError[] = [];

  for (const traceIdStr of traceIdStrings) {
    try {
      // Basic format validation
      if (!traceIdStr || typeof traceIdStr !== 'string') {
        errors.push({
          code: 'INVALID_TRACE_ID_FORMAT',
          message: 'Trace ID must be a non-empty string',
          details: { traceId: traceIdStr },
          timestamp: Date.now()
        });
        continue;
      }

      // Convex ID format validation (basic pattern check)
      if (!traceIdStr.match(/^[a-z0-9]+$/)) {
        errors.push({
          code: 'INVALID_TRACE_ID_PATTERN',
          message: 'Trace ID does not match expected Convex ID pattern',
          details: { traceId: traceIdStr },
          timestamp: Date.now()
        });
        continue;
      }

      // Attempt to retrieve and validate the trace
      const trace = await ctx.db.get(traceIdStr as Id<"persona_traces">);
      
      if (!trace) {
        errors.push({
          code: 'TRACE_NOT_FOUND',
          message: 'Referenced trace does not exist',
          details: { traceId: traceIdStr },
          timestamp: Date.now()
        });
        continue;
      }

      if (trace.userId !== userId) {
        errors.push({
          code: 'TRACE_UNAUTHORIZED',
          message: 'Referenced trace belongs to a different user',
          details: { traceId: traceIdStr, traceUserId: trace.userId, requestUserId: userId },
          timestamp: Date.now()
        });
        continue;
      }

      // If we reach here, the trace is valid
      validIds.push(traceIdStr as Id<"persona_traces">);

    } catch (error) {
      errors.push({
        code: 'TRACE_VALIDATION_ERROR',
        message: `Error validating trace: ${error instanceof Error ? error.message : 'Unknown error'}`,
        details: { traceId: traceIdStr, error: error instanceof Error ? error.message : 'Unknown error' },
        timestamp: Date.now()
      });
    }
  }

  return { validIds, errors };
};

/**
 * Generate a unique trace ID for manual traces
 */
export const generateManualTraceId = (): string => {
  return `manual_${Date.now()}_${Math.random().toString(36).substring(7)}`;
};

/**
 * Create default trace metadata for manual traces
 */
export const createDefaultTraceMetadata = (
  conversationId: string, 
  verbatimQuote: string, 
  userId: string
) => {
  const now = Date.now();
  return {
    conversation_id: conversationId,
    message_timestamp: now,
    extraction_timestamp: now,
    linguistic_markers: [],
    context_length: verbatimQuote.length,
    user_id: userId
  };
};

/**
 * Check if two arrays of trace IDs are equivalent (ignoring order)
 */
export const areTraceArraysEquivalent = (
  array1: Id<"persona_traces">[], 
  array2: Id<"persona_traces">[]
): boolean => {
  if (array1.length !== array2.length) return false;
  
  const sorted1 = [...array1].sort();
  const sorted2 = [...array2].sort();
  
  return JSON.stringify(sorted1) === JSON.stringify(sorted2);
};

/**
 * Merge evolution history entries, avoiding duplicates
 */
export const mergeEvolutionHistory = (
  existingHistory: any[], 
  newHistory: any[]
): any[] => {
  const merged = [...existingHistory];
  const existingTimestamps = new Set(existingHistory.map((e: any) => e.timestamp));
  
  for (const newEntry of newHistory) {
    if (!existingTimestamps.has(newEntry.timestamp)) {
      merged.push(newEntry);
    }
  }
  
  return merged.sort((a, b) => a.timestamp - b.timestamp);
};

/**
 * Check for significant changes in insight data
 */
export const hasSignificantChanges = (existing: any, updated: any): boolean => {
  return (
    existing.crystallized_insight !== updated.crystallized_insight ||
    Math.abs(existing.confidence - updated.confidence) > 0.001 ||
    Math.abs(existing.temporal_stability - updated.temporal_stability) > 0.001 ||
    !areTraceArraysEquivalent(existing.supporting_traces, updated.supporting_traces) ||
    JSON.stringify(existing.contradiction_flags.sort()) !== JSON.stringify(updated.contradiction_flags.sort()) ||
    JSON.stringify(existing.cross_pattern_correlations.sort()) !== JSON.stringify(updated.cross_pattern_correlations.sort())
  );
};

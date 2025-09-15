/**
 * Utility functions and constants for persona crystallization queries
 */

import { v } from "convex/values";
import { traceTypeValidator } from "./personaTypes";

// Pagination constants
export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 1000;
export const BACKEND_DEFAULT_PAGE_SIZE = 100;

// Common validator patterns
export const paginationValidator = v.object({
  hasMore: v.boolean(),
  nextCursor: v.optional(v.string()),
  totalCount: v.optional(v.number())
});

export const traceFilterValidator = v.object({
  traceTypes: v.optional(v.array(traceTypeValidator)),
  confidenceRange: v.optional(v.object({
    min: v.number(),
    max: v.number()
  })),
  timeRange: v.optional(v.object({
    start: v.number(),
    end: v.number()
  })),
  conversationIds: v.optional(v.array(v.id("conversations")))
});

export const metadataValidator = v.object({
  queryTimeMs: v.number(),
  filtersApplied: v.number(),
  sortApplied: v.string()
});

// Common trace format for backend consumption
export const backendTraceValidator = v.object({
  _id: v.id("persona_traces"),
  _creationTime: v.number(),
  user_id: v.string(),
  conversation_id: v.id("conversations"),
  trace_id: v.string(),
  trace_type: traceTypeValidator,
  verbatim_quote: v.string(),
  extracted_insight: v.string(),
  confidence: v.number(),
  context: v.string(),
  temporal_weight: v.number(),
  preference_strength: v.number(),
  metadata: v.optional(v.object({
    conversation_id: v.string(),
    message_timestamp: v.number(),
    extraction_timestamp: v.number(),
    linguistic_markers: v.array(v.string()),
    context_length: v.number(),
    user_id: v.string()
  }))
});

// Query utilities
export class QueryUtils {
  /**
   * Apply time window filter to a query
   * Handles timestamp format conversion for Convex compatibility
   */
  static applyTimeWindowFilter(query: any, timeWindowDays?: number, timeField = "_creationTime") {
    if (timeWindowDays) {
      // Convert to seconds since Convex _creationTime is in seconds
      const cutoffTimeMs = Date.now() - (timeWindowDays * 24 * 60 * 60 * 1000);
      const cutoffTime = timeField === "_creationTime" ? cutoffTimeMs / 1000 : cutoffTimeMs;
      return query.filter((q: any) => q.gte(q.field(timeField), cutoffTime));
    }
    return query;
  }

  /**
   * Apply trace type filter with OR logic
   */
  static applyTraceTypeFilter(query: any, traceTypes?: string[]) {
    if (traceTypes && traceTypes.length > 0) {
      return query.filter((q: any) => {
        let typeFilter = q.eq(q.field("trace_type"), traceTypes[0]);
        for (let i = 1; i < traceTypes.length; i++) {
          typeFilter = q.or(typeFilter, q.eq(q.field("trace_type"), traceTypes[i]));
        }
        return typeFilter;
      });
    }
    return query;
  }

  /**
   * Apply confidence range filter
   */
  static applyConfidenceFilter(query: any, minConfidence?: number, maxConfidence?: number) {
    let filteredQuery = query;
    if (minConfidence !== undefined) {
      filteredQuery = filteredQuery.filter((q: any) => q.gte(q.field("confidence"), minConfidence));
    }
    if (maxConfidence !== undefined) {
      filteredQuery = filteredQuery.filter((q: any) => q.lte(q.field("confidence"), maxConfidence));
    }
    return filteredQuery;
  }

  /**
   * Apply conversation filter with OR logic
   */
  static applyConversationFilter(query: any, conversationIds?: string[]) {
    if (conversationIds && conversationIds.length > 0) {
      return query.filter((q: any) => {
        let convFilter = q.eq(q.field("conversationId"), conversationIds[0]);
        for (let i = 1; i < conversationIds.length; i++) {
          convFilter = q.or(convFilter, q.eq(q.field("conversationId"), conversationIds[i]));
        }
        return convFilter;
      });
    }
    return query;
  }

  /**
   * Format trace for backend consumption
   */
  static formatTraceForBackend(trace: any, includeMetadata = true) {
    return {
      _id: trace._id,
      _creationTime: trace._creationTime,
      user_id: trace.user_id,
      conversation_id: trace.conversation_id,
      trace_id: trace.trace_id,
      trace_type: trace.trace_type,
      verbatim_quote: trace.verbatim_quote,
      extracted_insight: trace.extracted_insight,
      confidence: trace.confidence,
      context: trace.context,
      temporal_weight: trace.temporal_weight,
      preference_strength: trace.preference_strength,
      ...(includeMetadata && { metadata: trace.metadata })
    };
  }

  /**
   * Format insight for backend consumption
   */
  static formatInsightForBackend(insight: any, includeEvolution = true, includeTraces = true) {
    return {
      _id: insight._id,
      _creationTime: insight._creationTime,
      user_id: insight.user_id,
      insight_type: insight.insight_type,
      crystallized_insight: insight.crystallized_insight,
      confidence: insight.confidence,
      ...(includeTraces && { supporting_traces: insight.supporting_traces }),
      contradiction_flags: insight.contradiction_flags,
      ...(includeEvolution && { evolution_history: insight.evolution_history }),
      temporal_stability: insight.temporal_stability,
      cross_pattern_correlations: insight.cross_pattern_correlations,
      metadata: insight.metadata,
      created_at: insight.created_at,
      updated_at: insight.updated_at
    };
  }

  /**
   * Calculate confidence distribution
   */
  static calculateConfidenceDistribution(confidences: number[]) {
    return {
      high: confidences.filter(c => c >= 0.8).length,
      medium: confidences.filter(c => c >= 0.5 && c < 0.8).length,
      low: confidences.filter(c => c < 0.5).length
    };
  }

  /**
   * Calculate profile completeness score
   */
  static calculateProfileCompleteness(
    hasTraces: boolean,
    hasInsights: boolean,
    categoryCount: number,
    overallConfidence: number
  ): number {
    return Math.min(1.0, (
      (hasTraces ? 0.3 : 0) +
      (hasInsights ? 0.3 : 0) +
      (categoryCount * 0.05) + // 5% per category, up to 40%
      (overallConfidence * 0.4) // 40% based on overall confidence
    ));
  }

  /**
   * Validate and clamp limit parameter
   */
  static validateLimit(limit?: number, defaultLimit = DEFAULT_PAGE_SIZE, maxLimit = MAX_PAGE_SIZE): number {
    return Math.min(limit || defaultLimit, maxLimit);
  }

  /**
   * Handle pagination logic
   */
  static handlePagination<T>(results: T[], limit: number) {
    const hasMore = results.length > limit;
    const resultsToReturn = hasMore ? results.slice(0, limit) : results;
    const nextCursor = hasMore && resultsToReturn.length > 0 
      ? (resultsToReturn[resultsToReturn.length - 1] as any)._id 
      : undefined;

    return {
      results: resultsToReturn,
      pagination: {
        hasMore,
        nextCursor,
        totalCount: undefined // Expensive to compute, omit for performance
      }
    };
  }

  /**
   * Create error response with consistent format
   */
  static createErrorResponse(operation: string, error: any) {
    console.error(`❌ [PERSONA QUERIES] Error in ${operation}:`, error);
    return {
      traces: [],
      pagination: { hasMore: false },
      metadata: {
        queryTimeMs: 0,
        filtersApplied: 0,
        sortApplied: "error"
      }
    };
  }
}

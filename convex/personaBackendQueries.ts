/**
 * Backend-optimized queries for persona crystallization system
 * Designed for high-volume backend service consumption
 */

import { v } from "convex/values";
import { query } from "./_generated/server";
import { traceTypeValidator } from "./lib/personaTypes";
import { 
  BACKEND_DEFAULT_PAGE_SIZE, 
  MAX_PAGE_SIZE,
  QueryUtils,
  backendTraceValidator,
  paginationValidator
} from "./lib/personaQueryUtils";

/**
 * Get persona traces with backend-optimized pagination and filtering
 */
export const getPersonaTracesForBackend = query({
  args: {
    user_id: v.string(),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
    trace_types: v.optional(v.array(traceTypeValidator)),
    min_confidence: v.optional(v.number()),
    max_confidence: v.optional(v.number()),
    time_window_days: v.optional(v.number()),
    include_metadata: v.optional(v.boolean()),
    trace_ids: v.optional(v.array(v.string()))
  },
  returns: v.object({
    traces: v.array(backendTraceValidator),
    pagination: paginationValidator
  }),
  handler: async (ctx, args) => {
    const startTime = Date.now();
    console.log('🔄 [BACKEND QUERIES] Getting traces for backend consumption:', {
      user_id: args.user_id,
      limit: args.limit,
      filters: {
        trace_types: args.trace_types?.length,
        confidence: [args.min_confidence, args.max_confidence],
        time_window: args.time_window_days
      }
    });
    
    try {
      const limit = QueryUtils.validateLimit(args.limit, BACKEND_DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
      const includeMetadata = args.include_metadata !== false;
      
      // If specific trace IDs are provided, filter by those instead of using pagination
      if (args.trace_ids && args.trace_ids.length > 0) {
        console.log(`🔍 [BACKEND QUERIES] Filtering by specific trace IDs: ${args.trace_ids.length} traces`);
        
        // Get traces by specific IDs
        const tracePromises = args.trace_ids.map(async (traceId) => {
          const traces = await ctx.db
            .query("persona_traces")
            .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
            .filter((q) => q.eq(q.field("trace_id"), traceId))
            .collect();
          return traces;
        });
        
        const traceResults = await Promise.all(tracePromises);
        const allTraces = traceResults.flat();
        
        console.log(`🔍 [BACKEND QUERIES] Found ${allTraces.length} traces out of ${args.trace_ids.length} requested`);
        
        // Format results for backend consumption
        const formattedTraces = allTraces.map(trace => 
          QueryUtils.formatTraceForBackend(trace, includeMetadata)
        );

        return {
          traces: formattedTraces,
          pagination: { hasMore: false }
        };
      }

      // Start with base query for normal pagination
      let query = ctx.db
        .query("persona_traces")
        .withIndex("by_user", (q) => q.eq("user_id", args.user_id));

      // Apply filters using utility functions
      query = QueryUtils.applyTimeWindowFilter(query, args.time_window_days);
      query = QueryUtils.applyTraceTypeFilter(query, args.trace_types);
      query = QueryUtils.applyConfidenceFilter(query, args.min_confidence, args.max_confidence);

      // Execute query with pagination
      const traces = await query
        .order("desc")
        .take(limit + 1);

      const { results, pagination } = QueryUtils.handlePagination(traces, limit);

      // Format results for backend consumption
      const formattedTraces = results.map(trace => 
        QueryUtils.formatTraceForBackend(trace, includeMetadata)
      );

      console.log(`✅ [BACKEND QUERIES] Retrieved ${formattedTraces.length} traces for backend`);
      
      return {
        traces: formattedTraces,
        pagination
      };

    } catch (error) {
      console.error('❌ [BACKEND QUERIES] Error retrieving traces for backend:', error);
      return {
        traces: [],
        pagination: { hasMore: false }
      };
    }
  }
});

/**
 * Get crystallized insights with backend-optimized pagination and filtering
 */
export const getCrystallizedInsightsForBackend = query({
  args: {
    user_id: v.string(),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
    insight_types: v.optional(v.array(v.string())),
    min_confidence: v.optional(v.number()),
    min_stability: v.optional(v.number()),
    time_window_days: v.optional(v.number()),
    include_evolution_history: v.optional(v.boolean()),
    include_supporting_traces: v.optional(v.boolean())
  },
  returns: v.object({
    insights: v.array(v.object({
      _id: v.id("crystallized_insights"),
      _creationTime: v.number(),
      user_id: v.string(),
      insight_type: v.string(),
      crystallized_insight: v.string(),
      confidence: v.number(),
      supporting_traces: v.optional(v.array(v.id("persona_traces"))),
      contradiction_flags: v.array(v.string()),
      evolution_history: v.optional(v.array(v.object({
        timestamp: v.number(),
        event_type: v.union(
          v.literal("strengthened"),
          v.literal("weakened"), 
          v.literal("contradicted"),
          v.literal("refined")
        ),
        old_value: v.union(v.string(), v.null()),
        new_value: v.string(),
        trigger_trace_id: v.string(),
        confidence_change: v.number(),
        reason: v.string()
      }))),
      temporal_stability: v.number(),
      cross_pattern_correlations: v.array(v.string()),
      metadata: v.object({
        first_observed: v.number(),
        last_observed: v.number(),
        frequency: v.number(),
        contexts: v.array(v.string()),
        confidence_history: v.array(v.object({
          timestamp: v.number(),
          confidence: v.number()
        }))
      }),
      created_at: v.number(),
      updated_at: v.number()
    })),
    pagination: paginationValidator
  }),
  handler: async (ctx, args) => {
    console.log('🔮 [BACKEND QUERIES] Getting insights for backend consumption:', {
      user_id: args.user_id,
      limit: args.limit,
      filters: {
        insight_types: args.insight_types?.length,
        confidence: args.min_confidence,
        stability: args.min_stability,
        time_window: args.time_window_days
      }
    });
    
    try {
      const limit = QueryUtils.validateLimit(args.limit, BACKEND_DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE);
      const includeEvolution = args.include_evolution_history !== false;
      const includeTraces = args.include_supporting_traces !== false;
      
      // Start with base query
      let query = ctx.db
        .query("crystallized_insights")
        .withIndex("by_user", (q) => q.eq("user_id", args.user_id));

      // Apply time window filter on updated_at field
      query = QueryUtils.applyTimeWindowFilter(query, args.time_window_days, "updated_at");

      // Apply insight type filter
      if (args.insight_types && args.insight_types.length > 0) {
        query = query.filter((q) => {
          let typeFilter = q.eq(q.field("insight_type"), args.insight_types![0]);
          for (let i = 1; i < args.insight_types!.length; i++) {
            typeFilter = q.or(typeFilter, q.eq(q.field("insight_type"), args.insight_types![i]));
          }
          return typeFilter;
        });
      }

      // Apply confidence and stability filters
      query = QueryUtils.applyConfidenceFilter(query, args.min_confidence);
      if (args.min_stability !== undefined) {
        query = query.filter((q) => q.gte(q.field("temporal_stability"), args.min_stability!));
      }

      // Execute query with pagination
      const insights = await query
        .order("desc")
        .take(limit + 1);

      const { results, pagination } = QueryUtils.handlePagination(insights, limit);

      // Format results for backend consumption
      const formattedInsights = results.map(insight => 
        QueryUtils.formatInsightForBackend(insight, includeEvolution, includeTraces)
      );

      console.log(`✅ [BACKEND QUERIES] Retrieved ${formattedInsights.length} insights for backend`);
      
      return {
        insights: formattedInsights,
        pagination
      };

    } catch (error) {
      console.error('❌ [BACKEND QUERIES] Error retrieving insights for backend:', error);
      return {
        insights: [],
        pagination: { hasMore: false }
      };
    }
  }
});

/**
 * Get traces in the exact format expected by the backend services
 */
export const getTracesInBackendFormat = query({
  args: {
    user_id: v.string(),
    conversation_ids: v.optional(v.array(v.id("conversations"))),
    since_timestamp: v.optional(v.number()),
    include_raw_metadata: v.optional(v.boolean())
  },
  returns: v.array(v.object({
    trace_id: v.string(),
    trace_type: traceTypeValidator,
    verbatim_quote: v.string(),
    extracted_insight: v.string(),
    confidence: v.number(),
    context: v.string(),
    temporal_weight: v.number(),
    preference_strength: v.number(),
    metadata: v.object({
      conversation_id: v.string(),
      message_timestamp: v.number(),
      extraction_timestamp: v.number(),
      linguistic_markers: v.array(v.string()),
      context_length: v.number(),
      user_id: v.string()
    })
  })),
  handler: async (ctx, args) => {
    console.log('🔄 [BACKEND FORMAT] Getting traces in backend format:', {
      user_id: args.user_id,
      conversation_filter: args.conversation_ids?.length,
      since_timestamp: args.since_timestamp
    });
    
    try {
      let query = ctx.db
        .query("persona_traces")
        .withIndex("by_user", (q) => q.eq("user_id", args.user_id));

      // Handle conversation filtering with bulk queries
      if (args.conversation_ids && args.conversation_ids.length > 0) {
        const allTraces = [];
        for (const conversationId of args.conversation_ids) {
          const conversationTraces = await ctx.db
            .query("persona_traces")
            .withIndex("by_conversation", (q) => q.eq("conversation_id", conversationId))
            .filter((q) => q.eq(q.field("user_id"), args.user_id))
            .collect();
          allTraces.push(...conversationTraces);
        }
        
        // Apply time filter and format
        let filteredTraces = allTraces;
        if (args.since_timestamp) {
          filteredTraces = allTraces.filter(trace => trace._creationTime >= args.since_timestamp!);
        }
        
        return filteredTraces.map(trace => ({
          trace_id: trace.trace_id,
          trace_type: trace.trace_type,
          verbatim_quote: trace.verbatim_quote,
          extracted_insight: trace.extracted_insight,
          confidence: trace.confidence,
          context: trace.context,
          temporal_weight: trace.temporal_weight,
          preference_strength: trace.preference_strength,
          metadata: trace.metadata
        }));
      }

      // Apply time filter if provided
      query = QueryUtils.applyTimeWindowFilter(query, undefined);
      if (args.since_timestamp) {
        query = query.filter((q) => q.gte(q.field("_creationTime"), args.since_timestamp!));
      }

      const traces = await query.order("desc").take(1000);

      // Format traces to match backend expectations exactly
      const formattedTraces = traces.map(trace => ({
        trace_id: trace.trace_id,
        trace_type: trace.trace_type,
        verbatim_quote: trace.verbatim_quote,
        extracted_insight: trace.extracted_insight,
        confidence: trace.confidence,
        context: trace.context,
        temporal_weight: trace.temporal_weight,
        preference_strength: trace.preference_strength,
        metadata: trace.metadata
      }));

      console.log(`✅ [BACKEND FORMAT] Formatted ${formattedTraces.length} traces for backend`);
      return formattedTraces;

    } catch (error) {
      console.error('❌ [BACKEND FORMAT] Error formatting traces for backend:', error);
      return [];
    }
  }
});

/**
 * Bulk trace retrieval for batch processing by backend services
 */
export const bulkGetTracesByConversations = query({
  args: {
    user_id: v.string(),
    conversation_ids: v.array(v.id("conversations")),
    limit: v.optional(v.number())
  },
  returns: v.object({
    traces_by_conversation: v.record(v.string(), v.array(v.object({
      _id: v.id("persona_traces"),
      trace_id: v.string(),
      trace_type: traceTypeValidator,
      verbatim_quote: v.string(),
      extracted_insight: v.string(),
      confidence: v.number(),
      context: v.string(),
      temporal_weight: v.number(),
      preference_strength: v.number(),
      _creationTime: v.number()
    }))),
    total_traces: v.number(),
    conversations_processed: v.number()
  }),
  handler: async (ctx, args) => {
    console.log('📦 [BACKEND QUERIES] Bulk retrieving traces for conversations:', {
      user_id: args.user_id,
      conversation_count: args.conversation_ids.length,
      limit: args.limit
    });
    
    try {
      const limit = args.limit || MAX_PAGE_SIZE;
      const tracesByConversation: Record<string, any[]> = {};
      let totalTraces = 0;
      let conversationsProcessed = 0;

      // Process conversations in batches to avoid overwhelming the database
      for (const conversationId of args.conversation_ids) {
        const traces = await ctx.db
          .query("persona_traces")
          .withIndex("by_conversation", (q) => q.eq("conversation_id", conversationId))
          .filter((q) => q.eq(q.field("user_id"), args.user_id))
          .order("desc")
          .take(Math.min(limit - totalTraces, 100));

        if (traces.length > 0) {
          tracesByConversation[conversationId] = traces.map(trace => ({
            _id: trace._id,
            trace_id: trace.trace_id,
            trace_type: trace.trace_type,
            verbatim_quote: trace.verbatim_quote,
            extracted_insight: trace.extracted_insight,
            confidence: trace.confidence,
            context: trace.context,
            temporal_weight: trace.temporal_weight,
            preference_strength: trace.preference_strength,
            _creationTime: trace._creationTime
          }));
          totalTraces += traces.length;
        }
        
        conversationsProcessed++;
        
        if (totalTraces >= limit) break;
      }

      console.log(`✅ [BACKEND QUERIES] Bulk retrieved ${totalTraces} traces from ${conversationsProcessed} conversations`);
      
      return {
        traces_by_conversation: tracesByConversation,
        total_traces: totalTraces,
        conversations_processed: conversationsProcessed
      };

    } catch (error) {
      console.error('❌ [BACKEND QUERIES] Error bulk retrieving traces:', error);
      return {
        traces_by_conversation: {},
        total_traces: 0,
        conversations_processed: 0
      };
    }
  }
});

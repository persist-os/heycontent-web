/**
 * Analytics and monitoring queries for persona crystallization system
 */

import { v } from "convex/values";
import { query } from "./_generated/server";
import { traceTypeValidator } from "./lib/personaTypes";
import { QueryUtils } from "./lib/personaQueryUtils";

/**
 * Get aggregated trace statistics for backend analytics
 */
export const getTraceStatisticsForBackend = query({
  args: {
    userId: v.string(),
    timeWindowDays: v.optional(v.number()),
    groupBy: v.optional(v.union(
      v.literal("trace_type"),
      v.literal("confidence_range"),
      v.literal("daily"),
      v.literal("weekly")
    ))
  },
  returns: v.object({
    statistics: v.object({
      totalTraces: v.number(),
      averageConfidence: v.number(),
      confidenceDistribution: v.object({
        high: v.number(),
        medium: v.number(),
        low: v.number()
      }),
      traceTypeDistribution: v.record(v.string(), v.number()),
      temporalTrends: v.optional(v.any()),
      timeRange: v.object({
        start: v.number(),
        end: v.number()
      })
    }),
    metadata: v.object({
      computedAt: v.number(),
      queryTimeMs: v.number(),
      cacheHit: v.boolean()
    })
  }),
  handler: async (ctx, args) => {
    const startTime = Date.now();
    console.log('📊 [ANALYTICS] Computing trace statistics:', {
      userId: args.userId,
      timeWindow: args.timeWindowDays,
      groupBy: args.groupBy
    });
    
    try {
      const timeWindow = args.timeWindowDays || 30;
      const cutoffTimeMs = Date.now() - (timeWindow * 24 * 60 * 60 * 1000);
      const cutoffTime = cutoffTimeMs / 1000; // Convert to seconds for Convex _creationTime
      const endTime = Date.now();

      // Get all traces within time window
      const traces = await ctx.db
        .query("persona_traces")
        .withIndex("by_user", (q) => q.eq("user_id", args.userId))
        .filter((q) => q.gte(q.field("_creationTime"), cutoffTime))
        .collect();

      // Compute basic statistics
      const totalTraces = traces.length;
      const averageConfidence = traces.length > 0 
        ? traces.reduce((sum, t) => sum + t.confidence, 0) / traces.length 
        : 0;

      // Use utility function for confidence distribution
      const confidences = traces.map(t => t.confidence);
      const confidenceDistribution = QueryUtils.calculateConfidenceDistribution(confidences);

      // Trace type distribution
      const traceTypeDistribution: Record<string, number> = {};
      traces.forEach(trace => {
        traceTypeDistribution[trace.trace_type] = (traceTypeDistribution[trace.trace_type] || 0) + 1;
      });

      // Temporal trends (if requested)
      let temporalTrends = undefined;
      if (args.groupBy === "daily" || args.groupBy === "weekly") {
        const bucketSize = args.groupBy === "daily" ? 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;
        const trends: Record<string, number> = {};
        
        traces.forEach(trace => {
          const bucket = Math.floor(trace._creationTime / bucketSize) * bucketSize;
          const bucketKey = new Date(bucket).toISOString().split('T')[0];
          trends[bucketKey] = (trends[bucketKey] || 0) + 1;
        });
        
        temporalTrends = trends;
      }

      const queryTime = Date.now() - startTime;
      
      console.log(`✅ [ANALYTICS] Computed statistics for ${totalTraces} traces in ${queryTime}ms`);
      
      return {
        statistics: {
          totalTraces,
          averageConfidence: Math.round(averageConfidence * 1000) / 1000,
          confidenceDistribution,
          traceTypeDistribution,
          temporalTrends,
          timeRange: { start: cutoffTime, end: endTime }
        },
        metadata: {
          computedAt: Date.now(),
          queryTimeMs: queryTime,
          cacheHit: false
        }
      };

    } catch (error) {
      console.error('❌ [ANALYTICS] Error computing trace statistics:', error);
      return {
        statistics: {
          totalTraces: 0,
          averageConfidence: 0,
          confidenceDistribution: { high: 0, medium: 0, low: 0 },
          traceTypeDistribution: {},
          timeRange: { start: 0, end: 0 }
        },
        metadata: {
          computedAt: Date.now(),
          queryTimeMs: Date.now() - startTime,
          cacheHit: false
        }
      };
    }
  }
});

/**
 * Get trace statistics by type for analytics
 */
export const getTraceStatsByType = query({
  args: {
    userId: v.string(),
    timeWindow: v.optional(v.number())
  },
  returns: v.object({
    totalTraces: v.number(),
    tracesByType: v.any(),
    confidenceByType: v.any(),
    timeRange: v.object({
      start: v.number(),
      end: v.number()
    })
  }),
  handler: async (ctx, args) => {
    console.log('📊 [ANALYTICS] Getting trace statistics by type for user:', args.userId);
    
    try {
      const timeWindow = args.timeWindow || 30;
      const cutoffTimeMs = Date.now() - (timeWindow * 24 * 60 * 60 * 1000);
      const cutoffTime = cutoffTimeMs / 1000; // Convert to seconds for Convex _creationTime

      const traces = await ctx.db
        .query("persona_traces")
        .withIndex("by_user", (q) => q.eq("user_id", args.userId))
        .filter((q) => q.gte(q.field("_creationTime"), cutoffTime))
        .collect();

      // Count traces by type and calculate confidence
      const tracesByType: Record<string, number> = {};
      const confidenceByType: Record<string, number[]> = {};

      traces.forEach(trace => {
        tracesByType[trace.trace_type] = (tracesByType[trace.trace_type] || 0) + 1;
        
        if (!confidenceByType[trace.trace_type]) {
          confidenceByType[trace.trace_type] = [];
        }
        confidenceByType[trace.trace_type].push(trace.confidence);
      });

      // Calculate average confidence by type
      const avgConfidenceByType: Record<string, number> = {};
      Object.entries(confidenceByType).forEach(([type, confidences]) => {
        avgConfidenceByType[type] = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
      });

      return {
        totalTraces: traces.length,
        tracesByType,
        confidenceByType: avgConfidenceByType,
        timeRange: { start: cutoffTime, end: Date.now() }
      };

    } catch (error) {
      console.error('❌ [ANALYTICS] Error getting trace statistics:', error);
      return {
        totalTraces: 0,
        tracesByType: {},
        confidenceByType: {},
        timeRange: { start: 0, end: 0 }
      };
    }
  }
});

/**
 * Real-time monitoring query for backend health checks
 */
export const getPersonaSystemHealthMetrics = query({
  args: {
    timeWindowMinutes: v.optional(v.number())
  },
  returns: v.object({
    metrics: v.object({
      totalTraces: v.number(),
      totalInsights: v.number(),
      totalTriggers: v.number(),
      recentActivity: v.object({
        tracesLast24h: v.number(),
        insightsLast24h: v.number(),
        triggersLast24h: v.number()
      }),
      healthStatus: v.union(
        v.literal("healthy"),
        v.literal("warning"),
        v.literal("critical")
      ),
      dataQuality: v.object({
        averageConfidence: v.number(),
        highConfidencePercentage: v.number(),
        orphanedTraces: v.number()
      })
    }),
    timestamp: v.number()
  }),
  handler: async (ctx, args) => {
    console.log('🏥 [HEALTH CHECK] Computing persona system health metrics');
    
    try {
      const timeWindow = args.timeWindowMinutes || 60;
      const cutoffTime = Date.now() - (timeWindow * 60 * 1000);
      const last24hMs = Date.now() - (24 * 60 * 60 * 1000);
      const last24h = last24hMs / 1000; // Convert to seconds for _creationTime

      // Get counts efficiently using database aggregation
      const [totalTraces, totalInsights, totalTriggers] = await Promise.all([
        ctx.db.query("persona_traces").collect().then(traces => traces.length),
        ctx.db.query("crystallized_insights").collect().then(insights => insights.length),
        ctx.db.query("persona_crystallization_triggers").collect().then(triggers => triggers.length)
      ]);

      // Recent activity (last 24 hours)
      const [recentTraces, recentInsights, recentTriggers] = await Promise.all([
        ctx.db.query("persona_traces")
          .filter((q) => q.gte(q.field("_creationTime"), last24h))
          .collect()
          .then(traces => traces.length),
        ctx.db.query("crystallized_insights")
          .filter((q) => q.gte(q.field("updated_at"), last24hMs)) // updatedAt might be in milliseconds
          .collect()
          .then(insights => insights.length),
        ctx.db.query("persona_crystallization_triggers")
          .filter((q) => q.gte(q.field("created_at"), last24h))
          .collect()
          .then(triggers => triggers.length)
      ]);

      // Data quality metrics (sample for performance)
      const allTraces = await ctx.db.query("persona_traces").take(1000);
      const averageConfidence = allTraces.length > 0 
        ? allTraces.reduce((sum, t) => sum + t.confidence, 0) / allTraces.length 
        : 0;
      
      const highConfidenceCount = allTraces.filter(t => t.confidence >= 0.8).length;
      const highConfidencePercentage = allTraces.length > 0 
        ? (highConfidenceCount / allTraces.length) * 100 
        : 0;

      // Determine health status
      let healthStatus: "healthy" | "warning" | "critical" = "healthy";
      if (averageConfidence < 0.5 || highConfidencePercentage < 30) {
        healthStatus = "warning";
      }
      if (averageConfidence < 0.3 || totalTraces === 0) {
        healthStatus = "critical";
      }

      const metrics = {
        totalTraces,
        totalInsights,
        totalTriggers,
        recentActivity: {
          tracesLast24h: recentTraces,
          insightsLast24h: recentInsights,
          triggersLast24h: recentTriggers
        },
        healthStatus,
        dataQuality: {
          averageConfidence: Math.round(averageConfidence * 1000) / 1000,
          highConfidencePercentage: Math.round(highConfidencePercentage * 100) / 100,
          orphanedTraces: 0 // Expensive to compute, placeholder
        }
      };

      console.log(`✅ [HEALTH CHECK] Health status: ${healthStatus}, Traces: ${totalTraces}, Insights: ${totalInsights}`);
      
      return { metrics, timestamp: Date.now() };

    } catch (error) {
      console.error('❌ [HEALTH CHECK] Error computing health metrics:', error);
      return {
        metrics: {
          totalTraces: 0,
          totalInsights: 0,
          totalTriggers: 0,
          recentActivity: { tracesLast24h: 0, insightsLast24h: 0, triggersLast24h: 0 },
          healthStatus: "critical" as const,
          dataQuality: { averageConfidence: 0, highConfidencePercentage: 0, orphanedTraces: 0 }
        },
        timestamp: Date.now()
      };
    }
  }
});

/**
 * Advanced pagination query using cursor-based pagination for large datasets
 */
export const getPersonaTracesWithCursorPagination = query({
  args: {
    userId: v.string(),
    cursor: v.optional(v.string()),
    limit: v.optional(v.number()),
    filters: v.optional(v.object({
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
    })),
    sortBy: v.optional(v.union(
      v.literal("creationTime"),
      v.literal("confidence"),
      v.literal("temporalWeight")
    )),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc")))
  },
  returns: v.object({
    traces: v.array(v.object({
      _id: v.id("persona_traces"),
      _creationTime: v.number(),
      userId: v.string(),
      conversationId: v.id("conversations"),
      trace_id: v.string(),
      trace_type: traceTypeValidator,
      verbatim_quote: v.string(),
      extracted_insight: v.string(),
      confidence: v.number(),
      context: v.string(),
      temporal_weight: v.number(),
      preference_strength: v.number()
    })),
    pagination: v.object({
      nextCursor: v.optional(v.string()),
      hasMore: v.boolean(),
      totalEstimate: v.optional(v.number())
    }),
    metadata: v.object({
      queryTimeMs: v.number(),
      filtersApplied: v.number(),
      sortApplied: v.string()
    })
  }),
  handler: async (ctx, args) => {
    const startTime = Date.now();
    console.log('📄 [CURSOR PAGINATION] Advanced pagination query:', {
      userId: args.userId,
      cursor: args.cursor ? "provided" : "none",
      limit: args.limit,
      filters: Object.keys(args.filters || {}).length
    });
    
    try {
      const limit = QueryUtils.validateLimit(args.limit);
      const sortOrder = args.sortOrder || "desc";
      let filtersApplied = 0;

      // Start with base query
      let query = ctx.db
        .query("persona_traces")
        .withIndex("by_user", (q) => q.eq("user_id", args.userId));

      // Apply filters using utility functions
      if (args.filters) {
        const { traceTypes, confidenceRange, timeRange, conversationIds } = args.filters;

        if (traceTypes && traceTypes.length > 0) {
          query = QueryUtils.applyTraceTypeFilter(query, traceTypes);
          filtersApplied++;
        }

        if (confidenceRange) {
          query = QueryUtils.applyConfidenceFilter(query, confidenceRange.min, confidenceRange.max);
          filtersApplied++;
        }

        if (timeRange) {
          query = query.filter((q) => 
            q.and(
              q.gte(q.field("_creationTime"), timeRange.start),
              q.lte(q.field("_creationTime"), timeRange.end)
            )
          );
          filtersApplied++;
        }

        if (conversationIds && conversationIds.length > 0) {
          query = QueryUtils.applyConversationFilter(query, conversationIds);
          filtersApplied++;
        }
      }

      const traces = await query
        .order(sortOrder as "asc" | "desc")
        .take(limit + 1);

      const { results, pagination } = QueryUtils.handlePagination(traces, limit);

      // Format results
      const formattedTraces = results.map(trace => ({
        _id: trace._id,
        _creationTime: trace._creationTime,
        userId: trace.user_id,
        conversationId: trace.conversation_id,
        trace_id: trace.trace_id,
        trace_type: trace.trace_type,
        verbatim_quote: trace.verbatim_quote,
        extracted_insight: trace.extracted_insight,
        confidence: trace.confidence,
        context: trace.context,
        temporal_weight: trace.temporal_weight,
        preference_strength: trace.preference_strength
      }));

      const queryTime = Date.now() - startTime;
      
      console.log(`✅ [CURSOR PAGINATION] Retrieved ${formattedTraces.length} traces in ${queryTime}ms`);
      
      return {
        traces: formattedTraces,
        pagination,
        metadata: {
          queryTimeMs: queryTime,
          filtersApplied,
          sortApplied: `${args.sortBy || "creationTime"}_${sortOrder}`
        }
      };

    } catch (error) {
      const errorResponse = QueryUtils.createErrorResponse("cursor pagination", error);
      return {
        ...errorResponse,
        traces: [],
        metadata: {
          queryTimeMs: Date.now() - startTime,
          filtersApplied: 0,
          sortApplied: "error"
        }
      };
    }
  }
});

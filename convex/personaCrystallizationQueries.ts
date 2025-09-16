/**
 * Core persona crystallization queries for frontend consumption
 * Main queries used by the UI components
 */

import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import {
  PersonaTrace,
  CrystallizedInsight,
  UserPersonaProfile,
  TraceType,
  traceTypeValidator
} from "./lib/personaTypes";
import { DEFAULT_PAGE_SIZE, QueryUtils } from "./lib/personaQueryUtils";

/**
 * Get persona traces for a user with optional filtering
 */
export const getPersonaTraces = query({
  args: {
    user_id: v.string(),
    conversation_id: v.optional(v.id("conversations")),
    trace_type: v.optional(traceTypeValidator),
    limit: v.optional(v.number()),
    min_confidence: v.optional(v.number())
  },
  returns: v.array(v.object({
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
    console.log('📋 [PERSONA QUERIES] Getting persona traces for user:', args.user_id);
    
    try {
      let query = ctx.db
        .query("persona_traces")
        .withIndex("by_user", (q) => q.eq("user_id", args.user_id));

      // Apply conversation filter if specified
      if (args.conversation_id) {
        query = ctx.db
          .query("persona_traces")
          .withIndex("by_conversation", (q) => q.eq("conversation_id", args.conversation_id));
      }

      // Apply filters using utility functions
      query = QueryUtils.applyTraceTypeFilter(query, args.trace_type ? [args.trace_type] : undefined);
      query = QueryUtils.applyConfidenceFilter(query, args.min_confidence);

      // Order by creation time and apply limit
      const traces = await query
        .order("desc")
        .take(args.limit || DEFAULT_PAGE_SIZE);

      console.log(`✅ [PERSONA QUERIES] Retrieved ${traces.length} persona traces`);
      return traces;

    } catch (error) {
      console.error('❌ [PERSONA QUERIES] Error retrieving persona traces:', error);
      return [];
    }
  }
});


/**
 * Simple query to get traces by their IDs for backend use
 */
export const getTracesByIds = query({
  args: {
    userId: v.string(),
    traceIds: v.array(v.string())
  },
  returns: v.object({
    success: v.boolean(),
    data: v.object({
      pagination: v.object({
        hasMore: v.boolean()
      }),
      traces: v.array(v.any())
    })
  }),
  handler: async (ctx, args) => {
    console.log(`🔍 [GET-TRACES-BY-IDS] Fetching ${args.traceIds.length} traces for user: ${args.userId}`);

    try {
      // Get all traces for the user
      const allTraces = await ctx.db
          .query("persona_traces")
          .withIndex("by_user", (q) => q.eq("user_id", args.userId))
          .collect();

      // Filter to only the requested trace IDs
      const matchingTraces = allTraces.filter(trace =>
          args.traceIds.includes(trace.trace_id)
      );

      console.log(`🔍 [GET-TRACES-BY-IDS] Found ${matchingTraces.length} out of ${args.traceIds.length} requested traces`);

      return {
        success: true,
        data: {
          pagination: { hasMore: false },
          traces: matchingTraces
        }
      };
    } catch (error) {
      console.error('❌ [GET-TRACES-BY-IDS] Error fetching traces:', error);
      return {
        success: false,
        data: {
          pagination: { hasMore: false },
          traces: []
        }
      };
    }
  }
});

/**
 * Get crystallized insights for a user
 */
export const getCrystallizedInsights = query({
  args: {
    user_id: v.string(),
    insight_type: v.optional(v.string()),
    min_confidence: v.optional(v.number()),
    min_stability: v.optional(v.number()),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    _id: v.id("crystallized_insights"),
    _creationTime: v.number(),
    user_id: v.string(),
    insight_type: v.string(),
    crystallized_insight: v.string(),
    confidence: v.number(),
    supporting_traces: v.array(v.id("persona_traces")),
      contradiction_flags: v.union(v.array(v.string()), v.null()),
    evolution_history: v.array(v.object({
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
    })),
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
  handler: async (ctx, args) => {
    console.log('🔮 [PERSONA QUERIES] Getting crystallized insights for user:', args.user_id);
    
    try {
      let query = ctx.db
        .query("crystallized_insights")
        .withIndex("by_user", (q) => q.eq("user_id", args.user_id));

      // Apply filters
      if (args.insight_type) {
        query = query.filter((q) => q.eq(q.field("insight_type"), args.insight_type));
      }

      query = QueryUtils.applyConfidenceFilter(query, args.min_confidence);

      if (args.min_stability !== undefined) {
        query = query.filter((q) => q.gte(q.field("temporal_stability"), args.min_stability));
      }

      const insights = await query
        .order("desc")
        .take(args.limit || DEFAULT_PAGE_SIZE);

      console.log(`✅ [PERSONA QUERIES] Retrieved ${insights.length} crystallized insights`);
      return insights;

    } catch (error) {
      console.error('❌ [PERSONA QUERIES] Error retrieving crystallized insights:', error);
      return [];
    }
  }
});

/**
 * Get comprehensive user persona profile for AI context injection
 */
export const getUserPersonaProfile = query({
  args: {
    user_id: v.string(),
    include_recent_traces: v.optional(v.boolean()),
    trace_limit: v.optional(v.number()),
    insight_limit: v.optional(v.number()),
    _refresh_key: v.optional(v.number()) // Force refresh when changed
  },
  returns: v.object({
    user_id: v.string(),
    recent_traces: v.array(v.object({
      trace_type: traceTypeValidator,
      extracted_insight: v.string(),
      confidence: v.number(),
      context: v.string(),
      temporal_weight: v.number(),
      preference_strength: v.number(),
      created_at: v.number()
    })),
    crystallized_insights: v.array(v.object({
      insight_type: v.string(),
      crystallized_insight: v.string(),
      confidence: v.number(),
      temporal_stability: v.number(),
      contexts: v.array(v.string()),
      last_observed: v.number()
    })),
    confidence_scores: v.object({
      overall: v.number(),
      by_category: v.any()
    }),
    last_updated: v.number(),
    profile_completeness: v.number(),
    summary: v.object({
      total_traces: v.number(),
      total_insights: v.number(),
      top_categories: v.array(v.string()),
      confidence_distribution: v.any(),
      recent_activity: v.number()
    })
  }),
  handler: async (ctx, args) => {
    console.log('👤 [PERSONA QUERIES] Building comprehensive persona profile for user:', args.user_id);
    
    try {
      const includeTraces = args.include_recent_traces !== false;
      const traceLimit = args.trace_limit || 20;
      const insightLimit = args.insight_limit || 10;

      // Get recent traces
      let recentTraces: any[] = [];
      if (includeTraces) {
        const tracesQuery = await ctx.db
          .query("persona_traces")
          .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
          .order("desc")
          .take(traceLimit);

        recentTraces = tracesQuery
          .filter(trace => {
            return trace.trace_type && 
                   trace.extracted_insight && 
                   typeof trace.confidence === 'number' &&
                   trace.context &&
                   typeof trace.temporal_weight === 'number' &&
                   typeof trace.preference_strength === 'number' &&
                   trace._creationTime;
          })
          .map(trace => ({
            trace_type: trace.trace_type,
            extracted_insight: trace.extracted_insight,
            confidence: trace.confidence,
            context: trace.context,
            temporal_weight: trace.temporal_weight,
            preference_strength: trace.preference_strength,
            created_at: trace._creationTime
          }));
      }

      // Get crystallized insights
      const insightsQuery = await ctx.db
        .query("crystallized_insights")
        .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
        .order("desc")
        .take(insightLimit);

      const crystallizedInsights = insightsQuery.map(insight => ({
        insight_type: insight.insight_type,
        crystallized_insight: insight.crystallized_insight,
        confidence: insight.confidence,
        temporal_stability: insight.temporal_stability,
        contexts: insight.metadata.contexts,
        last_observed: insight.metadata.last_observed
      }));

      // Calculate confidence scores
      const allConfidences = [
        ...recentTraces.map(t => t.confidence),
        ...crystallizedInsights.map(i => i.confidence)
      ];
      
      const overallConfidence = allConfidences.length > 0 
        ? allConfidences.reduce((sum, conf) => sum + conf, 0) / allConfidences.length 
        : 0;

      // Calculate confidence by category
      const categoryConfidences: Record<string, number[]> = {};
      recentTraces.forEach(trace => {
        if (!categoryConfidences[trace.trace_type]) {
          categoryConfidences[trace.trace_type] = [];
        }
        categoryConfidences[trace.trace_type].push(trace.confidence);
      });

      const confidenceByCategory: Record<string, number> = {};
      Object.entries(categoryConfidences).forEach(([category, confidences]) => {
        confidenceByCategory[category] = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
      });

      // Calculate profile completeness using utility function
      const hasTraces = recentTraces.length > 0;
      const hasInsights = crystallizedInsights.length > 0;
      const categoryCount = Object.keys(categoryConfidences).length;
      const profileCompleteness = QueryUtils.calculateProfileCompleteness(
        hasTraces, hasInsights, categoryCount, overallConfidence
      );

      // Get last update time
      const latestTraceTime = recentTraces[0]?.created_at || 0;
      const latestInsightTime = insightsQuery[0]?.updated_at || 0;
      const lastUpdated = Math.max(latestTraceTime, latestInsightTime, 0);

      // Build summary statistics
      const topCategories = Object.entries(categoryConfidences)
        .sort(([,a], [,b]) => b.length - a.length)
        .slice(0, 5)
        .map(([category]) => category);

      const confidenceDistribution = QueryUtils.calculateConfidenceDistribution(allConfidences);

      // Calculate recent activity using consistent timestamp format
      // Convex _creationTime is in seconds, so convert comparison timestamp to seconds
      const sevenDaysAgoInSeconds = (Date.now() - (7 * 24 * 60 * 60 * 1000)) / 1000;
      const recentActivity = recentTraces.filter(t => 
        t.created_at > sevenDaysAgoInSeconds
      ).length;

      const profile = {
        user_id: args.user_id,
        recent_traces: recentTraces,
        crystallized_insights: crystallizedInsights,
        confidence_scores: {
          overall: Math.round(overallConfidence * 100) / 100,
          by_category: confidenceByCategory
        },
        last_updated: lastUpdated,
        profile_completeness: Math.round(profileCompleteness * 100) / 100,
        summary: {
          total_traces: recentTraces.length,
          total_insights: crystallizedInsights.length,
          top_categories: topCategories,
          confidence_distribution: confidenceDistribution,
          recent_activity: recentActivity
        }
      };

      console.log(`✅ [PERSONA QUERIES] Built persona profile with ${recentTraces.length} traces, ${crystallizedInsights.length} insights, ${Math.round(profileCompleteness * 100)}% complete`);
      
      // Log the complete persona profile for debugging
      console.log('📊 [PERSONA PROFILE] Complete profile data for user:', args.user_id);
      console.log('📊 [PERSONA PROFILE] Profile structure:', JSON.stringify(profile, null, 2));
      
      // Log specific sections for easier analysis
      console.log('📊 [PERSONA PROFILE] Recent traces summary:', {
        count: profile.recent_traces.length,
        trace_types: [...new Set(profile.recent_traces.map(t => t.trace_type))],
        avg_confidence: profile.recent_traces.length > 0 
          ? profile.recent_traces.reduce((sum, t) => sum + t.confidence, 0) / profile.recent_traces.length 
          : 0
      });
      
      console.log('📊 [PERSONA PROFILE] Crystallized insights summary:', {
        count: profile.crystallized_insights.length,
        insight_types: [...new Set(profile.crystallized_insights.map(i => i.insight_type))],
        avg_confidence: profile.crystallized_insights.length > 0 
          ? profile.crystallized_insights.reduce((sum, i) => sum + i.confidence, 0) / profile.crystallized_insights.length 
          : 0,
        avg_stability: profile.crystallized_insights.length > 0 
          ? profile.crystallized_insights.reduce((sum, i) => sum + i.temporal_stability, 0) / profile.crystallized_insights.length 
          : 0
      });
      
      console.log('📊 [PERSONA PROFILE] Confidence analysis:', profile.confidence_scores);
      console.log('📊 [PERSONA PROFILE] Profile metrics:', {
        completeness: profile.profile_completeness,
        last_updated: new Date(profile.last_updated * 1000).toISOString(),
        recent_activity: profile.summary.recent_activity
      });
      
      return profile;

    } catch (error) {
      console.error('❌ [PERSONA QUERIES] Error building persona profile:', error);
      
      return {
        user_id: args.user_id,
        recent_traces: [],
        crystallized_insights: [],
        confidence_scores: { overall: 0, by_category: {} },
        last_updated: 0,
        profile_completeness: 0,
        summary: {
          total_traces: 0,
          total_insights: 0,
          top_categories: [],
          confidence_distribution: { high: 0, medium: 0, low: 0 },
          recent_activity: 0
        }
      };
    }
  }
});

/**
 * Search traces by semantic similarity using text matching
 */
export const searchTracesBySimilarity = query({
  args: {
    user_id: v.string(),
    search_query: v.string(),
    limit: v.optional(v.number()),
    trace_type: v.optional(traceTypeValidator),
    min_confidence: v.optional(v.number())
  },
  returns: v.array(v.object({
    trace: v.object({
      _id: v.id("persona_traces"),
      trace_type: traceTypeValidator,
      verbatim_quote: v.string(),
      extracted_insight: v.string(),
      confidence: v.number(),
      context: v.string(),
      created_at: v.number()
    }),
    similarity_score: v.number()
  })),
  handler: async (ctx, args) => {
    console.log('🔍 [PERSONA QUERIES] Searching traces by similarity for query:', args.search_query);
    
    try {
      let query = ctx.db
        .query("persona_traces")
        .withIndex("by_user", (q) => q.eq("user_id", args.user_id));

      // Apply filters using utility functions
      query = QueryUtils.applyTraceTypeFilter(query, args.trace_type ? [args.trace_type] : undefined);
      query = QueryUtils.applyConfidenceFilter(query, args.min_confidence);

      const traces = await query.take(args.limit || 20);

      // Simple text matching (would be replaced with vector similarity)
      const searchTerms = args.search_query.toLowerCase().split(' ');
      const scoredTraces = traces
        .map(trace => {
          const content = `${trace.verbatim_quote} ${trace.extracted_insight} ${trace.context}`.toLowerCase();
          const matchCount = searchTerms.filter(term => content.includes(term)).length;
          const similarityScore = matchCount / searchTerms.length;
          
          return {
            trace: {
              _id: trace._id,
              trace_type: trace.trace_type,
              verbatim_quote: trace.verbatim_quote,
              extracted_insight: trace.extracted_insight,
              confidence: trace.confidence,
              context: trace.context,
              created_at: trace._creationTime
            },
            similarity_score: similarityScore
          };
        })
        .filter(item => item.similarity_score > 0)
        .sort((a, b) => b.similarity_score - a.similarity_score);

      console.log(`✅ [PERSONA QUERIES] Found ${scoredTraces.length} matching traces`);
      return scoredTraces;

    } catch (error) {
      console.error('❌ [PERSONA QUERIES] Error searching traces:', error);
      return [];
    }
  }
});

/**
 * Get the timestamp of the last crystallization for a user
 */
export const getLastCrystallizationTime = query({
  args: {
    user_id: v.string()
  },
  returns: v.union(v.number(), v.null()),
  handler: async (ctx, args) => {
    console.log('🕐 [PERSONA QUERIES] Getting last crystallization time for user:', args.user_id);
    
    try {
      const latestInsight = await ctx.db
        .query("crystallized_insights")
        .withIndex("by_user", (q) => q.eq("user_id", args.user_id))
        .order("desc")
        .first();

      const lastCrystallization = latestInsight?.updated_at || null;
      
      console.log('📅 [PERSONA QUERIES] Last crystallization time:', lastCrystallization);
      return lastCrystallization;

    } catch (error) {
      console.error('❌ [PERSONA QUERIES] Error getting last crystallization time:', error);
      return null;
    }
  }
});
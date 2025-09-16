/**
 * Clean Persona Crystallization Queries
 * Simple queries for the content-based schema
 */

import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import {
  PersonaTrace,
  CrystallizedInsight,
  UserPersonaProfile
} from "./lib/personaTypes";

/**
 * Get persona traces for a user
 */
export const getPersonaTraces = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
    minConfidence: v.optional(v.number())
  },
  returns: v.array(v.object({
    _id: v.id("persona_traces"),
    _creationTime: v.number(),
    userId: v.string(),
    content: v.any(),
    timestamp: v.number(),
    confidence: v.number()
  })),
  handler: async (ctx, args) => {
    console.log('📋 [GET-TRACES] Getting persona traces for user:', args.userId);
    
    try {
      let query = ctx.db
        .query("persona_traces")
        .withIndex("by_user", (q) => q.eq("userId", args.userId));

      // Apply confidence filter if specified
      if (args.minConfidence !== undefined) {
        query = query.filter((q) => q.gte(q.field("confidence"), args.minConfidence!));
      }

      const traces = await query
        .order("desc")
        .take(args.limit || 50);

      console.log(`✅ [GET-TRACES] Retrieved ${traces.length} persona traces`);
      return traces;

    } catch (error) {
      console.error('❌ [GET-TRACES] Error retrieving persona traces:', error);
      return [];
    }
  }
});

/**
 * Get traces by their IDs
 */
export const getTracesByIds = query({
  args: {
    userId: v.string(),
    traceIds: v.array(v.id("persona_traces"))
  },
  returns: v.array(v.object({
    _id: v.id("persona_traces"),
    _creationTime: v.number(),
    userId: v.string(),
    content: v.any(),
    timestamp: v.number(),
    confidence: v.number()
  })),
  handler: async (ctx, args) => {
    console.log(`🔍 [GET-TRACES-BY-IDS] Fetching ${args.traceIds.length} traces for user: ${args.userId}`);

    try {
      const traces: PersonaTrace[] = [];
      
      for (const traceId of args.traceIds) {
        const trace = await ctx.db.get(traceId);
        if (trace && trace.userId === args.userId) {
          traces.push(trace);
        }
      }

      console.log(`✅ [GET-TRACES-BY-IDS] Found ${traces.length} out of ${args.traceIds.length} requested traces`);
      return traces.map(t => ({
        _id: t._id!,
        _creationTime: t.timestamp,
        userId: t.userId,
        content: t.content,
        timestamp: t.timestamp,
        confidence: t.confidence
      }));

    } catch (error) {
      console.error('❌ [GET-TRACES-BY-IDS] Error fetching traces:', error);
      return [];
    }
  }
});

/**
 * Get crystallized insights for a user
 */
export const getCrystallizedInsights = query({
  args: {
    userId: v.string(),
    category: v.optional(v.string()),
    minConfidence: v.optional(v.number()),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    _id: v.id("crystallized_insights"),
    _creationTime: v.number(),
    userId: v.string(),
    content: v.string(),
    category: v.string(),
    timestamp: v.number(),
    confidence: v.number(),
    sources: v.array(v.id("persona_traces")),
    version: v.number(),
    previousVersions: v.optional(v.array(v.object({
      content: v.string(),
      confidence: v.number(),
      timestamp: v.number(),
      reason: v.string()
    }))),
    evolutionCount: v.number()
  })),
  handler: async (ctx, args) => {
    console.log('🔮 [GET-INSIGHTS] Getting crystallized insights for user:', args.userId);
    
    try {
      let query = ctx.db
        .query("crystallized_insights")
        .withIndex("by_user", (q) => q.eq("userId", args.userId));

      // Apply category filter if specified
      if (args.category) {
        query = ctx.db
          .query("crystallized_insights")
          .withIndex("by_user_category", (q) => q.eq("userId", args.userId).eq("category", args.category));
      }

      // Apply confidence filter if specified
      if (args.minConfidence !== undefined) {
        query = query.filter((q) => q.gte(q.field("confidence"), args.minConfidence!));
      }

      const insights = await query
        .order("desc")
        .take(args.limit || 20);

      console.log(`✅ [GET-INSIGHTS] Retrieved ${insights.length} crystallized insights`);
      return insights;

    } catch (error) {
      console.error('❌ [GET-INSIGHTS] Error retrieving crystallized insights:', error);
      return [];
    }
  }
});

/**
 * Get insights by category with evolution history
 */
export const getInsightsByCategory = query({
  args: {
    userId: v.string(),
    category: v.string()
  },
  returns: v.array(v.object({
    _id: v.id("crystallized_insights"),
    _creationTime: v.number(),
    userId: v.string(),
    content: v.string(),
    category: v.string(),
    timestamp: v.number(),
    confidence: v.number(),
    sources: v.array(v.id("persona_traces")),
    version: v.number(),
    previousVersions: v.optional(v.array(v.object({
      content: v.string(),
      confidence: v.number(),
      timestamp: v.number(),
      reason: v.string()
    }))),
    evolutionCount: v.number()
  })),
  handler: async (ctx, args) => {
    console.log('📂 [GET-INSIGHTS-BY-CATEGORY] Getting insights for category:', args.category);
    
    try {
      const insights = await ctx.db
        .query("crystallized_insights")
        .withIndex("by_user_category", (q) => q.eq("userId", args.userId).eq("category", args.category))
        .order("desc")
        .collect();

      console.log(`✅ [GET-INSIGHTS-BY-CATEGORY] Retrieved ${insights.length} insights for category ${args.category}`);
      return insights;

    } catch (error) {
      console.error('❌ [GET-INSIGHTS-BY-CATEGORY] Error:', error);
      return [];
    }
  }
});

/**
 * Get comprehensive user persona profile for AI context injection
 */
export const getUserPersonaProfile = query({
  args: {
    userId: v.string(),
    includeRecentTraces: v.optional(v.boolean()),
    traceLimit: v.optional(v.number()),
    insightLimit: v.optional(v.number())
  },
  returns: v.object({
    userId: v.string(),
    recentTraces: v.array(v.object({
      _id: v.id("persona_traces"),
      content: v.any(),
      timestamp: v.number(),
      confidence: v.number()
    })),
    crystallizedInsights: v.array(v.object({
      _id: v.id("crystallized_insights"),
      content: v.string(),
      category: v.string(),
      timestamp: v.number(),
      confidence: v.number(),
      version: v.number(),
      evolutionCount: v.number()
    })),
    confidenceScores: v.object({
      overall: v.number(),
      byCategory: v.any()
    }),
    lastUpdated: v.number(),
    profileCompleteness: v.number(),
    summary: v.object({
      totalTraces: v.number(),
      totalInsights: v.number(),
      topCategories: v.array(v.string()),
      recentActivity: v.number()
    })
  }),
  handler: async (ctx, args) => {
    console.log('👤 [GET-PROFILE] Building comprehensive persona profile for user:', args.userId);
    
    try {
      const includeTraces = args.includeRecentTraces !== false;
      const traceLimit = args.traceLimit || 20;
      const insightLimit = args.insightLimit || 10;

      // Get recent traces
      let recentTraces: any[] = [];
      if (includeTraces) {
        recentTraces = await ctx.db
          .query("persona_traces")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .order("desc")
          .take(traceLimit);
      }

      // Get crystallized insights
      const crystallizedInsights = await ctx.db
        .query("crystallized_insights")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(insightLimit);

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
      crystallizedInsights.forEach(insight => {
        if (!categoryConfidences[insight.category]) {
          categoryConfidences[insight.category] = [];
        }
        categoryConfidences[insight.category].push(insight.confidence);
      });

      const confidenceByCategory: Record<string, number> = {};
      Object.entries(categoryConfidences).forEach(([category, confidences]) => {
        confidenceByCategory[category] = confidences.reduce((sum, conf) => sum + conf, 0) / confidences.length;
      });

      // Calculate profile completeness
      const hasTraces = recentTraces.length > 0;
      const hasInsights = crystallizedInsights.length > 0;
      const categoryCount = Object.keys(categoryConfidences).length;
      const profileCompleteness = (
        (hasTraces ? 0.3 : 0) +
        (hasInsights ? 0.4 : 0) +
        (categoryCount > 0 ? Math.min(categoryCount * 0.1, 0.3) : 0)
      );

      // Get timestamps for last updated
      const latestTraceTime = recentTraces[0]?._creationTime || 0;
      const latestInsightTime = crystallizedInsights[0]?._creationTime || 0;
      const lastUpdated = Math.max(latestTraceTime, latestInsightTime);

      // Build summary statistics
      const topCategories = Object.entries(categoryConfidences)
        .sort(([,a], [,b]) => b.length - a.length)
        .slice(0, 5)
        .map(([category]) => category);

      // Calculate recent activity (last 7 days)
      const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
      const recentActivity = recentTraces.filter(t => 
        t.timestamp > sevenDaysAgo
      ).length;

      const profile = {
        userId: args.userId,
        recentTraces: recentTraces.map(t => ({
          _id: t._id,
          content: t.content,
          timestamp: t.timestamp,
          confidence: t.confidence
        })),
        crystallizedInsights: crystallizedInsights.map(i => ({
          _id: i._id,
          content: i.content,
          category: i.category,
          timestamp: i.timestamp,
          confidence: i.confidence,
          version: i.version,
          evolutionCount: i.evolutionCount
        })),
        confidenceScores: {
          overall: Math.round(overallConfidence * 100) / 100,
          byCategory: confidenceByCategory
        },
        lastUpdated,
        profileCompleteness: Math.round(profileCompleteness * 100) / 100,
        summary: {
          totalTraces: recentTraces.length,
          totalInsights: crystallizedInsights.length,
          topCategories,
          recentActivity
        }
      };

      console.log(`✅ [GET-PROFILE] Built persona profile with ${recentTraces.length} traces, ${crystallizedInsights.length} insights`);
      return profile;

    } catch (error) {
      console.error('❌ [GET-PROFILE] Error building persona profile:', error);
      
      return {
        userId: args.userId,
        recentTraces: [],
        crystallizedInsights: [],
        confidenceScores: { overall: 0, byCategory: {} },
        lastUpdated: 0,
        profileCompleteness: 0,
        summary: {
          totalTraces: 0,
          totalInsights: 0,
          topCategories: [],
          recentActivity: 0
        }
      };
    }
  }
});
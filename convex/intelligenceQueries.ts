/**
 * Intelligence Queries - Read-only access to intelligence system state
 * 
 * Provides queries for:
 * - User configuration
 * - Activity counters
 * - Intelligence state
 * - Job queue status
 */

import { query } from "./_generated/server";
import { v } from "convex/values";
import { DEFAULT_INTELLIGENCE_CONFIG } from "./intelligenceConfig";

/**
 * Get user's intelligence configuration.
 * Returns default config if user hasn't customized settings.
 */
export const getUserConfig = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const config = await ctx.db
      .query("intelligence_config")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    // Return user config or defaults
    return config || {
      userId,
      ...DEFAULT_INTELLIGENCE_CONFIG,
      last_analysis: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  },
});

/**
 * Get user's activity counters.
 * Returns zero counts if not initialized.
 */
export const getActivityCounters = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const counters = await ctx.db
      .query("user_activity_counters")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    // Return counters or defaults
    return counters || {
      userId,
      since_last_analysis: {
        chat_messages: 0,
        smart_notes: 0,
        crystal_formations: 0,
        crystal_retrievals: 0,
      },
      lifetime: {
        chat_messages: 0,
        smart_notes: 0,
        crystal_formations: 0,
        crystal_retrievals: 0,
      },
      pending_analysis: false,
      analysis_priority: "low" as const,
      updatedAt: Date.now(),
    };
  },
});

/**
 * Get pending intelligence jobs for processing.
 * Used by background job processor.
 */
export const getPendingJobs = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit }) => {
    const jobs = await ctx.db
      .query("intelligence_jobs")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .order("desc")  // Higher priority first
      .take(limit || 10);
    
    return jobs;
  },
});

/**
 * Get crystal intelligence state for a specific crystal.
 */
export const getCrystalIntelligence = query({
  args: {
    userId: v.string(),
    crystalId: v.string(),
  },
  handler: async (ctx, { userId, crystalId }) => {
    const intelligence = await ctx.db
      .query("crystal_intelligence")
      .withIndex("by_crystal", (q) => q.eq("userId", userId).eq("crystalId", crystalId))
      .first();
    
    return intelligence || null;
  },
});

/**
 * Get all crystal intelligence for a user (for analytics/display).
 */
export const getUserCrystalIntelligence = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit }) => {
    const intelligence = await ctx.db
      .query("crystal_intelligence")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .order("desc")
      .take(limit || 100);
    
    return intelligence;
  },
});

/**
 * Get crystals needing review (high/critical priority).
 */
export const getCrystalsNeedingReview = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit }) => {
    const highPriority = await ctx.db
      .query("crystal_intelligence")
      .withIndex("by_review_priority", (q) => 
        q.eq("userId", userId).eq("lifecycle.review_priority", "high")
      )
      .take(limit || 20);
    
    const criticalPriority = await ctx.db
      .query("crystal_intelligence")
      .withIndex("by_review_priority", (q) => 
        q.eq("userId", userId).eq("lifecycle.review_priority", "critical")
      )
      .take(limit || 20);
    
    // Combine and sort by health score (lowest first)
    const combined = [...criticalPriority, ...highPriority];
    combined.sort((a, b) => a.health.overall_score - b.health.overall_score);
    
    return combined.slice(0, limit || 20);
  },
});

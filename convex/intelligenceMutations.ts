/**
 * Intelligence Mutations - Write operations for intelligence system
 * 
 * Provides mutations for:
 * - Incrementing activity counters
 * - Creating/updating intelligence config
 * - Queueing analysis jobs
 * - Updating intelligence state
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { DEFAULT_INTELLIGENCE_CONFIG, ANALYSIS_VERSION } from "./intelligenceConfig";

/**
 * Increment activity counter for a specific activity type.
 * Called automatically when user performs tracked actions.
 */
export const incrementActivity = mutation({
  args: {
    userId: v.string(),
    activity_type: v.string(),  // "chat", "smart_note", "crystal_formation", "crystal_retrieval"
  },
  handler: async (ctx, { userId, activity_type }) => {
    // Get or create counters
    const existing = await ctx.db
      .query("user_activity_counters")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    const now = Date.now();
    
    if (existing) {
      // Map activity type to counter field
      const fieldMap: Record<string, string> = {
        "chat": "chat_messages",
        "smart_note": "smart_notes",
        "crystal_formation": "crystal_formations",
        "crystal_retrieval": "crystal_retrievals",
      };
      
      const field = fieldMap[activity_type] || "chat_messages";
      
      // Increment both since_last_analysis and lifetime
      await ctx.db.patch(existing._id, {
        since_last_analysis: {
          ...existing.since_last_analysis,
          [field]: existing.since_last_analysis[field] + 1,
        },
        lifetime: {
          ...existing.lifetime,
          [field]: existing.lifetime[field] + 1,
        },
        updatedAt: now,
      });
    } else {
      // Initialize counters
      const fieldMap: Record<string, string> = {
        "chat": "chat_messages",
        "smart_note": "smart_notes",
        "crystal_formation": "crystal_formations",
        "crystal_retrieval": "crystal_retrievals",
      };
      
      const field = fieldMap[activity_type] || "chat_messages";
      
      await ctx.db.insert("user_activity_counters", {
        userId,
        since_last_analysis: {
          chat_messages: field === "chat_messages" ? 1 : 0,
          smart_notes: field === "smart_notes" ? 1 : 0,
          crystal_formations: field === "crystal_formations" ? 1 : 0,
          crystal_retrievals: field === "crystal_retrievals" ? 1 : 0,
        },
        lifetime: {
          chat_messages: field === "chat_messages" ? 1 : 0,
          smart_notes: field === "smart_notes" ? 1 : 0,
          crystal_formations: field === "crystal_formations" ? 1 : 0,
          crystal_retrievals: field === "crystal_retrievals" ? 1 : 0,
        },
        pending_analysis: false,
        analysis_priority: "low",
        updatedAt: now,
      });
    }
    
    // ✅ CHECK INTELLIGENCE TRIGGERS (non-blocking)
    // This checks if activity thresholds are met and queues analysis jobs if needed.
    // We schedule it to run after this mutation completes to avoid blocking the user.
    await ctx.scheduler.runAfter(0, internal.intelligenceActions.checkIntelligenceTriggers, {
      userId,
      event_type: activity_type,
    });
  },
});

/**
 * Reset activity counters after intelligence analysis.
 */
export const resetActivityCounters = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    const counters = await ctx.db
      .query("user_activity_counters")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (counters) {
      await ctx.db.patch(counters._id, {
        since_last_analysis: {
          chat_messages: 0,
          smart_notes: 0,
          crystal_formations: 0,
          crystal_retrievals: 0,
        },
        pending_analysis: false,
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Queue an intelligence analysis job.
 */
export const queueAnalysisJob = mutation({
  args: {
    userId: v.string(),
    job_type: v.union(
      v.literal("quick_update"),
      v.literal("standard_analysis"),
      v.literal("deep_analysis"),
      v.literal("archival_review")
    ),
    priority: v.union(
      v.literal("low"),
      v.literal("normal"),
      v.literal("high"),
      v.literal("urgent")
    ),
    trigger_source: v.string(),
    crystal_ids: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { userId, job_type, priority, trigger_source, crystal_ids } = args;
    
    const now = Date.now();
    
    const jobId = await ctx.db.insert("intelligence_jobs", {
      userId,
      job_type,
      status: "pending",
      priority,
      scope: {
        crystal_ids: crystal_ids || [],
        analyze_all: !crystal_ids || crystal_ids.length === 0,
        analysis_depth: job_type.includes("deep") ? "deep" : 
                        job_type.includes("standard") ? "standard" : "fast",
      },
      trigger_source,
      scheduled_for: now,
      createdAt: now,
      updatedAt: now,
    });
    
    console.log(`[INTELLIGENCE] Queued ${job_type} job for user ${userId} (priority: ${priority})`);
    
    return jobId;
  },
});

/**
 * Update job status (for background processor).
 */
export const updateJobStatus = mutation({
  args: {
    jobId: v.id("intelligence_jobs"),
    status: v.union(
      v.literal("pending"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    started_at: v.optional(v.number()),
    completed_at: v.optional(v.number()),
    results: v.optional(v.object({
      crystals_analyzed: v.number(),
      relationships_found: v.number(),
      contradictions_found: v.number(),
      health_scores_updated: v.number(),
      error: v.optional(v.string()),
    })),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { jobId, status, started_at, completed_at, results, error } = args;
    
    const job = await ctx.db.get(jobId);
    if (!job) return;
    
    const updates: any = {
      status,
      updatedAt: Date.now(),
    };
    
    if (started_at) updates.started_at = started_at;
    if (completed_at) updates.completed_at = completed_at;
    if (results) updates.results = results;
    if (completed_at && started_at) {
      updates.duration_ms = completed_at - started_at;
    }
    
    await ctx.db.patch(jobId, updates);
  },
});

/**
 * Initialize intelligence config for a new user.
 * Uses default settings.
 */
export const initializeUserConfig = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, { userId }) => {
    // Check if config already exists
    const existing = await ctx.db
      .query("intelligence_config")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (existing) {
      return existing._id;
    }
    
    const now = Date.now();
    
    const configId = await ctx.db.insert("intelligence_config", {
      userId,
      triggers: DEFAULT_INTELLIGENCE_CONFIG.triggers,
      preferences: DEFAULT_INTELLIGENCE_CONFIG.preferences,
      last_analysis: 0,
      createdAt: now,
      updatedAt: now,
    });
    
    console.log(`[INTELLIGENCE] Initialized config for user ${userId}`);
    
    return configId;
  },
});

/**
 * Update user's intelligence configuration.
 */
export const updateUserConfig = mutation({
  args: {
    userId: v.string(),
    triggers: v.optional(v.object({
      chat_messages: v.number(),
      smart_notes: v.number(),
      crystal_formations: v.number(),
      days_since_last: v.number(),
    })),
    preferences: v.optional(v.object({
      analysis_depth: v.union(v.literal("fast"), v.literal("standard"), v.literal("deep")),
      auto_archival: v.boolean(),
      review_notifications: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const { userId, triggers, preferences } = args;
    
    const existing = await ctx.db
      .query("intelligence_config")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();
    
    if (!existing) {
      // Initialize with custom settings
      const now = Date.now();
      return await ctx.db.insert("intelligence_config", {
        userId,
        triggers: triggers || DEFAULT_INTELLIGENCE_CONFIG.triggers,
        preferences: preferences || DEFAULT_INTELLIGENCE_CONFIG.preferences,
        last_analysis: 0,
        createdAt: now,
        updatedAt: now,
      });
    }
    
    const updates: any = { updatedAt: Date.now() };
    if (triggers) updates.triggers = triggers;
    if (preferences) updates.preferences = preferences;
    
    await ctx.db.patch(existing._id, updates);
    return existing._id;
  },
});

/**
 * Update intelligence state for a crystal.
 * Called by the analyzer after computing intelligence.
 */
export const updateIntelligenceState = mutation({
  args: {
    userId: v.string(),
    crystalId: v.string(),
    intelligence: v.object({
      usage: v.optional(v.object({
        total_retrievals: v.optional(v.number()),
        retrievals_last_7d: v.optional(v.number()),
        retrievals_last_30d: v.optional(v.number()),
        last_used: v.optional(v.number()),
        last_retrieved: v.optional(v.number()),  // Backend uses this field
        usage_frequency: v.optional(v.number()),
        contexts: v.optional(v.array(v.string())),
        co_occurrence: v.optional(v.array(v.string())),
      })),
      relationships: v.optional(v.object({
        related: v.optional(v.array(v.object({
          crystalId: v.string(),
          similarity: v.number(),
          relationship_type: v.string(),
          confidence: v.number(),
        }))),
        related_crystal_ids: v.optional(v.array(v.string())),  // Backend uses this field
        relationship_scores: v.optional(v.any()),  // Backend uses this field
        conflicting: v.optional(v.array(v.object({
          crystalId: v.string(),
          conflict_score: v.number(),
          conflict_type: v.string(),
          resolution: v.optional(v.string()),
        }))),
      })),
      contradictions: v.optional(v.object({
        shard_ids: v.optional(v.array(v.string())),
        severity: v.optional(v.union(v.literal("low"), v.literal("medium"), v.literal("high"))),
        patterns: v.optional(v.array(v.string())),
        analysis: v.optional(v.string()),
      })),
      health: v.optional(v.object({
        overall_score: v.optional(v.number()),
        last_computed: v.optional(v.number()),  // Backend uses this field
        components: v.optional(v.object({
          evidence_strength: v.optional(v.number()),
          usage_recency: v.optional(v.number()),
          usage_frequency: v.optional(v.number()),
          contradiction_impact: v.optional(v.number()),
          age_factor: v.optional(v.number()),
        })),
        trend: v.optional(v.union(v.literal("improving"), v.literal("stable"), v.literal("declining"))),
      })),
      lifecycle: v.optional(v.object({
        review_priority: v.optional(v.union(
          v.literal("low"),
          v.literal("medium"),
          v.literal("high"),
          v.literal("critical")
        )),
        next_review_due: v.optional(v.number()),
        archival_candidate: v.optional(v.boolean()),
        archival_reason: v.optional(v.string()),
        archival_confidence: v.optional(v.number()),
      })),
    }),
    analysis_depth: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, crystalId, intelligence, analysis_depth } = args;
    
    const existing = await ctx.db
      .query("crystal_intelligence")
      .withIndex("by_crystal", (q) => q.eq("userId", userId).eq("crystalId", crystalId))
      .first();
    
    const now = Date.now();
    
    if (existing) {
      // Merge partial updates with existing data
      const merged = {
        usage: intelligence.usage ? { ...existing.usage, ...intelligence.usage } : existing.usage,
        relationships: intelligence.relationships ? { ...existing.relationships, ...intelligence.relationships } : existing.relationships,
        contradictions: intelligence.contradictions ? { ...existing.contradictions, ...intelligence.contradictions } : existing.contradictions,
        health: intelligence.health ? { ...existing.health, ...intelligence.health } : existing.health,
        lifecycle: intelligence.lifecycle ? { ...existing.lifecycle, ...intelligence.lifecycle } : existing.lifecycle,
      };
      
      await ctx.db.patch(existing._id, {
        ...merged,
        analysis_version: ANALYSIS_VERSION,
        last_analyzed: now,
        analysis_depth,
        updatedAt: now,
      });
    } else {
      // New record - just insert with provided data
      await ctx.db.insert("crystal_intelligence", {
        userId,
        crystalId,
        ...intelligence,
        analysis_version: ANALYSIS_VERSION,
        last_analyzed: now,
        analysis_depth,
        createdAt: now,
        updatedAt: now,
      });
    }
  },
});

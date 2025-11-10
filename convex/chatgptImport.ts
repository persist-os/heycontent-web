import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * ChatGPT Import Tracking
 * 
 * Tracks one-time ChatGPT conversation imports to prevent duplicate imports.
 * Users can only import their ChatGPT data once.
 */

const IMPORT_SOURCE = "chatgpt" as const;

/**
 * Check if user has already imported ChatGPT data
 */
export const checkHasImported = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const existing = await ctx.db
      .query("data_imports")
      .withIndex("by_user_source", (q) => 
        q.eq("userId", userId).eq("importSource", IMPORT_SOURCE)
      )
      .first();

    return {
      hasImported: !!existing?.completed,
      lastAttempt: existing?.lastAttemptAt,
      attempts: existing?.attempts || 0,
      contentProcessed: existing?.contentProcessed
    };
  }
});

/**
 * Mark ChatGPT import as completed
 */
export const markImportComplete = mutation({
  args: { 
    userId: v.string(),
    contentProcessed: v.optional(v.object({
      conversations: v.number(),
      totalItems: v.number(),
      messages: v.number()
    }))
  },
  handler: async (ctx, { userId, contentProcessed }) => {
    const existing = await ctx.db
      .query("data_imports")
      .withIndex("by_user_source", (q) => 
        q.eq("userId", userId).eq("importSource", IMPORT_SOURCE)
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        completed: true,
        completedAt: now,
        contentProcessed: contentProcessed ? {
          conversations: contentProcessed.conversations,
          notes: 0,
          totalItems: contentProcessed.totalItems,
          messages: contentProcessed.messages
        } : existing.contentProcessed
      });
    } else {
      await ctx.db.insert("data_imports", {
        userId,
        importSource: IMPORT_SOURCE,
        completed: true,
        completedAt: now,
        attempts: 1,
        lastAttemptAt: now,
        contentProcessed: contentProcessed ? {
          conversations: contentProcessed.conversations,
          notes: 0,
          totalItems: contentProcessed.totalItems,
          messages: contentProcessed.messages
        } : { conversations: 0, notes: 0, totalItems: 0 }
      });
    }

    return { success: true };
  }
});

/**
 * Record import attempt (for failure tracking)
 */
export const recordImportAttempt = mutation({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const existing = await ctx.db
      .query("data_imports")
      .withIndex("by_user_source", (q) => 
        q.eq("userId", userId).eq("importSource", IMPORT_SOURCE)
      )
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        attempts: (existing.attempts || 0) + 1,
        lastAttemptAt: now
      });
    } else {
      await ctx.db.insert("data_imports", {
        userId,
        importSource: IMPORT_SOURCE,
        completed: false,
        attempts: 1,
        lastAttemptAt: now,
        contentProcessed: { conversations: 0, notes: 0, totalItems: 0 }
      });
    }

    return { success: true };
  }
});

/**
 * Update import status (called by backend during processing)
 * This enables reactive UI without polling!
 */
export const updateImportStatus = mutation({
  args: { 
    userId: v.string(),
    jobId: v.optional(v.union(v.null(), v.string())),
    status: v.union(
      v.literal("queued"),
      v.literal("running"),
      v.literal("completed"),
      v.literal("failed"),
      v.literal("cancelled")
    ),
    progress: v.optional(v.union(v.null(), v.string())),
    error: v.optional(v.union(v.null(), v.string())),
    progressDetails: v.optional(v.union(
      v.null(),
      v.object({
        totalConversations: v.optional(v.number()),
        processedConversations: v.optional(v.number()),
        totalBatches: v.optional(v.number()),
        processedBatches: v.optional(v.number()),
        totalMessages: v.optional(v.number()),
        processedMessages: v.optional(v.number()),
        percentComplete: v.optional(v.number()),
        currentBatch: v.optional(v.number()),
        processingPhase: v.optional(v.string()),
      })
    )),
    contentProcessed: v.optional(v.union(
      v.null(),
      v.object({
        conversations: v.number(),
        totalItems: v.number(),
        messages: v.number()
      })
    ))
  },
  handler: async (ctx, { userId, jobId, status, progress, error, progressDetails, contentProcessed }) => {
    const existing = await ctx.db
      .query("data_imports")
      .withIndex("by_user_source", (q) => 
        q.eq("userId", userId).eq("importSource", IMPORT_SOURCE)
      )
      .first();

    const now = Date.now();
    const isCompleted = status === "completed";

    const updateData: any = {
      status,
      lastAttemptAt: now,
      ...(progress && { progress }),
      ...(error && { error }),
      ...(jobId && { jobId }),
      ...(progressDetails && { progressDetails }),
    };

    if (isCompleted) {
      updateData.completed = true;
      updateData.completedAt = now;
      if (contentProcessed) {
        updateData.contentProcessed = {
          conversations: contentProcessed.conversations,
          notes: 0,
          totalItems: contentProcessed.totalItems,
          messages: contentProcessed.messages
        };
      }
    }

    if (existing) {
      await ctx.db.patch(existing._id, updateData);
    } else {
      await ctx.db.insert("data_imports", {
        userId,
        importSource: IMPORT_SOURCE,
        completed: isCompleted,
        completedAt: isCompleted ? now : undefined,
        attempts: 1,
        lastAttemptAt: now,
        status,
        progress,
        error,
        jobId,
        progressDetails,
        contentProcessed: contentProcessed ? {
          conversations: contentProcessed.conversations,
          notes: 0,
          totalItems: contentProcessed.totalItems,
          messages: contentProcessed.messages
        } : { conversations: 0, notes: 0, totalItems: 0 }
      });
    }

    return { success: true };
  }
});

/**
 * Cancel ChatGPT import and delete all imported data
 * Works even after import completion - allows full reversal of import
 * Uses metadata tagging to identify and delete all imported shards/crystals
 */
export const cancelImport = mutation({
  args: { 
    userId: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { userId, reason }) => {
    console.log(`[CHATGPT_IMPORT] Canceling import and deleting all data for user ${userId}`);
    
    const importRecord = await ctx.db
      .query("data_imports")
      .withIndex("by_user_source", (q) => 
        q.eq("userId", userId).eq("importSource", IMPORT_SOURCE)
      )
      .first();

    if (!importRecord) {
      return { success: false, error: "No import found for this user" };
    }

    const deletedCount = {
      jobs: 0,
      shards: 0,
      crystals: 0
    };

    const relatedJobs = await ctx.db
      .query("background_jobs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.or(
          q.eq(q.field("type"), "chatgpt_import"),
          q.eq(q.field("type"), "shard_extraction"),
          q.eq(q.field("type"), "crystal_formation")
        )
      )
      .collect();

    for (const job of relatedJobs) {
      if (job.status === "queued" || job.status === "running") {
        await ctx.db.patch(job._id, { 
          status: "cancelled",
          error: reason || "Cancelled by user",
          completedAt: Date.now()
        });
      }
      deletedCount.jobs++;
    }

    const shardsToDelete = await ctx.db
      .query("crystal_shards")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter(q => q.eq(q.field("source"), "chatgpt_import"))
      .collect();
    
    for (const shard of shardsToDelete) {
      await ctx.db.delete(shard._id);
      deletedCount.shards++;
    }

    const allUserCrystals = await ctx.db
      .query("crystals")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    const crystalsToDelete = allUserCrystals.filter(crystal => 
      crystal.tags?.includes("chatgpt_import")
    );
    
    for (const crystal of crystalsToDelete) {
      await ctx.db.delete(crystal._id);
      deletedCount.crystals++;
    }

    await ctx.db.delete(importRecord._id);

    return { 
      success: true, 
      message: `Cancelled import and deleted all data: ${deletedCount.jobs} jobs, ${deletedCount.shards} shards, ${deletedCount.crystals} crystals`,
      deletedCount
    };
  }
});

/**
 * Get import status (for reactive frontend)
 * Frontend uses useQuery with this to get real-time updates
 */
export const getImportStatus = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const importData = await ctx.db
      .query("data_imports")
      .withIndex("by_user_source", (q) => 
        q.eq("userId", userId).eq("importSource", IMPORT_SOURCE)
      )
      .first();

    if (!importData) {
      return null;
    }

    return {
      jobId: importData.jobId,
      status: importData.status || (importData.completed ? "completed" : "unknown"),
      progress: importData.progress,
      progressDetails: importData.progressDetails,
      error: importData.error,
      hasImported: importData.completed,
      completedAt: importData.completedAt,
      contentProcessed: importData.contentProcessed,
    };
  }
});

/**
 * Get all background jobs related to ChatGPT import
 * Queries directly from background_jobs table by type
 */
export const getImportRelatedJobs = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const jobs = await ctx.db
      .query("background_jobs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .filter((q) => 
        q.or(
          q.eq(q.field("type"), "chatgpt_import"),
          q.eq(q.field("type"), "shard_extraction"),
          q.eq(q.field("type"), "crystal_formation")
        )
      )
      .order("desc")
      .take(50);

    return jobs.map(job => ({
      jobId: job.jobId,
      type: job.type,
      status: job.status,
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
    }));
  }
});

/**
 * Background Jobs - Convex mutations and queries for job tracking
 * 
 * Simple, production-ready job management with:
 * - Job creation and status tracking
 * - User-isolated job queries
 * - Statistics and monitoring
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { 
  jobTypeValidator, 
  jobStatusValidator, 
  jobPriorityValidator 
} from "./types/backgroundJobs";

/**
 * Create a new background job record
 * Called BEFORE enqueueing to Redis to get the job ID
 * Returns the Convex document ID as the jobId
 */
export const create = mutation({
  args: {
    userId: v.string(),
    type: jobTypeValidator,
    payload: v.any(),
    priority: jobPriorityValidator,
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const jobId = await ctx.db.insert("background_jobs", {
      jobId: "", // Will be set to document ID below
      userId: args.userId,
      type: args.type,
      payload: args.payload,
      status: "queued",
      priority: args.priority,
      createdAt: now,
      attempts: 0,
      maxAttempts: 3,
    });
    
    // Update jobId to match the Convex document ID
    await ctx.db.patch(jobId, { jobId: jobId });
    
    return { 
      success: true, 
      jobId: jobId 
    };
  },
});

/**
 * Update job status
 * Called by workers as jobs progress: queued -> running -> completed/failed
 */
export const updateStatus = mutation({
  args: {
    jobId: v.string(),
    status: jobStatusValidator,
    workerId: v.optional(v.string()),
    result: v.optional(v.any()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find job by jobId
    const job = await ctx.db
      .query("background_jobs")
      .withIndex("by_job_id", (q) => q.eq("jobId", args.jobId))
      .first();
    
    if (!job) {
      throw new Error(`Job not found: ${args.jobId}`);
    }
    
    const updates: any = {
      status: args.status,
    };
    
    if (args.workerId) {
      updates.workerId = args.workerId;
    }
    
    if (args.status === "running" && !job.startedAt) {
      updates.startedAt = Date.now();
    }
    
    if (args.status === "completed" || args.status === "failed") {
      updates.completedAt = Date.now();
      updates.attempts = job.attempts + 1;
    }
    
    if (args.result) {
      updates.result = args.result;
    }
    
    if (args.error) {
      updates.error = args.error;
    }
    
    await ctx.db.patch(job._id, updates);
    
    return { success: true };
  },
});

/**
 * Cancel/stop specific job or all jobs of a type
 * Useful for emergency stops
 */
export const cancelJobs = mutation({
  args: {
    userId: v.string(),
    jobId: v.optional(v.string()),
    type: v.optional(v.union(
      v.literal("shard_extraction"),
      v.literal("crystal_formation"),
      v.literal("intelligence_analysis"),
      v.literal("chatgpt_import")
    )),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let jobs = [];
    
    if (args.jobId) {
      // Cancel specific job
      const job = await ctx.db
        .query("background_jobs")
        .withIndex("by_job_id", (q) => q.eq("jobId", args.jobId))
        .first();
      if (job) jobs.push(job);
    } else if (args.type) {
      // Cancel all jobs of a specific type for the user
      jobs = await ctx.db
        .query("background_jobs")
        .withIndex("by_user_type_status", (q) => 
          q.eq("userId", args.userId).eq("type", args.type)
        )
        .filter((q) => 
          q.or(
            q.eq(q.field("status"), "queued"),
            q.eq(q.field("status"), "running")
          )
        )
        .collect();
    } else {
      // Cancel all active jobs for user
      jobs = await ctx.db
        .query("background_jobs")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => 
          q.or(
            q.eq(q.field("status"), "queued"),
            q.eq(q.field("status"), "running")
          )
        )
        .collect();
    }
    
    let cancelledCount = 0;
    for (const job of jobs) {
      await ctx.db.patch(job._id, {
        status: "failed",
        error: args.reason || "Manually cancelled by user",
        completedAt: Date.now(),
      });
      cancelledCount++;
    }
    
    return { 
      success: true, 
      cancelledCount,
      message: `Cancelled ${cancelledCount} job(s)`
    };
  },
});

/**
 * Get user's jobs with optional filtering
 */
export const getUserJobs = query({
  args: {
    userId: v.string(),
    jobType: v.optional(jobTypeValidator),
    status: v.optional(jobStatusValidator),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("background_jobs")
      .withIndex("by_user", (q) => q.eq("userId", args.userId));
    
    // If both filters provided, use compound index
    if (args.jobType && args.status) {
      query = ctx.db
        .query("background_jobs")
        .withIndex("by_user_type_status", (q) =>
          q.eq("userId", args.userId)
           .eq("type", args.jobType)
           .eq("status", args.status)
        );
    }
    
    const jobs = await query
      .order("desc")
      .take(args.limit || 10);
    
    return jobs;
  },
});

/**
 * Get job statistics for a user
 */
export const getJobStats = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    const jobs = await ctx.db
      .query("background_jobs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    
    const stats = {
      total: jobs.length,
      queued: jobs.filter((j) => j.status === "queued").length,
      running: jobs.filter((j) => j.status === "running").length,
      completed: jobs.filter((j) => j.status === "completed").length,
      failed: jobs.filter((j) => j.status === "failed").length,
      avgDuration: 0,
    };
    
    // Calculate average duration for completed jobs
    const completed = jobs.filter((j) => j.completedAt && j.startedAt);
    if (completed.length > 0) {
      const durations = completed.map((j) => j.completedAt! - j.startedAt!);
      stats.avgDuration = durations.reduce((a, b) => a + b, 0) / durations.length;
    }
    
    return stats;
  },
});


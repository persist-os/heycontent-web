/**
 * Background Jobs - Convex mutations and queries for job tracking
 * 
 * Simple, production-ready job management with:
 * - Job creation and status tracking
 * - User-isolated job queries
 * - Statistics and monitoring
 */

import { mutation, query, action } from "./_generated/server";
import { v } from "convex/values";
import { 
  jobTypeValidator, 
  jobStatusValidator, 
  jobPriorityValidator 
} from "./types/backgroundJobs";

/**
 * Find jobs stuck in RUNNING status (for recovery after backend restart)
 */
export const getStuckJobs = query({
  args: {
    maxAgeMinutes: v.optional(v.number()),
  },
  handler: async (ctx, { maxAgeMinutes = 10 }) => {
    const now = Date.now();
    const cutoffTime = now - (maxAgeMinutes * 60 * 1000);
    
    // Use by_status index for better performance
    const runningJobs = await ctx.db
      .query("background_jobs")
      .withIndex("by_status", (q) => q.eq("status", "running"))
      .collect();
    
    // Filter stuck jobs: either no startedAt (broken state) or startedAt is too old
    const stuckJobs = runningJobs.filter(job => {
      // Job stuck if it has no startedAt (shouldn't happen but catch it)
      if (!job.startedAt) {
        return true;
      }
      // Job stuck if it started too long ago
      return job.startedAt < cutoffTime;
    });
    
    return {
      success: true,
      currentTime: now,
      cutoffTime: cutoffTime,
      totalRunning: runningJobs.length,
      stuckCount: stuckJobs.length,
      jobs: stuckJobs.map(job => ({
        _id: job._id,
        jobId: job.jobId,
        userId: job.userId,
        type: job.type,
        status: job.status,
        createdAt: job.createdAt,
        startedAt: job.startedAt,
        runningForMinutes: job.startedAt ? Math.floor((now - job.startedAt) / 60000) : null,
        workerId: job.workerId,
      })),
    };
  },
});

/**
 * Reset a stuck job back to queued status
 */
export const resetStuckJob = mutation({
  args: {
    jobId: v.string(),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { jobId, reason }) => {
    const job = await ctx.db
      .query("background_jobs")
      .withIndex("by_job_id", (q) => q.eq("jobId", jobId))
      .first();
    
    if (!job) {
      return { success: false, message: "Job not found" };
    }
    
    await ctx.db.patch(job._id, {
      status: "queued",
      workerId: undefined,
      startedAt: undefined,
      error: reason || "Reset after backend restart",
    });
    
    return { success: true };
  },
});

/**
 * Bulk reset ALL stuck jobs at once
 * Useful for emergency cleanup after backend crashes
 */
export const resetAllStuckJobs = mutation({
  args: {
    maxAgeMinutes: v.optional(v.number()),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { maxAgeMinutes = 10, reason }) => {
    const now = Date.now();
    const cutoffTime = now - (maxAgeMinutes * 60 * 1000);
    
    // Get all running jobs
    const runningJobs = await ctx.db
      .query("background_jobs")
      .withIndex("by_status", (q) => q.eq("status", "running"))
      .collect();
    
    // Filter stuck jobs
    const stuckJobs = runningJobs.filter(job => {
      if (!job.startedAt) return true;
      return job.startedAt < cutoffTime;
    });
    
    if (stuckJobs.length === 0) {
      return { 
        success: true, 
        resetCount: 0,
        message: "No stuck jobs found"
      };
    }
    
    // Reset all stuck jobs
    const resetReason = reason || `Bulk reset: stuck in RUNNING for ${maxAgeMinutes}+ minutes`;
    
    for (const job of stuckJobs) {
      await ctx.db.patch(job._id, {
        status: "queued",
        workerId: undefined,
        startedAt: undefined,
        error: resetReason,
      });
    }
    
    return { 
      success: true, 
      resetCount: stuckJobs.length,
      message: `Reset ${stuckJobs.length} stuck job(s)`,
      jobs: stuckJobs.map(j => ({
        jobId: j.jobId,
        type: j.type,
        userId: j.userId,
      }))
    };
  },
});

/**
 * Force reset ALL running jobs (emergency use only)
 * Use when you need to clean up everything regardless of time
 */
export const forceResetAllRunningJobs = mutation({
  args: {
    reason: v.optional(v.string()),
  },
  handler: async (ctx, { reason }) => {
    // Get ALL running jobs regardless of age
    const runningJobs = await ctx.db
      .query("background_jobs")
      .withIndex("by_status", (q) => q.eq("status", "running"))
      .collect();
    
    if (runningJobs.length === 0) {
      return { 
        success: true, 
        resetCount: 0,
        message: "No running jobs found"
      };
    }
    
    const resetReason = reason || "Force reset: emergency cleanup of all running jobs";
    
    for (const job of runningJobs) {
      await ctx.db.patch(job._id, {
        status: "queued",
        workerId: undefined,
        startedAt: undefined,
        error: resetReason,
      });
    }
    
    return { 
      success: true, 
      resetCount: runningJobs.length,
      message: `Force reset ${runningJobs.length} running job(s)`,
      jobs: runningJobs.map(j => ({
        jobId: j.jobId,
        type: j.type,
        userId: j.userId,
      }))
    };
  },
});

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
    
    // CRITICAL FIX: Idempotency check - skip if already in target status (Pattern 48: Optimistic Concurrency)
    // WHY: Prevents unnecessary updates and reduces "Documents changed" errors from concurrent updates.
    // Without this, multiple workers updating same job status caused conflicts every millisecond.
    if (job.status === args.status) {
      // Already in target status - check if other updates are needed
      const needsUpdate = 
        (args.workerId && job.workerId !== args.workerId) ||
        (args.result && JSON.stringify(job.result) !== JSON.stringify(args.result)) ||
        (args.error && job.error !== args.error);
      
      if (!needsUpdate) {
        // No changes needed - idempotent operation
        return { success: true, message: "Already in target status" };
      }
    }
    
    // CRITICAL FIX: Optimistic concurrency control (Pattern 48: Optimistic Concurrency Control)
    // WHY: Re-query job to ensure we have latest version before patching. Prevents "Documents changed"
    // errors when multiple workers update same job concurrently. Handles race conditions gracefully.
    const currentJob = await ctx.db
      .query("background_jobs")
      .withIndex("by_job_id", (q) => q.eq("jobId", args.jobId))
      .first();
    
    if (!currentJob) {
      throw new Error(`Job not found: ${args.jobId}`);
    }
    
    // Check if status changed since we first read it (optimistic concurrency)
    if (currentJob.status !== job.status && currentJob.status === args.status) {
      // Another worker already updated to target status - idempotent success
      return { success: true, message: "Status already updated by another worker" };
    }
    
    const updates: any = {
      status: args.status,
    };
    
    if (args.workerId) {
      updates.workerId = args.workerId;
    }
    
    if (args.status === "running" && !currentJob.startedAt) {
      updates.startedAt = Date.now();
    }
    
    if (args.status === "completed" || args.status === "failed") {
      updates.completedAt = Date.now();
      updates.attempts = (currentJob.attempts || 0) + 1;
    }
    
    if (args.result) {
      updates.result = args.result;
    }
    
    if (args.error) {
      updates.error = args.error;
    }
    
    await ctx.db.patch(currentJob._id, updates);
    
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
    type: v.optional(jobTypeValidator),
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

/**
 * ✅ Get assignment (project) status by aggregating widget_execution jobs
 * Frontend uses this reactively - NO POLLING NEEDED
 */
export const getAssignmentStatus = query({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
  },
  handler: async (ctx, { projectId, userId }) => {
    // Get all widgets for this project
    const widgets = await ctx.db
      .query("widgets")
      .withIndex("by_project", (q) => q.eq("projectId", projectId))
      .collect();
    
    if (widgets.length === 0) {
      return {
        assignment_id: projectId,
        overall_status: "not_started",
        widgets: [],
        artifacts: [],
      };
    }
    
    // Get all widget_execution jobs for this user's widgets
    // Note: Must collect first, then filter in JavaScript (Convex can't filter nested payload fields)
    const allJobs = await ctx.db
      .query("background_jobs")
      .withIndex("by_user_type_status", (q) =>
        q.eq("userId", userId).eq("type", "widget_execution")
      )
      .collect();
    
    // Filter jobs by projectId in JavaScript (payload.projectId is nested)
    const jobs = allJobs.filter(job => job.payload?.projectId === projectId);
    
    // Map jobs to widget IDs
    const jobsByWidgetId = new Map();
    for (const job of jobs) {
      const widgetId = job.payload?.widget_id || job.payload?.widgetId;
      if (widgetId) {
        jobsByWidgetId.set(widgetId, job);
      }
    }
    
    // Build widget statuses
    const widgetStatuses = widgets.map((widget) => {
      const job = jobsByWidgetId.get(widget._id);
      let status = "pending";
      
      if (job) {
        if (job.status === "completed") status = "completed";
        else if (job.status === "running" || job.status === "queued") status = "in_progress";
        else if (job.status === "failed") status = "failed";
      }
      
      return {
        widget_id: widget._id,
        title: widget.title || "Unnamed Widget",
        status,
      };
    });
    
    // Determine overall status
    const completedCount = widgetStatuses.filter((w) => w.status === "completed").length;
    const inProgressCount = widgetStatuses.filter((w) => w.status === "in_progress").length;
    
    let overallStatus = "not_started";
    if (completedCount === widgets.length) {
      overallStatus = "completed";
    } else if (inProgressCount > 0 || completedCount > 0) {
      overallStatus = "active";
    }
    

    return {
      assignment_id: projectId,
      overall_status: overallStatus,
      widgets: widgetStatuses,
      artifacts: [], // Frontend queries artifacts separately
    };
  },
});

/**
 * Enqueue job to Redis queue after Convex record creation.
 * 
 * Called by frontend after creating job record via mutation.
 * Completes the atomic job creation pattern: Convex record → Redis enqueue.
 * 
 * This action calls the backend HTTP endpoint to enqueue the job to Redis,
 * allowing workers to pick it up for execution.
 */
export const enqueueToRedis = action({
  args: {
    jobId: v.string(),
    jobType: jobTypeValidator,
    userId: v.string(),
    payload: v.any(),
    priority: jobPriorityValidator,
  },
  handler: async (ctx, { jobId, jobType, userId, payload, priority }) => {
    try {
      const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
      
      if (!backendUrl) {
        throw new Error("BACKEND_URL not configured");
      }
      
      const response = await fetch(`${backendUrl}/api/v1/background-jobs/enqueue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId,
          jobType,
          userId,
          payload,
          priority,
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend returned ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      
      return {
        success: true,
        jobId: data.jobId,
        redisMessageId: data.redisMessageId,
      };
    } catch (error) {
      console.error(`[ENQUEUE_TO_REDIS] Failed to enqueue job ${jobId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});


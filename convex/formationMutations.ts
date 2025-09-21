/**
 * Crystal Formation Lock Cleanup System
 * 
 * This module provides comprehensive formation run management with automatic cleanup
 * to prevent stale "running" formations from blocking new formation processes.
 * 
 * CLEANUP OPERATIONS:
 * 
 * 1. cleanup_stale: Marks stale "running" formations as "failed"
 *    - Default timeout: 30 minutes
 *    - Configurable via timeoutMinutes parameter
 *    - Automatically run every 15 minutes via cron job
 * 
 * 2. force_reset: Development/debugging tool to reset all running formations for a user
 *    - Requires userId parameter
 *    - Marks all user's running formations as "failed"
 *    - Includes custom reason for tracking
 * 
 * 3. cleanup: Legacy operation to delete old completed/failed formations
 *    - Removes formations older than specified days
 *    - Used for database maintenance
 * 
 * MONITORING QUERIES:
 * 
 * - getStaleFormations: Returns list of formations that need cleanup
 * - getFormationStats: Provides overview of formation status counts
 * 
 * AUTOMATIC CLEANUP:
 * 
 * - Cron job runs every 15 minutes to clean up stale formations
 * - Daily cleanup removes old completed/failed formations (7+ days old)
 * - See convex/crons.ts for scheduling details
 * 
 * USAGE EXAMPLES:
 * 
 * // Clean up stale formations manually
 * await mutateFormation({ operation: "cleanup_stale", userId: "user123" });
 * 
 * // Force reset for debugging
 * await mutateFormation({ 
 *   operation: "force_reset", 
 *   userId: "user123", 
 *   reason: "Debug session reset" 
 * });
 * 
 * // Check for stale formations
 * const stale = await getStaleFormations({ timeoutMinutes: 30 });
 * 
 * // Get formation statistics
 * const stats = await getFormationStats();
 */

import { Infer, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import schema from "./schema";
import { validateConvexId, formationRunIdValidator } from "./utils/idValidation";

// Helper function to extract and validate run ID from various formats
function extractAndValidateRunId(runIdValue: any, operation: string): Id<"crystal_formation_runs"> {
  if (!runIdValue) {
    throw new Error(`runId is required for ${operation} operation`);
  }
  
  // Extract run ID from various formats
  let extractedValue = runIdValue;
  if (typeof runIdValue === 'object' && runIdValue?.data) {
    extractedValue = runIdValue.data;
  }
  
  // Additional validation for empty or invalid runId values
  if (!extractedValue || extractedValue === "" || extractedValue === null || extractedValue === undefined) {
    throw new Error(`runId cannot be empty or null for ${operation} operation`);
  }
  
  try {
    return validateConvexId(extractedValue, "crystal_formation_runs");
  } catch (error) {
    throw new Error(`Invalid runId format for ${operation} operation: ${error instanceof Error ? error.message : String(error)}`);
  }
}

const formationRunValidator = schema.tables.crystal_formation_runs.validator;
export type FormationRun = Infer<typeof formationRunValidator>;

// Flexible validator for all formation operations
// Includes all possible fields, most are optional to handle both creation and updates
const formationRunUpdateValidator = v.object({
  // Required fields for creation (optional for updates)
  userId: v.optional(v.string()),
  status: v.optional(v.union(
    v.literal("running"),
    v.literal("completed"), 
    v.literal("failed")
  )),
  input_shard_count: v.optional(v.number()),
  trigger_type: v.optional(v.union(
    v.literal("threshold_reached"),
    v.literal("periodic_refresh"),
    v.literal("manual_trigger")
  )),
  started_at: v.optional(v.number()),
  formation_version: v.optional(v.string()),
  
  // Event tracking
  event_type: v.optional(v.string()),
  timestamp: v.optional(v.number()),
  
  // Results
  clusters_formed: v.optional(v.number()),
  crystals_created: v.optional(v.number()),
  crystals_failed: v.optional(v.number()),
  
  // Additional tracking fields
  crystal_count: v.optional(v.number()),
  crystals_updated: v.optional(v.number()),
  crystals_merged: v.optional(v.number()),
  crystals_archived: v.optional(v.number()),
  evolution_events: v.optional(v.number()),
  vector_matches_found: v.optional(v.number()),
  agent_recommendations_used: v.optional(v.number()),
  
  // Timing (completed_at and duration_ms are calculated in mutation)
  completed_at: v.optional(v.number()),
  duration_ms: v.optional(v.number()),
  
  // Error handling
  error_message: v.optional(v.string()),
});

const formationMutationValidator = v.object({
  operation: v.union(
    v.literal("start"), 
    v.literal("complete"), 
    v.literal("fail"), 
    v.literal("cancel"), 
    v.literal("cleanup"), 
    v.literal("cleanup_stale"),
    v.literal("force_reset"),
    v.literal("track_event")
  ),
  userId: v.string(),
  data: v.optional(formationRunUpdateValidator), // Use update validator for all operations
  runId: v.optional(v.any()),
  olderThanDays: v.optional(v.number()),
  maxToDelete: v.optional(v.number()),
  reason: v.optional(v.string()),
  timeoutMinutes: v.optional(v.number()),
  forceReset: v.optional(v.boolean())
});

export const mutateFormation = mutation({
  args: formationMutationValidator,
  
  handler: async (ctx, args) => {
    if (args.operation === "start") {
      // Validate required fields for start operation
      if (!args.data) {
        throw new Error("data is required for start operation");
      }
      
      const requiredFields = ['userId', 'status', 'input_shard_count', 'trigger_type', 'started_at', 'formation_version'];
      for (const field of requiredFields) {
        if (!(field in args.data) || args.data[field as keyof typeof args.data] === undefined) {
          throw new Error(`Missing required field '${field}' for start operation`);
        }
      }
      
      // First, clean up any stale formations for this user (older than 5 minutes for faster recovery)
      const timeoutMs = 5 * 60 * 1000; // 5 minutes (reduced from 30 minutes)
      const cutoffTime = Date.now() - timeoutMs;
      
      const staleRuns = await ctx.db.query("crystal_formation_runs")
        .withIndex("by_user_status", q => q.eq("userId", args.userId).eq("status", "running"))
        .filter(q => q.lt(q.field("started_at"), cutoffTime))
        .take(10);

      // Clean up stale formations
      let cleanedCount = 0;
      for (const staleRun of staleRuns) {
        await ctx.db.patch(staleRun._id, {
          status: "failed",
          error_message: "Timeout cleanup: Formation exceeded 5 minute timeout during new formation start",
          completed_at: Date.now(),
          duration_ms: Date.now() - staleRun.started_at,
        });
        cleanedCount++;
      }
      
      if (cleanedCount > 0) {
        console.log(`🧹 [FORMATION START] Cleaned up ${cleanedCount} stale formations for user ${args.userId}`);
      }
      
      // Check for any remaining running formations after cleanup
      const existingRun = await ctx.db.query("crystal_formation_runs")
        .withIndex("by_user_status", q => q.eq("userId", args.userId).eq("status", "running"))
        .first();
      
      if (existingRun) {
        // If it's recent (within 5 minutes), it's a legitimate conflict
        const ageMinutes = (Date.now() - existingRun.started_at) / (60 * 1000);
        if (ageMinutes < 5) {
          // Return the existing run ID instead of throwing an error
          console.log(`⚠️ [FORMATION START] Formation already in progress: ${existingRun._id} (started ${Math.floor(ageMinutes)} minutes ago)`);
          return existingRun._id;
        } else {
          // This shouldn't happen after cleanup, but just in case
          console.log(`🧹 [FORMATION START] Force cleaning stale formation: ${existingRun._id}`);
          await ctx.db.patch(existingRun._id, {
            status: "failed",
            error_message: "Force cleanup: Formation was stale during new formation start",
            completed_at: Date.now(),
            duration_ms: Date.now() - existingRun.started_at,
          });
        }
      }
      
      console.log(`🚀 [FORMATION START] Starting new formation for user ${args.userId}`);
      return ctx.db.insert("crystal_formation_runs", args.data as any);
    }

    if (args.operation === "complete") {
      try {
        const runId = extractAndValidateRunId(args.runId, "complete");
        
        const run = await ctx.db.get(runId);
        if (!run) {
          throw new Error(`Formation run ${runId} not found. The run may have been deleted.`);
        }
        if (run.status !== "running") {
          throw new Error(`Cannot complete formation run ${runId}: current status is '${run.status}', expected 'running'`);
        }
        
        const completedAt = Date.now();
        const updateData = { ...args.data!, completed_at: completedAt, duration_ms: completedAt - run.started_at };
        await ctx.db.patch(runId, updateData);
        
        console.log(`Formation completed successfully: ${runId} (duration: ${completedAt - run.started_at}ms)`);
        return { success: true, duration_ms: completedAt - run.started_at, runId: runId };
      } catch (error) {
        console.error(`Failed to complete formation:`, error);
        throw new Error(`Failed to complete formation: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (args.operation === "fail") {
      try {
        const runId = extractAndValidateRunId(args.runId, "fail");
        
        const run = await ctx.db.get(runId);
        if (!run) {
          console.log(`Formation run not found for fail operation: ${runId}`);
          return { success: true, found: false, message: `Formation run ${runId} not found` };
        }
        
        const completedAt = Date.now();
        const updateData = { ...args.data!, completed_at: completedAt, duration_ms: completedAt - run.started_at };
        await ctx.db.patch(runId, updateData);
        
        console.log(`Formation marked as failed: ${runId} (reason: ${updateData.error_message || 'No reason provided'})`);
        return { success: true, found: true, runId: runId };
      } catch (error) {
        console.error(`Failed to mark formation as failed:`, error);
        throw new Error(`Failed to mark formation as failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (args.operation === "cancel") {
      const runningFormation = await ctx.db.query("crystal_formation_runs").withIndex("by_user_status", q => q.eq("userId", args.userId).eq("status", "running")).first();
      if (!runningFormation) return { success: false, message: "No running formation found" };
      
      await ctx.db.patch(runningFormation._id, {
        status: "failed",
        error_message: `Cancelled: ${args.reason || "Manual cancellation"}`,
        completed_at: Date.now(),
        duration_ms: Date.now() - runningFormation.started_at,
      });
      return { success: true, cancelledRunId: runningFormation._id };
    }

    if (args.operation === "track_event") {
      // For track_event, we update an existing run with event data
      if (!args.runId) {
        throw new Error("runId is required for track_event operation. Please provide a valid formation run ID.");
      }
      
      try {
        // Use the helper function to extract and validate the run ID
        const runId = extractAndValidateRunId(args.runId, "track_event");
        
        const run = await ctx.db.get(runId);
        if (!run) {
          throw new Error(`Formation run ${runId} not found. The run may have been deleted or the ID is invalid.`);
        }
        
        // Ensure we have data to update
        if (!args.data) {
          throw new Error("No data provided for track_event operation");
        }
        
        // Update the run with the event data
        await ctx.db.patch(runId, args.data);
        
        console.log(`📊 [FORMATION TRACK] Event tracked successfully for run ${runId}`);
        return { success: true, message: "Event tracked successfully", runId: runId };
      } catch (error) {
        console.error(`❌ [FORMATION TRACK] Failed to track event:`, error);
        throw new Error(`Failed to track event: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (args.operation === "cleanup_stale") {
      // Clean up stale "running" formations older than timeout (default 30 minutes)
      const timeoutMs = (args.timeoutMinutes || 30) * 60 * 1000;
      const cutoffTime = Date.now() - timeoutMs;
      
      const staleRuns = await ctx.db.query("crystal_formation_runs")
        .withIndex("by_status", q => q.eq("status", "running"))
        .filter(q => q.lt(q.field("started_at"), cutoffTime))
        .take(args.maxToDelete || 50);

      let cleanedCount = 0;
      for (const run of staleRuns) {
        await ctx.db.patch(run._id, {
          status: "failed",
          error_message: `Timeout cleanup: Formation exceeded ${args.timeoutMinutes || 30} minute timeout`,
          completed_at: Date.now(),
          duration_ms: Date.now() - run.started_at,
        });
        cleanedCount++;
      }
      
      return { 
        success: true, 
        cleanedCount, 
        timeoutMinutes: args.timeoutMinutes || 30,
        message: `Cleaned up ${cleanedCount} stale formations older than ${args.timeoutMinutes || 30} minutes`
      };
    }

    if (args.operation === "force_reset") {
      // Force reset all running formations for a user (development/debugging)
      if (!args.userId) throw new Error("userId is required for force_reset operation");
      
      const runningFormations = await ctx.db.query("crystal_formation_runs")
        .withIndex("by_user_status", q => q.eq("userId", args.userId).eq("status", "running"))
        .take(args.maxToDelete || 10);

      let resetCount = 0;
      for (const run of runningFormations) {
        await ctx.db.patch(run._id, {
          status: "failed",
          error_message: `Force reset: ${args.reason || "Manual force reset for debugging"}`,
          completed_at: Date.now(),
          duration_ms: Date.now() - run.started_at,
        });
        resetCount++;
      }
      
      return { 
        success: true, 
        resetCount,
        message: `Force reset ${resetCount} running formations for user ${args.userId}`
      };
    }

    // Legacy cleanup operation for old completed/failed runs
    if (args.operation === "cleanup") {
      const oldRuns = await ctx.db.query("crystal_formation_runs")
        .filter(q => q.lt(q.field("started_at"), Date.now() - args.olderThanDays! * 86400000))
        .take(args.maxToDelete || 100);

      for (const run of oldRuns) await ctx.db.delete(run._id);
      return { success: true, deletedCount: oldRuns.length };
    }

    throw new Error(`Unknown operation: ${args.operation}`);
  }
});

// Query to check for stale formations that need cleanup
export const getStaleFormations = query({
  args: { 
    timeoutMinutes: v.optional(v.number()),
    maxResults: v.optional(v.number())
  },
  returns: v.array(v.object({
    _id: v.id("crystal_formation_runs"),
    userId: v.string(),
    started_at: v.number(),
    status: v.string(),
    age_minutes: v.number()
  })),
  handler: async (ctx, args) => {
    const timeoutMs = (args.timeoutMinutes || 30) * 60 * 1000;
    const cutoffTime = Date.now() - timeoutMs;
    
    const staleRuns = await ctx.db.query("crystal_formation_runs")
      .withIndex("by_status", q => q.eq("status", "running"))
      .filter(q => q.lt(q.field("started_at"), cutoffTime))
      .take(args.maxResults || 20);

    return staleRuns.map(run => ({
      _id: run._id,
      userId: run.userId,
      started_at: run.started_at,
      status: run.status,
      age_minutes: Math.floor((Date.now() - run.started_at) / (60 * 1000))
    }));
  }
});

// Query to get formation statistics for monitoring
export const getFormationStats = query({
  args: {},
  returns: v.object({
    running: v.number(),
    completed: v.number(),
    failed: v.number(),
    stale_running: v.number(),
    oldest_running_minutes: v.optional(v.number())
  }),
  handler: async (ctx) => {
    const allRuns = await ctx.db.query("crystal_formation_runs").collect();
    
    const stats = {
      running: 0,
      completed: 0,
      failed: 0,
      stale_running: 0,
      oldest_running_minutes: undefined as number | undefined
    };
    
    const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
    let oldestRunningTime: number | undefined;
    
    for (const run of allRuns) {
      stats[run.status as keyof typeof stats]++;
      
      if (run.status === "running") {
        if (run.started_at < thirtyMinutesAgo) {
          stats.stale_running++;
        }
        
        if (!oldestRunningTime || run.started_at < oldestRunningTime) {
          oldestRunningTime = run.started_at;
        }
      }
    }
    
    if (oldestRunningTime) {
      stats.oldest_running_minutes = Math.floor((Date.now() - oldestRunningTime) / (60 * 1000));
    }
    
    return stats;
  }
});
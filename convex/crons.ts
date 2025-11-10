import { cronJobs } from "convex/server";
import { api, internal } from "./_generated/api";
import { internalMutation, internalAction } from "./_generated/server";
import { v } from "convex/values";

// Internal mutation to run the stale formation cleanup
export const cleanupStaleFormations = internalMutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    cleanedCount: v.number(),
    message: v.string()
  }),
  handler: async (ctx) => {
    // Find all stale running formations (older than 30 minutes)
    const timeoutMs = 30 * 60 * 1000; // 30 minutes
    const cutoffTime = Date.now() - timeoutMs;
    
    const staleRuns = await ctx.db.query("crystal_formation_runs")
      .withIndex("by_status", q => q.eq("status", "running"))
      .filter(q => q.lt(q.field("started_at"), cutoffTime))
      .take(50); // Limit to 50 per run to avoid overwhelming the system

    let cleanedCount = 0;
    for (const run of staleRuns) {
      await ctx.db.patch(run._id, {
        status: "failed",
        error_message: "Automatic cleanup: Formation exceeded 30 minute timeout",
        completed_at: Date.now(),
        duration_ms: Date.now() - run.started_at,
      });
      cleanedCount++;
    }
    
    if (cleanedCount > 0) {
      console.log(`Cleaned up ${cleanedCount} stale formations`);
    }
    
    return { 
      success: true, 
      cleanedCount,
      message: `Cleaned up ${cleanedCount} stale formations`
    };
  },
});

// Internal mutation to clean up old completed/failed formations (older than 7 days)
export const cleanupOldFormations = internalMutation({
  args: {},
  returns: v.object({
    success: v.boolean(),
    deletedCount: v.number(),
    message: v.string()
  }),
  handler: async (ctx) => {
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    
    const oldRuns = await ctx.db.query("crystal_formation_runs")
      .filter(q => 
        q.and(
          q.lt(q.field("started_at"), sevenDaysAgo),
          q.or(
            q.eq(q.field("status"), "completed"),
            q.eq(q.field("status"), "failed")
          )
        )
      )
      .take(100); // Limit to 100 per run

    let deletedCount = 0;
    for (const run of oldRuns) {
      await ctx.db.delete(run._id);
      deletedCount++;
    }
    
    if (deletedCount > 0) {
      console.log(`Deleted ${deletedCount} old formation records`);
    }
    
    return { 
      success: true, 
      deletedCount,
      message: `Deleted ${deletedCount} old formation records`
    };
  },
});

// Internal action to trigger background crystal formation cycle
export const triggerFormationCycle = internalAction({
  args: {},
  handler: async (ctx) => {
    try {
      console.log("[CRON] Triggering background crystal formation cycle");
      
      const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) {
        throw new Error("BACKEND_URL not configured");
      }
      
      const response = await fetch(`${backendUrl}/api/v1/background-tasks/crystal-formation-cycle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Backend returned ${response.status}: ${errorText}`);
      }
      
      const result = await response.json();
      
      console.log(`[CRON] Formation cycle complete: ${result.users_processed} users, ${result.formations_triggered} formations`);
      
      return {
        success: true,
        ...result
      };
    } catch (error: any) {
      console.error("[CRON] Formation cycle failed:", error);
      return {
        success: false,
        error: error.message
      };
    }
  },
});

// Internal action to process pending intelligence jobs
export const processIntelligenceJobs = internalAction({
  args: {},
  handler: async (ctx) => {
    try {
      console.log("[CRON] Processing pending intelligence jobs");
      
      // Get pending jobs from the database
      const pendingJobs = await ctx.runQuery(internal.intelligenceQueries.getPendingJobs, {
        limit: 20 // Process up to 20 jobs per cycle
      });
      
      if (pendingJobs.length === 0) {
        console.log("[CRON] No pending intelligence jobs");
        return {
          success: true,
          jobs_processed: 0,
          message: "No pending jobs"
        };
      }
      
      console.log(`[CRON] Found ${pendingJobs.length} pending intelligence jobs`);
      
      const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
      if (!backendUrl) {
        throw new Error("BACKEND_URL not configured");
      }
      
      let processed = 0;
      let failed = 0;
      
      // Process each job
      for (const job of pendingJobs) {
        try {
          // Mark job as running
          await ctx.runMutation(internal.intelligenceMutations.updateJobStatus, {
            jobId: job._id,
            status: "running" as const,
          });
          
          // Trigger backend analysis
          const response = await fetch(`${backendUrl}/api/v1/crystal_intelligence/analyze`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              userId: job.userId,
              jobId: job._id,
              jobType: "scheduled_analysis",
              scope: {
                analysis_depth: job.scope.analysis_depth,
                trigger_source: "scheduled",
                convex_job_id: job._id
              },
              analysisDepth: job.scope.analysis_depth
            }),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Backend returned ${response.status}: ${errorText}`);
          }
          
          processed++;
          console.log(`[CRON] Processed intelligence job ${job._id} for user ${job.userId}`);
          
        } catch (error: any) {
          failed++;
          console.error(`[CRON] Failed to process job ${job._id}:`, error);
          
          // Mark job as failed
          await ctx.runMutation(internal.intelligenceMutations.updateJobStatus, {
            jobId: job._id,
            status: "failed" as const,
            error: error.message
          });
        }
      }
      
      console.log(`[CRON] Intelligence processing complete: ${processed} processed, ${failed} failed`);
      
      return {
        success: true,
        jobs_processed: processed,
        jobs_failed: failed,
        message: `Processed ${processed} intelligence jobs`
      };
      
    } catch (error: any) {
      console.error("[CRON] Intelligence processing failed:", error);
      return {
        success: false,
        error: error.message
      };
    }
  },
});

const crons = cronJobs();

// Run stale formation cleanup every 15 minutes
crons.interval(
  "cleanup stale formations", 
  { minutes: 15 }, 
  internal.crons.cleanupStaleFormations,
  {}
);

// Run old formation cleanup once daily at 2 AM
crons.cron(
  "cleanup old formations",
  "0 2 * * *", // Daily at 2 AM
  internal.crons.cleanupOldFormations,
  {}
);

// Run background crystal formation cycle every 5 hours
// Checks all users for unprocessed shards (12+) and triggers formation
crons.interval(
  "background crystal formation",
  { hours: 5 },
  internal.crons.triggerFormationCycle,
  {}
);

// Process pending intelligence jobs every 30 minutes
// This picks up any jobs that weren't processed by the MAB system
crons.interval(
  "process intelligence jobs",
  { minutes: 30 },
  internal.crons.processIntelligenceJobs,
  {}
);

export default crons;

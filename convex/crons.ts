import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";
import { internalMutation } from "./_generated/server";
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

// Process intelligence jobs every 5 minutes
crons.interval(
  "process intelligence jobs",
  { minutes: 5 },
  internal.intelligenceScheduled.processIntelligenceJobs,
  {}
);

export default crons;

import { query } from "./_generated/server";
import { v } from "convex/values";

const formationQueryValidator = v.object({
  operation: v.union(v.literal("status"), v.literal("history"), v.literal("stats"), v.literal("eligibility")),
  userId: v.string(),
  includeHistory: v.optional(v.boolean()),
  limit: v.optional(v.number()),
  timeRangeHours: v.optional(v.number()),
  minShards: v.optional(v.number()),
  minDaysSinceLastRun: v.optional(v.number())
});

export const queryFormation = query({
  args: formationQueryValidator,
  
  handler: async (ctx, args) => {
    if (args.operation === "status") {
      const [currentRun, lastCompleted] = await Promise.all([
        ctx.db.query("crystal_formation_runs").withIndex("by_user_status", q => q.eq("userId", args.userId).eq("status", "running")).first(),
        ctx.db.query("crystal_formation_runs").withIndex("by_user", q => q.eq("userId", args.userId)).filter(q => q.neq(q.field("status"), "running")).order("desc").first()
      ]);

      return {
        canStart: !currentRun,
        isRunning: !!currentRun,
        currentRunId: currentRun?._id,
        lastRunStatus: lastCompleted?.status,
        timeSinceLastRun: lastCompleted?.completed_at ? Date.now() - lastCompleted.completed_at : null,
        history: args.includeHistory ? await ctx.db.query("crystal_formation_runs").withIndex("by_user", q => q.eq("userId", args.userId)).order("desc").take(args.limit || 5) : []
      };
    }

    if (args.operation === "history") {
      return ctx.db.query("crystal_formation_runs").withIndex("by_user", q => q.eq("userId", args.userId)).order("desc").take(args.limit || 10);
    }

    if (args.operation === "stats") {
      const runs = await ctx.db.query("crystal_formation_runs")
        .filter(q => q.eq(q.field("userId"), args.userId))
        .filter(q => q.gte(q.field("started_at"), Date.now() - (args.timeRangeHours || 24) * 3600000))
        .collect();

      return {
        total: runs.length,
        completed: runs.filter(r => r.status === "completed").length,
        failed: runs.filter(r => r.status === "failed").length,
        running: runs.filter(r => r.status === "running").length,
        avgDuration: runs.filter(r => r.duration_ms).reduce((sum, r) => sum + r.duration_ms!, 0) / Math.max(1, runs.filter(r => r.duration_ms).length),
        totalCrystalsCreated: runs.reduce((sum, r) => sum + (r.crystals_created || 0), 0)
      };
    }

    const [shardCount, lastRun, runningRun] = await Promise.all([
      ctx.db.query("crystal_shards").withIndex("by_user", q => q.eq("userId", args.userId)).collect().then(s => s.length),
      ctx.db.query("crystal_formation_runs").withIndex("by_user", q => q.eq("userId", args.userId)).order("desc").first(),
      ctx.db.query("crystal_formation_runs").withIndex("by_user_status", q => q.eq("userId", args.userId).eq("status", "running")).first()
    ]);

    const minShards = args.minShards || 15;
    const minDays = args.minDaysSinceLastRun || 3;
    const daysSinceLastRun = lastRun?.completed_at ? (Date.now() - lastRun.completed_at) / 86400000 : Infinity;
    
    const hasEnoughShards = shardCount >= minShards;
    const hasWaitedEnough = daysSinceLastRun >= minDays;
    const noRunningFormation = !runningRun;

    return {
      eligible: hasEnoughShards && hasWaitedEnough && noRunningFormation,
      shardCount,
      daysSinceLastRun: Math.floor(daysSinceLastRun),
      hasRunningFormation: !!runningRun,
      reasons: { insufficientShards: !hasEnoughShards, tooSoon: !hasWaitedEnough, alreadyRunning: !!runningRun }
    };
  }
});
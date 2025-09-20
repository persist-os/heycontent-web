import { Infer, v } from "convex/values";
import { mutation } from "./_generated/server";
import schema from "./schema";

const formationRunValidator = schema.tables.crystal_formation_runs.validator;
export type FormationRun = Infer<typeof formationRunValidator>;

const formationMutationValidator = v.object({
  operation: v.union(v.literal("start"), v.literal("complete"), v.literal("fail"), v.literal("cancel"), v.literal("cleanup")),
  userId: v.string(),
  data: v.optional(formationRunValidator),
  runId: v.optional(v.id("crystal_formation_runs")),
  olderThanDays: v.optional(v.number()),
  maxToDelete: v.optional(v.number()),
  reason: v.optional(v.string())
});

export const mutateFormation = mutation({
  args: formationMutationValidator,
  
  handler: async (ctx, args) => {
    if (args.operation === "start") {
      const existingRun = await ctx.db.query("crystal_formation_runs").withIndex("by_user_status", q => q.eq("userId", args.userId).eq("status", "running")).first();
      if (existingRun) throw new Error(`Formation already in progress: ${existingRun._id}`);
      return ctx.db.insert("crystal_formation_runs", args.data!);
    }

    if (args.operation === "complete") {
      const run = await ctx.db.get(args.runId!);
      if (!run) throw new Error(`Formation run ${args.runId} not found`);
      if (run.status !== "running") throw new Error(`Cannot complete formation run ${args.runId}: status is ${run.status}`);
      
      const completedAt = Date.now();
      const updateData = { ...args.data!, completed_at: completedAt, duration_ms: completedAt - run.started_at };
      await ctx.db.patch(args.runId!, updateData);
      return { success: true, duration_ms: completedAt - run.started_at };
    }

    if (args.operation === "fail") {
      const run = await ctx.db.get(args.runId!);
      if (!run) return { success: true, found: false };
      
      const completedAt = Date.now();
      const updateData = { ...args.data!, completed_at: completedAt, duration_ms: completedAt - run.started_at };
      await ctx.db.patch(args.runId!, updateData);
      return { success: true, found: true };
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

    const oldRuns = await ctx.db.query("crystal_formation_runs")
      .filter(q => q.lt(q.field("started_at"), Date.now() - args.olderThanDays! * 86400000))
      .take(args.maxToDelete || 100);

    for (const run of oldRuns) await ctx.db.delete(run._id);
    return { success: true, deletedCount: oldRuns.length };
  }
});
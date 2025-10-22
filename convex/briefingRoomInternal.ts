/**
 * Briefing Room Internal Mutations
 * 
 * Internal mutation wrappers that expose briefing room helper functions
 * for backend HTTP access. Called from http.ts endpoints.
 */

import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import * as briefingHelpers from "./briefingRoomHelpers";

/**
 * Publish system intelligence briefing (internal mutation wrapper)
 */
export const publishSystemIntelligenceBriefing = internalMutation({
  args: {
    userId: v.string(),
    alertType: v.string(),
    title: v.string(),
    description: v.string(),
    priority: v.optional(v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    )),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const eventId = await briefingHelpers.publishSystemIntelligenceBriefing(ctx, args);
    return eventId;
  },
});

/**
 * Publish crystal formation briefing (internal mutation wrapper)
 */
export const publishCrystalFormationBriefing = internalMutation({
  args: {
    userId: v.string(),
    crystalId: v.string(),
    crystalName: v.string(),
    crystalType: v.string(),
    confidenceScore: v.string(),
    coreInsight: v.optional(v.string()),
    shardCount: v.number(),
  },
  handler: async (ctx, args) => {
    const eventId = await briefingHelpers.publishCrystalFormationBriefing(ctx, {
      ...args,
      crystalId: args.crystalId as any, // Cast to Id type
    });
    return eventId;
  },
});

/**
 * Publish widget completion briefing (internal mutation wrapper)
 */
export const publishWidgetCompletionBriefing = internalMutation({
  args: {
    userId: v.string(),
    widgetId: v.string(),
    widgetTitle: v.string(),
    widgetType: v.string(),
    completedAt: v.number(),
    summary: v.optional(v.string()),
    projectId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const eventId = await briefingHelpers.publishWidgetCompletionBriefing(ctx, {
      ...args,
      widgetId: args.widgetId as any, // Cast to Id type
      projectId: args.projectId as any, // Cast to Id type
    });
    return eventId;
  },
});


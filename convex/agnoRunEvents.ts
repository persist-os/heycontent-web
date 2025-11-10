import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { agnoRunEventValidator } from "./types/agnoRunEvent";

export const recordAgnoRunEvents = mutation({
  args: {
    events: v.array(agnoRunEventValidator),
  },
  handler: async (ctx, { events }) => {
    const fallbackTimestamp = Date.now();

    for (const event of events) {
      await ctx.db.insert("agnoRunEvents", {
        ...event,
        eventType: event.eventType ?? "unknown" as string,
        createdAt: event.createdAt ?? fallbackTimestamp,
      });
    }
  },
});

export const getAgnoRunEvents = query({
  args: {
    agentId: v.optional(v.string()),
    agentType: v.optional(v.string()),
    userId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { agentId, agentType, userId, limit }) => {
    const take = limit ?? 50;

    if (agentId) {
      return await ctx.db
        .query("agnoRunEvents")
        .withIndex("by_agent_time", (q) => q.eq("agentId", agentId))
        .order("desc")
        .take(take);
    }

    if (userId) {
      return await ctx.db
        .query("agnoRunEvents")
        .withIndex("by_user_time", (q) => q.eq("userId", userId))
        .order("desc")
        .take(take);
    }

    if (agentType) {
      return await ctx.db
        .query("agnoRunEvents")
        .withIndex("by_agentType_time", (q) => q.eq("agentType", agentType))
        .order("desc")
        .take(take);
    }

    return await ctx.db.query("agnoRunEvents").order("desc").take(take);
  },
});

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const storeGmailTokens = mutation({
  args: {
    accessToken: v.string(),
    refreshToken: v.string(),
    expiryDate: v.number(),
    scope: v.string(),
  },
  async handler(ctx, args) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userId = identity.subject;
    const existing = await ctx.db
      .query("gmailTokens")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiryDate: args.expiryDate,
        scope: args.scope,
      });
    } else {
      await ctx.db.insert("gmailTokens", {
        userId,
        ...args,
      });
    }
  },
});

export const getGmailTokens = query({
  async handler(ctx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    return await ctx.db
      .query("gmailTokens")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();
  },
});
import { query, mutation } from "./_generated/server"
import { v } from "convex/values"
import { Id } from "./_generated/dataModel"

export const get = query({
  args: {
    userId: v.string(),
    platform: v.string()
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tokens")
      .withIndex("by_user_platform", (q) =>
        q.eq("userId", args.userId).eq("platform", args.platform)
      )
      .first()
  }
})

export const save = mutation({
  args: {
    userId: v.string(),
    platform: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.number(),
    tokenType: v.string(),
    scope: v.array(v.string())
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("tokens")
      .withIndex("by_user_platform", (q) =>
        q.eq("userId", args.userId).eq("platform", args.platform)
      )
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        tokenType: args.tokenType,
        scope: args.scope,
        lastRefreshed: Date.now()
      })
    } else {
      await ctx.db.insert("tokens", {
        userId: args.userId,
        platform: args.platform,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        tokenType: args.tokenType,
        scope: args.scope,
        lastRefreshed: Date.now()
      })
    }
  }
})

export const update = mutation({
  args: {
    id: v.id("tokens"),
    accessToken: v.string(),
    expiresAt: v.number(),
    tokenType: v.string(),
    scope: v.array(v.string()),
    lastRefreshed: v.number()
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      accessToken: args.accessToken,
      expiresAt: args.expiresAt,
      tokenType: args.tokenType,
      scope: args.scope,
      lastRefreshed: args.lastRefreshed
    })
  }
}) 
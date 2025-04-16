import { query, mutation } from "./_generated/server"
import { v } from "convex/values"

export const get = query({
  args: {
    userId: v.string(),
    platform: v.string()
  },
  handler: async (ctx, args) => {
    const token = await ctx.db
      .query("tokens")
      .withIndex("by_user_platform", (q) =>
        q.eq("userId", args.userId).eq("platform", args.platform)
      )
      .first()

    return token
  }
})

export const save = mutation({
  args: {
    userId: v.string(),
    platform: v.string(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.number(),
    scope: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Check if token exists
    const existingToken = await ctx.db
      .query("tokens")
      .withIndex("by_user_platform", (q) =>
        q.eq("userId", args.userId).eq("platform", args.platform)
      )
      .first()

    if (existingToken) {
      // Update existing token
      await ctx.db.patch(existingToken._id, {
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        scope: args.scope
      })
      return existingToken._id
    } else {
      // Create new token
      return await ctx.db.insert("tokens", {
        userId: args.userId,
        platform: args.platform,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiresAt: args.expiresAt,
        scope: args.scope
      })
    }
  }
}) 
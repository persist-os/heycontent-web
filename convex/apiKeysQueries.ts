import { query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const get = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        const apiKeys = await ctx.db
            .query("api_keys")
            .filter((q) =>
                q.and(
                    q.eq(q.field("user_id"), args.userId),
                    q.eq(q.field("status"), "active")
                )
            )
            .collect();

        return apiKeys.length > 0 ?
            { exists: true, keyId: apiKeys[0]._id } :
            { exists: false };
    },
});

export const listActive = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("api_keys")
            .filter((q) => q.eq(q.field("status"), "active"))
            .collect();
    },
});

export const getById = query({
  args: { keyIdStr: v.string() },
  handler: async (ctx, args) => {
    try {
      // Try to find the key by directly querying for it
      const apiKeys = await ctx.db
        .query("api_keys")
        // Use .normalizeId to safely convert string to Id<"api_keys"> or return null
        .filter((q) => q.eq(q.field("_id"), ctx.db.normalizeId("api_keys", args.keyIdStr)))
        .collect();

      if (apiKeys.length > 0) {
        return apiKeys[0];
      }

      // If not found, return null
      return null;
    } catch (error) {
      console.error("Error finding API key:", error);
      // Consider if throwing the error might be better depending on usage
      return null;
    }
  },
}); 
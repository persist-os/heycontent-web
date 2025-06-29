import { query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const get = query({
    args: { userId: v.string() },
    handler: async (ctx, args) => {
        const apiKeys = await ctx.db
            .query("api_keys")
            .filter((q) => q.eq(q.field("user_id"), args.userId))
            .collect();

        return apiKeys.length > 0 ?
            { exists: true, keyId: apiKeys[0]._id } :
            { exists: false };
    },
});

export const listAll = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("api_keys")
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

export const validate_api_key = query({
  args: {
    key_hash: v.string(),
  },
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("api_keys")
      .filter((q) => q.eq(q.field("hashed_key"), args.key_hash))
      .first();

    return result ? result.user_id : null;
  },
});

export const getUserKeys = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKeys = await ctx.db
      .query("api_keys")
      .filter((q) => q.eq(q.field("user_id"), args.userId))
      .collect();

    // Format keys to return relevant data but exclude the hashed_key for security
    // Use the Convex _id as the key_id in the response
    const formattedKeys = apiKeys.map(key => ({
      key_id: key._id, // This is the Convex-generated ID
      created_at: key.created_at,
      scopes: key.scopes || [],
      rate_tier: key.rate_tier || "default",
      status: key.status || "active",
      clientType: key.clientType || 'web',
    }));

    return formattedKeys;
  },
}); 
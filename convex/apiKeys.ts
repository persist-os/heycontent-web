import { mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import bcrypt from "bcryptjs";
import { query } from "./_generated/server";

// Helper mutation for the action to use
export const insertApiKey = mutation({
  args: {
    hashed_key: v.string(),
    user_id: v.string(),
    scopes: v.array(v.string()),
    rate_tier: v.string(),
    status: v.union(v.literal("active"), v.literal("revoked")),
    created_at: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("api_keys", {
      hashed_key: args.hashed_key,
      user_id: args.user_id,
      scopes: args.scopes,
      rate_tier: args.rate_tier,
      status: args.status,
      created_at: args.created_at,
    });
  },
});

export const generate = action({
    args: {
        user_id: v.string(),
        scopes: v.optional(v.array(v.string())),
        rate_tier: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const key = crypto.randomUUID() + "-" + crypto.randomUUID();
        const hashed_key = await bcrypt.hash(key, 10);

        await ctx.runMutation(api.apiKeys.insertApiKey, {
            hashed_key,
            user_id: args.user_id,
            scopes: args.scopes ?? [],
            rate_tier: args.rate_tier ?? "free",
            status: "active",
            created_at: Date.now(),
        });

        return { api_key: key }; // Show only once
    },
});

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

export const revoke = mutation({
    args: { key_id: v.id("api_keys") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.key_id, { status: "revoked" });
    },
});

export const getById = query({
  args: { keyIdStr: v.string() },
  handler: async (ctx, args) => {
    try {
      // Try to find the key by directly querying for it
      const apiKeys = await ctx.db
        .query("api_keys")
        .filter((q) => q.eq(q.field("_id"), args.keyIdStr))
        .collect();
      
      if (apiKeys.length > 0) {
        return apiKeys[0];
      }
      
      // If not found, return null
      return null;
    } catch (error) {
      console.error("Error finding API key:", error);
      return null;
    }
  },
});

export const revokeByStringId = action({
  args: { keyIdStr: v.string() },
  handler: async (ctx, args) => {
    // First find the key in the database to get its ID
    const apiKeys = await ctx.runQuery(api.apiKeys.listActive, {});
    
    // Find the key that matches the ID string representation
    const apiKey = apiKeys.find(key => key._id.toString() === args.keyIdStr);
    
    if (!apiKey) {
      throw new Error("API key not found");
    }
    
    // Now use the proper ID object to revoke the key
    await ctx.runMutation(api.apiKeys.revoke, { key_id: apiKey._id });
    return { success: true };
  }
});

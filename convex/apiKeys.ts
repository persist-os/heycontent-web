"use node";

import { action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import bcrypt from "bcryptjs";

export const generate = action({
    args: {
        user_id: v.string(),
        scopes: v.optional(v.array(v.string())),
        rate_tier: v.optional(v.string())
    },
    handler: async (ctx, args) => {
        const key = crypto.randomUUID() + "-" + crypto.randomUUID();
        const hashed_key = await bcrypt.hash(key, 10);

        await ctx.runMutation(api.apiKeysMutations.insertApiKey, {
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

export const revokeByStringId = action({
  args: { keyIdStr: v.string() },
  handler: async (ctx, args) => {
    // First find the key in the database to get its ID
    const apiKeys = await ctx.runQuery(api.apiKeysQueries.listActive, {});
    
    // Find the key that matches the ID string representation
    const apiKey = apiKeys.find((key: { _id: { toString: () => string } }) => key._id.toString() === args.keyIdStr);
    
    if (!apiKey) {
      throw new Error("API key not found");
    }
    
    // Now use the proper ID object to revoke the key
    await ctx.runMutation(api.apiKeysMutations.revoke, { key_id: apiKey._id });
    return { success: true };
  }
});

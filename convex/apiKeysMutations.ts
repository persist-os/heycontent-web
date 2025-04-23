import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

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

export const revoke = mutation({
    args: { key_id: v.id("api_keys") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.key_id, { status: "revoked" });
    },
}); 
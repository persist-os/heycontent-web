import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const insert_api_key = mutation({
  args: {
    user_id: v.string(),
    key_hash: v.string(),
    scopes: v.optional(v.array(v.string())),
    rate_tier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("api_keys", {
      user_id: args.user_id,
      hashed_key: args.key_hash,
      created_at: Date.now(),
      scopes: args.scopes || [],
      rate_tier: args.rate_tier || "default",
      status: "active",
    });
  },
});

export const delete_api_key = mutation({
  args: { key_id: v.id("api_keys") },
  handler: async (ctx, args) => {
    // Check if the key exists before attempting deletion
    const existingKey = await ctx.db.get(args.key_id);
    if (!existingKey) {
      console.warn(`API key with id ${args.key_id} not found for deletion.`);
      // Depending on requirements, you might throw an error or return a specific status
      return { success: false, message: "Key not found" }; 
    }
    await ctx.db.delete(args.key_id);
    console.log(`Deleted API key with id ${args.key_id}`);
    return { success: true };
  },
}); 
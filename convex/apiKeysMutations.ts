import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const insert_api_key = mutation({
  args: {
    user_id: v.string(),
    key_hash: v.string(),
    clientType: v.union(v.literal("web"), v.literal("extension")),
    scopes: v.optional(v.array(v.string())),
    rate_tier: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find all existing API keys for this user and clientType
    const existingKeys = await ctx.db
      .query("api_keys")
      .filter(q => q.eq(q.field("user_id"), args.user_id))
      .filter(q => q.eq(q.field("clientType"), args.clientType))
      .collect();
    
    // Delete only existing keys for this user and clientType
    for (const key of existingKeys) {
      await ctx.db.delete(key._id);
    }
    
    // Insert the new API key
    await ctx.db.insert("api_keys", {
      user_id: args.user_id,
      hashed_key: args.key_hash,
      created_at: Date.now(),
      clientType: args.clientType,
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
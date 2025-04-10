import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getConnectedAccounts = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const accounts = await ctx.db
      .query("socialAccounts")
      .filter((q) => 
        q.eq(q.field("userId"), args.userId) &&
        q.eq(q.field("isConnected"), true)
      )
      .collect();

    return accounts;
  },
});

export const getConnectionStatus = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const status = await ctx.db
      .query("socialConnectionStatus")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    return status;
  },
});

export const disconnect = mutation({
  args: {
    userId: v.string(),
    platform: v.string(),
  },
  handler: async (ctx, args) => {
    const account = await ctx.db
      .query("socialAccounts")
      .filter((q) => 
        q.eq(q.field("userId"), args.userId) &&
        q.eq(q.field("platform"), args.platform)
      )
      .first();

    // If account exists, update it
    if (account) {
      await ctx.db.patch(account._id, {
        isConnected: false,
        accessToken: "",
        refreshToken: "",
        expiresAt: undefined,
        updatedAt: Date.now(),
      });
    }

    // Update connection status regardless of whether account exists
    const status = await ctx.db
      .query("socialConnectionStatus")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (status) {
      // Normalize platform name to match the schema
      const normalizedPlatform = args.platform.toLowerCase();
      await ctx.db.patch(status._id, {
        connections: {
          ...status.connections,
          [normalizedPlatform]: false,
        },
        lastChecked: Date.now(),
      });
    } else {
      // Create new status if it doesn't exist
      await ctx.db.insert("socialConnectionStatus", {
        userId: args.userId,
        connections: {
          gmail: false,
          youtube: false,
        },
        lastChecked: Date.now(),
      });
    }
  },
});

// Add a new mutation to update connection status
export const updateConnectionStatus = mutation({
  args: {
    userId: v.string(),
    platform: v.string(),
    isConnected: v.boolean(),
  },
  handler: async (ctx, args) => {
    const status = await ctx.db
      .query("socialConnectionStatus")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    const normalizedPlatform = args.platform.toLowerCase();
    
    if (status) {
      await ctx.db.patch(status._id, {
        connections: {
          ...status.connections,
          [normalizedPlatform]: args.isConnected,
        },
        lastChecked: Date.now(),
      });
    } else {
      await ctx.db.insert("socialConnectionStatus", {
        userId: args.userId,
        connections: {
          gmail: false,
          youtube: false,
          [normalizedPlatform]: args.isConnected,
        },
        lastChecked: Date.now(),
      });
    }
  },
}); 
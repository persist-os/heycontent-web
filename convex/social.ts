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
    platform: v.union(
      v.literal("gmail"),
      v.literal("youtube"),
      v.literal("instagram"),
      v.literal("tiktok")
    ),
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
      // Create a new connections object with only valid platforms
      const updatedConnections = {
        gmail: status.connections.gmail,
        youtube: status.connections.youtube,
        instagram: status.connections.instagram || false,
        tiktok: status.connections.tiktok || false,
        [args.platform]: false
      };

      await ctx.db.patch(status._id, {
        connections: updatedConnections,
        lastChecked: Date.now(),
      });
    } else {
      // Initialize with all platforms set to false
      const initialConnections = {
        gmail: false,
        youtube: false,
        instagram: false,
        tiktok: false
      };

      await ctx.db.insert("socialConnectionStatus", {
        userId: args.userId,
        connections: initialConnections,
        lastChecked: Date.now(),
      });
    }
  },
});

// Add a new mutation to update connection status
export const updateConnectionStatus = mutation({
  args: {
    userId: v.string(),
    platform: v.union(
      v.literal("gmail"),
      v.literal("youtube"),
      v.literal("instagram"),
      v.literal("tiktok")
    ),
    isConnected: v.boolean(),
  },
  handler: async (ctx, args) => {
    const status = await ctx.db
      .query("socialConnectionStatus")
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();

    if (status) {
      await ctx.db.patch(status._id, {
        connections: {
          ...status.connections,
          [args.platform]: args.isConnected,
        },
        lastChecked: Date.now(),
      });
    } else {
      // Initialize with all platforms set to false
      const initialConnections = {
        gmail: false,
        youtube: false,
        instagram: false,
        tiktok: false
      };

      await ctx.db.insert("socialConnectionStatus", {
        userId: args.userId,
        connections: {
          ...initialConnections,
          [args.platform]: args.isConnected,
        },
        lastChecked: Date.now(),
      });
    }
  },
}); 
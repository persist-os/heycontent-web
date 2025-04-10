import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Store Gmail data
export const storeGmailData = mutation({
  args: {
    userId: v.string(),
    profileData: v.any(),
    accessToken: v.string(),
    refreshToken: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
    tokenType: v.string(),
    scope: v.string(),
  },
  handler: async (ctx, args) => {
    const { userId, profileData, accessToken, refreshToken, expiresAt, tokenType, scope } = args;

    // Store Gmail data
    await ctx.db.insert("gmailData", {
      userId,
      data: {
        ...profileData,
        accessToken,
        refreshToken,
        expiresAt,
        tokenType,
        scope,
      },
      timestamp: Date.now(),
      messageCount: profileData.messagesTotal,
      labels: profileData.labels || [],
    });

    // Update connection status
    const existingStatus = await ctx.db
      .query("socialConnectionStatus")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .first();

    if (existingStatus) {
      // Update the existing record
      await ctx.db.patch(existingStatus._id, {
        connections: {
          ...existingStatus.connections,
          gmail: true
        },
        lastChecked: Date.now(),
      });
    } else {
      // Create a new record
      await ctx.db.insert("socialConnectionStatus", {
        userId,
        connections: {
          gmail: true,
          youtube: false,
        },
        lastChecked: Date.now(),
      });
    }
  },
});

// Get Gmail data
export const getGmailData = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const data = await ctx.db
      .query("gmailData")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .first();

    return data;
  },
});

// Check Gmail connection status
export const getGmailConnectionStatus = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const status = await ctx.db
      .query("socialConnectionStatus")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    return status?.connections.gmail ?? false;
  },
});

// Store email thread data
export const storeEmailThread = mutation({
  args: {
    userId: v.string(),
    threadId: v.string(),
    threadData: v.any(),
    query: v.optional(v.string()),
    labels: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    const { userId, threadId, threadData, query, labels } = args;

    await ctx.db.insert("gmailData", {
      userId,
      data: {
        threadId,
        ...threadData,
      },
      timestamp: Date.now(),
      query,
      labels,
    });
  },
});

// Get email thread data
export const getEmailThread = query({
  args: { userId: v.string(), threadId: v.string() },
  handler: async (ctx, args) => {
    const data = await ctx.db
      .query("gmailData")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("data.threadId"), args.threadId))
      .order("desc")
      .first();

    return data;
  },
}); 
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
    const timestamp = Date.now();

    try {
      // Store Gmail data
      const gmailDataId = await ctx.db.insert("gmailData", {
        userId,
        data: {
          ...profileData,
          accessToken,
          refreshToken,
          expiresAt,
          tokenType,
          scope,
        },
        timestamp,
        messageCount: profileData.messagesTotal || 0,
        labels: profileData.labels || [],
      });

      // Save to socialAccounts for consistent retrieval
      const existingAccount = await ctx.db
        .query("socialAccounts")
        .filter((q) =>
          q.eq(q.field("userId"), userId) &&
          q.eq(q.field("platform"), "gmail")
        )
        .first();

      const accountData = {
        username: profileData.emailAddress,
        metadata: {
          emailAddress: profileData.emailAddress,
          messagesTotal: profileData.messagesTotal || 0,
          threadsTotal: profileData.threadsTotal || 0,
          historyId: profileData.historyId,
        },
        isConnected: true,
        updatedAt: timestamp
      };

      if (existingAccount) {
        // Update existing account
        await ctx.db.patch(existingAccount._id, accountData);
      } else {
        // Create new account
        await ctx.db.insert("socialAccounts", {
          userId,
          platform: "gmail",
          ...accountData
        });
      }

      // Update connection status
      const status = await ctx.db
        .query("socialConnectionStatus")
        .filter((q) => q.eq(q.field("userId"), userId))
        .first();

      if (status) {
        await ctx.db.patch(status._id, {
          connections: {
            ...status.connections,
            gmail: true
          },
          lastChecked: timestamp,
        });
      } else {
        // Initialize with all platforms set to false except Gmail
        await ctx.db.insert("socialConnectionStatus", {
          userId,
          connections: {
            gmail: true,
            youtube: false,
            instagram: false,
            tiktok: false
          },
          lastChecked: timestamp,
        });
      }

      return gmailDataId;
    } catch (error) {
      console.error('Error storing Gmail data:', error);
      throw new Error(`Failed to store Gmail data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get Gmail data for a user
export const getGmailData = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      const gmailData = await ctx.db
        .query("gmailData")
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .order("desc")
        .first();

      if (!gmailData) {
        return null;
      }

      // Also get the social account data for consistency
      const socialAccount = await ctx.db
        .query("socialAccounts")
        .filter((q) =>
          q.eq(q.field("userId"), args.userId) &&
          q.eq(q.field("platform"), "gmail")
        )
        .first();

      return {
        ...gmailData,
        socialAccount: socialAccount || null
      };
    } catch (error) {
      console.error('Error getting Gmail data:', error);
      throw new Error(`Failed to get Gmail data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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

// Save Gmail profile data
export const saveProfileData = mutation({
  args: {
    userId: v.string(),
    emailAddress: v.string(),
    messagesTotal: v.number(),
    threadsTotal: v.number(),
    historyId: v.string(),
    updatedAt: v.number()
  },
  handler: async (ctx, args) => {
    const { userId, emailAddress, messagesTotal, threadsTotal, historyId, updatedAt } = args;

    // Store Gmail profile data
    const gmailDataId = await ctx.db.insert("gmailData", {
      userId,
      data: {
        emailAddress,
        messagesTotal,
        threadsTotal,
        historyId
      },
      timestamp: updatedAt,
      messageCount: messagesTotal,
      labels: []
    });

    // Also save to socialAccounts for consistent retrieval
    const existingAccount = await ctx.db
      .query("socialAccounts")
      .filter((q) =>
        q.eq(q.field("userId"), userId) &&
        q.eq(q.field("platform"), "gmail")
      )
      .first();

    if (existingAccount) {
      // Update existing account
      await ctx.db.patch(existingAccount._id, {
        username: emailAddress,
        metadata: {
          emailAddress,
          messagesTotal,
          threadsTotal,
          historyId
        },
        isConnected: true,
        updatedAt
      });
    } else {
      // Create new account
      await ctx.db.insert("socialAccounts", {
        userId,
        platform: "gmail",
        username: emailAddress,
        metadata: {
          emailAddress,
          messagesTotal,
          threadsTotal,
          historyId
        },
        isConnected: true,
        updatedAt
      });
    }

    // Update connection status
    const status = await ctx.db
      .query("socialConnectionStatus")
      .filter((q) => q.eq(q.field("userId"), userId))
      .first();

    if (status) {
      await ctx.db.patch(status._id, {
        connections: {
          ...status.connections,
          gmail: true,
        },
        lastChecked: updatedAt,
      });
    } else {
      // Initialize with all platforms set to false except Gmail
      await ctx.db.insert("socialConnectionStatus", {
        userId,
        connections: {
          gmail: true,
          youtube: false,
          instagram: false,
          tiktok: false
        },
        lastChecked: updatedAt,
      });
    }

    return gmailDataId;
  },
});
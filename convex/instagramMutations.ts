import { v } from "convex/values";
import { mutation, action } from "./_generated/server";
import { MutationCtx, ActionCtx } from "./_generated/server";
import { api } from "./_generated/api";

// Store Instagram post data
export const storePostData = mutation({
  args: {
    userId: v.string(),
    postId: v.string(),
    postData: v.any(),
  },
  handler: async (ctx, args) => {
    const { userId, postId, postData } = args;
    const now = Date.now();
    // accountId is not present in args, so set as empty string or adapt if available
    const accountId = postData.accountId || "";

    try {
      // Check if post already exists using postId index
      const existingPost = await ctx.db
        .query("instagramPosts")
        .withIndex("by_postId", q => q.eq("postId", postId))
        .filter(q => q.eq(q.field("userId"), userId))
        .first();

      if (existingPost) {
        // Update existing post
        await ctx.db.patch(existingPost._id, {
          accountId,
          userId,
          postId,
          data: {
            id: postId,
            ...postData,
          },
          updatedAt: now,
        });
        return { status: "updated", postId: existingPost._id };
      } else {
        // Insert new post
        const id = await ctx.db.insert("instagramPosts", {
          accountId,
          userId,
          postId,
          data: {
            id: postId,
            ...postData,
          },
          createdAt: now,
          updatedAt: now,
        });
        return { status: "created", postId: id };
      }
    } catch (error) {
      console.error(`Error storing post data for ${postId}:`, error);
      throw new Error(`Failed to store post data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Save Instagram profile data
export const storeProfileData = mutation({
  args: {
    userId: v.string(),
    accountId: v.any(),
    username: v.string(),
    profileData: v.object({
      id: v.string(),
      username: v.string(),
      account_type: v.any(),
      profile_picture_url: v.any(),
      followers_count: v.any(),
      follows_count: v.any(),
      media_count: v.any(),
    }),
    createdAt: v.number(),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { userId, accountId, username, profileData, createdAt, updatedAt } = args;
    try {
      // Check if account already exists
      const existingAccount = await ctx.db
        .query("instagramAccounts")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();
      if (existingAccount) {
        await ctx.db.patch(existingAccount._id, {
          username,
          accountId,
          profileData,
          updatedAt,
        });
        return { status: "updated", accountId: existingAccount._id };
      } else {
        const id = await ctx.db.insert("instagramAccounts", {
          userId,
          accountId,
          username,
          profileData,
          createdAt,
          updatedAt,
        });
        return { status: "created", accountId: id };
      }
    } catch (error) {
      console.error(`Error storing Instagram account for user ${userId}:`, error);
      throw new Error(`Failed to store Instagram account: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Update Instagram token
export const updateInstagramToken = mutation({
  args: {
    userId: v.string(),
    accountId: v.any(),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiresAt: v.number(),
    scope: v.array(v.string())
  },
  handler: async (ctx, args) => {
    // Upsert logic: patch if exists, insert if not
    const existing = await ctx.db
      .query("instagramTokens")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, {
        accountId: args.accountId,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiryDate: args.expiresAt,
        scope: args.scope.join(" "),
        lastRefreshed: Date.now()
      });
    } else {
      await ctx.db.insert("instagramTokens", {
        accountId: args.accountId,
        userId: args.userId,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiryDate: args.expiresAt,
        scope: args.scope.join(" "),
        lastRefreshed: Date.now()
      });
    }
  },
});

// Clean up Instagram data when disconnecting
export const disconnectInstagram = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const { userId } = args;
    
    try {
      const results = {
        dataDeleted: 0,
        tokensDeleted: 0,
        accountsDeleted: 0
      };
     
      // Delete tokens using the by_userId index
      const tokens = await ctx.db
        .query("instagramTokens")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();

      console.log(`Found ${tokens.length} Instagram tokens to delete for user ${userId}`);
      
      for (const token of tokens) {
        await ctx.db.delete(token._id);
        results.tokensDeleted++;
      }

      // Delete Instagram accounts
      const accounts = await ctx.db
        .query("instagramAccounts")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();

      console.log(`Found ${accounts.length} Instagram accounts to delete for user ${userId}`);
      
      for (const account of accounts) {
        await ctx.db.delete(account._id);
        results.accountsDeleted++;
      }

      console.log(`Successfully disconnected Instagram for user ${userId}. Deleted ${results.dataDeleted} data records, ${results.tokensDeleted} tokens, and ${results.accountsDeleted} accounts.`);
      
      return { 
        success: true,
        results
      };
    } catch (error) {
      console.error('Error disconnecting Instagram:', error);
      throw new Error(`Failed to disconnect Instagram: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Store Instagram profile insights
export const storeProfileInsights = mutation({
  args: {
    userId: v.string(),
    accountId: v.any(),
    insightsData: v.object({
      impressions: v.optional(v.number()),
      reach: v.optional(v.number()),
      profile_views: v.optional(v.number()),
      follower_count: v.optional(v.number()),
      follows_count: v.optional(v.number()),
      media_count: v.optional(v.number()),
      saved_count: v.optional(v.number()),
      engagement_rate: v.optional(v.number()),
      period: v.string(),
      timestamp: v.number()
    }),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, accountId, insightsData, createdAt, updatedAt } = args;
    const now = Date.now();

    try {
      // Check if insights already exist
      const existingInsights = await ctx.db
        .query("instagramProfileInsights")
        .withIndex("by_userId", q => q.eq("userId", userId))
        .filter(q => q.eq(q.field("accountId"), accountId))
        .first();

      if (existingInsights) {
        // Update existing insights
        await ctx.db.patch(existingInsights._id, {
          data: insightsData,
          updatedAt: updatedAt ?? now,
        });
        return { status: "updated", insightsId: existingInsights._id };
      } else {
        // Insert new insights
        const id = await ctx.db.insert("instagramProfileInsights", {
          userId,
          accountId,
          data: insightsData,
          createdAt: createdAt ?? now,
          updatedAt: updatedAt ?? now,
        });
        return { status: "created", insightsId: id };
      }
    } catch (error) {
      console.error(`Error storing profile insights for user ${userId}:`, error);
      throw new Error(`Failed to store profile insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Store Instagram stories
export const storeStories = mutation({
  args: {
    userId: v.string(),
    accountId: v.any(),
    storiesData: v.array(v.object({
      id: v.string(),
      media_type: v.string(),
      media_url: v.string(),
      permalink: v.string(),
      timestamp: v.number(),
      insights: v.optional(v.object({
        impressions: v.optional(v.number()),
        reach: v.optional(v.number()),
        exits: v.optional(v.number()),
        replies: v.optional(v.number()),
        taps_forward: v.optional(v.number()),
        taps_back: v.optional(v.number()),
        navigation: v.optional(v.object({
          next: v.optional(v.number()),
          back: v.optional(v.number()),
          exit: v.optional(v.number())
        }))
      }))
    })),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, accountId, storiesData, createdAt, updatedAt } = args;
    const now = Date.now();

    try {
      // Check if stories already exist
      const existingStories = await ctx.db
        .query("instagramStories")
        .withIndex("by_userId", q => q.eq("userId", userId))
        .filter(q => q.eq(q.field("accountId"), accountId))
        .first();

      if (existingStories) {
        // Update existing stories
        await ctx.db.patch(existingStories._id, {
          data: storiesData,
          updatedAt: updatedAt ?? now,
        });
        return { status: "updated", storiesId: existingStories._id };
      } else {
        // Insert new stories
        const id = await ctx.db.insert("instagramStories", {
          userId,
          accountId,
          data: storiesData,
          createdAt: createdAt ?? now,
          updatedAt: updatedAt ?? now,
        });
        return { status: "created", storiesId: id };
      }
    } catch (error) {
      console.error(`Error storing stories for user ${userId}:`, error);
      throw new Error(`Failed to store stories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Store Instagram post insights
export const storePostInsights = mutation({
  args: {
    userId: v.string(),
    postId: v.string(),
    insightsData: v.object({
      impressions: v.optional(v.number()),
      reach: v.optional(v.number()),
      saved: v.optional(v.number()),
      shares: v.optional(v.number()),
      comments: v.optional(v.number()),
      likes: v.optional(v.number()),
      total_interactions: v.optional(v.number()),
      follows: v.optional(v.number()),
      profile_visits: v.optional(v.number()),
      profile_activity: v.optional(v.number()),
      views: v.optional(v.number()),
      period: v.string(),
      timestamp: v.number()
    }),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, postId, insightsData, createdAt, updatedAt } = args;
    const now = Date.now();

    try {
      // Check if insights already exist
      const existingInsights = await ctx.db
        .query("instagramPostInsights")
        .withIndex("by_postId", q => q.eq("postId", postId))
        .filter(q => q.eq(q.field("userId"), userId))
        .first();

      if (existingInsights) {
        // Update existing insights
        await ctx.db.patch(existingInsights._id, {
          data: insightsData,
          updatedAt: updatedAt ?? now,
        });
        return { status: "updated", insightsId: existingInsights._id };
      } else {
        // Insert new insights
        const id = await ctx.db.insert("instagramPostInsights", {
          userId,
          postId,
          data: insightsData,
          createdAt: createdAt ?? now,
          updatedAt: updatedAt ?? now,
        });
        return { status: "created", insightsId: id };
      }
    } catch (error) {
      console.error(`Error storing post insights for post ${postId}:`, error);
      throw new Error(`Failed to store post insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Store Instagram post comments
export const storePostComments = mutation({
  args: {
    userId: v.string(),
    postId: v.string(),
    commentsData: v.array(v.object({
      id: v.string(),
      text: v.string(),
      timestamp: v.number(),
      username: v.string(),
      replies: v.optional(v.array(v.object({
        id: v.string(),
        text: v.string(),
        timestamp: v.number(),
        username: v.string()
      })))
    })),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, postId, commentsData, createdAt, updatedAt } = args;
    const now = Date.now();

    try {
      // Check if comments already exist
      const existingComments = await ctx.db
        .query("instagramPostComments")
        .withIndex("by_postId", q => q.eq("postId", postId))
        .filter(q => q.eq(q.field("userId"), userId))
        .first();

      if (existingComments) {
        // Update existing comments
        await ctx.db.patch(existingComments._id, {
          data: commentsData,
          updatedAt: updatedAt ?? now,
        });
        return { status: "updated", commentsId: existingComments._id };
      } else {
        // Insert new comments
        const id = await ctx.db.insert("instagramPostComments", {
          userId,
          postId,
          data: commentsData,
          createdAt: createdAt ?? now,
          updatedAt: updatedAt ?? now,
        });
        return { status: "created", commentsId: id };
      }
    } catch (error) {
      console.error(`Error storing post comments for post ${postId}:`, error);
      throw new Error(`Failed to store post comments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
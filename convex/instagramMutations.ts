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
    // Get accountId from postData
    const accountId = postData.accountId || "";

    try {
      // Convert timestamp to number if it's a string
      const timestamp = postData.timestamp 
        ? (typeof postData.timestamp === 'string' 
          ? new Date(postData.timestamp).getTime() 
          : postData.timestamp)
        : now;

      // Process comments to ensure they have username
      const processedComments = postData.comments?.map((comment: any) => ({
        ...comment,
        username: comment.username || 'unknown',
        timestamp: typeof comment.timestamp === 'string' 
          ? new Date(comment.timestamp).getTime() 
          : comment.timestamp
      }));

      // Process children (for carousel posts)
      const processedChildren = postData.children?.map((child: any) => ({
        ...child,
        thumbnail_url: child.thumbnail_url || null
      }));

      const postDataToStore = {
        id: postId,
        ...postData,
        timestamp,
        comments: processedComments,
        children: processedChildren,
        comment_count: postData.comment_count || postData.comments_count || 0
      };

      // Check if post already exists using postId index
      const existingPost = await ctx.db
        .query("instagramPosts")
        .withIndex("by_postId", q => q.eq("postId", postId))
        .first();

      if (existingPost) {
        // Update existing post
        await ctx.db.patch(existingPost._id, {
          userId,
          accountId,
          postId,
          data: postDataToStore,
          updatedAt: now,
        });
        return { status: "updated", postId: existingPost._id };
      } else {
        // Insert new post
        const id = await ctx.db.insert("instagramPosts", {
          userId,
          accountId,
          postId,
          data: postDataToStore,
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
    insightsData: v.any(),
  },
  handler: async (ctx, args) => {
    const { userId, accountId, insightsData } = args;
    const now = Date.now();

    try {
      // Process insights data to match schema
      const processedData = {
        ...insightsData,
        timestamp: now,
        period: insightsData.period || 'week',
        values: insightsData.values || []
      };

      // Store insights
      const id = await ctx.db.insert("instagramProfileInsights", {
        userId,
        accountId,
        data: processedData,
        createdAt: now,
        updatedAt: now,
      });

      return { status: "created", id };
    } catch (error) {
      console.error(`Error storing profile insights for ${accountId}:`, error);
      throw new Error(`Failed to store profile insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Store Instagram stories
export const storeStories = mutation({
  args: {
    userId: v.string(),
    accountId: v.any(),
    storiesData: v.any(),
  },
  handler: async (ctx, args) => {
    const { userId, accountId, storiesData } = args;
    const now = Date.now();

    try {
      // Process stories data
      const processedStories = storiesData.data.map((story: any) => ({
        ...story,
        timestamp: typeof story.timestamp === 'string' 
          ? new Date(story.timestamp).getTime() 
          : story.timestamp
      }));

      // Store stories
      const id = await ctx.db.insert("instagramStories", {
        userId,
        accountId,
        data: processedStories,
        createdAt: now,
        updatedAt: now,
      });

      return { status: "created", id };
    } catch (error) {
      console.error(`Error storing stories for ${accountId}:`, error);
      throw new Error(`Failed to store stories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Store Instagram post insights
export const storePostInsights = mutation({
  args: {
    userId: v.string(),
    postId: v.string(),
    insightsData: v.any(),
  },
  handler: async (ctx, args) => {
    const { userId, postId, insightsData } = args;
    const now = Date.now();

    try {
      // Process insights data
      const processedData = {
        ...insightsData,
        timestamp: now,
        period: insightsData.period || 'lifetime',
        values: insightsData.values || []
      };

      // Store insights
      const id = await ctx.db.insert("instagramPostInsights", {
        userId,
        postId,
        data: processedData,
        createdAt: now,
        updatedAt: now,
      });

      return { status: "created", id };
    } catch (error) {
      console.error(`Error storing post insights for ${postId}:`, error);
      throw new Error(`Failed to store post insights: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Store Instagram post comments
export const storePostComments = mutation({
  args: {
    userId: v.string(),
    postId: v.string(),
    accountId: v.any(),
    commentsData: v.any(),
  },
  handler: async (ctx, args) => {
    const { userId, postId, accountId, commentsData } = args;
    const now = Date.now();

    try {
      // Process comments data
      const processedComments = commentsData.data.map((comment: any) => ({
        ...comment,
        timestamp: typeof comment.timestamp === 'string' 
          ? new Date(comment.timestamp).getTime() 
          : comment.timestamp,
        replies: comment.replies ? {
          ...comment.replies,
          data: comment.replies.data.map((reply: any) => ({
            ...reply,
            timestamp: typeof reply.timestamp === 'string' 
              ? new Date(reply.timestamp).getTime() 
              : reply.timestamp
          }))
        } : undefined
      }));

      // Store comments
      const id = await ctx.db.insert("instagramPostComments", {
        userId,
        postId,
        accountId,
        data: processedComments,
        createdAt: now,
        updatedAt: now,
      });

      return { status: "created", id };
    } catch (error) {
      console.error(`Error storing comments for ${postId}:`, error);
      throw new Error(`Failed to store comments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
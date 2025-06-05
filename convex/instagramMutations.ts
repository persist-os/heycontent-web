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
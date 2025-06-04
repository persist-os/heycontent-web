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

        .withIndex("by_userId", q => q.eq("userId", userId))
        .filter(q => q.eq(q.field("postId"), postId))

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

// Store Instagram story data
export const storeStoryData = mutation({
  args: {
    userId: v.string(),
    storyId: v.string(),
    storyData: v.any(),
  },
  handler: async (ctx, args) => {
    const { userId, storyId, storyData } = args;
    const timestamp = Date.now();

    try {
      // Check if story already exists
      const existingStory = await ctx.db
        .query("instagramData")
        .withIndex("by_user_resource", (q) => 
          q.eq("userId", userId).eq("resourceType", "story")
        )
        .filter((q) => q.eq(q.field("data.id"), storyId))
        .first();

      if (existingStory) {
        // Update existing story
        await ctx.db.patch(existingStory._id, {
          data: {
            id: storyId,
            ...storyData,
          },
          timestamp,
        });
        return { status: "updated", storyId: existingStory._id };
      } else {
        // Insert new story
        const id = await ctx.db.insert("instagramData", {
          userId,
          resourceType: "story",
          resourceId: storyId,
          data: {
            id: storyId,
            ...storyData,
          },
          timestamp,
        });
        return { status: "created", storyId: id };
      }
    } catch (error) {
      console.error(`Error storing story data for ${storyId}:`, error);
      throw new Error(`Failed to store story data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Store Instagram reel data
export const storeReelData = mutation({
  args: {
    userId: v.string(),
    reelId: v.string(),
    reelData: v.any(),
  },
  handler: async (ctx, args) => {
    const { userId, reelId, reelData } = args;
    const timestamp = Date.now();

    try {
      // Check if reel already exists
      const existingReel = await ctx.db
        .query("instagramData")
        .withIndex("by_user_resource", (q) => 
          q.eq("userId", userId).eq("resourceType", "reel")
        )
        .filter((q) => q.eq(q.field("data.id"), reelId))
        .first();

      if (existingReel) {
        // Update existing reel
        await ctx.db.patch(existingReel._id, {
          data: {
            id: reelId,
            ...reelData,
          },
          timestamp,
        });
        return { status: "updated", reelId: existingReel._id };
      } else {
        // Insert new reel
        const id = await ctx.db.insert("instagramData", {
          userId,
          resourceType: "reel",
          resourceId: reelId,
          data: {
            id: reelId,
            ...reelData,
          },
          timestamp,
        });
        return { status: "created", reelId: id };
      }
    } catch (error) {
      console.error(`Error storing reel data for ${reelId}:`, error);
      throw new Error(`Failed to store reel data: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
    username: v.string(),
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
        username: args.username,
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
        username: args.username,
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiryDate: args.expiresAt,
        scope: args.scope.join(" "),
        lastRefreshed: Date.now()
      });
    }
  },
});

// Store full Instagram profile data including posts, stories, and reels
export const storeInstagramFullProfile = mutation({
  args: {
    userId: v.string(),
    profile: v.any(),
    posts: v.array(v.any()),
    stories: v.optional(v.array(v.any())),
    reels: v.optional(v.array(v.any()))
  },
  handler: async (ctx, args) => {
    const { userId, profile, posts, stories = [], reels = [] } = args;
    const timestamp = Date.now();
    
    try {
      // Validate profile object
      if (!profile || !profile.id) {
        throw new Error("Invalid profile data: missing required profile ID");
      }
      
      // First, store the profile data
      // Check if profile already exists to avoid duplicates
      const existingProfile = await ctx.db
        .query("instagramData")
        .withIndex("by_user_resource", (q) => 
          q.eq("userId", userId).eq("resourceType", "profile")
        )
        .first();
      
      // Get statistics values with safe defaults
      const followerCount = Number(profile.statistics?.followerCount || 0);
      const followingCount = Number(profile.statistics?.followingCount || 0);
      const postCount = Number(profile.statistics?.postCount || 0);
      
      if (existingProfile) {
        // Update existing profile record
        await ctx.db.patch(existingProfile._id, {
          data: profile,
          resourceId: profile.id,
          timestamp,
          followerCount,
          followingCount,
          postCount
        });
        console.log(`Updated profile ${profile.id} for user ${userId}`);
      } else {
        // Insert new profile record
        await ctx.db.insert("instagramData", {
          userId,
          resourceType: "profile",
          resourceId: profile.id,
          data: profile,
          timestamp,
          followerCount,
          followingCount,
          postCount
        });
        console.log(`Inserted new profile ${profile.id} for user ${userId}`);
      }
      
      // Process posts
      const postResults = await storeMediaItems(ctx, userId, posts, "post");
      
      // Process stories
      const storyResults = await storeMediaItems(ctx, userId, stories, "story");
      
      // Process reels
      const reelResults = await storeMediaItems(ctx, userId, reels, "reel");
      
      return { 
        profileId: profile.id,
        postResults,
        storyResults,
        reelResults,
        status: "success" 
      };
    } catch (error) {
      console.error('Error storing Instagram full profile:', error);
      throw new Error(`Failed to store Instagram profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Helper function to store media items
async function storeMediaItems(
  ctx: MutationCtx,
  userId: string,
  items: any[],
  resourceType: "post" | "story" | "reel"
) {
  const timestamp = Date.now();
  const results = {
    processed: 0,
    inserted: 0,
    updated: 0,
    skipped: 0
  };
  
  for (const item of items) {
    results.processed++;
    
    if (!item.id) {
      console.warn(`Skipping ${resourceType} without ID for user ${userId}`);
      results.skipped++;
      continue;
    }
    
    // Check if item already exists
    const existingItem = await ctx.db
      .query("instagramData")
      .withIndex("by_user_resource", (q) => 
        q.eq("userId", userId).eq("resourceType", resourceType)
      )
      .filter((q) => q.eq(q.field("data.id"), item.id))
      .first();
      
    if (existingItem) {
      // Update existing item
      await ctx.db.patch(existingItem._id, {
        data: item,
        resourceId: item.id,
        timestamp
      });
      results.updated++;
    } else {
      // Insert new item
      await ctx.db.insert("instagramData", {
        userId,
        resourceType,
        resourceId: item.id,
        data: item,
        timestamp
      });
      results.inserted++;
    }
  }
  
  return results;
}

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
      
      // Delete all Instagram data for the user using the by_user index
      const instagramData = await ctx.db
        .query("instagramData")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .collect();

      console.log(`Found ${instagramData.length} Instagram data records to delete for user ${userId}`);
      
      for (const data of instagramData) {
        await ctx.db.delete(data._id);
        results.dataDeleted++;
      }
     
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

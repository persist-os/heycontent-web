import { v } from "convex/values";
import { mutation, action } from "./_generated/server";
import { MutationCtx, ActionCtx } from "./_generated/server";
import { api } from "./_generated/api";

// Store Instagram post data
export const storePostData = mutation({
  args: {
    userId: v.string(),
    postId: v.string(),
    instagramAccountId: v.string(),
    postData: v.any(),
  },
  handler: async (ctx, args) => {
    const { userId, postId, instagramAccountId, postData } = args;
    const now = Date.now();

    try {
      // Convert ISO timestamp to Unix timestamp if present
      const processedData = {
        ...postData,
        timestamp: postData.timestamp ? new Date(postData.timestamp).getTime() : undefined,
        // Handle nested children data structure
        children: postData.children?.data || postData.children
      };

      // Check if post already exists using postId index
      const existingPost = await ctx.db
        .query("instagramPosts")
        .withIndex("by_postId", q => q.eq("postId", postId))
        .first();

      if (existingPost) {
        // Update existing post
        await ctx.db.patch(existingPost._id, {
          instagramAccountId,
          postId,
          data: {
            id: postId,
            ...processedData,
          },
          updatedAt: now,
        });
        return { status: "updated", postId: existingPost._id };
      } else {
        // Insert new post
        const id = await ctx.db.insert("instagramPosts", {
          userId,
          instagramAccountId,
          postId,
          data: {
            id: postId,
            ...processedData,
          },
          createdAt: now,
          updatedAt: now,
        });
        return { status: "created", postId: id };
      }
    } catch (error) {
      console.error(`Error storing Instagram post ${postId}:`, error);
      throw new Error(`Failed to store Instagram post: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Save Instagram profile data
export const storeProfileData = mutation({
  args: {
    userId: v.string(),
    instagramAccountId: v.string(),
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
    const { userId, instagramAccountId, username, profileData, createdAt, updatedAt } = args;
    try {
      // Check if account already exists
      const existingAccount = await ctx.db
        .query("instagramAccounts")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();
      if (existingAccount) {
        await ctx.db.patch(existingAccount._id, {
          username,
          instagramAccountId: String(instagramAccountId),
          profileData,
          updatedAt,
        });
        return { status: "updated", instagramAccountId: String(instagramAccountId) };
      } else {
        const id = await ctx.db.insert("instagramAccounts", {
          userId,
          instagramAccountId: String(instagramAccountId),
          username,
          profileData,
          createdAt,
          updatedAt,
        });
        return { status: "created", instagramAccountId: String(instagramAccountId) };
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
    instagramAccountId: v.string(),
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
        instagramAccountId: String(args.instagramAccountId),
        accessToken: args.accessToken,
        refreshToken: args.refreshToken,
        expiryDate: args.expiresAt,
        scope: args.scope.join(" "),
        lastRefreshed: Date.now()
      });
    } else {
      await ctx.db.insert("instagramTokens", {
        instagramAccountId: String(args.instagramAccountId),
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
    instagramAccountId: v.string(),
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
    const { userId, instagramAccountId, insightsData, createdAt, updatedAt } = args;
    const now = Date.now();

    try {
      // Check if insights already exist
      const existingInsights = await ctx.db
        .query("instagramProfileInsights")
        .withIndex("by_userId", q => q.eq("userId", userId))
        .filter(q => q.eq(q.field("instagramAccountId"), String(instagramAccountId)))
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
          instagramAccountId: String(instagramAccountId),
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
    instagramAccountId: v.string(),
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
    const { userId, instagramAccountId, storiesData, createdAt, updatedAt } = args;
    const now = Date.now();

    try {
      // Check if stories already exist
      const existingStories = await ctx.db
        .query("instagramStories")
        .withIndex("by_userId", q => q.eq("userId", userId))
        .filter(q => q.eq(q.field("instagramAccountId"), String(instagramAccountId)))
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
          instagramAccountId: String(instagramAccountId),
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
      username: v.optional(v.string()),
      replies: v.optional(v.object({
        data: v.array(v.object({
          id: v.string(),
          text: v.string(),
          timestamp: v.number(),
          username: v.optional(v.string())
        })),
        paging: v.optional(v.object({
          cursors: v.object({
            before: v.string(),
            after: v.string()
          })
        }))
      }))
    })),
    createdAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { userId, postId, commentsData, createdAt, updatedAt } = args;
    const now = Date.now();

    try {
      // Format comments data to match schema and handle missing usernames
      const formattedComments = commentsData.map(comment => ({
        ...comment,
        username: comment.username || 'anonymous', // Provide default username if missing
        replies: comment.replies ? {
          data: Array.isArray(comment.replies) ? comment.replies.map(reply => ({
            ...reply,
            username: reply.username || 'anonymous' // Provide default username for replies if missing
          })) : [],
          paging: comment.replies.paging
        } : undefined
      }));

      // Check if comments already exist
      const existingComments = await ctx.db
        .query("instagramPostComments")
        .withIndex("by_postId", q => q.eq("postId", postId))
        .filter(q => q.eq(q.field("userId"), userId))
        .first();

      if (existingComments) {
        // Update existing comments
        await ctx.db.patch(existingComments._id, {
          data: formattedComments,
          updatedAt: updatedAt ?? now,
        });
        return { status: "updated", commentsId: existingComments._id };
      } else {
        // Insert new comments
        const id = await ctx.db.insert("instagramPostComments", {
          userId,
          postId,
          data: formattedComments,
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

// Store Instagram tracker analysis
export const storeInstagramTrackerAnalysis = mutation({
  args: {
    userId: v.string(),
    instagramAccountId: v.string(),
    analysis: v.any(),
  },
  handler: async (ctx, args) => {
    const { userId, instagramAccountId, analysis } = args;
    const now = Date.now();

    try {
      // Check if analysis already exists
      const existingAnalysis = await ctx.db
        .query("instagramTrackerAnalysis")
        .withIndex("by_userId", q => q.eq("userId", userId))
        .filter(q => q.eq(q.field("instagramAccountId"), instagramAccountId))
        .first();

      if (existingAnalysis) {
        // Update existing analysis
        await ctx.db.patch(existingAnalysis._id, {
          analysis,
          updatedAt: now,
        });
        return { status: "updated", analysisId: existingAnalysis._id };
      } else {
        // Insert new analysis
        const id = await ctx.db.insert("instagramTrackerAnalysis", {
          userId,
          instagramAccountId,
          analysis,
          createdAt: now,
          updatedAt: now,
        });
        return { status: "created", analysisId: id };
      }
    } catch (error) {
      console.error(`Error storing Instagram tracker analysis for user ${userId}:`, error);
      throw new Error(`Failed to store Instagram tracker analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Store Instagram batch analysis insights
export const storeInstagramBatchAnalysis = mutation({
  args: {
    userId: v.string(),
    instagramAccountId: v.string(),
    insights: v.any(),
  },
  handler: async (ctx, args) => {
    const { userId, instagramAccountId, insights } = args;
    const now = Date.now();

    try {
      // Check if batch analysis already exists
      const existingAnalysis = await ctx.db
        .query("instagramBatchAnalysis")
        .withIndex("by_userId", q => q.eq("userId", userId))
        .filter(q => q.eq(q.field("instagramAccountId"), instagramAccountId))
        .first();

      if (existingAnalysis) {
        // Update existing batch analysis
        await ctx.db.patch(existingAnalysis._id, {
          insights,
          updatedAt: now,
        });
        return { status: "updated", analysisId: existingAnalysis._id };
      } else {
        // Insert new batch analysis
        const id = await ctx.db.insert("instagramBatchAnalysis", {
          userId,
          instagramAccountId,
          insights,
          analysisType: "batch",
          createdAt: now,
          updatedAt: now,
        });
        return { status: "created", analysisId: id };
      }
    } catch (error) {
      console.error(`Error storing Instagram batch analysis for user ${userId}:`, error);
      throw new Error(`Failed to store Instagram batch analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Store Instagram post analysis data directly in instagramPosts table
export const storePostAnalysis = mutation({
  args: {
    userId: v.string(), // Accept userId for compatibility/auditing
    postId: v.string(),
    analysisData: v.any(),
  },
  handler: async (ctx, args) => {
    const { userId, postId, analysisData } = args;
    const now = Date.now();

    // Find the post by postId (similar to YouTube's videoId lookup)
    const post = await ctx.db
      .query("instagramPosts")
      .withIndex("by_postId", (q) => q.eq("postId", postId))
      .first();

    if (!post) {
      // Create a minimal post record if it doesn't exist
      console.log(`Creating new Instagram post record for postId: ${postId}, userId: ${userId}`);
      const postId_internal = await ctx.db.insert("instagramPosts", {
        userId,
        instagramAccountId: "unknown", // Placeholder - should be updated when actual post data is available
        postId,
        data: {
          id: postId,
          caption: "Instagram Post",
          media_type: "IMAGE",
          media_url: "",
          permalink: "",
          username: "",
        },
        createdAt: now,
        updatedAt: now,
      });

      // Store the analysis on the newly created record
      const updateData: any = { updatedAt: now };

      if (analysisData && typeof analysisData === 'object') {
        if (analysisData.markdown) {
          // Store markdown for display
          updateData.analysisMarkdown = analysisData.markdown;
          console.log(`Storing markdown analysis for new Instagram post ${postId}`);
        }
        
        if (analysisData.analysis) {
          // Store JSON analysis data
          updateData.analysis = analysisData.analysis;
          console.log(`Storing JSON analysis data for new Instagram post ${postId}`);
        }
        
        // Legacy support: if analysisData has markdown directly (old format)
        if (!analysisData.markdown && !analysisData.analysis && typeof analysisData === 'string') {
          updateData.analysisMarkdown = analysisData;
          console.log(`Storing legacy markdown analysis for new Instagram post ${postId}`);
        }
      } else {
        // Legacy format: Store as JSON analysis
        updateData.analysis = analysisData;
        console.log(`Storing legacy JSON analysis for new Instagram post ${postId}`);
      }

      await ctx.db.patch(postId_internal, updateData);

      return { success: true, status: "created", postId: postId_internal };
    }

    // Update existing post with analysis
    const updateData: any = { updatedAt: now };

    if (analysisData && typeof analysisData === 'object') {
      if (analysisData.markdown) {
        // Store markdown for display
        updateData.analysisMarkdown = analysisData.markdown;
        console.log(`Storing markdown analysis for Instagram post ${postId}`);
      }
      
      if (analysisData.analysis) {
        // Store JSON analysis data
        updateData.analysis = analysisData.analysis;
        console.log(`Storing JSON analysis data for Instagram post ${postId}`);
      }
      
      // Legacy support: if analysisData has markdown directly (old format)
      if (!analysisData.markdown && !analysisData.analysis && typeof analysisData === 'string') {
        updateData.analysisMarkdown = analysisData;
        console.log(`Storing legacy markdown analysis for Instagram post ${postId}`);
      }
    } else {
      // Legacy format: Store as JSON analysis
      updateData.analysis = analysisData;
      console.log(`Storing legacy JSON analysis for Instagram post ${postId}`);
    }

    await ctx.db.patch(post._id, updateData);

    return { success: true, status: "updated", postId: post._id };
  },
});
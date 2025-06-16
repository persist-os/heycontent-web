import { query } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

export const getHistory = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(limit);

    return conversations.map(conv => ({
      id: conv._id,
      title: conv.title,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      messageCount: conv.messages.length,
      starred: conv.starred
    }));
  },
});

export const getConversation = query({
  args: {
    userId: v.string(),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    
    if (!conversation || conversation.userId !== args.userId) {
      return null;
    }

    return {
      id: conversation._id,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: conversation.messages,
      starred: conversation.starred
    };
  },
});

// NEW UNIFIED MENTION SYSTEM using usersFiles

// Search all files for @ mentions (prioritizing platforms)
export const searchPlatforms = query({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Use the new unified search system
    const results = await ctx.db
      .query("usersFiles")
      .withSearchIndex("search_fileName", (q) => 
        q.search("fileName", args.query.toLowerCase())
          .eq("userId", args.userId)
      )
      .take((args.limit || 10) * 2);

    // Filter and prioritize platforms, but include all files for @ mentions
    const filteredResults = results
      .sort((a, b) => {
        // Prioritize platform types for @ mentions
        const aIsPlatform = a.fileType.startsWith('platform_');
        const bIsPlatform = b.fileType.startsWith('platform_');
        
        if (aIsPlatform && !bIsPlatform) return -1;
        if (!aIsPlatform && bIsPlatform) return 1;
        
        // Then sort by recency
        return b.updatedAt - a.updatedAt;
      })
      .slice(0, args.limit || 10);

    return filteredResults.map(file => ({
      id: file.fileId,
      type: file.fileType.startsWith('platform_') ? 'platform' : 'content',
      subtype: file.fileType,
      name: file.fileName,
      title: file.fileName,
      description: file.metadata.snippet || '',
      icon: getPlatformIcon(file.platform, file.fileType),
      thumbnailUrl: file.metadata.thumbnailUrl,
      stats: file.metadata.stats,
      platform: file.platform,
      from: file.metadata.from,
      date: file.metadata.date,
    }));
  },
});

// Search content for # mentions
export const searchContent = query({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Use the new unified search system
    const results = await ctx.db
      .query("usersFiles")
      .withSearchIndex("search_fileName", (q) => 
        q.search("fileName", args.query.toLowerCase())
          .eq("userId", args.userId)
      )
      .take((args.limit || 10) * 2);

    // Filter to content types and prioritize them for # mentions
    const filteredResults = results
      .filter(file => !file.fileType.startsWith('platform_')) // Only content, not platforms
      .sort((a, b) => {
        // Sort by content type relevance, then recency
        const contentTypeOrder = ['note', 'email', 'video', 'instagram_post', 'insight', 'analytics'];
        const aIndex = contentTypeOrder.indexOf(a.fileType);
        const bIndex = contentTypeOrder.indexOf(b.fileType);
        
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        
        return b.updatedAt - a.updatedAt;
      })
      .slice(0, args.limit || 10);

    return filteredResults.map(file => ({
      id: file.fileId,
      type: 'content' as const,
      subtype: file.fileType,
      platform: file.platform,
      title: file.fileName,
      snippet: file.metadata.snippet || '',
      from: file.metadata.from,
      date: file.metadata.date,
      thumbnailUrl: file.metadata.thumbnailUrl,
      url: getContentUrl(file),
      stats: file.metadata.stats,
      icon: getContentIcon(file.fileType),
      platformIcon: getPlatformIcon(file.platform, file.fileType),
    }));
  },
});

// Get specific platform by ID using unified system
export const getPlatformById = query({
  args: {
    userId: v.string(),
    platformId: v.string(),
    platformType: v.union(v.literal("gmail"), v.literal("youtube"), v.literal("instagram")),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db
      .query("usersFiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("fileId"), args.platformId),
          q.eq(q.field("platform"), args.platformType)
        )
      )
      .first();

    if (!file) return null;

    return {
      id: file.fileId,
      type: file.fileType.startsWith('platform_') ? 'platform' : 'content',
      name: file.fileName,
      title: file.fileName,
      description: file.metadata.snippet || '',
      stats: file.metadata.stats,
      fullData: file, // The file reference itself
    };
  },
});

// Get specific content by ID using unified system
export const getContentById = query({
  args: {
    userId: v.string(),
    contentId: v.string(),
    contentType: v.union(
      v.literal("email"), 
      v.literal("email_thread"), 
      v.literal("video"), 
      v.literal("instagram_post"),
      v.literal("note"),
      v.literal("insight"),
      v.literal("analytics")
    ),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db
      .query("usersFiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("fileId"), args.contentId),
          q.eq(q.field("fileType"), args.contentType)
        )
      )
      .first();

    if (!file) return null;

    // Get the actual data using File ID Manager
    const actualData = await getActualFileData(ctx, file);

    return {
      id: file.fileId,
      type: 'content' as const,
      subtype: file.fileType,
      platform: file.platform,
      title: file.fileName,
      snippet: file.metadata.snippet || '',
      from: file.metadata.from,
      date: file.metadata.date,
      thumbnailUrl: file.metadata.thumbnailUrl,
      url: getContentUrl(file),
      stats: file.metadata.stats,
      fullData: actualData,
    };
  },
});

// Helper function to get actual file data using File ID Manager
async function getActualFileData(ctx: any, fileRef: any) {
  try {
    switch (fileRef.sourceTable) {
      case "gmailMessages":
        return await ctx.db
          .query("gmailMessages")
          .withIndex("by_messageId", (q) => q.eq("messageId", fileRef.fileId))
          .filter((q) => q.eq(q.field("userId"), fileRef.userId))
          .first();

      case "gmailThreads":
        return await ctx.db
          .query("gmailThreads")
          .withIndex("by_threadId", (q) => q.eq("threadId", fileRef.fileId))
          .filter((q) => q.eq(q.field("userId"), fileRef.userId))
          .first();

      case "youtubeVideos":
        return await ctx.db
          .query("youtubeVideos")
          .withIndex("by_videoId", (q) => q.eq("videoId", fileRef.fileId))
          .filter((q) => q.eq(q.field("userId"), fileRef.userId))
          .first();

      case "instagramPosts":
        return await ctx.db
          .query("instagramPosts")
          .withIndex("by_postId", (q) => q.eq("postId", fileRef.fileId))
          .filter((q) => q.eq(q.field("userId"), fileRef.userId))
          .first();

      case "notes":
        const note = await ctx.db.get(fileRef.fileId);
        return (note && note.userId === fileRef.userId) ? note : null;

      default:
        console.warn(`Unknown source table: ${fileRef.sourceTable}`);
        return null;
    }
  } catch (error) {
    console.error(`Error fetching data from ${fileRef.sourceTable}:`, error);
    return null;
  }
}

// Helper function to get platform icon
function getPlatformIcon(platform: string, fileType: string) {
  if (fileType.startsWith('platform_')) {
    switch (platform) {
      case 'gmail': return '📧';
      case 'youtube': return '🎥';
      case 'instagram': return '📸';
      default: return '🔗';
    }
  }
  return '';
}

// Helper function to get content icon  
function getContentIcon(fileType: string) {
  switch (fileType) {
    case 'email': return '✉️';
    case 'email_thread': return '📧';
    case 'video': return '🎬';
    case 'instagram_post': return '📷';
    case 'note': return '📝';
    case 'insight': return '💡';
    case 'analytics': return '📊';
    default: return '📄';
  }
}

// Helper function to get content URL
function getContentUrl(file: any) {
  switch (file.fileType) {
    case 'video':
      return `https://www.youtube.com/watch?v=${file.fileId}`;
    case 'instagram_post':
      // Would need actual permalink from metadata
      return file.metadata.permalink || '';
    default:
      return '';
  }
}

// LEGACY COMPATIBILITY FUNCTIONS (deprecated but maintained for backward compatibility)

export const searchEmails = query({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Redirect to unified search with email filter
    const results = await ctx.db
      .query("usersFiles")
      .withSearchIndex("search_fileName", (q) => 
        q.search("fileName", args.query.toLowerCase())
          .eq("userId", args.userId)
      )
      .filter((q) => 
        q.or(
          q.eq(q.field("fileType"), "email"),
          q.eq(q.field("fileType"), "email_thread")
        )
      )
      .take(args.limit || 10);

    return results.map(file => ({
      id: file.fileId,
      type: file.fileType as 'email' | 'email_thread',
      title: file.fileName,
      snippet: file.metadata.snippet || '',
      from: file.metadata.from || '',
      date: file.metadata.date || '',
      email: file.metadata.from,
      threadId: file.fileType === 'email_thread' ? file.fileId : undefined,
      messageCount: file.metadata.stats?.messages,
    }));
  },
});

export const searchVideos = query({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Redirect to unified search with video filter
    const results = await ctx.db
      .query("usersFiles")
      .withSearchIndex("search_fileName", (q) => 
        q.search("fileName", args.query.toLowerCase())
          .eq("userId", args.userId)
      )
      .filter((q) => q.eq(q.field("fileType"), "video"))
      .take(args.limit || 10);

    return results.map(file => ({
      id: file.fileId,
      type: 'video' as const,
      title: file.fileName,
      description: file.metadata.snippet || '',
      thumbnailUrl: file.metadata.thumbnailUrl || '',
      publishedAt: file.metadata.date || '',
      channelTitle: file.metadata.from || '',
      url: `https://www.youtube.com/watch?v=${file.fileId}`,
      views: file.metadata.stats?.views || 0,
    }));
  },
});

export const getEmailById = query({
  args: {
    userId: v.string(),
    emailId: v.string(),
    type: v.union(v.literal("message"), v.literal("thread")),
  },
  handler: async (ctx, args) => {
    const fileType = args.type === "message" ? "email" : "email_thread";
    
    const file = await ctx.db
      .query("usersFiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("fileId"), args.emailId),
          q.eq(q.field("fileType"), fileType)
        )
      )
      .first();

    if (!file) return null;

    const actualData = await getActualFileData(ctx, file);

    return {
      id: file.fileId,
      type: args.type,
      title: file.fileName,
      snippet: file.metadata.snippet || '',
      from: file.metadata.from || '',
      date: file.metadata.date || '',
      email: file.metadata.from,
      threadId: file.fileType === 'email_thread' ? file.fileId : undefined,
      messageCount: file.metadata.stats?.messages,
      messages: actualData?.messages || [],
      analysis: actualData?.analysis,
      fullData: actualData,
    };
  },
});

export const getVideoById = query({
  args: {
    userId: v.string(),
    videoId: v.string(),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db
      .query("usersFiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => 
        q.and(
          q.eq(q.field("fileId"), args.videoId),
          q.eq(q.field("fileType"), "video")
        )
      )
      .first();

    if (!file) return null;

    const actualData = await getActualFileData(ctx, file);

    return {
      id: file.fileId,
      type: 'video' as const,
      title: file.fileName,
      description: file.metadata.snippet || '',
      thumbnailUrl: file.metadata.thumbnailUrl || '',
      publishedAt: file.metadata.date || '',
      channelTitle: file.metadata.from || '',
      url: `https://www.youtube.com/watch?v=${file.fileId}`,
      views: file.metadata.stats?.views || 0,
      fullData: actualData,
    };
  },
});



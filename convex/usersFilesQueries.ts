import { query } from "./_generated/server";
import { v } from "convex/values";

// Search files for mentions (@ and # commands)
export const searchFiles = query({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
    fileType: v.optional(v.union(
      v.literal("email"),
      v.literal("email_thread"), 
      v.literal("video"),
      v.literal("instagram_post"),
      v.literal("note"),
      v.literal("insight"),
      v.literal("analytics"),
      v.literal("platform_gmail"),
      v.literal("platform_youtube"),
      v.literal("platform_instagram")
    )),
    platform: v.optional(v.union(
      v.literal("gmail"),
      v.literal("youtube"), 
      v.literal("instagram"),
      v.literal("smart-notes"),
      v.literal("ai-insights"),
      v.literal("analytics")
    )),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const searchTerm = args.query.toLowerCase();
    
    // Use search index for better performance
    let searchResults = await ctx.db
      .query("usersFiles")
      .withSearchIndex("search_fileName", (q) => 
        q.search("fileName", searchTerm)
          .eq("userId", args.userId)
      )
      .take(limit * 2); // Take more to filter afterwards

    // Apply additional filters if specified
    if (args.fileType) {
      searchResults = searchResults.filter(file => file.fileType === args.fileType);
    }
    
    if (args.platform) {
      searchResults = searchResults.filter(file => file.platform === args.platform);
    }

    // Also search by keywords if the search index doesn't return enough results
    if (searchResults.length < limit) {
      const keywordResults = await ctx.db
        .query("usersFiles")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .filter((q) => 
          // Search in keywords array
          q.or(
            ...searchTerm.split(' ').map(term => 
              q.gte(q.field("searchKeywords"), [term])
            )
          )
        )
        .take(limit * 2);

      // Merge results and remove duplicates
      const allResults = [...searchResults, ...keywordResults];
      const uniqueResults = allResults.filter((file, index, self) => 
        index === self.findIndex(f => f._id === file._id)
      );
      
      searchResults = uniqueResults;
    }

    // Sort by relevance (exact match first, then by recency)
    searchResults.sort((a, b) => {
      const aExactMatch = a.fileName.toLowerCase().includes(searchTerm);
      const bExactMatch = b.fileName.toLowerCase().includes(searchTerm);
      
      if (aExactMatch && !bExactMatch) return -1;
      if (!aExactMatch && bExactMatch) return 1;
      
      // Sort by recency if both or neither are exact matches
      return b.updatedAt - a.updatedAt;
    });

    return searchResults.slice(0, limit).map(file => ({
      id: file.fileId,
      type: file.fileType.startsWith('platform_') ? 'platform' : 'content',
      subtype: file.fileType,
      platform: file.platform,
      fileName: file.fileName,
      title: file.fileName,
      snippet: file.metadata.snippet,
      thumbnailUrl: file.metadata.thumbnailUrl,
      from: file.metadata.from,
      date: file.metadata.date,
      stats: file.metadata.stats,
      sourceTable: file.sourceTable,
      _createdAt: file.createdAt,
      _updatedAt: file.updatedAt,
    }));
  },
});

// Get file by ID for the File ID Manager
export const getFileById = query({
  args: {
    userId: v.string(),
    fileId: v.string(),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db
      .query("usersFiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("fileId"), args.fileId))
      .first();

    if (!file) return null;

    return {
      id: file.fileId,
      type: file.fileType.startsWith('platform_') ? 'platform' : 'content',
      subtype: file.fileType,
      platform: file.platform,
      fileName: file.fileName,
      title: file.fileName,
      snippet: file.metadata.snippet,
      thumbnailUrl: file.metadata.thumbnailUrl,
      from: file.metadata.from,
      date: file.metadata.date,
      stats: file.metadata.stats,
      sourceTable: file.sourceTable,
      _createdAt: file.createdAt,
      _updatedAt: file.updatedAt,
    };
  },
});

// Get actual file data using File ID Manager
export const getFileData = query({
  args: {
    userId: v.string(),
    fileId: v.string(),
  },
  handler: async (ctx, args) => {
    // First get the file reference
    const fileRef = await ctx.db
      .query("usersFiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("fileId"), args.fileId))
      .first();

    if (!fileRef) return null;

    // Use File ID Manager to fetch actual data based on source table
    let actualData = null;

    try {
      switch (fileRef.sourceTable) {
        case "gmailMessages":
          actualData = await ctx.db
            .query("gmailMessages")
            .withIndex("by_messageId", (q) => q.eq("messageId", fileRef.fileId))
            .filter((q) => q.eq(q.field("userId"), args.userId))
            .first();
          break;

        case "gmailThreads":
          actualData = await ctx.db
            .query("gmailThreads")
            .withIndex("by_threadId", (q) => q.eq("threadId", fileRef.fileId))
            .filter((q) => q.eq(q.field("userId"), args.userId))
            .first();
          break;

        case "youtubeVideos":
          actualData = await ctx.db
            .query("youtubeVideos")
            .withIndex("by_videoId", (q) => q.eq("videoId", fileRef.fileId))
            .filter((q) => q.eq(q.field("userId"), args.userId))
            .first();
          break;

        case "instagramPosts":
          actualData = await ctx.db
            .query("instagramPosts")
            .withIndex("by_postId", (q) => q.eq("postId", fileRef.fileId))
            .filter((q) => q.eq(q.field("userId"), args.userId))
            .first();
          break;

        case "notes":
          actualData = await ctx.db.get(fileRef.fileId);
          // Verify ownership
          if (actualData && actualData.userId !== args.userId) {
            actualData = null;
          }
          break;

        default:
          console.warn(`Unknown source table: ${fileRef.sourceTable}`);
          break;
      }

      return {
        fileReference: {
          id: fileRef.fileId,
          type: fileRef.fileType.startsWith('platform_') ? 'platform' : 'content',
          subtype: fileRef.fileType,
          platform: fileRef.platform,
          fileName: fileRef.fileName,
          title: fileRef.fileName,
          snippet: fileRef.metadata.snippet,
          thumbnailUrl: fileRef.metadata.thumbnailUrl,
          from: fileRef.metadata.from,
          date: fileRef.metadata.date,
          stats: fileRef.metadata.stats,
          sourceTable: fileRef.sourceTable,
        },
        actualData: actualData,
      };

    } catch (error) {
      console.error(`Error fetching data from ${fileRef.sourceTable}:`, error);
      return {
        fileReference: {
          id: fileRef.fileId,
          type: fileRef.fileType.startsWith('platform_') ? 'platform' : 'content',
          subtype: fileRef.fileType,
          platform: fileRef.platform,
          fileName: fileRef.fileName,
          title: fileRef.fileName,
          snippet: fileRef.metadata.snippet,
          thumbnailUrl: fileRef.metadata.thumbnailUrl,
          from: fileRef.metadata.from,
          date: fileRef.metadata.date,
          stats: fileRef.metadata.stats,
          sourceTable: fileRef.sourceTable,
        },
        actualData: null,
        error: error.message,
      };
    }
  },
});

// Get all files for a user (for admin/debugging)
export const getUserFiles = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
    platform: v.optional(v.union(
      v.literal("gmail"),
      v.literal("youtube"), 
      v.literal("instagram"),
      v.literal("smart-notes"),
      v.literal("ai-insights"),
      v.literal("analytics")
    )),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;
    
    let query = ctx.db
      .query("usersFiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId));

    if (args.platform) {
      query = ctx.db
        .query("usersFiles")
        .withIndex("by_user_platform", (q) => 
          q.eq("userId", args.userId).eq("platform", args.platform)
        );
    }

    const files = await query.take(limit);

    return files.map(file => ({
      id: file.fileId,
      type: file.fileType.startsWith('platform_') ? 'platform' : 'content',
      subtype: file.fileType,
      platform: file.platform,
      fileName: file.fileName,
      title: file.fileName,
      snippet: file.metadata.snippet,
      thumbnailUrl: file.metadata.thumbnailUrl,
      from: file.metadata.from,
      date: file.metadata.date,
      stats: file.metadata.stats,
      sourceTable: file.sourceTable,
      _createdAt: file.createdAt,
      _updatedAt: file.updatedAt,
    }));
  },
});

// Legacy compatibility - search platforms (@ mentions)
export const searchPlatforms = query({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const results = await ctx.runQuery("usersFilesQueries:searchFiles", {
      userId: args.userId,
      query: args.query,
      limit: args.limit,
      fileType: undefined, // Will include platform_* types
    });

    // Filter to only platform types
    return results.filter(file => file.type === 'platform');
  },
});

// Legacy compatibility - search content (# mentions)
export const searchContent = query({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const results = await ctx.runQuery("usersFilesQueries:searchFiles", {
      userId: args.userId,
      query: args.query,
      limit: args.limit,
      fileType: undefined, // Will include content types
    });

    // Filter to only content types
    return results.filter(file => file.type === 'content');
  },
});

// Get platform statistics
export const getPlatformStats = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const files = await ctx.db
      .query("usersFiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    const stats = {
      totalFiles: files.length,
      platforms: {} as Record<string, number>,
      fileTypes: {} as Record<string, number>,
    };

    files.forEach(file => {
      stats.platforms[file.platform] = (stats.platforms[file.platform] || 0) + 1;
      stats.fileTypes[file.fileType] = (stats.fileTypes[file.fileType] || 0) + 1;
    });

    return stats;
  },
}); 
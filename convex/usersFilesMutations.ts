import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Create or update a file reference
export const upsertFileReference = mutation({
  args: {
    userId: v.string(),
    fileName: v.string(),
    fileType: v.union(
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
    ),
    platform: v.union(
      v.literal("gmail"),
      v.literal("youtube"), 
      v.literal("instagram"),
      v.literal("smart-notes"),
      v.literal("ai-insights"),
      v.literal("analytics")
    ),
    fileId: v.string(),
    sourceTable: v.string(),
    metadata: v.object({
      subject: v.optional(v.string()),
      snippet: v.optional(v.string()),
      thumbnailUrl: v.optional(v.string()),
      from: v.optional(v.string()),
      date: v.optional(v.string()),
      stats: v.optional(v.object({
        views: v.optional(v.number()),
        likes: v.optional(v.number()),
        comments: v.optional(v.number()),
        messages: v.optional(v.number()),
        threads: v.optional(v.number()),
      })),
    }),
    searchKeywords: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    // Check if file reference already exists
    const existingFile = await ctx.db
      .query("usersFiles")
      .withIndex("by_user_type", (q) => 
        q.eq("userId", args.userId).eq("fileType", args.fileType)
      )
      .filter((q) => q.eq(q.field("fileId"), args.fileId))
      .first();

    const now = Date.now();
    
    // Generate search keywords from fileName and metadata
    const searchKeywords = [
      ...args.fileName.toLowerCase().split(' '),
      ...(args.metadata.subject?.toLowerCase().split(' ') || []),
      ...(args.metadata.snippet?.toLowerCase().split(' ').slice(0, 10) || []),
      args.platform,
      args.fileType,
      ...(args.searchKeywords || [])
    ].filter(keyword => keyword.length > 2); // Remove short words

    if (existingFile) {
      // Update existing file reference
      await ctx.db.patch(existingFile._id, {
        fileName: args.fileName,
        metadata: args.metadata,
        searchKeywords,
        updatedAt: now,
      });
      return existingFile._id;
    } else {
      // Create new file reference
      const fileId = await ctx.db.insert("usersFiles", {
        userId: args.userId,
        fileName: args.fileName,
        fileType: args.fileType,
        platform: args.platform,
        fileId: args.fileId,
        sourceTable: args.sourceTable,
        metadata: args.metadata,
        searchKeywords,
        createdAt: now,
        updatedAt: now,
      });
      return fileId;
    }
  },
});

// Delete a file reference
export const deleteFileReference = mutation({
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

    if (file) {
      await ctx.db.delete(file._id);
      return true;
    }
    return false;
  },
});

// Bulk sync file references from existing data
export const syncFileReferencesFromExistingData = mutation({
  args: {
    userId: v.string(),
    batchSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const batchSize = args.batchSize || 50;
    let syncedCount = 0;

    try {
      // Sync Gmail Messages
      const gmailMessages = await ctx.db
        .query("gmailMessages")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .take(batchSize);

      for (const message of gmailMessages) {
        await ctx.db.insert("usersFiles", {
          userId: args.userId,
          fileName: message.subject || `Email from ${message.from}` || 'Email Message',
          fileType: "email",
          platform: "gmail",
          fileId: message.messageId,
          sourceTable: "gmailMessages",
          metadata: {
            subject: message.subject,
            snippet: message.snippet,
            from: message.from,
            date: message.internalDate,
          },
          searchKeywords: [
            ...(message.subject?.toLowerCase().split(' ') || []),
            ...(message.snippet?.toLowerCase().split(' ').slice(0, 10) || []),
            ...(message.from?.toLowerCase().split(' ') || []),
            'gmail', 'email'
          ].filter(k => k && k.length > 2),
          createdAt: message.createdAt,
          updatedAt: Date.now(),
        });
        syncedCount++;
      }

      // Sync Gmail Threads
      const gmailThreads = await ctx.db
        .query("gmailThreads")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .take(batchSize);

      for (const thread of gmailThreads) {
        await ctx.db.insert("usersFiles", {
          userId: args.userId,
          fileName: thread.subject || `Thread from ${thread.from}` || 'Email Thread',
          fileType: "email_thread",
          platform: "gmail",
          fileId: thread.threadId,
          sourceTable: "gmailThreads",
          metadata: {
            subject: thread.subject,
            snippet: thread.snippet,
            from: thread.from,
            date: thread.updatedAt ? new Date(thread.updatedAt).toISOString() : undefined,
            stats: {
              messages: thread.message_count,
            },
          },
          searchKeywords: [
            ...(thread.subject?.toLowerCase().split(' ') || []),
            ...(thread.snippet?.toLowerCase().split(' ').slice(0, 10) || []),
            ...(thread.from?.toLowerCase().split(' ') || []),
            'gmail', 'thread', 'email'
          ].filter(k => k && k.length > 2),
          createdAt: thread.createdAt,
          updatedAt: Date.now(),
        });
        syncedCount++;
      }

      // Sync YouTube Videos
      const youtubeVideos = await ctx.db
        .query("youtubeVideos")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .take(batchSize);

      for (const video of youtubeVideos) {
        await ctx.db.insert("usersFiles", {
          userId: args.userId,
          fileName: video.snippet?.title || 'YouTube Video',
          fileType: "video",
          platform: "youtube",
          fileId: video.videoId,
          sourceTable: "youtubeVideos",
          metadata: {
            subject: video.snippet?.title,
            snippet: video.snippet?.description,
            thumbnailUrl: video.snippet?.thumbnails?.high || video.snippet?.thumbnails?.medium || video.snippet?.thumbnails?.default,
            date: video.snippet?.published_at,
            stats: {
              views: video.statistics?.views,
              likes: video.statistics?.likes,
              comments: video.statistics?.comments,
            },
          },
          searchKeywords: [
            ...(video.snippet?.title?.toLowerCase().split(' ') || []),
            ...(video.snippet?.description?.toLowerCase().split(' ').slice(0, 15) || []),
            ...(video.snippet?.tags || []).map(tag => tag.toLowerCase()),
            'youtube', 'video'
          ].filter(k => k && k.length > 2),
          createdAt: video.createdAt || Date.now(),
          updatedAt: Date.now(),
        });
        syncedCount++;
      }

      // Sync Instagram Posts
      const instagramPosts = await ctx.db
        .query("instagramPosts")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .take(batchSize);

      for (const post of instagramPosts) {
        const postTitle = post.data.caption ? 
          (post.data.caption.length > 50 ? post.data.caption.substring(0, 50) + '...' : post.data.caption) :
          'Instagram Post';

        await ctx.db.insert("usersFiles", {
          userId: args.userId,
          fileName: postTitle,
          fileType: "instagram_post",
          platform: "instagram",
          fileId: post.postId,
          sourceTable: "instagramPosts",
          metadata: {
            snippet: post.data.caption,
            thumbnailUrl: post.data.media_url,
            date: post.data.timestamp ? new Date(post.data.timestamp * 1000).toISOString() : undefined,
            stats: {
              likes: post.data.like_count,
              comments: post.data.comments_count,
            },
          },
          searchKeywords: [
            ...(post.data.caption?.toLowerCase().split(' ').slice(0, 15) || []),
            post.data.username?.toLowerCase(),
            'instagram', 'post'
          ].filter(k => k && k.length > 2),
          createdAt: post.createdAt,
          updatedAt: Date.now(),
        });
        syncedCount++;
      }

      // Sync Smart Notes
      const notes = await ctx.db
        .query("notes")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .take(batchSize);

      for (const note of notes) {
        await ctx.db.insert("usersFiles", {
          userId: args.userId,
          fileName: note.title,
          fileType: "note",
          platform: "smart-notes",
          fileId: note._id,
          sourceTable: "notes",
          metadata: {
            subject: note.title,
            snippet: note.content,
            date: new Date(note.createdAt).toISOString(),
          },
          searchKeywords: [
            ...note.title.toLowerCase().split(' '),
            ...(note.content?.toLowerCase().split(' ').slice(0, 10) || []),
            ...note.tags.map(tag => tag.toLowerCase()),
            'note', 'smart-notes'
          ].filter(k => k && k.length > 2),
          createdAt: note.createdAt,
          updatedAt: Date.now(),
        });
        syncedCount++;
      }

      return {
        success: true,
        syncedCount,
        message: `Successfully synced ${syncedCount} file references`,
      };

    } catch (error) {
      console.error('Error syncing file references:', error);
      return {
        success: false,
        syncedCount,
        error: error.message,
      };
    }
  },
});

// Update file reference metadata (for when source data changes)
export const updateFileMetadata = mutation({
  args: {
    userId: v.string(),
    fileId: v.string(),
    metadata: v.object({
      subject: v.optional(v.string()),
      snippet: v.optional(v.string()),
      thumbnailUrl: v.optional(v.string()),
      from: v.optional(v.string()),
      date: v.optional(v.string()),
      stats: v.optional(v.object({
        views: v.optional(v.number()),
        likes: v.optional(v.number()),
        comments: v.optional(v.number()),
        messages: v.optional(v.number()),
        threads: v.optional(v.number()),
      })),
    }),
  },
  handler: async (ctx, args) => {
    const file = await ctx.db
      .query("usersFiles")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("fileId"), args.fileId))
      .first();

    if (file) {
      await ctx.db.patch(file._id, {
        metadata: args.metadata,
        updatedAt: Date.now(),
      });
      return true;
    }
    return false;
  },
}); 
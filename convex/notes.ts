import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { error } from "console";

// Type definition for note types and reference types
const noteType = v.union(
  v.literal("idea_bank"),
  v.literal("content_script"),
  v.literal("collaboration_note"),
  v.literal("analytics_insight"),
  v.literal("reflection_journal"),
  v.literal("task_checklist")
);

export const getNotesByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// UPDATE NOTE MUTATION

export const updateNote = mutation({
  args: {
    noteId: v.optional(v.id("notes")),
    userId: v.string(),
    updates: v.object({
      content: v.optional(v.string()),
      title: v.optional(v.string()),
      analysis: v.optional(v.string()),
      important: v.optional(v.boolean()),
      type: v.optional(noteType),
      tags: v.optional(v.array(v.string())),
      platform: v.optional(v.string()),
      postType: v.optional(v.string()),
      goal: v.optional(v.string()),
      fields: v.optional(v.any()),
      titleGenerated: v.optional(v.boolean()),
      typeGenerated: v.optional(v.boolean()),
      images: v.optional(v.array(v.object({
        url: v.string(),
        filename: v.string(),
        originalFilename: v.optional(v.string()),
        uploadedAt: v.number(),
        size: v.optional(v.number()),
        mimeType: v.optional(v.string()),
        width: v.optional(v.number()),
        height: v.optional(v.number())
      }))),
    })
  },
  handler: async (ctx, args) => {
    const { noteId, userId, updates } = args;

    // DEBUG: Log all incoming parameters
    console.log('🔍 [Convex updateNote] Received args:', {
      noteId,
      noteIdType: typeof noteId,
      userId,
      userIdType: typeof userId,
      updatesKeys: Object.keys(updates),
      hasImages: 'images' in updates,
      imagesCount: updates.images?.length || 0
    });

    // DEBUG: If images are being updated, log their structure
    if (updates.images) {
      console.log('🖼️ [Convex updateNote] Images update detected:');
      console.log('Images array:', updates.images);
      updates.images.forEach((img, index) => {
        console.log(`Image ${index}:`, {
          url: img.url,
          urlType: typeof img.url,
          filename: img.filename,
          filenameType: typeof img.filename,
          originalFilename: img.originalFilename,
          uploadedAt: img.uploadedAt,
          uploadedAtType: typeof img.uploadedAt,
          size: img.size,
          mimeType: img.mimeType,
          width: img.width,
          height: img.height
        });
      });
    }

    // CREATE new note if no ID is provided
    if (!noteId) {
      console.log('✨ [Convex updateNote] No note ID, creating a new note...');
      const now = Date.now();
      const newNoteData = {
        userId,
        title: updates.title ?? "",
        content: updates.content ?? "",
        platform: updates.platform ?? "",
        type: updates.type ?? "idea_bank",
        important: updates.important ?? false,
        tags: updates.tags ?? [],
        ...updates,
        titleGenerated: updates.titleGenerated ?? false,
        typeGenerated: updates.typeGenerated ?? false,
        createdAt: now,
        updatedAt: now,
      };
      const newNoteId = await ctx.db.insert("notes", newNoteData);
      console.log('✅ [Convex updateNote] New note created successfully:', newNoteId);
      return await ctx.db.get(newNoteId);
    }

    // UPDATE existing note if ID is provided
    console.log('🔄 [Convex updateNote] Starting note update for ID:', noteId);
    const note = await ctx.db.get(noteId);

    if (!note) {
      console.error('❌ [Convex updateNote] Note not found for update:', noteId);
      throw new Error("Note not found");
    }
    if (note.userId !== userId) {
      console.error('🚫 [Convex updateNote] Unauthorized update attempt:', { noteId, requestUserId: userId });
      throw new Error("Unauthorized: You do not own this note.");
    }

    const updateObj = { ...updates, updatedAt: Date.now() };
    
    // DEBUG: Log the exact object being patched
    console.log('📝 [Convex updateNote] Patching note with:', updateObj);
    
    await ctx.db.patch(noteId, updateObj);
    const updatedNote = await ctx.db.get(noteId);

    console.log('✅ [Convex updateNote] Note updated successfully:', updatedNote);
    return updatedNote;
  },
});

// DELETE NOTE MUTATION
export const deleteNote = mutation({
  args: {
    noteId: v.id("notes"), // Changed from v.string() to v.id("notes")
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // args.noteId is now of type Id<"notes">

    // 1. Get the note by its ID to verify existence and ownership
    const note = await ctx.db.get(args.noteId);

    // 2. Check if note exists
    if (!note) {
      throw new Error("Note not found");
    }

    // 3. Check ownership
    if (note.userId !== args.userId) {
      throw new Error("Unauthorized: You do not own this note.");
    }

    // 4. Delete the note
    await ctx.db.delete(args.noteId);

    return { success: true };
  },
});

// Add analysis to an existing note
export const addAnalysisToNote = mutation({
  args: {
    noteId: v.id("notes"),
    analysis: v.string(),
  },
  handler: async (ctx, args) => {
    const { noteId, analysis } = args;
    await ctx.db.patch(noteId, {
      analysis,
      updatedAt: Date.now(),
    });
    return await ctx.db.get(noteId);
  },
});

export const getAnalysisforNote = query({
  args: {
    noteId: v.id("notes"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { noteId, userId } = args;
    const note = await ctx.db.get(noteId);
    if (!note) {
      throw new Error("Note not found");
    }
    if (note.userId !== userId) {
      throw new Error("Unauthorized: You do not own this note.");
    }
    return note.analysis;
  },
});

// Type-specific queries
export const getIdeaBank = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .filter((q) =>
        q.eq(q.field("userId"), args.userId) &&
        q.eq(q.field("type"), "idea_bank")
      )
      .order("desc")
      .collect();
  },
});

export const getContentScripts = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .filter((q) =>
        q.eq(q.field("userId"), args.userId) &&
        q.eq(q.field("type"), "content_script")
      )
      .order("desc")
      .collect();
  },
});

export const getCollaborationNotes = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .filter((q) =>
        q.eq(q.field("userId"), args.userId) &&
        q.eq(q.field("type"), "collaboration_note")
      )
      .order("desc")
      .collect();
  },
});

export const getAnalyticsInsights = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .filter((q) =>
        q.eq(q.field("userId"), args.userId) &&
        q.eq(q.field("type"), "analytics_insight")
      )
      .order("desc")
      .collect();
  },
});

export const getReflectionJournal = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .filter((q) =>
        q.eq(q.field("userId"), args.userId) &&
        q.eq(q.field("type"), "reflection_journal")
      )
      .order("desc")
      .collect();
  },
});

export const getTaskChecklists = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("notes")
      .filter((q) =>
        q.eq(q.field("userId"), args.userId) &&
        q.eq(q.field("type"), "task_checklist")
      )
      .order("desc")
      .collect();
  },
});

export const getNote = query({
  args: {
    noteId: v.string(), // Keep as v.string() as it comes from HTTP as a string
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    // Attempt to get the note by its ID
    const note = await ctx.db.get(args.noteId as Id<"notes">); // Cast string ID to Id<"notes">

    // If note is found, check if the userId matches (for authorization)
    if (note && note.userId === args.userId) {
      return note;
    } else {
      // If note not found, or userId doesn't match, return null
      // This will result in a 404 from the HTTP endpoint if null is returned
      return null; 
    }
  },
});

// Get content by prefixed ID (supports note:, youtube:, instagram: prefixes)
export const getContentByPrefixedId = query({
  args: { 
    prefixedId: v.string(),
    userId: v.string() 
  },
  returns: v.union(
    v.null(),
    v.any()
  ),
  handler: async (ctx, args) => {
    try {
      const { prefixedId, userId } = args;
      
      // Validate inputs
      if (!prefixedId || !userId) {
        console.warn('getContentByPrefixedId: Missing required parameters', { prefixedId, userId });
        return null;
      }
      
      // Parse the prefixed ID
      const [contentType, contentId] = prefixedId.split(':', 2);
      
      if (!contentType || !contentId) {
        console.warn('getContentByPrefixedId: Invalid prefixed ID format', { prefixedId });
        return null;
      }
      
      switch (contentType) {
        case 'note':
          // Get note by Convex ID
          try {
            const note = await ctx.db.get(contentId as Id<"notes">);
            if (note && note.userId === userId) {
              return {
                type: 'note',
                id: prefixedId,
                title: note.title || 'Untitled Note',
                content: note.content || '',
                contentType: note.type || 'idea_bank',
                createdAt: note.createdAt || Date.now(),
                updatedAt: note.updatedAt || Date.now(),
                platform: note.platform || 'smart-notes',
                tags: note.tags || [],
                important: note.important || false,
                analysis: note.analysis
              };
            }
          } catch (error) {
            console.error('Error fetching note:', error);
          }
          break;
          
        case 'youtube':
          // Get YouTube video by videoId
          try {
            const video = await ctx.db
              .query("youtubeVideos")
              .withIndex("by_videoId", (q) => q.eq("videoId", contentId))
              .filter((q) => q.eq(q.field("userId"), userId))
              .first();
              
            if (video) {
              return {
                type: 'youtube',
                id: prefixedId,
                title: video.snippet?.title || 'YouTube Video',
                content: video.snippet?.description || '',
                contentType: 'video',
                createdAt: video.createdAt || Date.now(),
                updatedAt: video.updatedAt || Date.now(),
                platform: 'youtube',
                tags: video.snippet?.tags || [],
                important: false,
                analysis: video.analysis,
                videoId: video.videoId,
                url: video.url,
                thumbnailUrl: video.snippet?.thumbnails?.high || video.snippet?.thumbnails?.medium || '',
                statistics: {
                  views: video.statistics?.views ? Number(video.statistics.views) : 0,
                  likes: video.statistics?.likes ? Number(video.statistics.likes) : 0,
                  dislikes: video.statistics?.dislikes ? Number(video.statistics.dislikes) : 0,
                  comments: video.statistics?.comments ? Number(video.statistics.comments) : 0
                }
              };
            }
            
            // If not found, try without userId filter as fallback
            const fallbackVideo = await ctx.db
              .query("youtubeVideos")
              .withIndex("by_videoId", (q) => q.eq("videoId", contentId))
              .first();
              
            if (fallbackVideo) {
              return {
                type: 'youtube',
                id: prefixedId,
                title: fallbackVideo.snippet?.title || 'YouTube Video',
                content: fallbackVideo.snippet?.description || '',
                contentType: 'video',
                createdAt: fallbackVideo.createdAt || Date.now(),
                updatedAt: fallbackVideo.updatedAt || Date.now(),
                platform: 'youtube',
                tags: fallbackVideo.snippet?.tags || [],
                important: false,
                analysis: fallbackVideo.analysis,
                videoId: fallbackVideo.videoId,
                url: fallbackVideo.url,
                thumbnailUrl: fallbackVideo.snippet?.thumbnails?.high || fallbackVideo.snippet?.thumbnails?.medium || '',
                statistics: {
                  views: fallbackVideo.statistics?.views ? Number(fallbackVideo.statistics.views) : 0,
                  likes: fallbackVideo.statistics?.likes ? Number(fallbackVideo.statistics.likes) : 0,
                  dislikes: fallbackVideo.statistics?.dislikes ? Number(fallbackVideo.statistics.dislikes) : 0,
                  comments: fallbackVideo.statistics?.comments ? Number(fallbackVideo.statistics.comments) : 0
                }
              };
            }
          } catch (error) {
            console.error('Error fetching YouTube video:', error);
          }
          break;
          
        case 'instagram':
          // Get Instagram post by postId
          try {
            const post = await ctx.db
              .query("instagramPosts")
              .withIndex("by_postId", (q) => q.eq("postId", contentId))
              .filter((q) => q.eq(q.field("userId"), userId))
              .first();
              
            if (post) {
              return {
                type: 'instagram',
                id: prefixedId,
                title: post.data.caption?.slice(0, 100) || 'Instagram Post',
                content: post.data.caption || '',
                contentType: post.mediaType.toLowerCase(),
                createdAt: post.createdAt || (post.data.timestamp ? post.data.timestamp * 1000 : Date.now()),
                updatedAt: post.updatedAt,
                platform: 'instagram',
                tags: [],
                important: false,
                analysis: post.analysis,
                postId: post.postId,
                mediaUrl: post.data.media_url,
                permalink: post.data.permalink,
                insights: post.data.insights ? {
                  impressions: post.data.insights.impressions || 0,
                  reach: post.data.insights.reach || 0,
                  likes: post.data.insights.likes || 0,
                  comments: post.data.insights.comments || 0,
                  saved: post.data.insights.saved || 0,
                  shares: post.data.insights.shares || 0
                } : null
              };
            }
          } catch (error) {
            console.error('Error fetching Instagram post:', error);
          }
          break;
          
        default:
          console.warn('getContentByPrefixedId: Unsupported content type', { contentType });
          return null;
      }
      
      return null; // Content not found
    } catch (error) {
      console.error('getContentByPrefixedId: Unexpected error', error);
      return null;
    }
  },
});

// Batch query to get multiple content titles by prefixed IDs
export const getContentTitlesByPrefixedIds = query({
  args: { 
    prefixedIds: v.array(v.string()),
    userId: v.string() 
  },
  returns: v.record(v.string(), v.union(v.string(), v.null())),
  handler: async (ctx, args) => {
    try {
      const { prefixedIds, userId } = args;
      
      // Validate inputs
      if (!prefixedIds || prefixedIds.length === 0 || !userId) {
        console.warn('getContentTitlesByPrefixedIds: Missing required parameters', { prefixedIds, userId });
        return {};
      }
      
      const titles: Record<string, string | null> = {};
      
      for (const prefixedId of prefixedIds) {
        try {
          // Parse the prefixed ID
          const [contentType, contentId] = prefixedId.split(':', 2);
          
          if (!contentType || !contentId) {
            console.warn('getContentTitlesByPrefixedIds: Invalid prefixed ID format', { prefixedId });
            titles[prefixedId] = null;
            continue;
          }
          
          switch (contentType) {
            case 'note':
              // Get note by Convex ID
              try {
                const note = await ctx.db.get(contentId as Id<"notes">);
                if (note && note.userId === userId) {
                  titles[prefixedId] = note.title || 'Untitled Note';
                } else {
                  titles[prefixedId] = null;
                }
              } catch (error) {
                console.error('Error fetching note:', error);
                titles[prefixedId] = null;
              }
              break;
              
            case 'youtube':
              // Get YouTube video by videoId
              try {
                const video = await ctx.db
                  .query("youtubeVideos")
                  .withIndex("by_videoId", (q) => q.eq("videoId", contentId))
                  .filter((q) => q.eq(q.field("userId"), userId))
                  .first();
                  
                if (video) {
                  titles[prefixedId] = video.snippet?.title || 'YouTube Video';
                } else {
                  // Try fallback without userId filter
                  const fallbackVideo = await ctx.db
                    .query("youtubeVideos")
                    .withIndex("by_videoId", (q) => q.eq("videoId", contentId))
                    .first();
                    
                  if (fallbackVideo) {
                    titles[prefixedId] = fallbackVideo.snippet?.title || 'YouTube Video';
                  } else {
                    titles[prefixedId] = null;
                  }
                }
              } catch (error) {
                console.error('Error fetching YouTube video:', error);
                titles[prefixedId] = null;
              }
              break;
              
            case 'instagram':
              // Get Instagram post by postId
              try {
                const post = await ctx.db
                  .query("instagramPosts")
                  .withIndex("by_postId", (q) => q.eq("postId", contentId))
                  .filter((q) => q.eq(q.field("userId"), userId))
                  .first();
                  
                if (post) {
                  titles[prefixedId] = post.data.caption?.slice(0, 100) || 'Instagram Post';
                } else {
                  titles[prefixedId] = null;
                }
              } catch (error) {
                console.error('Error fetching Instagram post:', error);
                titles[prefixedId] = null;
              }
              break;
              
            default:
              console.warn('getContentTitlesByPrefixedIds: Unsupported content type', { contentType });
              titles[prefixedId] = null;
          }
        } catch (error) {
          console.error('Error processing prefixed ID:', prefixedId, error);
          titles[prefixedId] = null;
        }
      }
      
      return titles;
    } catch (error) {
      console.error('getContentTitlesByPrefixedIds: Unexpected error', error);
      return {};
    }
  },
});

// Get content by platform type
export const getContentByPlatform = query({
  args: { 
    userId: v.string(),
    platform: v.union(
      v.literal("smart-notes"),
      v.literal("youtube"), 
      v.literal("instagram")
    )
  },
  returns: v.array(v.object({
    id: v.string(),
    title: v.string(),
    type: v.union(v.literal("note"), v.literal("youtube"), v.literal("instagram")),
    contentType: v.string(),
    platform: v.string(),
    createdAt: v.number(),
    important: v.boolean(),
    tags: v.array(v.string()),
    analysis: v.optional(v.any()),
    thumbnailUrl: v.optional(v.string()),
    statistics: v.optional(v.any()),
    mediaUrl: v.optional(v.string()),
    insights: v.optional(v.any())
  })),
  handler: async (ctx, args) => {
    const { userId, platform } = args;
    
    try {
      // Validate input
      if (!userId || userId.trim() === '') {
        console.warn('getContentByPlatform: Empty userId provided');
        return [];
      }

      switch (platform) {
        case 'smart-notes':
          const notes = await ctx.db
            .query("notes")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();
            
          return notes.map(note => ({
            id: String(note._id), // Use raw ID, not prefixed
            title: note.title || 'Untitled Note',
            type: 'note' as const,
            contentType: note.type || 'idea_bank',
            platform: 'smart-notes',
            createdAt: note.createdAt || Date.now(),
            important: note.important || false,
            tags: note.tags || [],
            analysis: note.analysis
          }));
          
        case 'youtube':
          const videos = await ctx.db
            .query("youtubeVideos")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .collect();
            
          return videos.map(video => ({
            id: `youtube:${video.videoId}`,
            title: video.snippet?.title || 'Untitled Video',
            type: 'youtube' as const,
            contentType: 'video',
            platform: 'youtube',
            createdAt: video.createdAt || Date.now(),
            important: false,
            tags: video.snippet?.tags || [],
            analysis: video.analysis,
            thumbnailUrl: video.snippet?.thumbnails?.high || video.snippet?.thumbnails?.medium || '',
            statistics: {
              views: video.statistics?.views ? Number(video.statistics.views) : 0,
              likes: video.statistics?.likes ? Number(video.statistics.likes) : 0,
              dislikes: video.statistics?.dislikes ? Number(video.statistics.dislikes) : 0,
              comments: video.statistics?.comments ? Number(video.statistics.comments) : 0
            }
          }));
          
        case 'instagram':
          const posts = await ctx.db
            .query("instagramPosts")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .collect();
            
          return posts.map(post => ({
            id: `instagram:${post.postId}`,
            title: post.data?.caption?.slice(0, 100) || 'Instagram Post',
            type: 'instagram' as const,
            contentType: post.mediaType?.toLowerCase() || 'image',
            platform: 'instagram',
            createdAt: post.createdAt || (post.data?.timestamp ? post.data.timestamp * 1000 : Date.now()),
            important: false,
            tags: [],
            analysis: post.analysis,
            mediaUrl: post.data?.media_url || '',
            insights: post.data?.insights ? {
              impressions: post.data.insights.impressions || 0,
              reach: post.data.insights.reach || 0,
              likes: post.data.insights.likes || 0,
              comments: post.data.insights.comments || 0,
              saved: post.data.insights.saved || 0,
              shares: post.data.insights.shares || 0
            } : null
          }));
          
        default:
          return [];
      }
    } catch (error) {
      console.error('Error in getContentByPlatform:', error);
      // Return empty array instead of throwing to prevent client crashes
      return [];
    }
  },
});

// Get all available content for linking (notes, YouTube videos, Instagram posts)
export const getAllLinkableContent = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    console.log('=== getAllLinkableContent START ===');
    console.log('Input userId:', args.userId);
    console.log('Input type:', typeof args.userId);
    
    try {
      // Validate input
      if (!args.userId || args.userId.trim() === '') {
        console.warn('getAllLinkableContent: Empty userId provided');
        return [];
      }

      console.log('Starting database queries...');
      
      // Query notes
      console.log('Querying notes...');
      let notes;
      try {
        notes = await ctx.db
          .query("notes")
          .withIndex("by_user", (q) => q.eq("userId", args.userId))
          .collect();
        console.log('Notes query successful, count:', notes.length);
      } catch (notesError) {
        console.error('Error querying notes:', notesError);
        notes = [];
      }
      
      // Query YouTube videos
      console.log('Querying YouTube videos...');
      let videos;
      try {
        videos = await ctx.db
          .query("youtubeVideos")
          .withIndex("by_userId", (q) => q.eq("userId", args.userId))
          .collect();
        console.log('YouTube videos query successful, count:', videos.length);
      } catch (videosError) {
        console.error('Error querying YouTube videos:', videosError);
        videos = [];
      }
      
      // Query Instagram posts
      console.log('Querying Instagram posts...');
      let posts;
      try {
        posts = await ctx.db
          .query("instagramPosts")
          .withIndex("by_userId", (q) => q.eq("userId", args.userId))
          .collect();
        console.log('Instagram posts query successful, count:', posts.length);
      } catch (postsError) {
        console.error('Error querying Instagram posts:', postsError);
        posts = [];
      }
      
      console.log('All database queries completed');
      console.log('Transforming data...');
      
      // Transform into unified format
      const linkableContent = [
        // Transform notes
        ...notes.map((note, index) => {
          console.log(`Processing note ${index}:`, note._id);
          return {
            id: String(note._id), // Use raw ID, not prefixed
            title: note.title || 'Untitled Note',
            type: 'note' as const,
            contentType: note.type || 'idea_bank',
            platform: note.platform || 'smart-notes',
            createdAt: note.createdAt || Date.now(),
            important: note.important || false,
            tags: note.tags || [],
            analysis: note.analysis
          };
        }),
        
        // Transform YouTube videos
        ...videos.map((video, index) => {
          console.log(`Processing video ${index}:`, video.videoId);
          return {
            id: `youtube:${video.videoId}`,
            title: video.snippet?.title || 'Untitled Video',
            type: 'youtube' as const,
            contentType: 'video',
            platform: 'youtube',
            createdAt: video.createdAt || Date.now(),
            important: false,
            tags: video.snippet?.tags || [],
            analysis: video.analysis,
            thumbnailUrl: video.snippet?.thumbnails?.high || video.snippet?.thumbnails?.medium || '',
            statistics: {
              views: video.statistics?.views ? Number(video.statistics.views) : 0,
              likes: video.statistics?.likes ? Number(video.statistics.likes) : 0,
              dislikes: video.statistics?.dislikes ? Number(video.statistics.dislikes) : 0,
              comments: video.statistics?.comments ? Number(video.statistics.comments) : 0
            }
          };
        }),
        
        // Transform Instagram posts
        ...posts.map((post, index) => {
          console.log(`Processing post ${index}:`, post.postId);
          return {
            id: `instagram:${post.postId}`,
            title: post.data?.caption?.slice(0, 100) || 'Instagram Post',
            type: 'instagram' as const,
            contentType: post.mediaType?.toLowerCase() || 'image',
            platform: 'instagram',
            createdAt: post.createdAt || (post.data?.timestamp ? post.data.timestamp * 1000 : Date.now()),
            important: false,
            tags: [],
            analysis: post.analysis,
            mediaUrl: post.data?.media_url || '',
            insights: post.data?.insights ? {
              impressions: post.data.insights.impressions || 0,
              reach: post.data.insights.reach || 0,
              likes: post.data.insights.likes || 0,
              comments: post.data.insights.comments || 0,
              saved: post.data.insights.saved || 0,
              shares: post.data.insights.shares || 0
            } : null
          };
        })
      ];
      
      console.log('Data transformation completed');
      console.log('Total items:', linkableContent.length);
      
      // Sort by creation date (newest first)
      const sortedContent = linkableContent.sort((a, b) => b.createdAt - a.createdAt);
      console.log('Sorting completed');
      
      console.log('=== getAllLinkableContent SUCCESS ===');
      return sortedContent;
    } catch (error) {
      console.error('=== getAllLinkableContent ERROR ===');
      console.error('Error type:', typeof error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('Full error object:', error);
      // Return empty array instead of throwing to prevent client crashes
      return [];
    }
  },
});
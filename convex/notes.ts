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
  v.literal("task_checklist"),
  v.literal("email_draft")
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

// Get content by prefixed ID
export const getContentByPrefixedId = query({
  args: {
    prefixedId: v.string(),
    userId: v.string(),
  },
  returns: v.union(v.null(), v.object({
    type: v.union(v.literal("note"), v.literal("youtube"), v.literal("instagram"), v.literal("insight")),
    id: v.string(),
    title: v.string(),
    content: v.string(),
    contentType: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    platform: v.string(),
    tags: v.array(v.string()),
    important: v.boolean(),
    analysis: v.optional(v.any()),
    thumbnailUrl: v.optional(v.string()),
    statistics: v.optional(v.any()),
    mediaUrl: v.optional(v.string()),
    insights: v.optional(v.any())
  })),
  handler: async (ctx, args) => {
    const { prefixedId, userId } = args;
    
    if (!prefixedId || !userId) {
      return null;
    }

    const [contentType, contentId] = prefixedId.split(':', 2);
    
    switch (contentType) {
      case 'note':
        // Get note by Convex ID
        try {
          const note = await ctx.db.get(contentId as Id<"notes">);
          if (note && note.userId === userId) {
            return {
              type: 'note' as const,
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
        // Get YouTube video by video ID
        try {
          const video = await ctx.db
            .query("youtubeVideos")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("videoId"), contentId))
            .first();
            
          if (video) {
            return {
              type: 'youtube' as const,
              id: prefixedId,
              title: video.snippet?.title || 'Untitled Video',
              content: video.snippet?.description || '',
              contentType: 'video',
              createdAt: video.createdAt || Date.now(),
              updatedAt: video.updatedAt || Date.now(),
              platform: 'youtube',
              tags: video.snippet?.tags || [],
              important: false,
              analysis: video.analysis,
              thumbnailUrl: video.snippet?.thumbnails?.high || video.snippet?.thumbnails?.medium || '',
              statistics: {
                views: video.statistics?.views ? Number(video.statistics.views) : 0,
                likes: video.statistics?.likes ? Number(video.statistics.likes) : 0,
                dislikes: video.statistics?.dislikes ? Number(video.statistics.dislikes) : 0,
                comments: video.statistics?.comments ? Number(video.statistics.comments) : 0
              }
            };
          }
        } catch (error) {
          console.error('Error fetching YouTube video:', error);
        }
        break;

      case 'insight':
        // Get insight by analysis ID and index
        try {
          const [analysisId, indexStr] = contentId.split(':', 2);
          const index = parseInt(indexStr, 10);
          
          if (isNaN(index)) {
            console.error('Invalid insight index:', indexStr);
            return null;
          }
          
          const analysis = await ctx.db.get(analysisId as Id<"youtubeBatchAnalysis">);
          if (analysis && analysis.userId === userId && analysis.insights && analysis.insights.insights && Array.isArray(analysis.insights.insights)) {
            const insight = analysis.insights.insights[index];
            if (insight) {
              return {
                type: 'insight' as const,
                id: prefixedId,
                title: insight.title || 'Untitled Insight',
                content: insight.expectedOutcome || '',
                contentType: 'insight',
                createdAt: analysis.createdAt || Date.now(),
                updatedAt: analysis.updatedAt || Date.now(),
                platform: 'insights',
                tags: [],
                important: false,
                analysis: insight,
                insights: insight
              };
            }
          }
        } catch (error) {
          console.error('Error fetching insight:', error);
        }
        break;

      default:
        console.warn('Unknown content type:', contentType);
        return null;
    }
    
    return null;
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
      v.literal("instagram"),
      v.literal("insights")
    )
  },
  returns: v.array(v.object({
    id: v.string(),
    title: v.string(),
    type: v.union(v.literal("note"), v.literal("youtube"), v.literal("instagram"), v.literal("insight")),
    contentType: v.string(),
    platform: v.string(),
    createdAt: v.number(),
    important: v.boolean(),
    tags: v.array(v.string()),
    analysis: v.optional(v.any()),
    content: v.optional(v.string()),
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
            analysis: note.analysis,
            content: note.content || ''
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

        case 'insights':
          const batchAnalyses = await ctx.db
            .query("youtubeBatchAnalysis")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .collect();
            
          const insights: any[] = [];
          
          batchAnalyses.forEach(analysis => {
            if (analysis.insights && analysis.insights.insights && Array.isArray(analysis.insights.insights)) {
              analysis.insights.insights.forEach((insight: any, index: number) => {
                insights.push({
                  id: `insight:${analysis._id}:${index}`,
                  title: insight.title || 'Untitled Insight',
                  type: 'insight' as const,
                  contentType: 'insight',
                  platform: 'insights',
                  createdAt: analysis.createdAt || Date.now(),
                  important: false,
                  tags: [],
                  analysis: insight,
                  insights: insight
                });
              });
            }
          });
          
          return insights;
          
        default:
          return [];
      }
    } catch (error) {
      console.error('Error in getContentByPlatform:', error);
      return [];
    }
  },
});

// Get all available content for linking (notes, YouTube videos, Instagram posts)
export const getAllLinkableContent = query({
  args: {
    userId: v.string(),
  },
  returns: v.array(v.object({
    id: v.string(),
    title: v.string(),
    type: v.union(v.literal("note"), v.literal("youtube"), v.literal("instagram"), v.literal("insight")),
    contentType: v.string(),
    platform: v.string(),
    createdAt: v.number(),
    important: v.boolean(),
    tags: v.array(v.string()),
    analysis: v.optional(v.any()),
    content: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    statistics: v.optional(v.any()),
    mediaUrl: v.optional(v.string()),
    insights: v.optional(v.any())
  })),
  handler: async (ctx, args) => {
    const { userId } = args;
    
    if (!userId || userId.trim() === '') {
      return [];
    }

    try {
      // Fetch all data in parallel
      const [notes, videos, batchAnalyses] = await Promise.all([
        ctx.db.query("notes").withIndex("by_user", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("youtubeVideos").withIndex("by_userId", (q) => q.eq("userId", userId)).collect(),
        ctx.db.query("youtubeBatchAnalysis").withIndex("by_userId", (q) => q.eq("userId", userId)).collect()
      ]);
      
      // Transform into unified format
      const linkableContent = [
        // Transform notes
        ...notes.map((note, index) => {
          return {
            id: String(note._id),
            title: note.title || 'Untitled Note',
            type: 'note' as const,
            contentType: note.type || 'idea_bank',
            platform: note.platform || 'smart-notes',
            createdAt: note.createdAt || Date.now(),
            important: note.important || false,
            tags: note.tags || [],
            analysis: note.analysis,
            content: note.content || ''
          };
        }),
        // Transform YouTube videos
        ...videos.map((video, index) => {
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
        // Transform insights
        ...batchAnalyses.flatMap((analysis, analysisIndex) => {
          if (analysis.insights && analysis.insights.insights && Array.isArray(analysis.insights.insights)) {
            return analysis.insights.insights.map((insight: any, insightIndex: number) => {
              return {
                id: `insight:${analysis._id}:${insightIndex}`,
                title: insight.title || 'Untitled Insight',
                type: 'insight' as const,
                contentType: 'insight',
                platform: 'insights',
                createdAt: analysis.createdAt || Date.now(),
                important: false,
                tags: [],
                analysis: insight,
                insights: insight
              };
            });
          }
          return [];
        })
      ];
      
      return linkableContent;
      
    } catch (error) {
      console.error('Error in getAllLinkableContent:', error);
      return [];
    }
  },
});

export const getInsightById = query({
  args: { insightId: v.string() },
  returns: v.union(
    v.object({
      id: v.string(),
      title: v.string(),
      type: v.union(v.literal("note"), v.literal("youtube"), v.literal("instagram"), v.literal("insight")),
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
    }),
    v.null()
  ),
  handler: async (ctx, { insightId }) => {
    // Find the insight in batch analyses
    const batchAnalyses = await ctx.db.query("youtubeBatchAnalysis").collect();
    for (const analysis of batchAnalyses) {
      if (analysis.insights && analysis.insights.insights && Array.isArray(analysis.insights.insights)) {
        for (let insightIndex = 0; insightIndex < analysis.insights.insights.length; insightIndex++) {
          const insight = analysis.insights.insights[insightIndex];
          const id = `insight:${analysis._id}:${insightIndex}`;
          if (id === insightId) {
            return {
              id,
              title: insight.title || 'Untitled Insight',
              type: 'insight' as const,
              contentType: 'insight',
              platform: 'insights',
              createdAt: analysis.createdAt || Date.now(),
              important: false,
              tags: [],
              analysis: insight,
              insights: insight
            };
          }
        }
      }
    }
    return null;
  }
});
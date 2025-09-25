import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Type definition for note types and reference types
const noteType = v.union(
  v.literal("idea_bank"),
  v.literal("content_script"),
  v.literal("collaboration_note"),
  v.literal("reflection_journal"),
  v.literal("task_checklist"),
  v.literal("email_draft")
);


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

    // Note: Embeddings will be cleaned up automatically on next heartbeat
    console.log('📝 [NOTE] Embedding will be cleaned up on next heartbeat sync');

    return { success: true };
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
    type: v.union(v.literal("note"), v.literal("conversation")),
    id: v.string(),
    title: v.string(),
    content: v.string(),
    contentType: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    platform: v.string(),
    tags: v.array(v.string()),
    important: v.boolean()
  })),
  handler: async (ctx, args) => {
    const { prefixedId, userId } = args;
    
    if (!prefixedId || !userId) {
      return null;
    }

    const [contentType, ...rest] = prefixedId.split(':');
    const contentId = rest.join(':');
    console.log('🔍 getContentByPrefixedId: Original prefixedId:', prefixedId);
    console.log('🔍 getContentByPrefixedId: Parsed contentType:', contentType, 'contentId:', contentId);
    
    switch (contentType) {
      case 'note':
      case 'notes':
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
              important: note.important || false
            };
          }
        } catch (error) {
          console.error('Error fetching note:', error);
        }
        break;

      case 'conversations':
        // Get conversation by ID
        try {
          const conversation = await ctx.db
            .query("conversations")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("_id"), contentId))
            .first();
            
          if (conversation) {
            return {
              type: 'conversation' as const,
              id: prefixedId,
              title: conversation.title || 'Conversation',
              content: conversation.messages?.map(m => m.content).join('\n') || '',
              contentType: 'conversation',
              createdAt: conversation.createdAt || Date.now(),
              updatedAt: conversation.updatedAt || Date.now(),
              platform: 'conversations',
              tags: [],
              important: conversation.starred || false
            };
          }
        } catch (error) {
          console.error('Error fetching conversation:', error);
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
          console.log('🔍 getContentTitlesByPrefixedIds: Processing prefixedId:', prefixedId);
          // Parse the prefixed ID
          const [contentType, ...rest] = prefixedId.split(':');
          const contentId = rest.join(':');
          console.log('🔍 Parsed contentType:', contentType, 'contentId:', contentId);
          
          if (!contentType || !contentId) {
            console.warn('getContentTitlesByPrefixedIds: Invalid prefixed ID format', { prefixedId });
            titles[prefixedId] = null;
            continue;
          }
          
          // Additional validation for malformed IDs
          if (contentId.length < 10 || contentId.includes(' ') || contentId.includes('\n') || contentId.includes('\t')) {
            console.warn('getContentTitlesByPrefixedIds: Malformed content ID', { prefixedId, contentId });
            titles[prefixedId] = null;
            continue;
          }
          
          switch (contentType) {
            case 'note':
            case 'notes':
              // Get note by Convex ID
              console.log('🔍 getContentTitlesByPrefixedIds: Processing note/notes:', { contentType, contentId, contentIdType: typeof contentId });
              try {
                // Validate that contentId is a valid Convex ID format
                if (!contentId || typeof contentId !== 'string' || contentId.length < 10) {
                  console.error('Invalid contentId format:', { contentId, contentType });
                  titles[prefixedId] = null;
                  break;
                }
                
                const note = await ctx.db.get(contentId as Id<"notes">);
                if (note && note.userId === userId) {
                  titles[prefixedId] = note.title || 'Untitled Note';
                } else {
                  titles[prefixedId] = null;
                }
              } catch (error) {
                console.error('Error fetching note:', { error, contentId, contentType });
                titles[prefixedId] = null;
              }
              break;
              
            case 'conversations':
              // Get conversation by ID
              console.log('🔍 getContentTitlesByPrefixedIds: Processing conversation:', { contentType, contentId, contentIdType: typeof contentId });
              try {
                const conversation = await ctx.db
                  .query("conversations")
                  .withIndex("by_user", (q) => q.eq("userId", userId))
                  .filter((q) => q.eq(q.field("_id"), contentId))
                  .first();
                  
                console.log('🔍 getContentTitlesByPrefixedIds: Conversation result:', { found: !!conversation, title: conversation?.title });
                
                if (conversation) {
                  // Clean the title for inline display - remove newlines and truncate if too long
                  let cleanTitle = conversation.title || 'Conversation';
                  cleanTitle = cleanTitle.replace(/[\r\n]+/g, ' ').trim(); // Remove newlines
                  cleanTitle = cleanTitle.replace(/\s+/g, ' '); // Replace multiple spaces with single space
                  
                  // Truncate if too long for inline display
                  if (cleanTitle.length > 50) {
                    cleanTitle = cleanTitle.substring(0, 47) + '...';
                  }
                  
                  titles[prefixedId] = cleanTitle;
                } else {
                  titles[prefixedId] = null;
                }
              } catch (error) {
                console.error('Error fetching conversation:', error);
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
      v.literal("smart-notes")
    )
  },
  returns: v.array(v.object({
    id: v.string(),
    title: v.string(),
    type: v.union(v.literal("note")),
    contentType: v.string(),
    platform: v.string(),
    createdAt: v.number(),
    important: v.boolean(),
    tags: v.array(v.string()),
    content: v.optional(v.string())
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
            content: note.content || ''
          }));
          
        default:
          return [];
      }
    } catch (error) {
      console.error('Error in getContentByPlatform:', error);
      return [];
    }
  },
});

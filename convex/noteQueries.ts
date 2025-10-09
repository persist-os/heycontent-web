import { v } from "convex/values";
import { query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Default page size for pagination
const DEFAULT_PAGE_SIZE = 20;

// Define valid note types based on schema
export const NOTE_TYPES = [
  'idea_bank',
  'content_script',
  'collaboration_note',
  'analytics_insight',
  'reflection_journal',
  'task_checklist',
  'email_draft',
  'idea' // Legacy type for existing notes
] as const;

type NoteType = typeof NOTE_TYPES[number];


/**
 * Get paginated notes for a user with optional filtering and sorting
 * Includes both owned notes and notes shared with the user
 * @param userId - The ID of the user to get notes for
 * @param cursor - Optional cursor for pagination
 * @param numItems - Number of items to fetch (default: 20, max: 50)
 * @param sortField - Field to sort by (default: '_creationTime')
 * @param sortOrder - Sort order ('asc' or 'desc', default: 'desc')
 * @param filters - Optional filters to apply
 * @param includeShared - Whether to include shared notes (default: true)
 */
export const getUserNotes = query({
  args: {
    userId: v.string(),
    cursor: v.optional(v.string()),
    numItems: v.optional(v.number()),
    sortField: v.optional(v.string()),
    sortOrder: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
    includeShared: v.optional(v.boolean()),
    filters: v.optional(v.object({
      type: v.optional(v.union(
        v.literal('idea_bank'),
        v.literal('content_script'),
        v.literal('collaboration_note'),
        v.literal('analytics_insight'),
        v.literal('reflection_journal'),
        v.literal('task_checklist'),
        v.literal('email_draft'),
        v.literal('idea') // Legacy type for existing notes
      )),
      important: v.optional(v.boolean()),
      tags: v.optional(v.array(v.string())),
    })),
  },
  handler: async (ctx, args) => {
    const {
      userId,
      cursor,
      numItems = DEFAULT_PAGE_SIZE,
      sortField = '_creationTime',
      sortOrder = 'desc',
      includeShared = true,
      filters = {}
    } = args;

    // Validate and sanitize input
    const limit = Math.min(Math.max(1, numItems), 50); // Enforce reasonable limits
    
    // Get owned notes
    let ownedQuery = ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    // Apply filters to owned notes
    if (filters.type) {
      ownedQuery = ownedQuery.filter((q) => q.eq(q.field('type'), filters.type));
    }
    
    if (filters.important !== undefined) {
      ownedQuery = ownedQuery.filter((q) => q.eq(q.field('important'), filters.important));
    }
    
    if (filters.tags?.length) {
      const tags = filters.tags;
      ownedQuery = ownedQuery.filter((q) => 
        q.or(
          ...tags.map(tag => 
            q.eq(q.field('tags'), [tag])
          )
        )
      );
    }

    // Get owned notes
    const ownedNotes = await ownedQuery.collect();

    // Get shared notes if requested
    let sharedNotes: any[] = [];
    if (includeShared) {
      const shares = await ctx.db
        .query("shared_notes")
        .withIndex("by_shared_user", (q) => q.eq("sharedWithUserId", userId))
        .filter((q) => q.eq(q.field("isActive"), true))
        .collect();

      // Get the actual notes for each share
      const sharedNotePromises = shares.map(async (share) => {
        const note = await ctx.db.get(share.noteId);
        if (!note) return null;

        // Apply filters to shared notes
        if (filters.type && note.type !== filters.type) return null;
        if (filters.important !== undefined && note.important !== filters.important) return null;
        if (filters.tags?.length) {
          const hasMatchingTag = filters.tags.some(tag => note.tags.includes(tag));
          if (!hasMatchingTag) return null;
        }

        return note;
      });

      const resolvedSharedNotes = await Promise.all(sharedNotePromises);
      sharedNotes = resolvedSharedNotes.filter(note => note !== null);
    }

    // Combine and sort all notes
    const allNotes = [...ownedNotes, ...sharedNotes];
    
    // Sort by the specified field
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    allNotes.sort((a, b) => {
      const aValue = a._creationTime;
      const bValue = b._creationTime;
      return (aValue - bValue) * sortDirection;
    });

    // Manual pagination since we're combining results
    const startIndex = cursor ? parseInt(cursor) : 0;
    const endIndex = startIndex + limit;
    const paginatedNotes = allNotes.slice(startIndex, endIndex);
    const hasMore = endIndex < allNotes.length;

    return {
      page: paginatedNotes,
      isDone: !hasMore,
      continueCursor: hasMore ? endIndex.toString() : null,
      nextCursor: hasMore ? endIndex.toString() : null,
    };
  },
});

/**
 * Get a single note by ID with proper authorization (including shared notes)
 * @param noteId - The ID of the note to retrieve
 * @param userId - The ID of the user making the request (for auth)
 */
export const getNote = query({
  args: {
    noteId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, { noteId, userId }) => {
    try {
      const note = await ctx.db.get(noteId as Id<"notes">);
      
      if (!note) {
        return null;
      }

      // Check if user owns the note
      if (note.userId === userId) {
        return note;
      }

      // Check if note is shared with user
      const shareRecord = await ctx.db
        .query("shared_notes")
        .withIndex("by_note_user", (q) => 
          q.eq("noteId", noteId as Id<"notes">).eq("sharedWithUserId", userId)
        )
        .filter((q) => q.eq(q.field("isActive"), true))
        .unique();

      if (shareRecord) {
        return note;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching note:', error);
      return null;
    }
  },
});

/**
 * Get a single note by ID with permission information
 * @param noteId - The ID of the note to retrieve
 * @param userId - The ID of the user making the request (for auth)
 */
export const getNoteWithPermissions = query({
  args: {
    noteId: v.string(),
    userId: v.string(),
  },
  returns: v.union(
    v.null(),
    v.object({
      note: v.any(), // The note object
      permission: v.union(
        v.literal("owner"),
        v.literal("read"),
        v.literal("edit")
      ),
      isReadOnly: v.boolean(),
    })
  ),
  handler: async (ctx, { noteId, userId }) => {
    try {
      const note = await ctx.db.get(noteId as Id<"notes">);
      
      if (!note) {
        return null;
      }

      // Check if user owns the note
      if (note.userId === userId) {
        return {
          note,
          permission: "owner" as const,
          isReadOnly: false,
        };
      }

      // Check if note is shared with user
      const shareRecord = await ctx.db
        .query("shared_notes")
        .withIndex("by_note_user", (q) => 
          q.eq("noteId", noteId as Id<"notes">).eq("sharedWithUserId", userId)
        )
        .filter((q) => q.eq(q.field("isActive"), true))
        .unique();

      if (shareRecord) {
        const isReadOnly = shareRecord.permission !== "edit";
        
        return {
          note,
          permission: shareRecord.permission,
          isReadOnly,
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching note with permissions:', error);
      return null;
    }
  },
});

/**
 * Get all notes connected to a specific widget
 * @param widgetId - The widget ID to filter notes by
 * @param userId - The user ID for authorization
 */
export const getNotesByWidgetId = query({
  args: {
    widgetId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, { widgetId, userId }) => {
    try {
      const notes = await ctx.db
        .query("notes")
        .withIndex("by_widget", (q) => q.eq("widgetId", widgetId))
        .filter((q) => q.eq(q.field("userId"), userId))
        .order("desc")
        .collect();
      
      return notes;
    } catch (error) {
      console.error('Error fetching notes by widgetId:', error);
      return [];
    }
  },
});

/**
 * Get multiple notes by their IDs (batch fetch for context enrichment)
 * @param noteIds - Array of note IDs to fetch
 * @param userId - The user ID for authorization
 */
export const getMultiple = query({
  args: {
    noteIds: v.array(v.id("notes")),
    userId: v.string(),
  },
  handler: async (ctx, { noteIds, userId }) => {
    try {
      // Fetch all notes in parallel
      const notePromises = noteIds.map(noteId => ctx.db.get(noteId));
      const notes = await Promise.all(notePromises);
      
      // Filter out null values and check authorization
      const authorizedNotes = await Promise.all(
        notes.map(async (note) => {
          if (!note) return null;
          
          // Check if user owns the note
          if (note.userId === userId) {
            return note;
          }
          
          // Check if note is shared with user
          const shareRecord = await ctx.db
            .query("shared_notes")
            .withIndex("by_note_user", (q) => 
              q.eq("noteId", note._id).eq("sharedWithUserId", userId)
            )
            .filter((q) => q.eq(q.field("isActive"), true))
            .unique();
          
          if (shareRecord) {
            return note;
          }
          
          return null;
        })
      );
      
      // Filter out nulls and return
      return authorizedNotes.filter(note => note !== null);
    } catch (error) {
      console.error('Error fetching multiple notes:', error);
      return [];
    }
  },
});

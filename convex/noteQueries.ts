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
 * @param userId - The ID of the user to get notes for
 * @param cursor - Optional cursor for pagination
 * @param numItems - Number of items to fetch (default: 20, max: 50)
 * @param sortField - Field to sort by (default: '_creationTime')
 * @param sortOrder - Sort order ('asc' or 'desc', default: 'desc')
 * @param filters - Optional filters to apply
 */
export const getUserNotes = query({
  args: {
    userId: v.string(),
    cursor: v.optional(v.string()),
    numItems: v.optional(v.number()),
    sortField: v.optional(v.string()),
    sortOrder: v.optional(v.union(v.literal('asc'), v.literal('desc'))),
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
      filters = {}
    } = args;

    // Validate and sanitize input
    const limit = Math.min(Math.max(1, numItems), 50); // Enforce reasonable limits
    
    // Start building the query with user index
    let query = ctx.db
      .query("notes")
      .withIndex("by_user", (q) => q.eq("userId", userId));

    // Apply type filter if provided
    if (filters.type) {
      const type = filters.type;
      query = query.filter((q) => q.eq(q.field('type'), type));
    }
    
    // Apply importance filter if provided
    if (filters.important !== undefined) {
      query = query.filter((q) => q.eq(q.field('important'), filters.important));
    }
    
    // Apply tags filter if provided
    if (filters.tags?.length) {
      // For tags, we need to check if any of the tags are in the note's tags array
      const tags = filters.tags;
      query = query.filter((q) => 
        q.or(
          ...tags.map(tag => 
            q.eq(q.field('tags'), [tag]) // Wrap tag in array to match the array type
          )
        )
      );
    }

    // Apply sorting and pagination
    const sortDirection = sortOrder === 'asc' ? 'asc' : 'desc';
    const results = await query
      .order(sortDirection)
      .paginate({
        numItems: limit,
        cursor: cursor ? JSON.parse(cursor) : undefined,
      });

    return {
      ...results,
      nextCursor: results.continueCursor ? JSON.stringify(results.continueCursor) : null,
    };
  },
});

/**
 * Get a single note by ID with proper authorization
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
      
      // Verify ownership
      if (!note || note.userId !== userId) {
        return null;
      }
      
      return note;
    } catch (error) {
      console.error('Error fetching note:', error);
      return null;
    }
  },
});

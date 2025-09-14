import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// In-memory presence storage (ephemeral, no database persistence)
const presenceData = new Map<string, Map<string, any>>();

/**
 * Update user presence for a specific note
 * This is ephemeral data that doesn't persist to the database
 */
export const updatePresence = mutation({
  args: {
    noteId: v.string(),
    userId: v.string(),
    userName: v.string(),
    userColor: v.string(),
    cursorPosition: v.number(),
    selectionRange: v.optional(v.object({
      start: v.number(),
      end: v.number(),
    })),
    isTyping: v.boolean(),
    scrollPosition: v.number(),
    viewport: v.object({
      top: v.number(),
      bottom: v.number(),
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { noteId, userId, ...presenceInfo } = args;
    
    // Get or create note presence map
    if (!presenceData.has(noteId)) {
      presenceData.set(noteId, new Map());
    }
    
    const notePresence = presenceData.get(noteId)!;
    
    // Update user presence with timestamp
    notePresence.set(userId, {
      ...presenceInfo,
      userId,
      lastSeen: Date.now(),
    });
    
    // Clean up stale presence data (older than 30 seconds)
    const staleThreshold = Date.now() - 30000;
    for (const [id, presence] of notePresence) {
      if (presence.lastSeen < staleThreshold) {
        notePresence.delete(id);
      }
    }
    
    // If note has no active users, remove it entirely
    if (notePresence.size === 0) {
      presenceData.delete(noteId);
    }
    
    return null;
  },
});

/**
 * Remove user presence when they disconnect
 */
export const removePresence = mutation({
  args: {
    noteId: v.string(),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { noteId, userId } = args;
    
    const notePresence = presenceData.get(noteId);
    if (notePresence) {
      notePresence.delete(userId);
      
      // If note has no active users, remove it entirely
      if (notePresence.size === 0) {
        presenceData.delete(noteId);
      }
    }
    
    return null;
  },
});

/**
 * Get all active users for a specific note
 * This query will automatically update clients via subscription
 */
export const getPresence = query({
  args: {
    noteId: v.string(),
  },
  returns: v.array(v.object({
    userId: v.string(),
    userName: v.string(),
    userColor: v.string(),
    cursorPosition: v.number(),
    selectionRange: v.optional(v.object({
      start: v.number(),
      end: v.number(),
    })),
    isTyping: v.boolean(),
    lastSeen: v.number(),
    scrollPosition: v.number(),
    viewport: v.object({
      top: v.number(),
      bottom: v.number(),
    }),
  })),
  handler: async (ctx, args) => {
    const { noteId } = args;
    
    const notePresence = presenceData.get(noteId);
    if (!notePresence) {
      return [];
    }
    
    // Clean up stale presence data before returning
    const staleThreshold = Date.now() - 30000;
    const activeUsers = [];
    
    for (const [userId, presence] of notePresence) {
      if (presence.lastSeen >= staleThreshold) {
        activeUsers.push(presence);
      } else {
        notePresence.delete(userId);
      }
    }
    
    // If note has no active users after cleanup, remove it entirely
    if (notePresence.size === 0) {
      presenceData.delete(noteId);
    }
    
    return activeUsers;
  },
});

/**
 * Get presence statistics for multiple notes
 * Useful for showing active user counts in note lists
 */
export const getPresenceStats = query({
  args: {
    noteIds: v.array(v.string()),
  },
  returns: v.array(v.object({
    noteId: v.string(),
    activeUserCount: v.number(),
    activeUsers: v.array(v.object({
      userId: v.string(),
      userName: v.string(),
      userColor: v.string(),
    })),
  })),
  handler: async (ctx, args) => {
    const { noteIds } = args;
    const stats = [];
    
    const staleThreshold = Date.now() - 30000;
    
    for (const noteId of noteIds) {
      const notePresence = presenceData.get(noteId);
      if (!notePresence) {
        stats.push({
          noteId,
          activeUserCount: 0,
          activeUsers: [],
        });
        continue;
      }
      
      const activeUsers = [];
      for (const [userId, presence] of notePresence) {
        if (presence.lastSeen >= staleThreshold) {
          activeUsers.push({
            userId: presence.userId,
            userName: presence.userName,
            userColor: presence.userColor,
          });
        } else {
          notePresence.delete(userId);
        }
      }
      
      // If note has no active users after cleanup, remove it entirely
      if (notePresence.size === 0) {
        presenceData.delete(noteId);
      }
      
      stats.push({
        noteId,
        activeUserCount: activeUsers.length,
        activeUsers,
      });
    }
    
    return stats;
  },
});

/**
 * Cleanup stale presence data across all notes
 * This can be called periodically to maintain clean state
 */
export const cleanupStalePresence = mutation({
  args: {},
  returns: v.object({
    cleanedNotes: v.number(),
    cleanedUsers: v.number(),
  }),
  handler: async (ctx, args) => {
    const staleThreshold = Date.now() - 30000;
    let cleanedNotes = 0;
    let cleanedUsers = 0;
    
    for (const [noteId, notePresence] of presenceData) {
      const initialSize = notePresence.size;
      
      for (const [userId, presence] of notePresence) {
        if (presence.lastSeen < staleThreshold) {
          notePresence.delete(userId);
          cleanedUsers++;
        }
      }
      
      // If note has no active users, remove it entirely
      if (notePresence.size === 0) {
        presenceData.delete(noteId);
        cleanedNotes++;
      }
    }
    
    return {
      cleanedNotes,
      cleanedUsers,
    };
  },
});

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// In-memory presence storage (ephemeral, no database persistence)
const projectPresenceData = new Map<string, Map<string, any>>();

/**
 * Update user presence for a specific project
 * This is ephemeral data that doesn't persist to the database
 */
export const updateProjectPresence = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    userName: v.string(),
    userColor: v.string(),
    currentView: v.optional(v.string()),
    currentItemId: v.optional(v.string()),
    isActive: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { projectId, userId, ...presenceInfo } = args;
    
    // Get or create project presence map
    if (!projectPresenceData.has(projectId)) {
      projectPresenceData.set(projectId, new Map());
    }
    
    const projectPresence = projectPresenceData.get(projectId)!;
    
    // Update user presence with timestamp
    projectPresence.set(userId, {
      ...presenceInfo,
      userId,
      lastSeen: Date.now(),
    });
    
    // Clean up stale presence data (older than 30 seconds)
    const staleThreshold = Date.now() - 30000;
    for (const [id, presence] of projectPresence) {
      if (presence.lastSeen < staleThreshold) {
        projectPresence.delete(id);
      }
    }
    
    // If project has no active users, remove it entirely
    if (projectPresence.size === 0) {
      projectPresenceData.delete(projectId);
    }
    
    return null;
  },
});

/**
 * Remove user presence when they disconnect
 */
export const removeProjectPresence = mutation({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const { projectId, userId } = args;
    
    const projectPresence = projectPresenceData.get(projectId);
    if (projectPresence) {
      projectPresence.delete(userId);
      
      // If project has no active users, remove it entirely
      if (projectPresence.size === 0) {
        projectPresenceData.delete(projectId);
      }
    }
    
    return null;
  },
});

/**
 * Get all active users for a specific project
 * This query will automatically update clients via subscription
 */
export const getProjectPresence = query({
  args: {
    projectId: v.id("projects"),
  },
  returns: v.array(v.object({
    userId: v.string(),
    userName: v.string(),
    userColor: v.string(),
    currentView: v.optional(v.string()),
    currentItemId: v.optional(v.string()),
    isActive: v.boolean(),
    lastSeen: v.number(),
  })),
  handler: async (ctx, args) => {
    const { projectId } = args;
    
    const projectPresence = projectPresenceData.get(projectId);
    if (!projectPresence) {
      return [];
    }
    
    // Clean up stale presence data before returning
    const staleThreshold = Date.now() - 30000;
    const activeUsers = [];
    
    for (const [userId, presence] of projectPresence) {
      if (presence.lastSeen >= staleThreshold) {
        activeUsers.push(presence);
      } else {
        projectPresence.delete(userId);
      }
    }
    
    // If project has no active users after cleanup, remove it entirely
    if (projectPresence.size === 0) {
      projectPresenceData.delete(projectId);
    }
    
    return activeUsers;
  },
});


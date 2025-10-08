/**
 * Project Content Queries
 * 
 * Provides efficient batch fetching of all content types attached to projects.
 * Implements user isolation and content type filtering for the Project Content Display feature.
 */

import { v } from "convex/values";
import { query, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";

/**
 * Unified content item type for consistent display across all content types
 */
export interface ProjectContentItem {
  id: string;
  type: "note" | "conversation" | "crystal" | "shard";
  title: string;
  content?: string;
  preview?: string;
  metadata: {
    createdAt: number;
    updatedAt: number;
    userId: string;
    [key: string]: any;
  };
  projectId: string;
}

/**
 * Content type filter for tabbed interface
 */
export type ContentTypeFilter = "all" | "notes" | "conversations" | "crystals" | "shards";

/**
 * Batch fetch all content attached to a project with user isolation
 * 
 * Returns unified content structure with type discrimination for the Project Content Display.
 * Optimized for performance with batch operations, pagination, and proper indexing.
 * 
 * @param projectId - Project ID to fetch content for
 * @param userId - User ID for ownership validation and isolation
 * @param contentType - Optional filter for specific content type
 * @param limit - Maximum number of items to return (default: 50, max: 100)
 * @param offset - Number of items to skip for pagination (default: 0)
 * @returns Array of unified content items with metadata
 */
export const getProjectContent = query({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    contentType: v.optional(v.union(
      v.literal("all"),
      v.literal("notes"),
      v.literal("conversations"),
      v.literal("crystals"),
      v.literal("shards")
    )),
    limit: v.optional(v.number()),
    offset: v.optional(v.number())
  },
  returns: v.object({
    items: v.array(v.any()),
    totalCount: v.number(),
    hasMore: v.boolean(),
    nextOffset: v.optional(v.number())
  }),
  handler: async (ctx, { projectId, userId, contentType = "all", limit = 50, offset = 0 }) => {
    // First validate project ownership
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) {
      console.warn(`[PROJECT CONTENT] Project ${projectId} not found or user ${userId} not authorized`);
      return {
        items: [],
        totalCount: 0,
        hasMore: false
      };
    }

    const contentItems: ProjectContentItem[] = [];
    const maxLimit = Math.min(limit, 100); // Cap at 100 for performance
    const currentOffset = Math.max(offset, 0);

    try {
      // Fetch content based on type filter
      if (contentType === "all" || contentType === "notes") {
        const noteIds = project.noteIds || [];
        const noteLimit = contentType === "notes" ? maxLimit : Math.floor(maxLimit / 4);
        
        for (const noteId of noteIds.slice(0, noteLimit)) {
          try {
            const note = await ctx.db.get(noteId as Id<"notes">);
            if (note && note.userId === userId) {
              contentItems.push({
                id: note._id,
                type: "note",
                title: note.title,
                content: note.content,
                preview: note.content?.substring(0, 150) + (note.content && note.content.length > 150 ? "..." : ""),
                metadata: {
                  createdAt: note.createdAt,
                  updatedAt: note.updatedAt,
                  userId: note.userId,
                  type: note.type,
                  important: note.important,
                  tags: note.tags,
                  platform: note.platform,
                  folderId: note.folderId
                },
                projectId: project._id
              });
            }
          } catch (error) {
            console.warn(`[PROJECT CONTENT] Error fetching note ${noteId}:`, error);
            continue;
          }
        }
      }

      if (contentType === "all" || contentType === "conversations") {
        const conversationIds = project.conversationIds || [];
        const conversationLimit = contentType === "conversations" ? maxLimit : Math.floor(maxLimit / 4);
        
        for (const conversationId of conversationIds.slice(0, conversationLimit)) {
          try {
            const conversation = await ctx.db.get(conversationId as Id<"conversations">);
            if (conversation && conversation.userId === userId) {
              contentItems.push({
                id: conversation._id,
                type: "conversation",
                title: conversation.title,
                content: undefined, // Conversations don't have direct content
                preview: `Conversation with ${conversation.messageCount || 0} messages`,
                metadata: {
                  createdAt: conversation.createdAt,
                  updatedAt: conversation.updatedAt,
                  userId: conversation.userId,
                  messageCount: conversation.messageCount,
                  lastMessageAt: conversation.lastMessageAt,
                  starred: conversation.starred,
                  conversationType: conversation.conversationType,
                  widgetId: conversation.widgetId
                },
                projectId: project._id
              });
            }
          } catch (error) {
            console.warn(`[PROJECT CONTENT] Error fetching conversation ${conversationId}:`, error);
            continue;
          }
        }
      }

      if (contentType === "all" || contentType === "crystals") {
        const crystalIds = project.crystalIds || [];
        const crystalLimit = contentType === "crystals" ? maxLimit : Math.floor(maxLimit / 4);
        
        for (const crystalId of crystalIds.slice(0, crystalLimit)) {
          try {
            // Search for crystal by crystal_id field (not Convex ID)
            const crystal = await ctx.db
              .query("crystals")
              .withIndex("by_user", (q) => q.eq("userId", userId))
              .filter((q) => q.eq(q.field("crystal_id"), crystalId))
              .first();
              
            if (crystal) {
              contentItems.push({
                id: crystal._id,
                type: "crystal",
                title: crystal.name,
                content: crystal.description || crystal.core_insight,
                preview: (crystal.description || crystal.core_insight || "")?.substring(0, 150) + 
                        ((crystal.description || crystal.core_insight) && (crystal.description || crystal.core_insight)!.length > 150 ? "..." : ""),
                metadata: {
                  createdAt: crystal.createdAt,
                  updatedAt: crystal.updatedAt,
                  userId: crystal.userId,
                  crystal_id: crystal.crystal_id,
                  crystal_type: crystal.crystal_type,
                  dimension: crystal.dimension,
                  confidence_score: crystal.confidence_score,
                  evidence_strength: crystal.evidence_strength,
                  tags: crystal.tags,
                  usage_count: crystal.usage_count
                },
                projectId: project._id
              });
            }
          } catch (error) {
            console.warn(`[PROJECT CONTENT] Error fetching crystal ${crystalId}:`, error);
            continue;
          }
        }
      }

      if (contentType === "all" || contentType === "shards") {
        const shardIds = project.shardIds || [];
        const shardLimit = contentType === "shards" ? maxLimit : Math.floor(maxLimit / 4);
        
        for (const shardId of shardIds.slice(0, shardLimit)) {
          try {
            const shard = await ctx.db.get(shardId as Id<"crystal_shards">);
            if (shard && shard.userId === userId) {
              contentItems.push({
                id: shard._id,
                type: "shard",
                title: shard.what_it_reveals || shard.dimension || "Crystal Shard",
                content: shard.exact_quote || shard.what_it_reveals,
                preview: (shard.exact_quote || shard.what_it_reveals || "")?.substring(0, 150) + 
                        ((shard.exact_quote || shard.what_it_reveals) && (shard.exact_quote || shard.what_it_reveals)!.length > 150 ? "..." : ""),
                metadata: {
                  createdAt: shard.createdAt,
                  updatedAt: shard.updatedAt,
                  userId: shard.userId,
                  dimension: shard.dimension,
                  confidence_level: shard.confidence_level,
                  linguistic_intensity: shard.linguistic_intensity,
                  emotional_weight: shard.emotional_weight,
                  specificity: shard.specificity,
                  source: shard.source,
                  source_type: shard.source_type,
                  shard_status: shard.shard_status
                },
                projectId: project._id
              });
            }
          } catch (error) {
            console.warn(`[PROJECT CONTENT] Error fetching shard ${shardId}:`, error);
            continue;
          }
        }
      }

      // Sort by creation date (most recent first)
      contentItems.sort((a, b) => b.metadata.createdAt - a.metadata.createdAt);

      // Apply pagination
      const totalCount = contentItems.length;
      const paginatedItems = contentItems.slice(currentOffset, currentOffset + maxLimit);
      const hasMore = currentOffset + maxLimit < totalCount;
      const nextOffset = hasMore ? currentOffset + maxLimit : undefined;

      console.log(`[PROJECT CONTENT] Successfully fetched ${paginatedItems.length}/${totalCount} content items for project ${projectId}`);
      
      return {
        items: paginatedItems,
        totalCount,
        hasMore,
        nextOffset
      };

    } catch (error) {
      console.error(`[PROJECT CONTENT] Error fetching content for project ${projectId}:`, error);
      return {
        items: [],
        totalCount: 0,
        hasMore: false
      };
    }
  }
});

/**
 * Get content counts by type for a project
 * 
 * Returns count statistics for each content type, useful for tab badges
 * and content overview displays.
 * 
 * @param projectId - Project ID to get counts for
 * @param userId - User ID for ownership validation
 * @returns Object with counts for each content type
 */
export const getProjectContentCounts = query({
  args: {
    projectId: v.id("projects"),
    userId: v.string()
  },
  returns: v.object({
    all: v.number(),
    notes: v.number(),
    conversations: v.number(),
    crystals: v.number(),
    shards: v.number()
  }),
  handler: async (ctx, { projectId, userId }) => {
    // Validate project ownership
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) {
      return {
        all: 0,
        notes: 0,
        conversations: 0,
        crystals: 0,
        shards: 0
      };
    }

    // Count existing content arrays
    const noteCount = (project.noteIds || []).length;
    const conversationCount = (project.conversationIds || []).length;
    const crystalCount = (project.crystalIds || []).length;
    const shardCount = (project.shardIds || []).length;
    const allCount = noteCount + conversationCount + crystalCount + shardCount;

    return {
      all: allCount,
      notes: noteCount,
      conversations: conversationCount,
      crystals: crystalCount,
      shards: shardCount
    };
  }
});

/**
 * Internal query to get content metadata without full content
 * 
 * Used internally for quick metadata retrieval and validation.
 * Returns lightweight metadata objects for performance.
 * 
 * @param projectId - Project ID to get metadata for
 * @param userId - User ID for ownership validation
 * @param contentType - Content type to get metadata for
 * @returns Array of metadata objects
 */
export const getProjectContentMetadata = internalQuery({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    contentType: v.union(
      v.literal("notes"),
      v.literal("conversations"),
      v.literal("crystals"),
      v.literal("shards")
    )
  },
  returns: v.array(v.any()),
  handler: async (ctx, { projectId, userId, contentType }) => {
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) {
      return [];
    }

    const metadata = [];

    try {
      switch (contentType) {
        case "notes":
          const noteIds = project.noteIds || [];
          for (const noteId of noteIds) {
            try {
              const note = await ctx.db.get(noteId as Id<"notes">);
              if (note && note.userId === userId) {
                metadata.push({
                  id: note._id,
                  type: "note",
                  title: note.title,
                  createdAt: note.createdAt,
                  updatedAt: note.updatedAt,
                  important: note.important,
                  noteType: note.type
                });
              }
            } catch (error) {
              continue;
            }
          }
          break;

        case "conversations":
          const conversationIds = project.conversationIds || [];
          for (const conversationId of conversationIds) {
            try {
              const conversation = await ctx.db.get(conversationId as Id<"conversations">);
              if (conversation && conversation.userId === userId) {
                metadata.push({
                  id: conversation._id,
                  type: "conversation",
                  title: conversation.title,
                  createdAt: conversation.createdAt,
                  updatedAt: conversation.updatedAt,
                  messageCount: conversation.messageCount,
                  starred: conversation.starred
                });
              }
            } catch (error) {
              continue;
            }
          }
          break;

        case "crystals":
          const crystalIds = project.crystalIds || [];
          for (const crystalId of crystalIds) {
            try {
              const crystal = await ctx.db
                .query("crystals")
                .withIndex("by_user", (q) => q.eq("userId", userId))
                .filter((q) => q.eq(q.field("crystal_id"), crystalId))
                .first();
                
              if (crystal) {
                metadata.push({
                  id: crystal._id,
                  type: "crystal",
                  title: crystal.name,
                  createdAt: crystal.createdAt,
                  updatedAt: crystal.updatedAt,
                  dimension: crystal.dimension,
                  confidence_score: crystal.confidence_score
                });
              }
            } catch (error) {
              continue;
            }
          }
          break;

        case "shards":
          const shardIds = project.shardIds || [];
          for (const shardId of shardIds) {
            try {
              const shard = await ctx.db.get(shardId as Id<"crystal_shards">);
              if (shard && shard.userId === userId) {
                metadata.push({
                  id: shard._id,
                  type: "shard",
                  title: shard.what_it_reveals || shard.dimension || "Crystal Shard",
                  createdAt: shard.createdAt,
                  updatedAt: shard.updatedAt,
                  dimension: shard.dimension,
                  confidence_level: shard.confidence_level
                });
              }
            } catch (error) {
              continue;
            }
          }
          break;
      }

      return metadata;
    } catch (error) {
      console.error(`[PROJECT CONTENT METADATA] Error fetching metadata:`, error);
      return [];
    }
  }
});

/**
 * Search content within a project
 * 
 * Performs text search across all content types in a project.
 * Searches titles, content, and metadata fields.
 * 
 * @param projectId - Project ID to search within
 * @param userId - User ID for ownership validation
 * @param searchTerm - Search term to look for
 * @param contentType - Optional content type filter
 * @param limit - Maximum results to return
 * @returns Array of matching content items
 */
export const searchProjectContent = query({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    searchTerm: v.string(),
    contentType: v.optional(v.union(
      v.literal("all"),
      v.literal("notes"),
      v.literal("conversations"),
      v.literal("crystals"),
      v.literal("shards")
    )),
    limit: v.optional(v.number())
  },
  returns: v.array(v.any()),
  handler: async (ctx, { projectId, userId, searchTerm, contentType = "all", limit = 20 }) => {
    // Get all content first using internal query
    const contentResult = await ctx.runQuery(api.projectContentQueries.getProjectContent, { 
      projectId, 
      userId, 
      contentType, 
      limit: 200 // Get more for searching
    });

    if (!searchTerm.trim()) {
      return contentResult.items.slice(0, limit);
    }

    const searchLower = searchTerm.toLowerCase();
    
    // Filter content based on search term
    const filteredContent = contentResult.items.filter(item => {
      const titleMatch = item.title?.toLowerCase().includes(searchLower);
      const contentMatch = item.content?.toLowerCase().includes(searchLower);
      const previewMatch = item.preview?.toLowerCase().includes(searchLower);
      
      // Search in metadata fields
      const metadataMatch = Object.values(item.metadata).some(value => 
        typeof value === 'string' && value.toLowerCase().includes(searchLower)
      );
      
      return titleMatch || contentMatch || previewMatch || metadataMatch;
    });

    return filteredContent.slice(0, limit);
  }
});

/**
 * Virtual scrolling query for large content sets
 * 
 * Optimized query for virtual scrolling implementations.
 * Returns content in chunks with minimal data for performance.
 * 
 * @param projectId - Project ID to fetch content for
 * @param userId - User ID for ownership validation
 * @param contentType - Content type filter
 * @param startIndex - Starting index for virtual scrolling
 * @param endIndex - Ending index for virtual scrolling
 * @returns Minimal content data for virtual scrolling
 */
export const getProjectContentVirtual = query({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
    contentType: v.optional(v.union(
      v.literal("all"),
      v.literal("notes"),
      v.literal("conversations"),
      v.literal("crystals"),
      v.literal("shards")
    )),
    startIndex: v.number(),
    endIndex: v.number()
  },
  returns: v.object({
    items: v.array(v.any()),
    totalCount: v.number()
  }),
  handler: async (ctx, { projectId, userId, contentType = "all", startIndex, endIndex }) => {
    // Validate project ownership
    const project = await ctx.db.get(projectId);
    if (!project || project.userId !== userId) {
      return {
        items: [],
        totalCount: 0
      };
    }

    // Get all content IDs first (lightweight operation)
    let allIds: string[] = [];
    
    if (contentType === "all" || contentType === "notes") {
      allIds = allIds.concat(project.noteIds || []);
    }
    if (contentType === "all" || contentType === "conversations") {
      allIds = allIds.concat(project.conversationIds || []);
    }
    if (contentType === "all" || contentType === "crystals") {
      allIds = allIds.concat(project.crystalIds || []);
    }
    if (contentType === "all" || contentType === "shards") {
      allIds = allIds.concat(project.shardIds || []);
    }

    const totalCount = allIds.length;
    const requestedIds = allIds.slice(startIndex, endIndex);
    
    // Fetch minimal data for requested items only
    const items = [];
    
    for (const id of requestedIds) {
      try {
        // Determine content type by checking which array it belongs to
        let item = null;
        
        if ((project.noteIds || []).includes(id)) {
          item = await ctx.db.get(id as Id<"notes">);
          if (item && item.userId === userId) {
            items.push({
              id: item._id,
              type: "note",
              title: item.title,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt
            });
          }
        } else if ((project.conversationIds || []).includes(id)) {
          item = await ctx.db.get(id as Id<"conversations">);
          if (item && item.userId === userId) {
            items.push({
              id: item._id,
              type: "conversation",
              title: item.title,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt
            });
          }
        } else if ((project.crystalIds || []).includes(id)) {
          // For crystals, search by crystal_id
          const crystal = await ctx.db
            .query("crystals")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .filter((q) => q.eq(q.field("crystal_id"), id))
            .first();
            
          if (crystal) {
            items.push({
              id: crystal._id,
              type: "crystal",
              title: crystal.name,
              createdAt: crystal.createdAt,
              updatedAt: crystal.updatedAt
            });
          }
        } else if ((project.shardIds || []).includes(id)) {
          item = await ctx.db.get(id as Id<"crystal_shards">);
          if (item && item.userId === userId) {
            items.push({
              id: item._id,
              type: "shard",
              title: item.what_it_reveals || item.dimension || "Crystal Shard",
              createdAt: item.createdAt,
              updatedAt: item.updatedAt
            });
          }
        }
      } catch (error) {
        console.warn(`[VIRTUAL SCROLLING] Error fetching item ${id}:`, error);
        continue;
      }
    }

    return {
      items,
      totalCount
    };
  }
});

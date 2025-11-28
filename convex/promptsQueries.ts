import { query } from "./_generated/server";
import { v } from "convex/values";
import { promptScopeValidator } from "./types/prompt";

/**
 * Universal Prompt System - Queries
 * 
 * Discovery and retrieval of prompt blocks.
 * Enables intelligent composition via tag-based querying.
 */

/**
 * Query prompt blocks by tags
 * Returns blocks that match ANY of the provided tags
 */
export const queryPromptsByTags = query({
  args: {
    tags: v.array(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    // Query all prompts (we'll filter in memory since Convex doesn't support array contains)
    const allPrompts = await ctx.db.query("prompts").collect();

    // Filter prompts that have at least one matching tag
    const matchingPrompts = allPrompts.filter((prompt) => {
      return args.tags.some((tag) => prompt.tags.includes(tag));
    });

    // Sort by effectiveness (highest first)
    matchingPrompts.sort((a, b) => {
      const aEffectiveness = a.effectiveness ?? 0;
      const bEffectiveness = b.effectiveness ?? 0;
      return bEffectiveness - aEffectiveness;
    });

    // Return limited results
    return matchingPrompts.slice(0, limit);
  },
});

/**
 * Query prompt blocks by scope and scopeId
 * Returns blocks for a specific context (platform/project/widget)
 */
export const queryPromptsByScope = query({
  args: {
    scope: promptScopeValidator,
    scopeId: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    // Use index for efficient lookup
    const prompts = await ctx.db
      .query("prompts")
      .withIndex("by_scope", (q) => {
        if (args.scopeId) {
          return q.eq("scope", args.scope).eq("scopeId", args.scopeId);
        }
        return q.eq("scope", args.scope);
      })
      .collect();

    // ✅ PATTERN 50: Prompt Versioning - Filter by isActive: true (only return active prompts)
    const activePrompts = prompts.filter((p) => p.isActive !== false); // Default to true for existing prompts without isActive

    return activePrompts.slice(0, limit);
  },
});

/**
 * Get a single prompt block by ID
 */
export const getPromptBlock = query({
  args: {
    promptId: v.id("prompts"),
  },
  handler: async (ctx, args) => {
    const prompt = await ctx.db.get(args.promptId);

    return prompt;
  },
});

/**
 * Get most effective prompt blocks
 * Returns top-performing blocks for learning analysis
 */
export const getMostEffectiveBlocks = query({
  args: {
    limit: v.optional(v.number()),
    minUsageCount: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;
    const minUsage = args.minUsageCount ?? 5;

    // Query by effectiveness index
    const prompts = await ctx.db
      .query("prompts")
      .withIndex("by_effectiveness")
      .order("desc")
      .collect();

    // Filter by minimum usage (only consider blocks with enough data)
    const qualifiedPrompts = prompts.filter(
      (p) => (p.usageCount ?? 0) >= minUsage
    );

    return qualifiedPrompts.slice(0, limit);
  },
});

/**
 * Get block evolution history
 * Returns parent and all child variants
 */
export const getBlockHistory = query({
  args: {
    promptId: v.id("prompts"),
  },
  handler: async (ctx, args) => {
    const prompt = await ctx.db.get(args.promptId);

    if (!prompt) {
      return null;
    }

    // Get parent (if exists)
    let parent = null;
    if (prompt.parentId) {
      parent = await ctx.db.get(prompt.parentId);
    }

    // Get all children (variants forked from this prompt)
    const children = await ctx.db
      .query("prompts")
      .withIndex("by_parent", (q) => q.eq("parentId", args.promptId))
      .collect();

    return {
      prompt,
      parent,
      children,
    };
  },
});

/**
 * Query prompts by scope and tags (combined filter)
 * Most useful for widget execution - finds relevant blocks
 */
export const queryPromptsByScopeAndTags = query({
  args: {
    scope: promptScopeValidator,
    scopeId: v.optional(v.string()),
    tags: v.array(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    // First, get prompts by scope
    let scopePrompts;
    if (args.scopeId) {
      scopePrompts = await ctx.db
        .query("prompts")
        .withIndex("by_scope", (q) =>
          q.eq("scope", args.scope).eq("scopeId", args.scopeId)
        )
        .collect();
    } else {
      scopePrompts = await ctx.db
        .query("prompts")
        .withIndex("by_scope", (q) => q.eq("scope", args.scope))
        .collect();
    }

    // ✅ PATTERN 50: Prompt Versioning - Filter by isActive: true (only return active prompts)
    const activePrompts = scopePrompts.filter((p) => p.isActive !== false); // Default to true for existing prompts without isActive

    // Filter by tags (must match at least one tag)
    const matchingPrompts = activePrompts.filter((prompt) => {
      return args.tags.some((tag) => prompt.tags.includes(tag));
    });

    // Sort by effectiveness
    matchingPrompts.sort((a, b) => {
      const aEffectiveness = a.effectiveness ?? 0;
      const bEffectiveness = b.effectiveness ?? 0;
      return bEffectiveness - aEffectiveness;
    });

    return matchingPrompts.slice(0, limit);
  },
});

/**
 * Get all prompts (for admin/debugging)
 */
export const getAllPrompts = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    const prompts = await ctx.db.query("prompts").take(limit);

    return prompts;
  },
});

/**
 * Search prompts by content (simple text search)
 */
export const searchPromptsByContent = query({
  args: {
    searchTerm: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    const allPrompts = await ctx.db.query("prompts").collect();

    // Simple text search (case-insensitive)
    const searchLower = args.searchTerm.toLowerCase();
    const matching = allPrompts.filter(
      (p) =>
        p.content.toLowerCase().includes(searchLower) ||
        p.description?.toLowerCase().includes(searchLower) ||
        p.tags.some((tag) => tag.toLowerCase().includes(searchLower))
    );

    return matching.slice(0, limit);
  },
});

/**
 * Query prompts by tags for universal prompt engine
 */
export const queryByTags = query({
  args: {
    tags: v.array(v.string()),
    scope: v.optional(v.string()),
    scopeId: v.optional(v.string()),
    effectivenessThreshold: v.optional(v.number()),
  },
  handler: async (ctx, { tags, scope, scopeId, effectivenessThreshold = 0.0 }) => {
    let promptsQuery = ctx.db.query("prompts");
    
    // Filter by scope if provided
    if (scope) {
      promptsQuery = promptsQuery.filter((q) => q.eq(q.field("scope"), scope));
    }
    
    // Filter by scopeId if provided
    if (scopeId) {
      promptsQuery = promptsQuery.filter((q) => q.eq(q.field("scopeId"), scopeId));
    }
    
    // Get all matching prompts
    const allPrompts = await promptsQuery.collect();
    
    // Filter by tags (any tag matches)
    const filtered = allPrompts.filter((prompt) => {
      const promptTags = prompt.tags || [];
      return tags.some((tag) => promptTags.includes(tag));
    });
    
    // Filter by effectiveness threshold
    const effectivePrompts = filtered.filter(
      (p) => (p.effectiveness || 0.5) >= effectivenessThreshold
    );
    
    // Sort by effectiveness (descending)
    const sorted = effectivePrompts.sort(
      (a, b) => (b.effectiveness || 0.5) - (a.effectiveness || 0.5)
    );
    
    return sorted;
  },
});


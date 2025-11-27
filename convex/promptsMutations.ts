import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { promptTypeValidator, promptScopeValidator } from "./types/prompt";

/**
 * Universal Prompt System - Mutations
 * 
 * CRUD operations for prompt blocks.
 * Enables creation, updating, and evolution of prompts.
 */

/**
 * Create a new prompt block
 * Following LAW #3: NO auto-generated or system-managed fields in args
 */
export const createPromptBlock = mutation({
  args: {
    // Business data only
    content: v.string(),
    type: promptTypeValidator,
    tags: v.array(v.string()),
    scope: promptScopeValidator,
    scopeId: v.optional(v.string()),
    version: v.string(),
    parentId: v.optional(v.id("prompts")),
    createdBy: v.string(),
    description: v.optional(v.string()),
    // NO effectiveness, usageCount, successRate - handler initializes these
  },
  handler: async (ctx, args) => {
    // ✅ PATTERN 50: Prompt Versioning - Check for existing active prompt with same scope + scopeId + operation
    // Operation is in tags array (e.g., "information_check", "planning", "generation", "validation")
    // Find operation tag from args.tags (it's one of the known operation types)
    const operationTags = ["information_check", "planning", "generation", "validation", "execution", "review"];
    const operationTag = args.tags.find(tag => operationTags.includes(tag));
    
    if (operationTag && args.scopeId) {
      // Query existing prompts with same scope + scopeId
      let existingPrompts;
      if (args.scopeId) {
        existingPrompts = await ctx.db
          .query("prompts")
          .withIndex("by_scope", (q) =>
            q.eq("scope", args.scope).eq("scopeId", args.scopeId)
          )
          .collect();
      } else {
        existingPrompts = await ctx.db
          .query("prompts")
          .withIndex("by_scope", (q) => q.eq("scope", args.scope))
          .collect();
      }
      
      // Filter by tags containing the operation and isActive: true
      const matchingActivePrompts = existingPrompts.filter((prompt) => {
        const hasOperation = prompt.tags.includes(operationTag);
        const isActive = prompt.isActive !== false; // Default to true for existing prompts without isActive
        return hasOperation && isActive;
      });
      
      // Mark old active prompts as inactive
      for (const oldPrompt of matchingActivePrompts) {
        await ctx.db.patch(oldPrompt._id, { isActive: false });
      }
    }
    
    const promptId = await ctx.db.insert("prompts", {
      // Business data from args
      content: args.content,
      type: args.type,
      tags: args.tags,
      scope: args.scope,
      scopeId: args.scopeId,
      version: args.version,
      parentId: args.parentId,
      createdBy: args.createdBy,
      description: args.description,
      // System metrics initialized by handler
      effectiveness: 1.0,  // Baseline effectiveness
      usageCount: 0,       // New block, no usage
      successRate: 1.0,    // Start optimistic
      isActive: true,      // New prompt is active
    });

    return promptId;
  },
});

/**
 * Update an existing prompt block
 */
export const updatePromptBlock = mutation({
  args: {
    promptId: v.id("prompts"),
    content: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    description: v.optional(v.string()),
    effectiveness: v.optional(v.number()),
    version: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { promptId, ...updates } = args;

    await ctx.db.patch(promptId, updates);

    return promptId;
  },
});

/**
 * Update effectiveness metrics for a prompt block
 * Called after widget executions to track learning
 */
export const updateEffectiveness = mutation({
  args: {
    promptId: v.id("prompts"),
    executionSuccess: v.boolean(),
    usageIncrement: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const prompt = await ctx.db.get(args.promptId);

    if (!prompt) {
      throw new Error(`Prompt ${args.promptId} not found`);
    }

    // Update usage count
    const newUsageCount = (prompt.usageCount ?? 0) + (args.usageIncrement ?? 1);

    // Calculate new success rate (exponential moving average)
    const alpha = 0.1; // Weight for new data
    const currentSuccess = args.executionSuccess ? 1.0 : 0.0;
    const newSuccessRate =
      alpha * currentSuccess + (1 - alpha) * (prompt.successRate ?? 1.0);

    // Update effectiveness (simple formula: success rate)
    // In future, can incorporate other factors (edit rate, question rate, etc.)
    const newEffectiveness = newSuccessRate;

    await ctx.db.patch(args.promptId, {
      usageCount: newUsageCount,
      successRate: newSuccessRate,
      effectiveness: newEffectiveness,
    });

    return {
      promptId: args.promptId,
      usageCount: newUsageCount,
      successRate: newSuccessRate,
      effectiveness: newEffectiveness,
    };
  },
});

/**
 * Fork (create variant of) an existing prompt block
 * Used for A/B testing and evolution
 */
export const forkPromptBlock = mutation({
  args: {
    parentId: v.id("prompts"),
    content: v.string(), // New content variant
    version: v.string(), // New version number
    createdBy: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const parent = await ctx.db.get(args.parentId);

    if (!parent) {
      throw new Error(`Parent prompt ${args.parentId} not found`);
    }

    // Create child with same tags/scope as parent
    const childId = await ctx.db.insert("prompts", {
      content: args.content,
      type: parent.type,
      tags: parent.tags,
      scope: parent.scope,
      scopeId: parent.scopeId,
      effectiveness: 1.0, // Start fresh
      usageCount: 0,
      successRate: 1.0,
      version: args.version,
      parentId: args.parentId,
      createdBy: args.createdBy,
      description: args.description ?? `Fork of ${parent.version}`,
      isActive: true, // New fork is active
    });

    return childId;
  },
});

/**
 * Delete a prompt block
 */
export const deletePromptBlock = mutation({
  args: {
    promptId: v.id("prompts"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.promptId);

    return { success: true };
  },
});

/**
 * One-time migration: Mark all existing prompts as active
 * Run this once after deploying the isActive field to set default value
 */
export const migratePromptsToActive = mutation({
  args: {},
  handler: async (ctx) => {
    // Get all prompts
    const allPrompts = await ctx.db.query("prompts").collect();
    
    let migratedCount = 0;
    for (const prompt of allPrompts) {
      // Only update prompts that don't have isActive set (undefined or null)
      if (prompt.isActive === undefined || prompt.isActive === null) {
        await ctx.db.patch(prompt._id, { isActive: true });
        migratedCount++;
      }
    }
    
    return {
      success: true,
      totalPrompts: allPrompts.length,
      migratedCount,
      message: `Migrated ${migratedCount} prompts to isActive: true`,
    };
  },
});

/**
 * Batch create prompt blocks
 * Useful for migration from static files
 */
export const batchCreatePromptBlocks = mutation({
  args: {
    prompts: v.array(
      v.object({
        content: v.string(),
        type: promptTypeValidator,
        tags: v.array(v.string()),
        scope: promptScopeValidator,
        scopeId: v.optional(v.string()),
        version: v.string(),
        createdBy: v.string(),
        description: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const promptIds: string[] = [];

    for (const prompt of args.prompts) {
      const promptId = await ctx.db.insert("prompts", {
        ...prompt,
        effectiveness: 1.0,
        usageCount: 0,
        successRate: 1.0,
        isActive: true, // New batch prompts are active
      });

      promptIds.push(promptId);
    }

    return {
      success: true,
      count: promptIds.length,
      promptIds,
    };
  },
});


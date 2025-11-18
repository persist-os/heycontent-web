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
    tool: v.optional(v.string()),  // Optional single tool name (granular, e.g., "send_email", "search_web")
    // NO effectiveness, usageCount, successRate - handler initializes these
  },
  handler: async (ctx, args) => {
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
      tool: args.tool,  // Optional tool name
      // System metrics initialized by handler
      effectiveness: 1.0,  // Baseline effectiveness
      usageCount: 0,       // New block, no usage
      successRate: 1.0,    // Start optimistic
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


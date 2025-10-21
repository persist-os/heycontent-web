/**
 * Convergence Mutations - Write operations for Convergence-optimized configurations
 * 
 * Provides mutations for:
 * - Config creation and updates
 * - Status management (candidate -> active -> archived)
 * - Usage tracking and success rate monitoring
 * - Batch operations for deployment
 * 
 * Used by The Convergence framework to store optimized parameters for:
 * - MAB systems (context enrichment, crystal thresholds, intelligence triggers)
 * - Tool workflows (Reddit tools, search tools, extraction tools)
 * - Agent configurations
 * - Feature-specific parameters
 * 
 * CONFIG LIFECYCLE:
 * 1. Created as "candidate" by optimization run
 * 2. Promoted to "active" when deployed
 * 3. Archived when replaced by better config
 * 
 * USAGE TRACKING:
 * - Records every use with success/failure
 * - Calculates rolling success rate
 * - Tracks last usage timestamp
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { 
  convergenceConfigValidator,
  configStatusValidator 
} from "./types/convergence";

/**
 * Shared handler for config updates with timestamp management
 * 
 * Handles common update operations with proper timestamp tracking.
 * Automatically sets deployed_at, archived_at, and updatedAt based on status changes.
 * 
 * @param ctx - Convex mutation context
 * @param configId - Config ID to update
 * @param updates - Fields to update
 * @param options - Update options
 * @returns Updated config ID
 */
const updateConfigHandler = async (
  ctx: any,
  configId: Id<"convergence_configs">,
  updates: any,
  options: {
    trackStatusChange?: boolean;
  } = {}
) => {
  const now = Date.now();
  const updateData = { ...updates, updatedAt: now };
  
  // Track status-specific timestamps
  if (options.trackStatusChange && updates.status) {
    if (updates.status === "active") {
      updateData.deployed_at = now;
    } else if (updates.status === "archived") {
      updateData.archived_at = now;
    }
  }
  
  await ctx.db.patch(configId, updateData);
  return configId;
};

/**
 * Master function for convergence config mutations
 * 
 * Unified interface for all config operations with operation-based routing.
 * Handles create, update, status changes, and usage tracking.
 * 
 * @example
 * ```typescript
 * // Create new config
 * await mutateConfig({
 *   operation: "create",
 *   data: {
 *     system_name: "context_enrichment",
 *     config_type: "mab_params",
 *     params: { threshold: 0.75 },
 *     score: 0.92,
 *     rank: 1,
 *     ...
 *   }
 * });
 * 
 * // Update status
 * await mutateConfig({
 *   operation: "update_status",
 *   configId: "configId123",
 *   status: "active"
 * });
 * ```
 */
export const mutateConfig = mutation({
  args: {
    operation: v.union(
      v.literal("create"),
      v.literal("update_status"),
      v.literal("record_usage"),
      v.literal("update_metrics"),
      v.literal("archive")
    ),
    configId: v.optional(v.id("convergence_configs")),
    data: v.optional(v.any()),
    status: v.optional(v.union(
      v.literal("candidate"),
      v.literal("active"),
      v.literal("archived")
    )),
    success: v.optional(v.boolean()),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const { operation } = args;
    
    switch (operation) {
      case "create":
        if (!args.data) {
          throw new Error("data required for create operation");
        }
        const now = Date.now();
        const configId = await ctx.db.insert("convergence_configs", {
          ...args.data,
          status: args.data.status || "candidate",
          createdAt: now,
          updatedAt: now,
        });
        return { configId };
      
      case "update_status":
        if (!args.configId || !args.status) {
          throw new Error("configId and status required for update_status operation");
        }
        await updateConfigHandler(ctx, args.configId, { status: args.status }, {
          trackStatusChange: true,
        });
        return { configId: args.configId };
      
      case "record_usage":
        if (!args.configId || args.success === undefined) {
          throw new Error("configId and success required for record_usage operation");
        }
        const config = await ctx.db.get(args.configId);
        if (!config) {
          throw new Error(`Config ${args.configId} not found`);
        }
        const usage_count = (config.usage_count || 0) + 1;
        const prev_success_total = (config.success_rate || 0) * (config.usage_count || 0);
        const new_success_total = args.success ? prev_success_total + 1 : prev_success_total;
        const success_rate = new_success_total / usage_count;
        await updateConfigHandler(ctx, args.configId, {
          usage_count,
          success_rate,
          last_used: Date.now(),
        });
        return { configId: args.configId, usage_count, success_rate };
      
      case "update_metrics":
        if (!args.configId || !args.data) {
          throw new Error("configId and data required for update_metrics operation");
        }
        await updateConfigHandler(ctx, args.configId, {
          metrics: args.data.metrics,
          score: args.data.score,
        });
        return { configId: args.configId };
      
      case "archive":
        if (!args.configId) {
          throw new Error("configId required for archive operation");
        }
        await updateConfigHandler(ctx, args.configId, { status: "archived" }, {
          trackStatusChange: true,
        });
        return { configId: args.configId };
      
      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  },
});

/**
 * Save a Convergence-optimized config (convenience function)
 * 
 * Creates a new configuration with full validation and timestamp management.
 * Typically called by Convergence optimization runs to store results.
 */
export const saveConfig = mutation({
  args: convergenceConfigValidator,
  returns: v.id("convergence_configs"),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const configId = await ctx.db.insert("convergence_configs", {
      system_name: args.system_name,
      config_type: args.config_type,
      params: args.params,
      contextTag: args.contextTag,
      embedding: args.embedding,
      score: args.score,
      rank: args.rank,
      test_cases_passed: args.test_cases_passed,
      test_cases_total: args.test_cases_total,
      optimization_run_id: args.optimization_run_id,
      algorithm_used: args.algorithm_used,
      generation: args.generation,
      metrics: args.metrics,
      status: args.status || "candidate",
      version: args.version,
      replaces_config_id: args.replaces_config_id,
      createdAt: now,
      updatedAt: now,
    });
    
    return configId;
  },
});

/**
 * Batch save multiple configs (for optimization runs)
 * 
 * Efficiently saves multiple configs from a single optimization run.
 * More performant than individual saves when dealing with multiple configs.
 * 
 * @example
 * ```typescript
 * await batchSaveConfigs({
 *   configs: [
 *     { system_name: "context_enrichment", params: {...}, score: 0.92, ... },
 *     { system_name: "context_enrichment", params: {...}, score: 0.89, ... },
 *   ]
 * });
 * ```
 */
export const batchSaveConfigs = mutation({
  args: {
    configs: v.array(convergenceConfigValidator),
  },
  returns: v.object({
    success: v.boolean(),
    config_ids: v.array(v.id("convergence_configs")),
    count: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const config_ids: Id<"convergence_configs">[] = [];
    
    for (const config of args.configs) {
      const configId = await ctx.db.insert("convergence_configs", {
        ...config,
        status: config.status || "candidate",
        createdAt: now,
        updatedAt: now,
      });
      config_ids.push(configId);
    }
    
    return {
      success: true,
      config_ids,
      count: config_ids.length,
    };
  },
});

/**
 * Update config status (candidate -> active -> archived)
 * 
 * Manages config lifecycle transitions with automatic timestamp tracking.
 * Sets deployed_at when activating, archived_at when archiving.
 */
export const updateConfigStatus = mutation({
  args: {
    configId: v.id("convergence_configs"),
    status: configStatusValidator,
  },
  returns: v.id("convergence_configs"),
  handler: async (ctx, args) => {
    return await updateConfigHandler(ctx, args.configId, { status: args.status }, {
      trackStatusChange: true,
    });
  },
});

/**
 * Record config usage with success tracking
 * 
 * Tracks each config usage and maintains rolling success rate.
 * Call this every time a config is used in production to monitor performance.
 */
export const recordConfigUsage = mutation({
  args: {
    configId: v.id("convergence_configs"),
    success: v.boolean(),
  },
  returns: v.id("convergence_configs"),
  handler: async (ctx, args) => {
    const config = await ctx.db.get(args.configId);
    if (!config) {
      throw new Error(`Config ${args.configId} not found`);
    }
    
    const usage_count = (config.usage_count || 0) + 1;
    const prev_success_total = (config.success_rate || 0) * (config.usage_count || 0);
    const new_success_total = args.success ? prev_success_total + 1 : prev_success_total;
    const success_rate = new_success_total / usage_count;
    
    await updateConfigHandler(ctx, args.configId, {
      usage_count,
      success_rate,
      last_used: Date.now(),
    });
    
    return args.configId;
  },
});

/**
 * Promote configs - Archive old active configs and activate new ones
 * 
 * Atomic operation to replace active configs with new optimized versions.
 * Call this after optimization run to deploy new configs.
 * 
 * Process:
 * 1. Archives all currently active configs for the system
 * 2. Activates specified new configs
 * 3. Returns counts for verification
 */
export const promoteConfigs = mutation({
  args: {
    system_name: v.string(),
    new_config_ids: v.array(v.id("convergence_configs")),
  },
  returns: v.object({
    archived_count: v.number(),
    promoted_count: v.number(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    const activeConfigs = await ctx.db
      .query("convergence_configs")
      .withIndex("by_system_status", (q) =>
        q.eq("system_name", args.system_name).eq("status", "active")
      )
      .collect();
    
    for (const config of activeConfigs) {
      await ctx.db.patch(config._id, {
        status: "archived",
        archived_at: now,
        updatedAt: now,
      });
    }
    
    for (const configId of args.new_config_ids) {
      await ctx.db.patch(configId, {
        status: "active",
        deployed_at: now,
        updatedAt: now,
      });
    }
    
    return {
      archived_count: activeConfigs.length,
      promoted_count: args.new_config_ids.length,
    };
  },
});


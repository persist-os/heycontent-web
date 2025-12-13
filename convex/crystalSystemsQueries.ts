/**
 * Crystal OS System Queries
 * 
 * Read-only queries for Crystal OS system state.
 */

import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Get a Crystal OS system by system key.
 * 
 * Args:
 *   systemKey: Unique identifier (format: "user_id:agent_type")
 * 
 * Returns:
 *   System data or null if not found
 */
export const getSystem = query({
  args: {
    systemKey: v.string(),
  },
  handler: async (ctx, { systemKey }) => {
    const system = await ctx.db
      .query("crystalSystems")
      .withIndex("by_systemKey", (q) => q.eq("systemKey", systemKey))
      .first();
    
    if (!system) {
      return null;
    }
    
    // Return system data (excluding _id, _creationTime)
    return {
      config: system.config,
      memory: system.memory,
      evolution: system.evolution,
    };
  },
});


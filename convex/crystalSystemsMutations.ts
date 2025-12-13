/**
 * Crystal OS System Mutations
 * 
 * Handles persistent Crystal OS system state storage.
 * Used by Crystal OS API Extension (Phase 5) for learning and evolution.
 * 
 * Pattern: Follows existing mutation patterns (crystalMutations.ts, cognitiveMutations.ts)
 */

import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import {
  crystalSystemCreateValidator,
  crystalSystemUpdateValidator,
} from "./types/crystalSystem";

/**
 * Save or update a Crystal OS system.
 * 
 * Creates new system if systemKey doesn't exist, updates if it does.
 * 
 * Args:
 *   systemKey: Unique identifier (format: "user_id:agent_type")
 *   systemData: System data (config, memory, evolution)
 * 
 * Returns:
 *   System ID
 */
export const saveSystem = mutation({
  args: {
    systemKey: v.string(),
    systemData: crystalSystemCreateValidator,
  },
  handler: async (ctx, { systemKey, systemData }) => {
    const now = Date.now();
    
    // Check if system exists
    const existing = await ctx.db
      .query("crystalSystems")
      .withIndex("by_systemKey", (q) => q.eq("systemKey", systemKey))
      .first();
    
    if (existing) {
      // Update existing system
      await ctx.db.patch(existing._id, {
        config: systemData.config,
        memory: systemData.memory,
        evolution: systemData.evolution,
        updatedAt: now,
      });
      return existing._id;
    } else {
      // Create new system
      const systemId = await ctx.db.insert("crystalSystems", {
        systemKey,
        userId: systemData.userId,
        agentType: systemData.agentType,
        config: systemData.config,
        memory: systemData.memory,
        evolution: systemData.evolution,
        createdAt: now,
        updatedAt: now,
      });
      return systemId;
    }
  },
});

/**
 * Delete a Crystal OS system.
 * 
 * Args:
 *   systemKey: Unique identifier (format: "user_id:agent_type")
 * 
 * Returns:
 *   true if deleted, false if not found
 */
export const deleteSystem = mutation({
  args: {
    systemKey: v.string(),
  },
  handler: async (ctx, { systemKey }) => {
    const system = await ctx.db
      .query("crystalSystems")
      .withIndex("by_systemKey", (q) => q.eq("systemKey", systemKey))
      .first();
    
    if (!system) {
      return false;
    }
    
    await ctx.db.delete(system._id);
    return true;
  },
});


/**
 * Persona Management Mutations
 * Handles cleanup, deletion, and data management operations
 */

import { v } from "convex/values";
import { mutation } from "./_generated/server";
import {
  generateMutationId,
  logMutationStart,
  logMutationComplete,
  logMutationError
} from "./lib/personaErrorHandling";
import { validateUserId } from "./lib/personaValidation";

/**
 * Clear all persona data for a user (GDPR compliance)
 */
export const clearAllPersonaData = mutation({
  args: {
    userId: v.string(),
    confirmUserId: v.string() // Double confirmation for safety
  },
  returns: v.object({
    success: v.boolean(),
    tracesDeleted: v.number(),
    insightsDeleted: v.number(),
    error: v.optional(v.string())
  }),
  handler: async (ctx, args) => {
    const mutationId = generateMutationId();
    const startTime = Date.now();
    
    logMutationStart(mutationId, "CLEAR-ALL-DATA", {
      userId: args.userId,
      confirmUserId: args.confirmUserId
    });
    
    try {
      // Validate user IDs
      const userValidation = validateUserId(args.userId);
      if (userValidation) {
        return {
          success: false,
          tracesDeleted: 0,
          insightsDeleted: 0,
          error: userValidation.message
        };
      }

      const confirmValidation = validateUserId(args.confirmUserId);
      if (confirmValidation) {
        return {
          success: false,
          tracesDeleted: 0,
          insightsDeleted: 0,
          error: confirmValidation.message
        };
      }

      // Safety check - require double confirmation
      if (args.userId !== args.confirmUserId) {
        throw new Error("User ID confirmation mismatch - operation cancelled for safety");
      }

      // Delete all traces
      const traces = await ctx.db
        .query("persona_traces")
        .withIndex("by_user", (q) => q.eq("user_id", args.userId))
        .collect();

      let tracesDeleted = 0;
      for (const trace of traces) {
        await ctx.db.delete(trace._id);
        tracesDeleted++;
      }

      // Delete all insights
      const insights = await ctx.db
        .query("crystallized_insights")
        .withIndex("by_user", (q) => q.eq("user_id", args.userId))
        .collect();

      let insightsDeleted = 0;
      for (const insight of insights) {
        await ctx.db.delete(insight._id);
        insightsDeleted++;
      }

      const processingTime = Date.now() - startTime;
      logMutationComplete(mutationId, "CLEAR-ALL-DATA", processingTime, {
        tracesDeleted,
        insightsDeleted
      });
      
      return {
        success: true,
        tracesDeleted,
        insightsDeleted
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      logMutationError(mutationId, "CLEAR-ALL-DATA", error as Error, processingTime);
      
      return {
        success: false,
        tracesDeleted: 0,
        insightsDeleted: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
});

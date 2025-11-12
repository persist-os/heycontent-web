import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { 
  actionCreateValidator,
  actionUpdateValidator
} from "./types/actions";

/**
 * Create Action
 * 
 * Creates a new action in the unified actions table.
 * Used for all action types: email sends, widget executions, artifact updates, etc.
 * 
 * Pattern: Pattern 16 (Validator Centralization) - uses validators from types/actions.ts
 */
export const createAction = mutation({
  args: actionCreateValidator,
  returns: v.object({
    success: v.boolean(),
    actionId: v.optional(v.id("actions")),
  }),
  handler: async (ctx, args) => {
    try {
      const now = Date.now();
      
      // Atomic insert
      const actionId = await ctx.db.insert("actions", {
        userId: args.userId,
        projectId: args.projectId,
        widgetId: args.widgetId,
        artifactId: args.artifactId,
        agentId: args.agentId,
        toolId: args.toolId,
        actionType: args.actionType,
        status: args.status,
        actionData: args.actionData,
        scheduledAt: args.scheduledAt,
        metadata: args.metadata,
        createdAt: now,
        updatedAt: now,
      });
      
      return { success: true, actionId };
    } catch (error) {
      console.error("[createAction] Error:", error);
      return { success: false };
    }
  },
});

/**
 * Update Action
 * 
 * Updates an existing action (e.g., status change, completion, error).
 * Used to track action lifecycle: pending → in_progress → completed/failed
 * 
 * Pattern: Pattern 16 (Validator Centralization) - uses validators from types/actions.ts
 */
export const updateAction = mutation({
  args: actionUpdateValidator,
  returns: v.object({
    success: v.boolean(),
  }),
  handler: async (ctx, args) => {
    try {
      const updateData: any = {
        updatedAt: Date.now(),
      };
      
      // Only include fields that are provided
      if (args.status !== undefined) {
        updateData.status = args.status;
      }
      if (args.actionData !== undefined) {
        updateData.actionData = args.actionData;
      }
      if (args.startedAt !== undefined) {
        updateData.startedAt = args.startedAt;
      }
      if (args.completedAt !== undefined) {
        updateData.completedAt = args.completedAt;
      }
      if (args.error !== undefined) {
        updateData.error = args.error;
      }
      if (args.errorDetails !== undefined) {
        updateData.errorDetails = args.errorDetails;
      }
      if (args.metadata !== undefined) {
        updateData.metadata = args.metadata;
      }
      
      await ctx.db.patch(args.actionId, updateData);
      
      return { success: true };
    } catch (error) {
      console.error("[updateAction] Error:", error);
      return { success: false };
    }
  },
});


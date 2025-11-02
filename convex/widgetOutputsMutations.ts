import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { widgetOutputCreateValidator, widgetOutputUpdateValidator } from "./types/widgetOutput";

/**
 * Widget Outputs Mutations - Optimized Batch Pattern
 * Single batch mutation handles create/update/delete operations
 * Eliminates code duplication and improves performance
 * Privacy: All operations verify user ownership
 */

// Define operation schema using proper validators
const operationSchema = v.object({
  type: v.union(v.literal("create"), v.literal("update"), v.literal("delete")),
  createData: v.optional(widgetOutputCreateValidator),
  updateData: v.optional(widgetOutputUpdateValidator),
  id: v.optional(v.id("widget_outputs")),
  outputId: v.optional(v.string()), // For delete by outputId
  userId: v.optional(v.string()), // For delete auth check
});

/**
 * Single batch mutation function for all widget output operations
 * Replaces create, deleteOutput, deleteByWidget with one function
 * 
 * Usage examples:
 * - Create: { type: "create", createData: { outputId, widgetId, projectId, userId, ... } }
 * - Update: { type: "update", id: "...", updateData: { userId, artifactData, ... } }
 * - Delete: { type: "delete", id: "...", userId: "..." }
 * 
 * Returns detailed results for each operation
 */
export const batchMutateWidgetOutputs = mutation({
  args: {
    operations: v.array(operationSchema),
  },
  returns: v.object({
    success: v.boolean(),
    results: v.array(v.object({
      operation: v.union(v.literal("create"), v.literal("update"), v.literal("delete")),
      success: v.boolean(),
      id: v.optional(v.id("widget_outputs")),
      error: v.optional(v.string()),
    })),
    totalOperations: v.number(),
    successfulOperations: v.number(),
    failedOperations: v.number(),
  }),
  handler: async (ctx, { operations }) => {
    const results = [];
    let successfulOperations = 0;
    let failedOperations = 0;

    for (const op of operations) {
      try {
        let resultId;

        switch (op.type) {
          case "create":
            if (!op.createData) {
              throw new Error("createData required for create operation");
            }
            // Validator ensures all required fields are present
            resultId = await ctx.db.insert("widget_outputs", {
              outputId: op.createData.outputId,
              widgetId: op.createData.widgetId,
              projectId: op.createData.projectId,
              userId: op.createData.userId,
              noteId: op.createData.noteId || "",
              prompts: op.createData.prompts || [],
              createdAt: Date.now(), // Auto-generated
              // Optional fields
              openingMessage: op.createData.openingMessage,
              executionPrompt: op.createData.executionPrompt,
              artifactType: op.createData.artifactType,
              artifactSchema: op.createData.artifactSchema,
              artifactData: op.createData.artifactData,
              contributors: op.createData.contributors,
              lastContributor: op.createData.lastContributor,
              version: op.createData.version,
              userApproved: op.createData.userApproved,
            } as any);
            break;

          case "update":
            if (!op.id || !op.updateData) {
              throw new Error("ID and updateData required for update operation");
            }
            const existing = await ctx.db.get(op.id);
            if (!existing || existing.userId !== op.updateData.userId) {
              throw new Error("Output not found or access denied");
            }
            // Build update object from validated updateData
            const updateFields: any = {};
            if (op.updateData.prompts !== undefined) updateFields.prompts = op.updateData.prompts;
            if (op.updateData.noteId !== undefined) updateFields.noteId = op.updateData.noteId;
            if (op.updateData.executionPrompt !== undefined) updateFields.executionPrompt = op.updateData.executionPrompt;
            if (op.updateData.userRating !== undefined) {
              updateFields.userRating = op.updateData.userRating;
              updateFields.ratedAt = Date.now();
            }
            if (op.updateData.feedbackText !== undefined) updateFields.feedbackText = op.updateData.feedbackText;
            if (op.updateData.artifactData !== undefined) updateFields.artifactData = op.updateData.artifactData;
            if (op.updateData.artifactSchema !== undefined) updateFields.artifactSchema = op.updateData.artifactSchema;
            if (op.updateData.contributors !== undefined) updateFields.contributors = op.updateData.contributors;
            if (op.updateData.lastContributor !== undefined) updateFields.lastContributor = op.updateData.lastContributor;
            if (op.updateData.version !== undefined) updateFields.version = op.updateData.version;
            if (op.updateData.userApproved !== undefined) updateFields.userApproved = op.updateData.userApproved;
            if (op.updateData.updatedAt !== undefined) updateFields.updatedAt = op.updateData.updatedAt;
            await ctx.db.patch(op.id, updateFields);
            resultId = op.id;
            break;

          case "delete":
            if (!op.userId) {
              throw new Error("userId required for delete operation");
            }
            let toDelete;
            if (op.id) {
              toDelete = await ctx.db.get(op.id);
            } else if (op.outputId) {
              toDelete = await ctx.db
                .query("widget_outputs")
                .withIndex("by_output_id", (q) => q.eq("outputId", op.outputId!))
                .first();
            } else {
              throw new Error("ID or outputId required for delete operation");
            }

            if (!toDelete || toDelete.userId !== op.userId) {
              throw new Error("Output not found or access denied");
            }
            await ctx.db.delete(toDelete._id);
            resultId = toDelete._id;
            break;
        }

        results.push({ operation: op.type, success: true, id: resultId });
        successfulOperations++;
      } catch (error) {
        results.push({
          operation: op.type,
          success: false,
          id: op.id,
          error: error instanceof Error ? error.message : "Unknown error",
        });
        failedOperations++;
      }
    }

    return {
      success: failedOperations === 0,
      results,
      totalOperations: operations.length,
      successfulOperations,
      failedOperations,
    };
  },
});


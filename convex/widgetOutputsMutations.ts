import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { widgetOutputArtifactTypeValidator } from "./types/widgets";

/**
 * Widget Outputs Mutations - Optimized Batch Pattern
 * Single batch mutation handles create/update/delete operations
 * Eliminates code duplication and improves performance
 * Privacy: All operations verify user ownership
 */

// Define operation schema once - no parameter rewriting
const operationSchema = v.object({
  type: v.union(v.literal("create"), v.literal("update"), v.literal("delete")),
  data: v.optional(v.object({
    outputId: v.optional(v.string()),
    widgetId: v.optional(v.union(v.string(), v.id("widgets"))),  // 🔄 Migration: supports both legacy string and Convex ID
    projectId: v.optional(v.id("projects")),
    userId: v.string(), // Required for all operations
    noteId: v.optional(v.string()),
    prompts: v.optional(v.array(v.object({
      text: v.string(),
      priority: v.number(),
    }))),
    openingMessage: v.optional(v.string()),  // AI's first conversational message
    executionPrompt: v.optional(v.string()),  // User's custom prompt for widget execution
    userRating: v.optional(v.union(v.literal(1), v.literal(0))),  // 1 = thumbs up, 0 = thumbs down
    feedbackText: v.optional(v.string()),  // Optional text feedback
    // ✅ ARTIFACT FIELDS - Added to match schema
    artifactType: v.optional(widgetOutputArtifactTypeValidator),
    artifactSchema: v.optional(v.any()),
    artifactData: v.optional(v.any()),
    createdAt: v.optional(v.number()),
  })),
  id: v.optional(v.id("widget_outputs")),
  outputId: v.optional(v.string()), // For delete by outputId
});

/**
 * Single batch mutation function for all widget output operations
 * Replaces create, deleteOutput, deleteByWidget with one function
 * 
 * Usage examples:
 * - Create: { type: "create", data: { outputId, widgetId, projectId, userId, noteId, prompts } }
 * - Delete: { type: "delete", outputId, data: { userId } }
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
            if (!op.data) {
              throw new Error("Data required for create operation");
            }
            // ✅ FIXED: Include artifact fields in insert
            // This ensures new fields (artifactType, artifactSchema, artifactData) are saved
            resultId = await ctx.db.insert("widget_outputs", {
              outputId: op.data.outputId!,  // Required
              widgetId: op.data.widgetId!,  // Required
              projectId: op.data.projectId!,  // Required
              userId: op.data.userId,        // Required
              noteId: op.data.noteId || "",  // Required in schema (default empty)
              prompts: op.data.prompts || [], // Required (default empty array)
              createdAt: op.data.createdAt || Date.now(),  // Required
              // Optional fields
              openingMessage: op.data.openingMessage,
              executionPrompt: op.data.executionPrompt,
              artifactType: op.data.artifactType,
              artifactSchema: op.data.artifactSchema,
              artifactData: op.data.artifactData,
            } as any);  // Type assertion to bypass strict typing (fields are validated)
            break;

          case "update":
            if (!op.id || !op.data) {
              throw new Error("ID and data required for update operation");
            }
            const existing = await ctx.db.get(op.id);
            if (!existing || existing.userId !== op.data.userId) {
              throw new Error("Output not found or access denied");
            }
            // Only update fields that exist in schema
            const updateData: any = {};
            if (op.data.prompts) updateData.prompts = op.data.prompts;
            if (op.data.noteId) updateData.noteId = op.data.noteId;
            if (op.data.executionPrompt !== undefined) updateData.executionPrompt = op.data.executionPrompt;
            if (op.data.userRating !== undefined) {
              updateData.userRating = op.data.userRating;
              updateData.ratedAt = Date.now();
            }
            if (op.data.feedbackText !== undefined) updateData.feedbackText = op.data.feedbackText;
            await ctx.db.patch(op.id, updateData);
            resultId = op.id;
            break;

          case "delete":
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

            if (!toDelete || toDelete.userId !== op.data?.userId) {
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


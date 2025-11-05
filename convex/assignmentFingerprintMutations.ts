import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { 
  assignmentFingerprintCreateValidator,
  assignmentFingerprintUpdateValidator
} from "./types/assignmentFingerprint";

/**
 * Assignment Fingerprint Mutations
 * 
 * Unified mutation handler for Living Projects fingerprint operations.
 * Following Pattern 2 (Backend-to-Convex Bridge) from patterns.md
 * 
 * Operations:
 * - create: Insert new fingerprint
 * - update: Patch existing fingerprint (merge fields)
 * 
 * ✅ FOLLOWS CONVEX_SAVE_ABSOLUTE_LAW.md:
 * - Uses centralized validators from types file
 * - Auto-generated fields (createdAt, updatedAt) set by Convex
 * - All fields use camelCase
 */

export const mutateAssignmentFingerprint = mutation({
  args: {
    operation: v.union(v.literal("create"), v.literal("update")),
    projectId: v.id("projects"),
    userId: v.string(),  // ✅ SECURITY: Required for ownership validation
    createData: v.optional(assignmentFingerprintCreateValidator),
    updateData: v.optional(assignmentFingerprintUpdateValidator),
  },
  handler: async (ctx, { operation, projectId, userId, createData, updateData }) => {
    switch (operation) {
      case "create":
        if (!createData) {
          throw new Error("createData required for 'create' operation");
        }
        
        // ✅ SECURITY: Validate project ownership before creating fingerprint
        const project = await ctx.db.get(projectId);
        if (!project) {
          throw new Error("Project not found");
        }
        if (project.userId !== userId) {
          throw new Error("Access denied: You don't own this project");
        }
        
        const now = Date.now();
        const fingerprintId = await ctx.db.insert("assignment_fingerprints", {
          projectId,
          userId,
          insights: createData.insights || [],           // NEW: Structured insights
          currentGoals: createData.currentGoals,          // NEW: Fast-access summaries
          currentConstraints: createData.currentConstraints,
          currentTimeline: createData.currentTimeline,
          widgetPreferences: createData.widgetPreferences,
          version: createData.version || 1,              // NEW: Schema version
          totalInsights: createData.totalInsights || 0,  // NEW: Insight count
          lastEvolution: now,                            // NEW: Evolution tracking
          createdAt: now,
          updatedAt: now,
        });
        
        return fingerprintId;
      
      case "update":
        if (!updateData) {
          throw new Error("updateData required for 'update' operation");
        }
        
        // ✅ SECURITY: Find fingerprint with userId validation (compound index)
        let existing = await ctx.db
          .query("assignment_fingerprints")
          .withIndex("by_project_user", (q) => 
            q.eq("projectId", projectId).eq("userId", userId)
          )
          .first();
        
        // ✅ UPSERT: If fingerprint doesn't exist, create it automatically
        if (!existing) {
          // Validate project ownership before creating
          const project = await ctx.db.get(projectId);
          if (!project) {
            throw new Error("Project not found");
          }
          if (project.userId !== userId) {
            throw new Error("Access denied: You don't own this project");
          }
          
          const now = Date.now();
          const newId = await ctx.db.insert("assignment_fingerprints", {
            projectId,
            userId,
            insights: [],
            version: 1,
            totalInsights: 0,
            lastEvolution: now,
            createdAt: now,
            updatedAt: now,
          });
          
          // Fetch the newly created fingerprint
          existing = await ctx.db.get(newId);
          if (!existing) {
            throw new Error("Failed to create fingerprint");
          }
        }
        
        // ✅ CRITICAL: Append insights, don't replace (preserves history)
        const updatedInsights = updateData.insights
          ? [...(existing.insights || []), ...updateData.insights]  // APPEND mode
          : existing.insights;
        
        const updatedTotalInsights = updatedInsights?.length || existing.totalInsights || 0;
        
        // Merge update fields
        await ctx.db.patch(existing._id, {
          insights: updatedInsights,              // NEW: Appended insights
          currentGoals: updateData.currentGoals !== undefined ? updateData.currentGoals : existing.currentGoals,
          currentConstraints: updateData.currentConstraints !== undefined ? updateData.currentConstraints : existing.currentConstraints,
          currentTimeline: updateData.currentTimeline !== undefined ? updateData.currentTimeline : existing.currentTimeline,
          widgetPreferences: updateData.widgetPreferences !== undefined ? updateData.widgetPreferences : existing.widgetPreferences,
          totalInsights: updatedTotalInsights,    // NEW: Updated count
          lastEvolution: updateData.lastEvolution || existing.lastEvolution,
          updatedAt: Date.now(),
        });
        
        return existing._id;
        
      default:
        throw new Error(`Invalid operation: ${operation}`);
    }
  }
});


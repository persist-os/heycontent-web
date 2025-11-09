import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { 
  assignmentFingerprintCreateValidator,
  assignmentFingerprintUpdateValidator,
  insightEntryValidator
} from "./types/assignmentFingerprint";
import type { InsightEntry } from "./types/assignmentFingerprint";

/**
 * Assignment Fingerprint Mutations
 * 
 * Unified mutation handler for Living Projects fingerprint operations.
 * Following Pattern 2 (Backend-to-Convex Bridge) from patterns.md
 * 
 * Operations:
 * - create: Insert new fingerprint
 * - update: Patch existing fingerprint (merge fields)
 * - addUserInsight: Add user-edited insight and update denormalized fields
 * 
 * ✅ FOLLOWS CONVEX_SAVE_ABSOLUTE_LAW.md:
 * - Uses centralized validators from types file
 * - Auto-generated fields (createdAt, updatedAt) set by Convex
 * - All fields use camelCase
 */

export const mutateAssignmentFingerprint = mutation({
  args: {
    operation: v.union(v.literal("create"), v.literal("update"), v.literal("addUserInsight")),
    projectId: v.id("projects"),
    userId: v.string(),  // ✅ SECURITY: Required for ownership validation
    createData: v.optional(assignmentFingerprintCreateValidator),
    updateData: v.optional(assignmentFingerprintUpdateValidator),
    userInsight: v.optional(insightEntryValidator),  // For addUserInsight operation
  },
  handler: async (ctx, { operation, projectId, userId, createData, updateData, userInsight }) => {
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
      
      case "addUserInsight":
        if (!userInsight) {
          throw new Error("userInsight required for 'addUserInsight' operation");
        }
        
        // ✅ SECURITY: Find fingerprint with userId validation (compound index)
        let fingerprint = await ctx.db
          .query("assignment_fingerprints")
          .withIndex("by_project_user", (q) => 
            q.eq("projectId", projectId).eq("userId", userId)
          )
          .first();
        
        // ✅ UPSERT: If fingerprint doesn't exist, create it automatically
        if (!fingerprint) {
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
          fingerprint = await ctx.db.get(newId);
          if (!fingerprint) {
            throw new Error("Failed to create fingerprint");
          }
        }
        
        // Append user insight to insights array
        const newInsights = [...(fingerprint.insights || []), userInsight];
        const newTotalInsights = newInsights.length;
        
        // Denormalize current fields from all insights
        const denormalized = denormalizeFromInsights(newInsights);
        
        // Update fingerprint with new insight and denormalized fields
        await ctx.db.patch(fingerprint._id, {
          insights: newInsights,
          currentGoals: denormalized.currentGoals,
          currentConstraints: denormalized.currentConstraints,
          currentTimeline: denormalized.currentTimeline,
          totalInsights: newTotalInsights,
          lastEvolution: Date.now(),
          updatedAt: Date.now(),
        });
        
        return fingerprint._id;
        
      default:
        throw new Error(`Invalid operation: ${operation}`);
    }
  }
});

/**
 * Denormalize current fields from insights array
 * Extracts most recent, high-confidence insights by category
 * 
 * Logic:
 * - Filter by category and confidence >= 0.7
 * - Sort by timestamp descending (newest first)
 * - Extract top 5 for goals/constraints
 * - Extract most recent for timeline (single string)
 */
function denormalizeFromInsights(insights: InsightEntry[]): {
  currentGoals: string[],
  currentConstraints: string[],
  currentTimeline: string | null
} {
  // Filter insights by confidence >= 0.7 (or default to 0.7 if not set)
  const highConfidenceInsights = insights.filter(i => (i.confidence ?? 0.7) >= 0.7);
  
  // Extract goals: filter by category "goals", sort by timestamp descending, take top 5
  const goals = highConfidenceInsights
    .filter(i => i.category === "goals")
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5)
    .map(i => i.insight);
  
  // Extract constraints: filter by category "constraints", sort by timestamp descending, take top 5
  const constraints = highConfidenceInsights
    .filter(i => i.category === "constraints")
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, 5)
    .map(i => i.insight);
  
  // Extract timeline: filter by category "timeline", sort by timestamp descending, take most recent
  const timelineInsights = highConfidenceInsights
    .filter(i => i.category === "timeline")
    .sort((a, b) => b.timestamp - a.timestamp);
  const timeline = timelineInsights.length > 0 ? timelineInsights[0].insight : null;
  
  return {
    currentGoals: goals,
    currentConstraints: constraints,
    currentTimeline: timeline,
  };
}


import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Widget Outputs Queries - Optimized Generic Pattern
 * Single parameterized query eliminates code duplication and improves maintainability
 * Privacy: All queries enforce user isolation via userId filtering
 */

/**
 * Find existing artifact by projectId and artifactType
 * Used for multi-widget collaboration on shared artifacts
 */
export const findArtifactByProjectAndType = query({
  args: {
    projectId: v.id("projects"),
    artifactType: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("widget_outputs")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) =>
        q.and(
          q.eq(q.field("artifactType"), args.artifactType),
          q.eq(q.field("userId"), args.userId)
        )
      )
      .first();
  },
});

/**
 * Generic query helper for widget outputs
 * Handles dynamic index selection and filtering with user isolation
 */
const queryWidgetOutputsWithOptions = async (
  ctx: any,
  userId: string,
  options: {
    useIndex?: string;
    indexFields?: Record<string, any>;
    filters?: Record<string, any>;
    limit?: number;
    orderBy?: "asc" | "desc";
  } = {}
) => {
  const baseQuery = ctx.db.query("widget_outputs");

  // Dynamic index selection with user isolation
  let indexedQuery;
  if (options.useIndex && options.indexFields) {
    indexedQuery = baseQuery.withIndex(options.useIndex, (q: any) => {
      let queryBuilder = q;
      // Apply index fields dynamically
      Object.entries(options.indexFields).forEach(([field, value]) => {
        queryBuilder = queryBuilder.eq(field, value);
      });
      return queryBuilder;
    });
  } else {
    // Default: query all and filter by userId
    indexedQuery = baseQuery;
  }

  // Runtime filters (including userId for privacy)
  let filteredQuery = indexedQuery;
  const allFilters = { ...options.filters, userId }; // ALWAYS filter by user
  Object.entries(allFilters).forEach(([field, value]) => {
    filteredQuery = filteredQuery.filter((filterQuery: any) =>
      filterQuery.eq(filterQuery.field(field), value)
    );
  });

  // Ordering
  let orderedQuery = filteredQuery;
  if (options.orderBy) {
    orderedQuery = filteredQuery.order(options.orderBy);
  }

  // Get widget outputs
  let outputs;
  if (options.limit === 1) {
    outputs = await orderedQuery.first();
    outputs = outputs ? [outputs] : [];
  } else {
    outputs = options.limit ? await orderedQuery.take(options.limit) : await orderedQuery.collect();
  }

  // If we have outputs, enrich them with note titles
  if (outputs && Array.isArray(outputs)) {
    const enrichedOutputs = await Promise.all(
      outputs.map(async (output: any) => {
        if (output.noteId) {
          try {
            const note = await ctx.db.get(output.noteId);
            return {
              ...output,
              noteTitle: note?.title || "Untitled Note"
            };
          } catch (error) {
            console.error('Error fetching note title for output:', output.outputId, error);
            return {
              ...output,
              noteTitle: "Note Title Unavailable"
            };
          }
        }
        return output;
      })
    );
    return options.limit === 1 ? enrichedOutputs[0] : enrichedOutputs;
  }

  return outputs;
};

/**
 * Single generic query function for all widget output operations
 * Replaces getByOutputId, getByWidget, getLatestByWidget with one function
 * 
 * Usage examples:
 * - Get by output ID: { userId, outputId }
 * - Get by widget: { userId, widgetId, limit: 10 }
 * - Get latest by widget: { userId, widgetId, limit: 1, orderBy: "desc" }
 */
export const getWidgetOutputData = query({
  args: {
    userId: v.string(),
    useIndex: v.optional(v.string()),
    indexFields: v.optional(v.record(v.string(), v.any())),
    filters: v.optional(v.record(v.string(), v.any())),
    limit: v.optional(v.number()),
    orderBy: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
  },
  returns: v.union(
    v.null(),
    v.any(), // Can return single object or array depending on limit
  ),
  handler: async (ctx, { userId, ...options }) => {
    return await queryWidgetOutputsWithOptions(ctx, userId, options);
  },
});

/**
 * Get a single widget output by ID
 * Used by artifact viewer page
 * Privacy: Enforces user isolation
 */
export const getById = query({
  args: {
    id: v.id("widget_outputs"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const output = await ctx.db.get(args.id);
    
    // Privacy check: Only return if it belongs to this user
    if (!output || output.userId !== args.userId) {
      return null;
    }
    
    return output;
  },
});

/**
 * Get all artifacts for a project
 * Used by ConstellationView to display artifacts in preview modal
 */
export const getProjectArtifacts = query({
  args: {
    projectId: v.id("projects"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("widget_outputs")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId))
      .filter((q) =>
        q.and(
          q.eq(q.field("userId"), args.userId),
          q.neq(q.field("artifactType"), null) // Only return outputs with artifacts
        )
      )
      .order("desc")
      .collect();
  },
});

/**
 * Get recent artifacts across all user's projects
 * Used by homepage to display latest artifacts
 */
export const getRecentArtifacts = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { userId, limit = 5 }) => {
    // Query widget_outputs, filter by userId and has artifact, order by most recent
    const artifacts = await ctx.db
      .query("widget_outputs")
      .filter((q) => 
        q.and(
          q.eq(q.field("userId"), userId),
          q.neq(q.field("artifactType"), null)
        )
      )
      .order("desc")
      .take(Math.min(limit, 10));

    // Enrich with project names
    const enrichedArtifacts = await Promise.all(
      artifacts.map(async (artifact) => {
        let projectName = 'Unknown Project'
        
        if (artifact.projectId) {
          try {
            const project = await ctx.db.get(artifact.projectId)
            if (project) {
              projectName = project.name
            }
          } catch (error) {
            console.warn('Failed to fetch project for artifact:', artifact._id)
          }
        }
        
        return {
          ...artifact,
          projectName,
        }
      })
    )

    return enrichedArtifacts
  },
});


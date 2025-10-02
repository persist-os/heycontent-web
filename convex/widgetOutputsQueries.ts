import { v } from "convex/values";
import { query } from "./_generated/server";

/**
 * Widget Outputs Queries - Optimized Generic Pattern
 * Single parameterized query eliminates code duplication and improves maintainability
 * Privacy: All queries enforce user isolation via userId filtering
 */

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

  // Pagination
  if (options.limit === 1) {
    return await orderedQuery.first();
  }
  return options.limit ? await orderedQuery.take(options.limit) : await orderedQuery.collect();
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


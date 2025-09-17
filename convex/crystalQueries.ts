import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Builds and executes a query with all options in one go
 * @param ctx - Convex query context
 * @param table - The table to query (crystal_shards or crystals)
 * @param userId - User ID for scoping the query
 * @param options - Query configuration object
 * @param options.useIndex - Optional index name for optimization
 * @param options.indexFields - Fields to match in the index
 * @param options.filters - Runtime filters to apply
 * @param options.limit - Maximum number of results
 * @param options.orderBy - Sort direction (asc/desc)
 * @returns Promise resolving to query results
 */
const queryWithOptions = async (
    ctx: any,
    table: string,
    userId: string,
    options: {
        useIndex?: string;
        indexFields?: Record<string, any>;
        filters?: Record<string, any>;
        limit?: number;
        orderBy?: "asc" | "desc";
    } = {}
) => {
    // Build query with index
    let query = options.useIndex
        ? ctx.db.query(table).withIndex(options.useIndex, (q: any) => {
            q = q.eq("userId", userId);
            if (options.indexFields) {
                Object.entries(options.indexFields).forEach(([field, value]) => {
                    q = q.eq(field, value);
                });
            }
            return q;
        })
        : ctx.db.query(table).withIndex("by_user", (q: any) => q.eq("userId", userId));

    // Apply filters
    if (options.filters) {
        Object.entries(options.filters).forEach(([field, value]) => {
            query = query.filter((q: any) => q.eq(q.field(field), value));
        });
    }

    // Apply ordering and limits
    if (options.orderBy) query = query.order(options.orderBy);
    if (options.limit) query = query.take(options.limit);

    return query.collect();
};

/**
 * Master function for flexible crystal data retrieval
 *
 * Provides a unified interface for querying crystal_shards and crystals tables
 * with support for various indexes, filters, and result constraints.
 *
 * @example
 * ```typescript
 * // Get recent high-confidence shards
 * const shards = await getCrystalData(ctx, {
 *   userId: "user123",
 *   table: "crystal_shards",
 *   useIndex: "by_confidence",
 *   indexFields: { confidence_level: "high" },
 *   limit: 10,
 *   orderBy: "desc"
 * });
 * ```
 */
export const getCrystalData = query({
    args: {
        userId: v.string(),
        table: v.union(v.literal("crystal_shards"), v.literal("crystals")),
        useIndex: v.optional(v.string()),
        indexFields: v.optional(v.record(v.string(), v.any())),
        filters: v.optional(v.record(v.string(), v.any())),
        limit: v.optional(v.number()),
        orderBy: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    },

    handler: async (ctx, { userId, table, ...options }) => {
        return queryWithOptions(ctx, table, userId, options);
    }
});

/**
 * Convenience function for common persona data operations
 *
 * Provides pre-configured queries for typical use cases in persona management.
 * Results are structured based on the operation type.
 *
 * @param userId - User ID for scoping queries
 * @param operation - The type of operation to perform
 * @param limit - Optional maximum number of results per query
 *
 * @example
 * ```typescript
 * // Get overview data (recent shards + top crystals)
 * const overview = await getPersonaData(ctx, {
 *   userId: "user123",
 *   operation: "overview",
 *   limit: 5
 * });
 * // Returns: { recentShards: [...], topCrystals: [...] }
 *
 * // Get high confidence items
 * const highConf = await getPersonaData(ctx, {
 *   userId: "user123",
 *   operation: "high_confidence"
 * });
 * // Returns: { shards: [...], crystals: [...] }
 * ```
 */
export const getPersonaData = query({
    args: {
        userId: v.string(),
        operation: v.union(
            v.literal("shards"),
            v.literal("crystals"),
            v.literal("overview"),
            v.literal("high_confidence"),
            v.literal("due_review")
        ),
        limit: v.optional(v.number())
    },

    handler: async (ctx, { userId, operation, limit }) => {
        switch (operation) {
            case "shards":
                return queryWithOptions(ctx, "crystal_shards", userId, { limit });

            case "crystals":
                return queryWithOptions(ctx, "crystals", userId, { limit });

            case "high_confidence":
                const [shards, crystals] = await Promise.all([
                    queryWithOptions(ctx, "crystal_shards", userId, {
                        useIndex: "by_confidence",
                        indexFields: { confidence_level: "high" },
                        limit
                    }),
                    queryWithOptions(ctx, "crystals", userId, {
                        useIndex: "by_confidence",
                        indexFields: { confidence_score: "high" },
                        limit
                    })
                ]);
                return { shards, crystals };

            case "due_review":
                return queryWithOptions(ctx, "crystals", userId, {
                    useIndex: "by_review_due",
                    filters: { next_review_due: Date.now() }
                });

            case "overview":
                const [recentShards, topCrystals] = await Promise.all([
                    queryWithOptions(ctx, "crystal_shards", userId, { limit: limit || 10, orderBy: "desc" }),
                    queryWithOptions(ctx, "crystals", userId, { useIndex: "by_usage", limit: limit || 10, orderBy: "desc" })
                ]);
                return { recentShards, topCrystals };
        }
    }
});
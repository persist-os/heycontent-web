import { query } from "./_generated/server";
import { v } from "convex/values";
import { blogPostCategoryValidator, blogPostStatusValidator } from "./types/blogPost";

/**
 * Blog Post Queries
 * 
 * Retrieval queries for blog posts.
 * Public queries filter to published posts only.
 * 
 * Pattern: Pattern 16 (Validator Centralization)
 */

/**
 * Get a single blog post by slug
 * Public query: only returns published posts
 */
export const getBlogPostBySlug = query({
  args: {
    slug: v.string(),
    includeDrafts: v.optional(v.boolean()),  // Admin only
  },
  handler: async (ctx, args) => {
    const blogPost = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    
    if (!blogPost) {
      return null;
    }
    
    // Public queries only return published posts
    if (!args.includeDrafts && blogPost.status !== "published") {
      return null;
    }
    
    return blogPost;
  },
});

/**
 * Get all blog posts
 * Public query: only returns published posts
 * Supports filtering by status, category, series
 */
export const getAllBlogPosts = query({
  args: {
    status: v.optional(blogPostStatusValidator),  // Filter by status
    category: v.optional(blogPostCategoryValidator),  // Filter by category
    series: v.optional(v.string()),  // Filter by series
    includeDrafts: v.optional(v.boolean()),  // Admin only
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    
    // Default to published only for public queries
    const effectiveStatus = args.status ?? (args.includeDrafts ? undefined : "published");
    
    let query = ctx.db.query("blogPosts");
    
    // Filter by status if provided
    if (effectiveStatus) {
      query = query.withIndex("by_status", (q) => q.eq("status", effectiveStatus));
    } else {
      // Get all if no status filter
      query = query;
    }
    
    const allPosts = await query.collect();
    
    // Filter by category if provided
    let filtered = allPosts;
    if (args.category) {
      filtered = filtered.filter((post) => post.category === args.category);
    }
    
    // Filter by series if provided
    if (args.series) {
      filtered = filtered.filter((post) => post.series === args.series);
    }
    
    // Sort by date (newest first), then by order if in series
    filtered.sort((a, b) => {
      // First sort by date
      const dateCompare = b.date.localeCompare(a.date);
      if (dateCompare !== 0) return dateCompare;
      
      // Then by order if in same series
      if (a.series === b.series && a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      
      return 0;
    });
    
    return filtered.slice(0, limit);
  },
});

/**
 * Get blog posts by series (ordered)
 */
export const getBlogPostsBySeries = query({
  args: {
    series: v.string(),
    includeDrafts: v.optional(v.boolean()),  // Admin only
  },
  handler: async (ctx, args) => {
    const allPosts = await ctx.db
      .query("blogPosts")
      .withIndex("by_series_order", (q) => q.eq("series", args.series))
      .collect();
    
    // Filter by status if not including drafts
    let filtered = allPosts;
    if (!args.includeDrafts) {
      filtered = filtered.filter((post) => post.status === "published");
    }
    
    // Sort by order
    filtered.sort((a, b) => {
      if (a.order === undefined && b.order === undefined) return 0;
      if (a.order === undefined) return 1;
      if (b.order === undefined) return -1;
      return a.order - b.order;
    });
    
    return filtered;
  },
});


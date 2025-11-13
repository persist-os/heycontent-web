import { v } from "convex/values";

/**
 * Blog Post Schema
 * 
 * CMS pattern for blog posts stored in Convex.
 * Enables admin editing, versioning, and draft/published states.
 * 
 * Pattern: Pattern 16 (Validator Centralization)
 */

// Blog post status validator
export const blogPostStatusValidator = v.union(
  v.literal("draft"),
  v.literal("published"),
  v.literal("archived")
);

// Blog post category validator
export const blogPostCategoryValidator = v.union(
  v.literal("code"),
  v.literal("ux"),
  v.literal("design")
);

// Blog post schema fields
export const blogPostSchemaFields = {
  // Core content
  slug: v.string(),  // URL slug (unique)
  title: v.string(),
  description: v.string(),
  content: v.string(),  // HTML content (from TipTap editor)
  category: blogPostCategoryValidator,
  
  // Metadata
  readTime: v.string(),  // e.g., "8 min"
  date: v.optional(v.string()),  // ISO date string (auto-generated from publishedAt)
  
  // Series/ordering
  series: v.optional(v.string()),  // Series name
  order: v.optional(v.number()),  // Order within series
  
  // Status & lifecycle
  status: blogPostStatusValidator,
  publishedAt: v.optional(v.number()),  // Timestamp when published
  
  // Author & tracking
  authorId: v.string(),  // Firebase UID
  authorName: v.optional(v.string()),  // Display name for author
  contentHistory: v.optional(v.array(v.object({
    timestamp: v.number(),
    authorId: v.string(),
    content: v.string(),
    title: v.optional(v.string()),
  }))),  // Edit history for versioning
  
  // Timestamps (auto-handled by Convex)
  // _creationTime provided automatically
};

// Validators for mutations
export const blogPostCreateValidator = v.object({
  slug: v.string(),
  title: v.string(),
  description: v.string(),
  content: v.string(),
  category: blogPostCategoryValidator,
  readTime: v.string(),
  date: v.optional(v.string()),  // Auto-generated from publishedAt when publishing
  series: v.optional(v.string()),
  order: v.optional(v.number()),
  status: v.optional(blogPostStatusValidator),  // Defaults to "draft"
  authorId: v.string(),
  authorName: v.optional(v.string()),
});

export const blogPostUpdateValidator = v.object({
  slug: v.optional(v.string()),
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  content: v.optional(v.string()),
  category: v.optional(blogPostCategoryValidator),
  readTime: v.optional(v.string()),
  // date is auto-generated, not manually updatable
  series: v.optional(v.string()),
  order: v.optional(v.number()),
  status: v.optional(blogPostStatusValidator),
  authorName: v.optional(v.string()),
});


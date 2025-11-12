import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { blogPostCreateValidator, blogPostUpdateValidator, blogPostStatusValidator } from "./types/blogPost";

/**
 * Blog Post Mutations
 * 
 * CRUD operations for blog posts.
 * Enables admin editing, versioning, and draft/published states.
 * 
 * Pattern: Pattern 16 (Validator Centralization)
 */

/**
 * Create a new blog post
 */
export const createBlogPost = mutation({
  args: blogPostCreateValidator,
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if slug already exists
    const existing = await ctx.db
      .query("blogPosts")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
    
    if (existing) {
      throw new Error(`Blog post with slug "${args.slug}" already exists`);
    }
    
    // Auto-generate date from publishedAt timestamp when publishing
    const publishedAt = args.status === "published" ? now : undefined;
    const date = publishedAt ? new Date(publishedAt).toISOString().split('T')[0] : undefined;
    
    const blogPostId = await ctx.db.insert("blogPosts", {
      slug: args.slug,
      title: args.title,
      description: args.description,
      content: args.content,
      category: args.category,
      readTime: args.readTime,
      date,
      series: args.series,
      order: args.order,
      status: args.status ?? "draft",
      publishedAt,
      authorId: args.authorId,
      authorName: args.authorName,
      contentHistory: [],
    });
    
    return blogPostId;
  },
});

/**
 * Update an existing blog post
 * Tracks edit history in contentHistory array
 */
export const updateBlogPost = mutation({
  args: {
    blogPostId: v.id("blogPosts"),
    updates: blogPostUpdateValidator,
    authorId: v.string(),  // Required for edit history
  },
  handler: async (ctx, args) => {
    const blogPost = await ctx.db.get(args.blogPostId);
    
    if (!blogPost) {
      throw new Error(`Blog post ${args.blogPostId} not found`);
    }
    
    // Check for duplicate slug if slug is being updated
    if (args.updates.slug && args.updates.slug !== blogPost.slug) {
      const existing = await ctx.db
        .query("blogPosts")
        .withIndex("by_slug", (q) => q.eq("slug", args.updates.slug))
        .first();
      
      if (existing && existing._id !== args.blogPostId) {
        throw new Error(`Blog post with slug "${args.updates.slug}" already exists`);
      }
    }
    
    const now = Date.now();
    const updates: any = { ...args.updates };
    
    // Track content changes in history
    if (args.updates.content && args.updates.content !== blogPost.content) {
      const history = blogPost.contentHistory || [];
      history.push({
        timestamp: now,
        authorId: args.authorId,
        content: blogPost.content,
        title: blogPost.title,
      });
      updates.contentHistory = history;
    }
    
    // Update publishedAt and date if status changed to published
    if (args.updates.status === "published" && blogPost.status !== "published") {
      updates.publishedAt = now;
      updates.date = new Date(now).toISOString().split('T')[0];
    }
    
    await ctx.db.patch(args.blogPostId, updates);
    
    return args.blogPostId;
  },
});

/**
 * Publish a blog post (change status from draft → published)
 */
export const publishBlogPost = mutation({
  args: {
    blogPostId: v.id("blogPosts"),
  },
  handler: async (ctx, args) => {
    const blogPost = await ctx.db.get(args.blogPostId);
    
    if (!blogPost) {
      throw new Error(`Blog post ${args.blogPostId} not found`);
    }
    
    const now = Date.now();
    const publishedAt = blogPost.publishedAt ?? now;
    
    await ctx.db.patch(args.blogPostId, {
      status: "published",
      publishedAt,
      date: new Date(publishedAt).toISOString().split('T')[0],
    });
    
    return args.blogPostId;
  },
});

/**
 * Delete a blog post (soft delete → archived)
 */
export const deleteBlogPost = mutation({
  args: {
    blogPostId: v.id("blogPosts"),
  },
  handler: async (ctx, args) => {
    const blogPost = await ctx.db.get(args.blogPostId);
    
    if (!blogPost) {
      throw new Error(`Blog post ${args.blogPostId} not found`);
    }
    
    // Soft delete: change status to archived
    await ctx.db.patch(args.blogPostId, {
      status: "archived",
    });
    
    return { success: true };
  },
});

/**
 * Batch create blog posts
 * Useful for migration from static files
 */
export const batchCreateBlogPosts = mutation({
  args: {
    posts: v.array(blogPostCreateValidator),
  },
  handler: async (ctx, args) => {
    const blogPostIds: string[] = [];
    const now = Date.now();
    
    for (const post of args.posts) {
      // Check if slug already exists
      const existing = await ctx.db
        .query("blogPosts")
        .withIndex("by_slug", (q) => q.eq("slug", post.slug))
        .first();
      
      if (existing) {
        console.warn(`Skipping duplicate slug: ${post.slug}`);
        continue;
      }
      
      const blogPostId = await ctx.db.insert("blogPosts", {
        slug: post.slug,
        title: post.title,
        description: post.description,
        content: post.content,
        category: post.category,
        readTime: post.readTime,
        date: post.status === "published" && post.publishedAt 
          ? new Date(post.publishedAt).toISOString().split('T')[0]
          : undefined,
        series: post.series,
        order: post.order,
        status: post.status ?? "published",  // Migration: default to published
        publishedAt: post.status === "published" ? now : undefined,
        authorId: post.authorId,
        authorName: post.authorName,
        contentHistory: [],
      });
      
      blogPostIds.push(blogPostId);
    }
    
    return {
      success: true,
      count: blogPostIds.length,
      blogPostIds,
    };
  },
});


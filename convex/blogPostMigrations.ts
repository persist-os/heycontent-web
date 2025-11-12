import { internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { blogPostCreateValidator } from "./types/blogPost";

/**
 * Blog Post Migration Script
 * 
 * Migrates blog posts from hardcoded React content to Convex.
 * Run from Convex dashboard or admin UI.
 * 
 * Usage:
 * 1. From Convex Dashboard: Run `blogPostMigrations:migrateBlogPosts` with posts array
 * 2. From Admin UI: Use "Migrate Posts" button (if implemented)
 */

/**
 * Batch migrate blog posts
 * Accepts array of blog post data and creates them in Convex
 */
export const migrateBlogPosts = internalMutation({
  args: {
    posts: v.array(blogPostCreateValidator),
    authorId: v.string(),  // Firebase UID of admin running migration
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const results: Array<{ slug: string; success: boolean; blogPostId?: string; error?: string }> = [];
    
    for (const post of args.posts) {
      try {
        // Check if slug already exists
        const existing = await ctx.db
          .query("blogPosts")
          .withIndex("by_slug", (q) => q.eq("slug", post.slug))
          .first();
        
        if (existing) {
          results.push({
            slug: post.slug,
            success: false,
            error: `Slug "${post.slug}" already exists`,
          });
          continue;
        }
        
        const blogPostId = await ctx.db.insert("blogPosts", {
          slug: post.slug,
          title: post.title,
          description: post.description,
          content: post.content,
          category: post.category,
          readTime: post.readTime,
          date: post.date,
          series: post.series,
          order: post.order,
          status: post.status ?? "published",  // Migration: default to published
          publishedAt: post.status === "published" ? now : undefined,
          authorId: args.authorId,
          contentHistory: [],
        });
        
        results.push({
          slug: post.slug,
          success: true,
          blogPostId,
        });
      } catch (error: any) {
        results.push({
          slug: post.slug,
          success: false,
          error: error.message || String(error),
        });
      }
    }
    
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    return {
      success: failureCount === 0,
      total: args.posts.length,
      succeeded: successCount,
      failed: failureCount,
      results,
    };
  },
});


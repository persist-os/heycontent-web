// Written by Aria
import { v } from "convex/values";
import { query } from "./_generated/server";

// Get Gmail account data for a user
export const getGmailAccounts = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      const gmailAccounts = await ctx.db
        .query("gmailData")
        .withIndex("by_user", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("resourceType"), "account"))
        .collect();

      return gmailAccounts;
    } catch (error) {
      console.error('Error getting Gmail accounts:', error);
      throw new Error(`Failed to get Gmail accounts: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get Gmail account by email
export const getGmailAccountByEmail = query({
  args: { userId: v.string(), email: v.string() },
  handler: async (ctx, args) => {
    try {
      const gmailAccount = await ctx.db
        .query("gmailData")
        .withIndex("by_email", (q) => q.eq("userId", args.userId).eq("email", args.email))
        .filter((q) => q.eq(q.field("resourceType"), "account"))
        .first();

      return gmailAccount;
    } catch (error) {
      console.error('Error getting Gmail account by email:', error);
      throw new Error(`Failed to get Gmail account by email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get Gmail token for a user
export const getGmailToken = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      const token = await ctx.db
        .query("gmailTokens")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .first();
      return token;
    } catch (error) {
      console.error('Error getting Gmail token:', error);
      throw new Error(`Failed to get Gmail token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get Gmail message by ID
export const getGmailMessageById = query({
  args: { 
    userId: v.string(),
    messageId: v.string()
  },
  handler: async (ctx, args) => {
    try {
      const message = await ctx.db
        .query("gmailData")
        .withIndex("by_resource_id", (q) => q.eq("resourceId", args.messageId))
        .filter((q) => 
          q.eq(q.field("userId"), args.userId) && 
          q.eq(q.field("resourceType"), "message")
        )
        .first();
      
      return message;
    } catch (error) {
      console.error('Error getting Gmail message by ID:', error);
      throw new Error(`Failed to get Gmail message by ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get Gmail thread by ID
export const getGmailThreadById = query({
  args: { 
    userId: v.string(),
    threadId: v.string()
  },
  handler: async (ctx, args) => {
    try {
      const thread = await ctx.db
        .query("gmailData")
        .withIndex("by_resource_id", (q) => q.eq("resourceId", args.threadId))
        .filter((q) => 
          q.eq(q.field("userId"), args.userId) && 
          q.eq(q.field("resourceType"), "thread")
        )
        .first();
      
      return thread;
    } catch (error) {
      console.error('Error getting Gmail thread by ID:', error);
      throw new Error(`Failed to get Gmail thread by ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get Gmail messages by thread ID
export const getGmailMessagesByThread = query({
  args: { 
    userId: v.string(),
    threadId: v.string()
  },
  handler: async (ctx, args) => {
    try {
      const messages = await ctx.db
        .query("gmailData")
        .withIndex("by_thread_id", (q) => q.eq("threadId", args.threadId))
        .filter((q) => 
          q.eq(q.field("userId"), args.userId) && 
          q.eq(q.field("resourceType"), "message")
        )
        .collect();
      
      return messages;
    } catch (error) {
      console.error('Error getting Gmail messages by thread:', error);
      throw new Error(`Failed to get Gmail messages by thread: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get recent Gmail messages for a user
export const getRecentGmailMessages = query({
  args: { 
    userId: v.string(),
    email: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    try {
      let messagesQuery = ctx.db
        .query("gmailData")
        .withIndex("by_user_resource", (q) => 
          q.eq("userId", args.userId).eq("resourceType", "message")
        );
      
      if (args.email) {
        messagesQuery = messagesQuery.filter((q) => q.eq(q.field("email"), args.email));
      }
      
      const messages = await messagesQuery
        .order("desc")
        .take(args.limit || 50);
      
      return messages;
    } catch (error) {
      console.error('Error getting recent Gmail messages:', error);
      throw new Error(`Failed to get recent Gmail messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get recent Gmail threads for a user
export const getRecentGmailThreads = query({
  args: { 
    userId: v.string(),
    email: v.optional(v.string()),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    try {
      let threadsQuery = ctx.db
        .query("gmailData")
        .withIndex("by_user_resource", (q) => 
          q.eq("userId", args.userId).eq("resourceType", "thread")
        );
      
      if (args.email) {
        threadsQuery = threadsQuery.filter((q) => q.eq(q.field("email"), args.email));
      }
      
      const threads = await threadsQuery
        .order("desc")
        .take(args.limit || 50);
      
      return threads;
    } catch (error) {
      console.error('Error getting recent Gmail threads:', error);
      throw new Error(`Failed to get recent Gmail threads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get Gmail data by resource type
export const getGmailDataByType = query({
  args: {
    userId: v.string(),
    resourceType: v.union(v.literal("message"), v.literal("thread")),
    email: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      let query = ctx.db
        .query("gmailData")
        .withIndex("by_user_resource", (q) => 
          q.eq("userId", args.userId).eq("resourceType", args.resourceType)
        );
      
      if (args.email) {
        query = query.filter((q) => q.eq(q.field("email"), args.email));
      }
      
      return await query
        .order("desc")
        .take(args.limit || 50);
    } catch (error) {
      console.error(`Error getting Gmail ${args.resourceType}s:`, error);
      throw new Error(`Failed to get Gmail ${args.resourceType}s: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
}); 
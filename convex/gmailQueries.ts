// Written by Aria
import { v } from "convex/values";
import { query } from "./_generated/server";
import { api } from "./_generated/api";

// Get Gmail account data for a user
export const getGmailAccounts = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      const gmailAccounts = await ctx.db
        .query("gmailAccounts")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
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
        .query("gmailAccounts")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .filter((q) => q.eq(q.field("userId"), args.userId))
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
    email: v.string(), 
    messageId: v.string() 
  },
  handler: async (ctx, args) => {
    try {
      const message = await ctx.db
        .query("gmailMessages")
        .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
        .filter((q) => 
          q.eq(q.field("userId"), args.userId) && 
          q.eq(q.field("email"), args.email)
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
    email: v.string(), 
    threadId: v.string() 
  },
  handler: async (ctx, args) => {
    try {
      const thread = await ctx.db
        .query("gmailThreads")
        .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
        .filter((q) => 
          q.eq(q.field("userId"), args.userId) && 
          q.eq(q.field("email"), args.email)
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
    email: v.string(), 
    threadId: v.string() 
  },
  handler: async (ctx, args) => {
    try {
      const messages = await ctx.db
        .query("gmailMessages")
        .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
        .filter((q) => 
          q.eq(q.field("userId"), args.userId) && 
          q.eq(q.field("email"), args.email)
        )
        .collect();
      return messages;
    } catch (error) {
      console.error('Error getting Gmail messages by thread ID:', error);
      throw new Error(`Failed to get Gmail messages by thread ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Get recent Gmail messages for a user
export const getRecentGmailMessages = query({
  args: { 
    userId: v.string(),
    email: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      let query = ctx.db
        .query("gmailMessages")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId));
      
      // Filter by email if provided
      if (args.email) {
        query = query.filter((q) => q.eq(q.field("email"), args.email));
      }
      
      // Sort by updatedAt (newest first)
      const sortedQuery = query.order("desc");
      
      // Apply limit if provided
      const messages = await (args.limit ? sortedQuery.take(args.limit) : sortedQuery.collect());
      
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
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      let query = ctx.db
        .query("gmailThreads")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId));
      
      // Filter by email if provided
      if (args.email) {
        query = query.filter((q) => q.eq(q.field("email"), args.email));
      }
      
      // Sort by updatedAt (newest first)
      const sortedQuery = query.order("desc");
      
      // Apply limit if provided
      const threads = await (args.limit ? sortedQuery.take(args.limit) : sortedQuery.collect());
      
      return threads;
    } catch (error) {
      console.error('Error getting recent Gmail threads:', error);
      throw new Error(`Failed to get recent Gmail threads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// List Gmail threads for content analytics page - compatible with UI components
export const listUserGmailThreads = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      // Fetch threads from the gmailThreads table
      const threads = await ctx.db
        .query("gmailThreads")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .order("desc")
        .collect();
      
      // Transform threads to match the GmailContentItem format for UI
      return threads.map(thread => {
        // Extract the first message in the thread for display
        const firstMessage = thread.messages && thread.messages.length > 0 ? thread.messages[0] : null;
        
        // Determine if this is a newsletter or regular email (basic logic - can be enhanced)
        let emailType: 'newsletter' | 'partnership' | 'individual' | 'other' = 'individual';
        const from = firstMessage?.from || thread.data?.from || '';
        const subject = firstMessage?.subject || thread.data?.subject || 'No Subject';
        
        // Simple heuristic to guess email type - could be improved with more sophisticated logic
        if (from.toLowerCase().includes('newsletter') || subject.toLowerCase().includes('newsletter')) {
          emailType = 'newsletter';
        } else if (from.toLowerCase().includes('partner') || subject.toLowerCase().includes('partner')) {
          emailType = 'partnership';
        } else if ((thread.message_count && thread.message_count > 3) || (thread.messages && thread.messages.length > 3)) {
          // Longer threads are more likely to be individual conversations
          emailType = 'individual';
        } else {
          emailType = 'other';
        }
        
        return {
          id: thread.threadId || '',
          platform: 'gmail' as const,
          publishedAt: thread.createdAt ? new Date(thread.createdAt).toISOString() : new Date().toISOString(),
          content: {
            subject: subject,
            from: from,
            snippet: thread.snippet || firstMessage?.snippet || '',
            threadId: thread.threadId,
            messageCount: thread.message_count || (thread.messages?.length || 0),
            emailType: emailType, // Add required emailType property
            // Use default value for recipients as it's optional in the interface
            recipients: 1 // Default to 1 recipient
          },
          metrics: {
            // These would normally come from Gmail analytics data
            // For now, we'll use placeholders or default values
            replies: thread.message_count ? thread.message_count - 1 : 0,
            openRate: 0.75, // Placeholder
            clickRate: 0.25, // Placeholder
          }
        };
      });
    } catch (error) {
      console.error('Error listing Gmail threads:', error);
      throw new Error(`Failed to list Gmail threads: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
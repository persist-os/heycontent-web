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

// Fetch a batch of unreviewed Gmail threads for spam review
export const getUnreviewedGmailThreads = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    let q = ctx.db
      .query("gmailThreads")
      .withIndex("by_userId", q => q.eq("userId", args.userId))
      .filter(q => q.eq(q.field("spamStatus"), "unreviewed"))
      .order("desc");
    const threads = args.limit ? await q.take(args.limit) : await q.collect();
    return threads;
  },
});

function isNonEmptyString(val) {
  return typeof val === 'string' && val.trim().length > 0;
}

// List Gmail threads for content analytics page - compatible with UI components
export const listUserGmailThreads = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      const threads = await ctx.db
        .query("gmailThreads")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .order("desc")
        .collect();

      // Debug log: log the raw threads from Convex
      console.log('Convex: Raw threads from DB:', JSON.stringify(threads, null, 2));

      // Return threads as-is (UI should use thread.data for user-visible fields)
      return threads;
    } catch (error) {
      console.error('Error in listUserGmailThreads:', error);
      return [];
    }
  }
});

// List Gmail messages for content analytics page - fetches individual messages with clean data
export const listUserGmailMessages = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      const messages = await ctx.db
        .query("gmailMessages")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .filter((q) => 
          // Filter out spam messages
          q.neq(q.field("labelIds"), ["SPAM"])
        )
        .order("desc")
        .collect();

      // Return messages as-is (UI should use message.data for user-visible fields)
      return messages;
    } catch (error) {
      console.error('Error in listUserGmailMessages:', error);
      return [];
    }
  }
});

// In gmailQueries.ts - Enhanced query that returns threads with messages (filtering done at entry level)
export const getGmailThreadsWithMessages = query({
  args: { userId: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    try {
      // Get threads (already filtered at entry level)
      const threads = await ctx.db
        .query("gmailThreads")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(args.limit || 50);
      
      if (threads.length === 0) return [];
      
      // Get ALL messages for these threads in ONE query (fixes N+1 problem)
      const threadIds = threads.map(t => t.threadId);
      const allMessages = await ctx.db
        .query("gmailMessages")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .filter((q) => {
          // Filter to only messages from our threads
          return threadIds.some(threadId => q.eq(q.field("threadId"), threadId));
        })
        .collect();
      
      // Group messages by threadId
      const messagesByThread = allMessages.reduce((acc, msg) => {
        if (!acc[msg.threadId]) acc[msg.threadId] = [];
        acc[msg.threadId].push(msg);
        return acc;
      }, {} as Record<string, typeof allMessages>);
      
      // Build response - maintaining frontend compatibility
      const enhancedThreads = threads.map(thread => {
        const threadMessages = messagesByThread[thread.threadId] || [];
        
        // Get the FIRST message (original email) for thread summary
        const firstMessage = threadMessages.sort((a, b) => {
          const aDate = a.data?.internalDate || a.createdAt || 0;
          const bDate = b.data?.internalDate || b.createdAt || 0;
          return aDate - bDate; // Ascending = oldest first
        })[0];
        
        // Get the MOST RECENT message for snippet (better preview)
        const recentMessage = threadMessages.sort((a, b) => {
          const aDate = a.data?.internalDate || a.createdAt || 0;
          const bDate = b.data?.internalDate || b.createdAt || 0;
          return bDate - aDate; // Descending = newest first
        })[0];
        
        // Try multiple sources for snippet (prioritize most recent message)
        const snippet = recentMessage?.data?.snippet || 
                       firstMessage?.data?.snippet || 
                       thread.data?.snippet || 
                       thread.snippet || 
                       // If still no snippet, try to extract from message body
                       (recentMessage?.data?.body && recentMessage.data.body.substring(0, 150)) ||
                       'No preview available';
        
        const subject = firstMessage?.data?.subject || thread.subject || 'No Subject';
        const from = firstMessage?.data?.from || thread.from || 'Unknown Sender';
        
        // Return the SAME format your frontend expects
        return {
          ...thread,
          data: {
            ...thread.data,
            // Ensure first message data is available at thread level
            subject: subject,
            from: from,
            snippet: snippet,
            threadId: thread.threadId,
            emailId: firstMessage?.messageId,
          },
          messages: threadMessages // Include full message list if needed
        };
      });
      
      console.log(`📧 Convex Gmail Query: Returning ${enhancedThreads.length} threads (filtering done at entry level)`);
      
      return enhancedThreads;
    } catch (error) {
      console.error('Error in getGmailThreadsWithMessages:', error);
      return []; // Return empty array for graceful frontend handling
    }
  },
});

// Get Gmail account for a user
export const getGmailAccount = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    // Always return null on any error to prevent frontend crashes
    try {
      // Validate input
      if (!args.userId || typeof args.userId !== 'string' || args.userId.trim() === '') {
        console.log('[getGmailAccount] Invalid userId provided:', args.userId);
        return null;
      }

      console.log('[getGmailAccount] Querying for userId:', args.userId);
      
      // Try to get account with index
      const account = await ctx.db
        .query("gmailAccounts")
        .withIndex("by_userId", q => q.eq("userId", args.userId))
        .first();
      
      console.log('[getGmailAccount] Found account:', account ? {
        userId: account.userId,
        email: account.email,
        hasData: !!account.data,
        createdAt: account.createdAt,
        updatedAt: account.updatedAt
      } : 'No account found');
      
      return account || null;
    } catch (error) {
      console.error('[getGmailAccount] Error (returning null to prevent crashes):', error);
      // ALWAYS return null instead of throwing to prevent frontend crashes
      return null;
    }
  },
});

// Get Gmail batch analysis insights
export const getGmailBatchAnalysis = query({
  args: {
    userId: v.string(),
    gmailAccountId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Validate inputs
      if (!args.userId || typeof args.userId !== 'string' || args.userId.trim() === '') {
        console.log('[getGmailBatchAnalysis] Invalid userId provided:', args.userId);
        return null;
      }
      
      if (!args.gmailAccountId || typeof args.gmailAccountId !== 'string' || args.gmailAccountId.trim() === '') {
        console.log('[getGmailBatchAnalysis] Invalid gmailAccountId provided:', args.gmailAccountId);
        return null;
      }

      console.log('[getGmailBatchAnalysis] Querying with:', { 
        userId: args.userId, 
        gmailAccountId: args.gmailAccountId 
      });
      
      const analysis = await ctx.db
        .query("gmailBatchAnalysis")
        .withIndex("by_user_account", q => 
          q.eq("userId", args.userId)
           .eq("gmailAccountId", args.gmailAccountId)
        )
        .first();

      console.log('[getGmailBatchAnalysis] Found analysis:', analysis ? {
        userId: analysis.userId,
        gmailAccountId: analysis.gmailAccountId,
        hasInsights: !!analysis.insights,
        insightsKeys: analysis.insights ? Object.keys(analysis.insights) : null,
        createdAt: analysis.createdAt,
        updatedAt: analysis.updatedAt
      } : 'No analysis found');

      if (!analysis) {
        return null;
      }

      return {
        _id: analysis._id,
        userId: analysis.userId,
        gmailAccountId: analysis.gmailAccountId,
        insights: analysis.insights,
        updatedAt: analysis.updatedAt || analysis._creationTime
      };
    } catch (error) {
      console.error("Error fetching Gmail batch analysis:", error);
      // Return null instead of throwing to prevent frontend crashes
      return null;
    }
  },
});

// Get Gmail threads for analysis
export const getGmailThreads = query({
  args: { 
    userId: v.string(),
    email: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const threads = await ctx.db
      .query("gmailThreads")
      .withIndex("by_user_email", q => 
        q.eq("userId", args.userId).eq("email", args.email)
      )
      .order("desc")
      .take(args.limit || 50);
    
    return threads;
  },
});

// Get Gmail messages for analysis
export const getGmailMessages = query({
  args: { 
    userId: v.string(),
    email: v.string(),
    limit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("gmailMessages")
      .withIndex("by_user_email", q => 
        q.eq("userId", args.userId).eq("email", args.email)
      )
      .order("desc")
      .take(args.limit || 100);
    
    return messages;
  },
});

// Debug query to check Gmail data for a user
export const debugGmailData = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    try {
      console.log('[debugGmailData] Checking Gmail data for userId:', args.userId);
      
      // Check Gmail accounts
      const accounts = await ctx.db
        .query("gmailAccounts")
        .filter(q => q.eq(q.field("userId"), args.userId))
        .collect();
      
      // Check Gmail tokens
      const tokens = await ctx.db
        .query("gmailTokens")
        .filter(q => q.eq(q.field("userId"), args.userId))
        .collect();
      
      // Check Gmail threads
      const threads = await ctx.db
        .query("gmailThreads")
        .filter(q => q.eq(q.field("userId"), args.userId))
        .take(5); // Just first 5 for debugging
      
      // Check Gmail messages
      const messages = await ctx.db
        .query("gmailMessages")
        .filter(q => q.eq(q.field("userId"), args.userId))
        .take(5); // Just first 5 for debugging
      
      const result = {
        userId: args.userId,
        accounts: accounts.length,
        tokens: tokens.length,
        threads: threads.length,
        messages: messages.length,
        accountDetails: accounts.map(acc => ({
          email: acc.email,
          createdAt: acc.createdAt,
          updatedAt: acc.updatedAt,
          hasData: !!acc.data
        })),
        tokenDetails: tokens.map(token => ({
          hasAccessToken: !!token.accessToken,
          hasRefreshToken: !!token.refreshToken,
          expiryDate: token.expiryDate,
          lastRefreshed: token.lastRefreshed
        }))
      };
      
      console.log('[debugGmailData] Result:', result);
      return result;
    } catch (error) {
      console.error('[debugGmailData] Error:', error);
      return {
        userId: args.userId,
        error: error.message,
        accounts: 0,
        tokens: 0,
        threads: 0,
        messages: 0
      };
    }
  },
});
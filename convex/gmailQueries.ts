// Written by Aria
import { v } from "convex/values";
import { query } from "./_generated/server";
import { paginationOptsValidator } from "convex/server";
import { getGmailTokenArgsValidator } from "./types/gmail";

// Get Gmail account data for a user
export const getGmailAccounts = query({
  args: { userId: v.string() },
  returns: v.array(v.object({
    _id: v.id("gmailAccounts"),
    _creationTime: v.number(),
    userId: v.string(),
    email: v.string(),
    historyId: v.optional(v.string()),
    messagesTotal: v.optional(v.number()),
    threadsTotal: v.optional(v.number()),
    labelsTotal: v.optional(v.union(v.number(), v.null())),
    data: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("gmailAccounts")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

// Get Gmail account by email (for collision detection - checks across all users)
export const getGmailAccountByEmailGlobal = query({
  args: { email: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("gmailAccounts"),
      _creationTime: v.number(),
      userId: v.string(),
      email: v.string(),
      historyId: v.optional(v.string()),
      messagesTotal: v.optional(v.number()),
      threadsTotal: v.optional(v.number()),
      labelsTotal: v.optional(v.union(v.number(), v.null())),
      data: v.optional(v.any()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("gmailAccounts")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
  },
});

// Get Gmail token for a user
export const getGmailToken = query({
  args: getGmailTokenArgsValidator,
  returns: v.union(
    v.object({
      _id: v.id("gmailTokens"),
      _creationTime: v.number(),
      userId: v.string(),
      accessToken: v.string(),
      refreshToken: v.string(),
      expiryDate: v.number(),
      scope: v.string(),
      lastRefreshed: v.number(),
      tokenType: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("gmailTokens")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// Paginated query for Gmail threads - handles massive datasets efficiently
export const getGmailThreadsPaginated = query({
  args: { 
    userId: v.string(),
    email: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("gmailThreads"),
      _creationTime: v.number(),
      userId: v.string(),
      email: v.string(),
      threadId: v.string(),
      from: v.optional(v.string()),
      subject: v.optional(v.string()),
      snippet: v.optional(v.string()),
      message_count: v.optional(v.number()),
      messages: v.optional(v.array(v.object({
        id: v.string(),
        from: v.optional(v.string()),
        subject: v.optional(v.string()),
        snippet: v.optional(v.string()),
        label_ids: v.optional(v.array(v.string())),
      }))),
      data: v.optional(v.any()),
      analysis: v.optional(v.any()),
      category: v.optional(v.union(
        v.literal("partnership"),
        v.literal("media"),
        v.literal("business"),
        v.literal("community"),
        v.literal("none")
      )),
      spamStatus: v.optional(v.union(
        v.literal('unreviewed'),
        v.literal('flagged'),
        v.literal('confirmed_spam'),
        v.literal('not_spam')
      )),
      spamScore: v.optional(v.number()),
      reviewedByUser: v.optional(v.boolean()),
      reviewedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
    pageStatus: v.optional(v.any()),
    splitCursor: v.optional(v.union(v.string(), v.null())),
  }),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("gmailThreads")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc");
    
    // Filter by email if provided
    if (args.email) {
      query = query.filter((q) => q.eq(q.field("email"), args.email));
    }
    
    return await query.paginate(args.paginationOpts);
  },
});

// Paginated query for Gmail messages - handles massive datasets efficiently
export const getGmailMessagesPaginated = query({
  args: { 
    userId: v.string(),
    email: v.optional(v.string()),
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    page: v.array(v.object({
      _id: v.id("gmailMessages"),
      _creationTime: v.number(),
      userId: v.string(),
      email: v.string(),
      messageId: v.string(),
      threadId: v.string(),
      from: v.optional(v.string()),
      subject: v.optional(v.string()),
      snippet: v.optional(v.string()),
      labelIds: v.optional(v.array(v.string())),
      internalDate: v.optional(v.string()),
      sizeEstimate: v.optional(v.number()),
      historyId: v.optional(v.string()),
      data: v.optional(v.any()),
      category: v.optional(v.union(
        v.literal("partnership"),
        v.literal("media"),
        v.literal("business"),
        v.literal("community"),
        v.literal("none")
      )),
      spamStatus: v.optional(v.union(
        v.literal('unreviewed'),
        v.literal('flagged'),
        v.literal('confirmed_spam'),
        v.literal('not_spam')
      )),
      spamScore: v.optional(v.number()),
      reviewedByUser: v.optional(v.boolean()),
      reviewedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    })),
    isDone: v.boolean(),
    continueCursor: v.union(v.string(), v.null()),
    pageStatus: v.optional(v.any()),
    splitCursor: v.optional(v.union(v.string(), v.null())),
  }),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("gmailMessages")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc");
    
    // Filter by email if provided
    if (args.email) {
      query = query.filter((q) => q.eq(q.field("email"), args.email));
    }
    
    return await query.paginate(args.paginationOpts);
  },
});

// Get limited recent Gmail threads (for UI components that need small datasets)
export const getRecentGmailThreads = query({
  args: { 
    userId: v.string(),
    email: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(v.object({
    _id: v.id("gmailThreads"),
    _creationTime: v.number(),
    userId: v.string(),
    email: v.string(),
    threadId: v.string(),
    from: v.optional(v.string()),
    subject: v.optional(v.string()),
    snippet: v.optional(v.string()),
    message_count: v.optional(v.number()),
    messages: v.optional(v.array(v.object({
      id: v.string(),
      from: v.optional(v.string()),
      subject: v.optional(v.string()),
      snippet: v.optional(v.string()),
      label_ids: v.optional(v.array(v.string())),
    }))),
    data: v.optional(v.any()),
    analysis: v.optional(v.any()),
    category: v.optional(v.union(
      v.literal("partnership"),
      v.literal("media"),
      v.literal("business"),
      v.literal("community"),
      v.literal("none")
    )),
    spamStatus: v.optional(v.union(
      v.literal('unreviewed'),
      v.literal('flagged'),
      v.literal('confirmed_spam'),
      v.literal('not_spam')
    )),
    spamScore: v.optional(v.number()),
    reviewedByUser: v.optional(v.boolean()),
    reviewedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    let query = ctx.db
      .query("gmailThreads")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc");
    
    // Filter by email if provided
    if (args.email) {
      query = query.filter((q) => q.eq(q.field("email"), args.email));
    }
    
    return await query.take(args.limit || 50);
  },
});

// Get Gmail threads by user and email with index (for analysis)
export const getGmailThreadsByUserEmail = query({
  args: { 
    userId: v.string(),
    email: v.string(),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    _id: v.id("gmailThreads"),
    _creationTime: v.number(),
    userId: v.string(),
    email: v.string(),
    threadId: v.string(),
    from: v.optional(v.string()),
    subject: v.optional(v.string()),
    snippet: v.optional(v.string()),
    message_count: v.optional(v.number()),
    messages: v.optional(v.array(v.object({
      id: v.string(),
      from: v.optional(v.string()),
      subject: v.optional(v.string()),
      snippet: v.optional(v.string()),
      label_ids: v.optional(v.array(v.string())),
    }))),
    data: v.optional(v.any()),
    analysis: v.optional(v.any()),
    category: v.optional(v.union(
      v.literal("partnership"),
      v.literal("media"),
      v.literal("business"),
      v.literal("community"),
      v.literal("none")
    )),
    spamStatus: v.optional(v.union(
      v.literal('unreviewed'),
      v.literal('flagged'),
      v.literal('confirmed_spam'),
      v.literal('not_spam')
    )),
    spamScore: v.optional(v.number()),
    reviewedByUser: v.optional(v.boolean()),
    reviewedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("gmailThreads")
      .withIndex("by_user_email", q => 
        q.eq("userId", args.userId).eq("email", args.email)
      )
      .order("desc")
      .take(args.limit || 50);
  },
});

// Get Gmail thread by threadId and userId (for linking)
export const getGmailThreadByThreadId = query({
  args: { 
    userId: v.string(),
    threadId: v.string() 
  },
  returns: v.union(
    v.object({
      _id: v.id("gmailThreads"),
      _creationTime: v.number(),
      userId: v.string(),
      email: v.string(),
      threadId: v.string(),
      from: v.optional(v.string()),
      subject: v.optional(v.string()),
      snippet: v.optional(v.string()),
      message_count: v.optional(v.number()),
      messages: v.optional(v.array(v.object({
        id: v.string(),
        from: v.optional(v.string()),
        subject: v.optional(v.string()),
        snippet: v.optional(v.string()),
        label_ids: v.optional(v.array(v.string())),
      }))),
      data: v.optional(v.any()),
      analysis: v.optional(v.any()),
      category: v.optional(v.union(
        v.literal("partnership"),
        v.literal("media"),
        v.literal("business"),
        v.literal("community"),
        v.literal("none")
      )),
      spamStatus: v.optional(v.union(
        v.literal('unreviewed'),
        v.literal('flagged'),
        v.literal('confirmed_spam'),
        v.literal('not_spam')
      )),
      spamScore: v.optional(v.number()),
      reviewedByUser: v.optional(v.boolean()),
      reviewedAt: v.optional(v.number()),
      createdAt: v.number(),
      updatedAt: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("gmailThreads")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .first();
  },
});

// Get Gmail messages for a specific thread (optimized for thread view)
export const getGmailMessagesForThread = query({
  args: { 
    userId: v.string(),
    threadId: v.string(),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    _id: v.id("gmailMessages"),
    _creationTime: v.number(),
    userId: v.string(),
    email: v.string(),
    messageId: v.string(),
    threadId: v.string(),
    from: v.optional(v.string()),
    subject: v.optional(v.string()),
    snippet: v.optional(v.string()),
    labelIds: v.optional(v.array(v.string())),
    internalDate: v.optional(v.string()),
    sizeEstimate: v.optional(v.number()),
    historyId: v.optional(v.string()),
    data: v.optional(v.any()),
    category: v.optional(v.union(
      v.literal("partnership"),
      v.literal("media"),
      v.literal("business"),
      v.literal("community"),
      v.literal("none")
    )),
    spamStatus: v.optional(v.union(
      v.literal('unreviewed'),
      v.literal('flagged'),
      v.literal('confirmed_spam'),
      v.literal('not_spam')
    )),
    spamScore: v.optional(v.number()),
    reviewedByUser: v.optional(v.boolean()),
    reviewedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("gmailMessages")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .filter((q) => q.eq(q.field("userId"), args.userId))
      .order("asc")
      .take(args.limit || 100);
  },
});

// Get Gmail batch analysis insights
export const getGmailBatchAnalysis = query({
  args: {
    userId: v.string(),
    gmailAccountId: v.string(),
  },
  returns: v.union(
    v.object({
      _id: v.id("gmailBatchAnalysis"),
      userId: v.string(),
      gmailAccountId: v.string(),
      insights: v.optional(v.any()),
      status: v.optional(v.any()),
      updatedAt: v.optional(v.number()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const analysis = await ctx.db
      .query("gmailBatchAnalysis")
      .withIndex("by_user_account", q => 
        q.eq("userId", args.userId)
         .eq("gmailAccountId", args.gmailAccountId)
      )
      .first();

    if (!analysis) {
      return null;
    }

    return {
      _id: analysis._id,
      userId: analysis.userId,
      gmailAccountId: analysis.gmailAccountId,
      insights: analysis.insights,
      status: analysis.status,
      updatedAt: analysis.updatedAt || analysis._creationTime
    };
  },
});

// Get recent threads for content hub (limited to 3 for performance)
export const getRecentThreadsForContentHub = query({
  args: { userId: v.string() },
  returns: v.array(v.object({
    id: v.string(),
    subject: v.string(),
    snippet: v.string(),
    from: v.string(),
    to: v.string(),
    messageCount: v.number(),
    timestamp: v.number(),
    email: v.string(),
  })),
  handler: async (ctx, args) => {
    const threads = await ctx.db
      .query("gmailThreads")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(3);

    return threads.map(thread => ({
      id: thread.threadId,
      subject: thread.data?.subject || thread.subject || 'No Subject',
      snippet: thread.data?.snippet || thread.snippet || '',
      from: thread.data?.from || thread.from || 'Unknown Sender',
      to: thread.data?.to || '',
      messageCount: thread.message_count || 1,
      timestamp: thread.createdAt || Date.now(),
      email: thread.email
    }));
  },
});
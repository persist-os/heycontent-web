// Written by Aria
import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Helper function to determine if an email is useful for content analysis
function isEmailUsefulForContentAnalysis(
  subject: string, 
  sender: string, 
  snippet: string, 
  labelIds: string[] = []
): { isUseful: boolean; reason: string } {
  try {
    // Normalize strings for checking
    const normalizedSubject = (subject || '').trim().toLowerCase();
    const normalizedSender = (sender || '').trim().toLowerCase();
    const normalizedSnippet = (snippet || '').trim().toLowerCase();
    
    // 1. Only filter out SPAM and TRASH - keep promotions/social for AI analysis
    const hardSpamLabels = ['SPAM', 'TRASH'];
    const matchedSpamLabels = hardSpamLabels.filter(label => labelIds.includes(label));
    if (matchedSpamLabels.length > 0) {
      return { isUseful: false, reason: `Hard spam/trash: ${matchedSpamLabels.join(', ')}` };
    }
    
    // 2. Only filter completely empty emails (no content at all)
    const hasNoContent = (
      (!normalizedSubject || normalizedSubject.length <= 1) &&
      (!normalizedSender || normalizedSender.length <= 1) &&
      (!normalizedSnippet || normalizedSnippet.length <= 5)
    );
    
    if (hasNoContent) {
      return { isUseful: false, reason: "Completely empty email (no subject, sender, or content)" };
    }
    
    // 3. Only filter obvious automated system emails (much more restrictive)
    const systemPatterns = [
      'mailer-daemon', 'postmaster', 'delivery-failure', 'mail-delivery-subsystem'
    ];
    
    const isSystemEmail = systemPatterns.some(pattern => 
      normalizedSender.includes(pattern) || normalizedSubject.includes(pattern)
    );
    
    if (isSystemEmail) {
      return { isUseful: false, reason: `System email detected: ${systemPatterns.find(p => normalizedSender.includes(p) || normalizedSubject.includes(p))}` };
    }
    
    // Email passed minimal filters - allow it for AI analysis
    // AI can decide if it's a partnership opportunity or not
    return { isUseful: true, reason: "Passed minimal quality filters - AI will analyze" };
    
  } catch (error) {
    console.error('Error in email filtering:', error);
    // On error, err on the side of inclusion
    return { isUseful: true, reason: `Error in filtering (included): ${error}` };
  }
}

// Update Gmail tokens
export const updateGmailToken = mutation({
  args: {
    userId: v.string(),
    accessToken: v.string(),
    refreshToken: v.string(),
    expiryDate: v.number(),
    scope: v.string(),
    tokenType: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      // Check if token already exists
      const existingToken = await ctx.db
        .query("gmailTokens")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .first();

      const now = Date.now();

      if (existingToken) {
        // Update existing token
        await ctx.db.patch(existingToken._id, {
          accessToken: args.accessToken,
          refreshToken: args.refreshToken,
          expiryDate: args.expiryDate,
          scope: args.scope,
          lastRefreshed: now,
          tokenType: args.tokenType,
        });
        return { status: "updated", tokenId: existingToken._id };
      } else {
        // Insert new token
        const tokenId = await ctx.db.insert("gmailTokens", {
          userId: args.userId,
          accessToken: args.accessToken,
          refreshToken: args.refreshToken,
          expiryDate: args.expiryDate,
          scope: args.scope,
          lastRefreshed: now,
          tokenType: args.tokenType,
        });
        return { status: "created", tokenId };
      }
    } catch (error) {
      console.error('Error updating Gmail token:', error);
      throw new Error(`Failed to update Gmail token: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Store Gmail message
export const storeGmailMessage = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    messageId: v.string(),
    threadId: v.string(),
    data: v.any(), // All user-visible info is now inside 'data'
    historyId: v.optional(v.string()),
    internalDate: v.optional(v.number()),
    labelIds: v.optional(v.array(v.string())),
    sizeEstimate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const now = Date.now();
      
      // Extract fields for filtering
      const subject = args.data?.subject || '';
      const sender = args.data?.from || '';
      const snippet = args.data?.snippet || '';
      const labelIds = args.labelIds || args.data?.labelIds || args.data?.label_ids || [];
      
      // Apply filtering at Convex level
      const filterResult = isEmailUsefulForContentAnalysis(subject, sender, snippet, labelIds);
      if (!filterResult.isUseful) {
        console.log(`Filtering out message ${args.messageId}: ${filterResult.reason}`);
        return { status: "filtered", reason: filterResult.reason };
      }
      
      // Check if the message already exists
      const existingMessage = await ctx.db
        .query("gmailMessages")
        .withIndex("by_messageId", (q) => q.eq("messageId", args.messageId))
        .filter((q) => 
          q.eq(q.field("userId"), args.userId) && 
          q.eq(q.field("email"), args.email)
        )
        .first();
      if (existingMessage) {
        await ctx.db.patch(existingMessage._id, {
          data: args.data,
          historyId: args.historyId,
          internalDate: args.internalDate ? args.internalDate.toString() : undefined,
          labelIds: args.labelIds,
          sizeEstimate: args.sizeEstimate,
          updatedAt: now,
        });
        return { status: "updated", messageId: existingMessage._id };
      } else {
        const messageId = await ctx.db.insert("gmailMessages", {
          userId: args.userId,
          email: args.email,
          messageId: args.messageId,
          threadId: args.threadId,
          data: args.data,
          historyId: args.historyId,
          internalDate: args.internalDate ? args.internalDate.toString() : undefined,
          labelIds: args.labelIds,
          sizeEstimate: args.sizeEstimate,
          createdAt: now,
          updatedAt: now,
        });
        return { status: "created", messageId };
      }
    } catch (error) {
      console.error('Error storing Gmail message:', error);
      throw new Error(`Failed to store Gmail message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Store Gmail thread
export const storeGmailThread = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    threadId: v.string(),
    data: v.any(), // All user-visible info is now inside 'data'
    message_count: v.optional(v.number()),
    messages: v.optional(v.array(v.any())),
  },
  handler: async (ctx, args) => {
    try {
      const now = Date.now();
      
      // Extract fields for filtering from thread data or first message
      let subject = args.data?.subject || '';
      let sender = args.data?.from || '';
      let snippet = args.data?.snippet || '';
      let labelIds = args.data?.labelIds || [];
      
      // If thread has messages, use first message for filtering
      if (args.messages && Array.isArray(args.messages) && args.messages.length > 0) {
        const firstMessage = args.messages[0];
        subject = firstMessage.subject || subject;
        sender = firstMessage.from || sender;
        snippet = firstMessage.snippet || snippet;
        labelIds = firstMessage.labelIds || firstMessage.label_ids || labelIds;
      }
      
      // Apply filtering at Convex level
      const filterResult = isEmailUsefulForContentAnalysis(subject, sender, snippet, labelIds);
      if (!filterResult.isUseful) {
        console.log(`Filtering out thread ${args.threadId}: ${filterResult.reason}`);
        return { status: "filtered", reason: filterResult.reason };
      }
      
      const existingThread = await ctx.db
        .query("gmailThreads")
        .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
        .filter((q) => 
          q.eq(q.field("userId"), args.userId) && 
          q.eq(q.field("email"), args.email)
        )
        .first();
      if (existingThread) {
        await ctx.db.patch(existingThread._id, {
          data: args.data,
          message_count: args.message_count,
          messages: args.messages,
          updatedAt: now,
        });
        return { status: "updated", threadId: existingThread._id };
      } else {
        const threadId = await ctx.db.insert("gmailThreads", {
          userId: args.userId,
          email: args.email,
          threadId: args.threadId,
          data: args.data,
          message_count: args.message_count,
          messages: args.messages,
          createdAt: now,
          updatedAt: now,
        });
        return { status: "created", threadId };
      }
    } catch (error) {
      console.error('Error storing Gmail thread:', error);
      throw new Error(`Failed to store Gmail thread: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Disconnect Gmail
export const disconnectGmail = mutation({
  args: { 
    userId: v.string(),
    email: v.optional(v.string()) // Optional: if provided, only disconnect this specific email
  },
  handler: async (ctx, args) => {
    const { userId, email } = args;

    try {
      let totalDeleted = 0;
      
      // Define the collections to clean up
      const collections = ['gmailAccounts', 'gmailThreads', 'gmailMessages', 'gmailHistory'];
      
      // Delete data from each collection
      for (const collection of collections) {
        let items;
        if (email) {
          // Delete only data for the specified email
          items = await ctx.db
            .query(collection as any)
            .withIndex("by_email", (q) => q.eq("email", email))
            .filter(q => q.eq(q.field("userId"), userId))
            .collect();
        } else {
          // Delete all data for this user
          items = await ctx.db
            .query(collection as any)
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .collect();
        }
        
        // Delete the items
        const batchSize = 100;
        for (let i = 0; i < items.length; i += batchSize) {
          const batch = items.slice(i, i + batchSize);
          await Promise.all(batch.map(item => ctx.db.delete(item._id)));
          totalDeleted += batch.length;
        }
      }
      
      // If no specific email is provided, also delete tokens
      if (!email) {
        const tokens = await ctx.db
          .query("gmailTokens")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .collect();

        for (const token of tokens) {
          await ctx.db.delete(token._id);
          totalDeleted++;
        }
      }

      return { 
        success: true, 
        itemsDeleted: totalDeleted 
      };
    } catch (error) {
      console.error('Error disconnecting Gmail:', error);
      throw new Error(`Failed to disconnect Gmail: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Store batch of Gmail messages
export const storeBatchGmailMessages = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    messages: v.array(v.object({
      messageId: v.string(),
      threadId: v.string(),
      data: v.any(), // All user-visible info is now inside 'data'
      historyId: v.optional(v.string()),
      internalDate: v.optional(v.number()),
      labelIds: v.optional(v.array(v.string())),
      sizeEstimate: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    try {
      const now = Date.now();
      const results = [];
      for (const message of args.messages) {
        const existingMessage = await ctx.db
          .query("gmailMessages")
          .withIndex("by_messageId", (q) => q.eq("messageId", message.messageId))
          .filter((q) => 
            q.eq(q.field("userId"), args.userId) && 
            q.eq(q.field("email"), args.email)
          )
          .first();
        if (existingMessage) {
          await ctx.db.patch(existingMessage._id, {
            data: message.data,
            historyId: message.historyId,
            internalDate: message.internalDate ? message.internalDate.toString() : undefined,
            labelIds: message.labelIds,
            sizeEstimate: message.sizeEstimate,
            updatedAt: now,
          });
          results.push({ messageId: message.messageId, status: "updated" });
        } else {
          await ctx.db.insert("gmailMessages", {
            userId: args.userId,
            email: args.email,
            messageId: message.messageId,
            threadId: message.threadId,
            data: message.data,
            historyId: message.historyId,
            internalDate: message.internalDate ? message.internalDate.toString() : undefined,
            labelIds: message.labelIds,
            sizeEstimate: message.sizeEstimate,
            createdAt: now,
            updatedAt: now,
          });
          results.push({ messageId: message.messageId, status: "created" });
        }
      }
      return { success: true, results };
    } catch (error) {
      console.error('Error storing batch Gmail messages:', error);
      throw new Error(`Failed to store batch Gmail messages: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Store full Gmail profile, ensuring no duplicates
export const storeGmailFullProfile = mutation({
  args: {
    userId: v.string(),
    account: v.any(),
    messages: v.optional(v.array(v.any())),
    threads: v.optional(v.array(v.any())),
  },
  handler: async (ctx, args) => {
    try {
      const now = Date.now();
      const { userId, account, messages, threads } = args;
      if (!account || !account.email) {
        throw new Error("Account and email are required");
      }
      const email = account.email;
      const profile = {
        emailAddress: account.email,
        messagesTotal: account.messagesTotal,
        threadsTotal: account.threadsTotal,
        historyId: account.historyId,
        labelsTotal: account.labelsTotal,
      };
      const existingAccount = await ctx.db
        .query("gmailAccounts")
        .withIndex("by_email", (q) => q.eq("email", email))
        .filter(q => q.eq(q.field("userId"), userId))
        .first();
      if (existingAccount) {
        await ctx.db.patch(existingAccount._id, {
          messagesTotal: profile.messagesTotal,
          threadsTotal: profile.threadsTotal,
          historyId: profile.historyId,
          labelsTotal: profile.labelsTotal,
          data: account,
          updatedAt: now,
        });
        // Store messages if provided
        if (Array.isArray(messages)) {
          let totalMessages = 0;
          let storedMessages = 0;
          let filteredMessages = 0;
          
          for (const msg of messages) {
            totalMessages++;
            const messageId = msg.id || msg.messageId;
            if (!messageId) {
              console.warn(`Skipping message with undefined messageId: ${JSON.stringify(msg)}`);
              continue;
            }
            const threadId = msg.threadId;
            const data = msg.data || msg; // Expect all user-visible info in data
            
            // Extract fields for filtering
            const subject = data.subject || '';
            const sender = data.from || '';
            const snippet = data.snippet || '';
            const labelIds = data.labelIds || data.label_ids || [];
            
            // Apply filtering at Convex level
            const filterResult = isEmailUsefulForContentAnalysis(subject, sender, snippet, labelIds);
            if (!filterResult.isUseful) {
              filteredMessages++;
              console.log(`Filtering out message ${messageId}: ${filterResult.reason}`);
              continue; // Skip storing this message
            }
            
            const existingMsg = await ctx.db
              .query("gmailMessages")
              .withIndex("by_messageId", (q) => q.eq("messageId", messageId))
              .filter(q => 
                q.eq(q.field("userId"), userId) && 
                q.eq(q.field("email"), email)
              )
              .first();
            if (existingMsg) {
              await ctx.db.patch(existingMsg._id, {
                data,
                updatedAt: now,
              });
            } else {
              await ctx.db.insert("gmailMessages", {
                userId,
                email,
                messageId,
                threadId,
                data,
                createdAt: now,
                updatedAt: now,
              });
            }
            storedMessages++;
          }
          
          // Log filtering statistics
          console.log(`Gmail message filtering completed for ${email}:`, {
            totalMessages,
            storedMessages,
            filteredMessages,
            filterRate: totalMessages > 0 ? `${((filteredMessages / totalMessages) * 100).toFixed(1)}%` : '0%'
          });
        }
        // Store threads if provided
        if (Array.isArray(threads)) {
          let totalThreads = 0;
          let storedThreads = 0;
          let filteredThreads = 0;
          
          for (const thread of threads) {
            totalThreads++;
            const threadId = thread.id || thread.threadId || thread.data?.thread_id || thread.resourceId;
            if (!threadId) {
              console.warn(`Skipping thread with undefined threadId: ${JSON.stringify(thread)}`);
              continue;
            }
            const data = thread.data || thread; // Expect all user-visible info in data
            
            // For threads, check if the first message (if available) would be useful
            let shouldStoreThread = true;
            if (data.messages && Array.isArray(data.messages) && data.messages.length > 0) {
              const firstMessage = data.messages[0];
              const subject = firstMessage.subject || data.subject || '';
              const sender = firstMessage.from || data.from || '';
              const snippet = firstMessage.snippet || data.snippet || '';
              const labelIds = firstMessage.labelIds || firstMessage.label_ids || data.labelIds || [];
              
              const filterResult = isEmailUsefulForContentAnalysis(subject, sender, snippet, labelIds);
              if (!filterResult.isUseful) {
                filteredThreads++;
                console.log(`Filtering out thread ${threadId}: ${filterResult.reason}`);
                shouldStoreThread = false;
              }
            } else {
              // If no messages in thread, check thread-level data
              const subject = data.subject || '';
              const sender = data.from || '';
              const snippet = data.snippet || '';
              const labelIds = data.labelIds || [];
              
              const filterResult = isEmailUsefulForContentAnalysis(subject, sender, snippet, labelIds);
              if (!filterResult.isUseful) {
                filteredThreads++;
                console.log(`Filtering out thread ${threadId}: ${filterResult.reason}`);
                shouldStoreThread = false;
              }
            }
            
            if (!shouldStoreThread) {
              continue; // Skip storing this thread
            }
            
            const existingThread = await ctx.db
              .query("gmailThreads")
              .withIndex("by_threadId", (q) => q.eq("threadId", threadId))
              .filter(q => 
                q.eq(q.field("userId"), userId) && 
                q.eq(q.field("email"), email)
              )
              .first();
            if (existingThread) {
              await ctx.db.patch(existingThread._id, {
                data,
                updatedAt: now,
              });
            } else {
              await ctx.db.insert("gmailThreads", {
                userId,
                email,
                threadId,
                data,
                createdAt: now,
                updatedAt: now,
              });
            }
            storedThreads++;
          }
          
          // Log thread filtering statistics
          console.log(`Gmail thread filtering completed for ${email}:`, {
            totalThreads,
            storedThreads,
            filteredThreads,
            filterRate: totalThreads > 0 ? `${((filteredThreads / totalThreads) * 100).toFixed(1)}%` : '0%'
          });
        }
        return { status: "updated", accountId: existingAccount._id };
      } else {
        const accountId = await ctx.db.insert("gmailAccounts", {
          userId,
          email,
          historyId: profile.historyId,
          messagesTotal: profile.messagesTotal,
          threadsTotal: profile.threadsTotal,
          labelsTotal: profile.labelsTotal,
          data: account,
          createdAt: now,
          updatedAt: now,
        });
        if (Array.isArray(messages)) {
          for (const msg of messages) {
            const messageId = msg.id || msg.messageId;
            if (!messageId) {
              console.warn(`Skipping message with undefined messageId: ${JSON.stringify(msg)}`);
              continue;
            }
            const threadId = msg.threadId;
            const data = msg.data || msg;
            await ctx.db.insert("gmailMessages", {
              userId,
              email,
              messageId,
              threadId,
              data,
              createdAt: now,
              updatedAt: now,
            });
          }
        }
        if (Array.isArray(threads)) {
          for (const thread of threads) {
            const threadId = thread.id || thread.threadId;
            if (!threadId) {
              console.warn(`Skipping thread with undefined threadId: ${JSON.stringify(thread)}`);
              continue;
            }
            const data = thread.data || thread;
            await ctx.db.insert("gmailThreads", {
              userId,
              email,
              threadId,
              data,
              createdAt: now,
              updatedAt: now,
            });
          }
        }
        return { status: "created", accountId };
      }
    } catch (error) {
      console.error('Error storing Gmail profile:', error);
      throw new Error(`Failed to store Gmail profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Save just the profile data, updating if it exists
export const saveProfileData = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    profileData: v.object({
      messagesTotal: v.optional(v.number()),
      threadsTotal: v.optional(v.number()),
      historyId: v.optional(v.string()),
      labelsTotal: v.optional(v.number()),
    }),
  },
  handler: async (ctx, args) => {
    try {
      const now = Date.now();
      
      // Check if the account already exists
      const existingAccount = await ctx.db
        .query("gmailAccounts")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .filter(q => q.eq(q.field("userId"), args.userId))
        .first();

      if (existingAccount) {
        // Update just the profile metrics
        await ctx.db.patch(existingAccount._id, {
          messagesTotal: args.profileData.messagesTotal,
          threadsTotal: args.profileData.threadsTotal,
          historyId: args.profileData.historyId,
          labelsTotal: args.profileData.labelsTotal,
          updatedAt: now,
        });
        return { status: "updated", accountId: existingAccount._id };
      } else {
        // Create a new account entry if it does not exist
        const accountId = await ctx.db.insert("gmailAccounts", {
          userId: args.userId,
          email: args.email,
          messagesTotal: args.profileData.messagesTotal,
          threadsTotal: args.profileData.threadsTotal,
          historyId: args.profileData.historyId,
          labelsTotal: args.profileData.labelsTotal,
          data: {
            messagesTotal: args.profileData.messagesTotal,
            threadsTotal: args.profileData.threadsTotal,
            historyId: args.profileData.historyId,
            labelsTotal: args.profileData.labelsTotal,
          },
          createdAt: now,
          updatedAt: now,
        });
        return { status: "created", accountId };
      }
    } catch (error) {
      console.error('Error updating Gmail profile data:', error);
      throw new Error(`Failed to update Gmail profile data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Store AI analysis for a Gmail thread
export const storeGmailThreadAnalysis = mutation({
  args: {
    userId: v.string(),
    threadId: v.string(),
    analysis: v.any(), // Store as JSON
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    // Find the thread
    const thread = await ctx.db
      .query("gmailThreads")
      .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
      .filter(q => q.eq(q.field("userId"), args.userId))
      .first();
    if (!thread) throw new Error("Thread not found");
    // Patch the thread with the analysis
    await ctx.db.patch(thread._id, {
      analysis: args.analysis,
      updatedAt: now,
    });
    return { success: true };
  },
});

// One-time migration: copy data.messages to messages for all threads
export const migrateGmailThreadMessages = mutation({
  args: {},
  handler: async (ctx, args) => {
    const threads = await ctx.db.query("gmailThreads").collect();
    let updated = 0;
    for (const thread of threads) {
      if (
        thread.data &&
        Array.isArray(thread.data.messages) &&
        thread.data.messages.length > 0
      ) {
        await ctx.db.patch(thread._id, {
          messages: thread.data.messages,
        });
        updated++;
      }
    }
    return { updated };
  },
});

export const migrateThreadTopLevelFields = mutation({
  args: {},
  handler: async (ctx) => {
    const threads = await ctx.db.query("gmailThreads").collect();
    let updated = 0;
    for (const thread of threads) {
      const firstMessage = thread.messages && thread.messages.length > 0 ? thread.messages[0] : null;
      const from = firstMessage?.from || '';
      const subject = thread.data?.subject || firstMessage?.subject || '';
      const snippet = firstMessage?.snippet || thread.snippet || '';
      await ctx.db.patch(thread._id, { from, subject, snippet });
      updated++;
    }
    return { updated };
  },
});

// Update the spam status of a Gmail thread
export const updateGmailThreadSpamStatus = mutation({
  args: {
    userId: v.string(),
    threadId: v.string(),
    spamStatus: v.union(
      v.literal('flagged'),
      v.literal('confirmed_spam'),
      v.literal('not_spam')
    ),
    spamScore: v.optional(v.number()),
    reviewedByUser: v.optional(v.boolean()),
    reviewedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const thread = await ctx.db
      .query("gmailThreads")
      .withIndex("by_threadId", q => q.eq("threadId", args.threadId))
      .filter(q => q.eq(q.field("userId"), args.userId))
      .first();
    if (!thread) throw new Error("Thread not found");
    await ctx.db.patch(thread._id, {
      spamStatus: args.spamStatus,
      spamScore: args.spamScore,
      reviewedByUser: args.reviewedByUser,
      reviewedAt: args.reviewedAt,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

// Migration: Normalize top-level fields for all Gmail threads
export const normalizeGmailThreadTopLevelFields = mutation({
  args: {},
  handler: async (ctx, args) => {
    const threads = await ctx.db.query("gmailThreads").collect();
    let updated = 0;
    for (const thread of threads) {
      const firstMessage = thread.messages && thread.messages.length > 0 ? thread.messages[0] : null;
      if (firstMessage) {
        const patch: Record<string, any> = {};
        if (!thread.subject && firstMessage.subject) patch["subject"] = firstMessage.subject;
        if (!thread.from && firstMessage.from) patch["from"] = firstMessage.from;
        if (!thread.snippet && firstMessage.snippet) patch["snippet"] = firstMessage.snippet;
        if (Object.keys(patch).length > 0) {
          await ctx.db.patch(thread._id, patch);
          updated++;
        }
      }
    }
    return { updated };
  },
});

// TEMPORARY: Patch gmailMessages to fix 'from' field if possible
// REMOVE THIS MUTATION AFTER USE!
export const patchGmailMessageSenders = mutation({
  args: {},
  handler: async (ctx, args) => {
    const messages = await ctx.db.query("gmailMessages").collect();
    let updated = 0;
    for (const msg of messages) {
      if (msg.from === "unknown" && msg.data?.payload?.headers) {
        const headerFrom = msg.data.payload.headers.find(
          (h: any) => h.name && h.name.toLowerCase() === "from"
        );
        if (headerFrom && headerFrom.value && headerFrom.value.toLowerCase() !== "unknown") {
          await ctx.db.patch(msg._id, { from: headerFrom.value });
          updated++;
        } else if (msg.data?.from && msg.data.from.toLowerCase() !== "unknown") {
          await ctx.db.patch(msg._id, { from: msg.data.from });
          updated++;
        }
      }
    }
    return { updated };
  },
}); 

// TEMPORARY: Delete all Gmail data for a specific user (for testing clean slate)
// REMOVE THIS MUTATION AFTER USE!
export const deleteAllGmailDataForUser = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const collections = ['gmailAccounts', 'gmailThreads', 'gmailMessages', 'gmailHistory'];
    let totalDeleted = 0;
    for (const collection of collections) {
      const items = await ctx.db
        .query(collection as any)
        .withIndex('by_userId', q => q.eq('userId', args.userId))
        .collect();
      for (const item of items) {
        await ctx.db.delete(item._id);
        totalDeleted++;
      }
    }
    // Optionally delete Gmail tokens
    const tokens = await ctx.db
      .query('gmailTokens')
      .withIndex('by_userId', q => q.eq('userId', args.userId))
      .collect();
    for (const token of tokens) {
      await ctx.db.delete(token._id);
      totalDeleted++;
    }
    return { success: true, itemsDeleted: totalDeleted };
  },
});

// Migration: Move top-level subject/from/snippet into data and remove top-level fields
export const migrateGmailMessagesToDataOnly = mutation({
  args: {},
  handler: async (ctx) => {
    const messages = await ctx.db.query("gmailMessages").collect();
    let updated = 0;
    for (const msg of messages) {
      const data = { ...(msg.data || {}) };
      let needsUpdate = false;
      // Migrate subject
      if (!data.subject && msg.subject) {
        data.subject = msg.subject;
        needsUpdate = true;
      }
      // Migrate from
      if (!data.from && msg.from) {
        data.from = msg.from;
        needsUpdate = true;
      }
      // Migrate snippet
      if (!data.snippet && msg.snippet) {
        data.snippet = msg.snippet;
        needsUpdate = true;
      }
      if (needsUpdate || msg.subject !== undefined || msg.from !== undefined || msg.snippet !== undefined) {
        // Remove top-level fields
        await ctx.db.patch(msg._id, {
          data,
          subject: undefined,
          from: undefined,
          snippet: undefined,
        });
        updated++;
      }
    }
    return { updated };
  },
});

// Store Gmail batch analysis insights
export const storeGmailBatchAnalysis = mutation({
  args: {
    userId: v.string(),
    gmailAccountId: v.string(),
    insights: v.any(),
  },
  handler: async (ctx, args) => {
    const { userId, gmailAccountId, insights } = args;
    const now = Date.now();

    try {
      // Check if batch analysis already exists
      const existingAnalysis = await ctx.db
        .query("gmailBatchAnalysis")
        .withIndex("by_user_account", q => 
          q.eq("userId", userId)
           .eq("gmailAccountId", gmailAccountId)
        )
        .first();

      if (existingAnalysis) {
        // Update existing batch analysis
        await ctx.db.patch(existingAnalysis._id, {
          insights,
          updatedAt: now,
        });
        return { status: "updated", analysisId: existingAnalysis._id };
      } else {
        // Insert new batch analysis
        const id = await ctx.db.insert("gmailBatchAnalysis", {
          userId,
          gmailAccountId,
          insights,
          analysisType: "batch",
          createdAt: now,
          updatedAt: now,
        });
        return { status: "created", analysisId: id };
      }
    } catch (error) {
      console.error(`Error storing Gmail batch analysis for user ${userId}:`, error);
      throw new Error(`Failed to store Gmail batch analysis: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Debug mutation to manually create Gmail account record
export const createDebugGmailAccount = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const now = Date.now();
      
      // Check if account already exists
      const existing = await ctx.db
        .query("gmailAccounts")
        .filter(q => 
          q.eq(q.field("userId"), args.userId) && 
          q.eq(q.field("email"), args.email)
        )
        .first();
      
      if (existing) {
        return { 
          success: true, 
          message: "Account already exists", 
          accountId: existing._id 
        };
      }
      
      // Create new account record
      const accountId = await ctx.db.insert("gmailAccounts", {
        userId: args.userId,
        email: args.email,
        messagesTotal: 100, // Placeholder
        threadsTotal: 35,   // Based on your logs
        historyId: "12345",
        labelsTotal: 10,
        data: {
          email: args.email,
          messagesTotal: 100,
          threadsTotal: 35,
          historyId: "12345",
          labelsTotal: 10,
        },
        createdAt: now,
        updatedAt: now,
      });
      
      return { 
        success: true, 
        message: "Gmail account record created", 
        accountId 
      };
    } catch (error) {
      console.error("Error creating debug Gmail account:", error);
      return { 
        success: false, 
        error: error.message 
      };
    }
  },
});
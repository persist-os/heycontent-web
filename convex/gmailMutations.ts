// Written by Aria
import { v } from "convex/values";
import { mutation } from "./_generated/server";

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
    from: v.optional(v.string()),
    subject: v.optional(v.string()),
    snippet: v.string(),
    historyId: v.optional(v.string()),
    internalDate: v.optional(v.number()),
    labelIds: v.optional(v.array(v.string())),
    payload: v.any(),
    sizeEstimate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const now = Date.now();
      // Extract the real sender from payload.headers if possible
      let from = args.from;
      if (!from && args.payload?.headers) {
        const headerFrom = args.payload.headers.find((h: any) => h.name && h.name.toLowerCase() === 'from');
        if (headerFrom && headerFrom.value && headerFrom.value.toLowerCase() !== 'unknown') {
          from = headerFrom.value;
        }
      }
      if (!from && args.payload?.from && args.payload.from.toLowerCase() !== 'unknown') {
        from = args.payload.from;
      }
      if (!from) {
        from = 'unknown';
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
        // Update existing message
        await ctx.db.patch(existingMessage._id, {
          from,
          subject: args.subject,
          snippet: args.snippet,
          historyId: args.historyId,
          internalDate: args.internalDate ? args.internalDate.toString() : undefined,
          labelIds: args.labelIds,
          data: args.payload,
          sizeEstimate: args.sizeEstimate,
          updatedAt: now,
        });
        return { status: "updated", messageId: existingMessage._id };
      } else {
        // Insert new message
        const messageId = await ctx.db.insert("gmailMessages", {
          userId: args.userId,
          email: args.email,
          messageId: args.messageId,
          threadId: args.threadId,
          from,
          subject: args.subject,
          snippet: args.snippet,
          historyId: args.historyId,
          internalDate: args.internalDate ? args.internalDate.toString() : undefined,
          labelIds: args.labelIds,
          data: args.payload,
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
    snippet: v.optional(v.string()),
    historyId: v.optional(v.string()),
    labelIds: v.optional(v.array(v.string())),
    message_count: v.optional(v.number()),
    messages: v.optional(v.array(v.object({
      id: v.string(),
      from: v.optional(v.string()),
      subject: v.optional(v.string()),
      snippet: v.optional(v.string()),
      label_ids: v.optional(v.array(v.string())),
    }))),
    threadData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    try {
      const now = Date.now();
      // Prepare data object
      const data = args.threadData || {};
      // Get first message for top-level fields
      const firstMessage = args.messages && args.messages.length > 0 ? args.messages[0] : null;
      const from = firstMessage?.from || '';
      const subject = firstMessage?.subject || '';
      const snippet = firstMessage?.snippet || args.snippet || '';
      // Check if the thread already exists
      const existingThread = await ctx.db
        .query("gmailThreads")
        .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
        .filter((q) => 
          q.eq(q.field("userId"), args.userId) && 
          q.eq(q.field("email"), args.email)
        )
        .first();
      if (existingThread) {
        // Update existing thread
        await ctx.db.patch(existingThread._id, {
          from,
          subject,
          snippet,
          message_count: args.message_count,
          messages: args.messages,
          data,
          updatedAt: now,
        });
        return { status: "updated", threadId: existingThread._id };
      } else {
        // Insert new thread
        const threadId = await ctx.db.insert("gmailThreads", {
          userId: args.userId,
          email: args.email,
          threadId: args.threadId,
          from,
          subject,
          snippet,
          message_count: args.message_count,
          messages: args.messages,
          data,
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
      from: v.optional(v.string()),
      subject: v.optional(v.string()),
      snippet: v.string(),
      historyId: v.optional(v.string()),
      internalDate: v.optional(v.number()),
      labelIds: v.optional(v.array(v.string())),
      payload: v.any(),
      sizeEstimate: v.optional(v.number()),
    })),
  },
  handler: async (ctx, args) => {
    try {
      const now = Date.now();
      const results = [];
      
      for (const message of args.messages) {
        // Derive 'from' field using the same logic as storeGmailMessage
        let from = undefined;
        if (message.payload?.headers) {
          const headerFrom = message.payload.headers.find((h: any) => h.name && h.name.toLowerCase() === 'from');
          if (headerFrom && headerFrom.value && headerFrom.value.toLowerCase() !== 'unknown') {
            from = headerFrom.value;
          }
        }
        if (!from && message.payload?.from && message.payload.from.toLowerCase() !== 'unknown') {
          from = message.payload.from;
        }
        if (!from) {
          from = 'unknown';
        }

        // Check if the message already exists
        const existingMessage = await ctx.db
          .query("gmailMessages")
          .withIndex("by_messageId", (q) => q.eq("messageId", message.messageId))
          .filter((q) => 
            q.eq(q.field("userId"), args.userId) && 
            q.eq(q.field("email"), args.email)
          )
          .first();

        if (existingMessage) {
          // Update existing message
          await ctx.db.patch(existingMessage._id, {
            from,
            subject: message.subject,
            snippet: message.snippet,
            historyId: message.historyId,
            internalDate: message.internalDate ? message.internalDate.toString() : undefined,
            labelIds: message.labelIds,
            data: message.payload,
            sizeEstimate: message.sizeEstimate,
            updatedAt: now,
          });
          results.push({ messageId: message.messageId, status: "updated" });
        } else {
          // Insert new message
          await ctx.db.insert("gmailMessages", {
            userId: args.userId,
            email: args.email,
            messageId: message.messageId,
            threadId: message.threadId,
            from,
            subject: message.subject,
            snippet: message.snippet,
            historyId: message.historyId,
            internalDate: message.internalDate ? message.internalDate.toString() : undefined,
            labelIds: message.labelIds,
            data: message.payload,
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
      
      // Extract fields from account
      const email = account.email;
      const profile = {
        emailAddress: account.email,
        messagesTotal: account.messagesTotal,
        threadsTotal: account.threadsTotal,
        historyId: account.historyId,
        labelsTotal: account.labelsTotal,
      };

      // Check if the account already exists
      const existingAccount = await ctx.db
        .query("gmailAccounts")
        .withIndex("by_email", (q) => q.eq("email", email))
        .filter(q => q.eq(q.field("userId"), userId))
        .first();
        
      if (existingAccount) {
        // Update existing account
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
          for (const msg of messages) {
            const messageId = msg.id || msg.messageId;
            if (!messageId) {
              console.warn(`Skipping message with undefined messageId: ${JSON.stringify(msg)}`);
              continue;
            }
            
            const threadId = msg.threadId;
            const from = msg.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'from')?.value;
            const subject = msg.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'subject')?.value;
            const snippet = msg.snippet || '';
            
            const existingMsg = await ctx.db
              .query("gmailMessages")
              .withIndex("by_messageId", (q) => q.eq("messageId", messageId))
              .filter(q => 
                q.eq(q.field("userId"), userId) && 
                q.eq(q.field("email"), email)
              )
              .first();
            
            if (existingMsg) {
              // Update existing message
              await ctx.db.patch(existingMsg._id, {
                from,
                subject,
                snippet,
                data: msg,
                updatedAt: now,
              });
            } else {
              // Insert new message
              await ctx.db.insert("gmailMessages", {
                userId,
                email,
                messageId,
                threadId,
                from,
                subject,
                snippet,
                labelIds: msg.labelIds,
                historyId: msg.historyId,
                internalDate: msg.internalDate ? msg.internalDate.toString() : undefined,
                sizeEstimate: msg.sizeEstimate,
                data: msg,
                createdAt: now,
                updatedAt: now,
              });
            }
          }
        }
        
        // Store threads if provided
        if (Array.isArray(threads)) {
          for (const thread of threads) {
            // Check for threadId in multiple possible locations
            const threadId = thread.id || thread.threadId || thread.data?.thread_id || thread.resourceId;
            if (!threadId) {
              console.warn(`Skipping thread with undefined threadId: ${JSON.stringify(thread)}`);
              continue;
            }
            
            // Extract messages from the thread if available
            const threadMessages = thread.messages || [];
            const message_count = threadMessages.length;
            
            // Map the messages to the correct format
            const formattedMessages = threadMessages.map((m: any) => {
              const from = m.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'from')?.value;
              const subject = m.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'subject')?.value;
              
              return {
                id: m.id,
                from,
                subject,
                snippet: m.snippet,
                label_ids: m.labelIds
              };
            });
            
            const existingThread = await ctx.db
              .query("gmailThreads")
              .withIndex("by_threadId", (q) => q.eq("threadId", threadId))
              .filter(q => 
                q.eq(q.field("userId"), userId) && 
                q.eq(q.field("email"), email)
              )
              .first();
            
            if (existingThread) {
              // Update existing thread
              await ctx.db.patch(existingThread._id, {
                snippet: thread.snippet,
                message_count,
                messages: formattedMessages,
                data: thread,
                updatedAt: now,
              });
            } else {
              // Insert new thread
              await ctx.db.insert("gmailThreads", {
                userId,
                email,
                threadId,
                snippet: thread.snippet,
                message_count,
                messages: formattedMessages,
                data: thread,
                createdAt: now,
                updatedAt: now,
              });
            }
          }
        }
        
        return { status: "updated", accountId: existingAccount._id };
      } else {
        // Insert new account
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
        
        // Store messages and threads if provided (reusing same code as above)
        if (Array.isArray(messages)) {
          for (const msg of messages) {
            const messageId = msg.id || msg.messageId;
            if (!messageId) {
              console.warn(`Skipping message with undefined messageId: ${JSON.stringify(msg)}`);
              continue;
            }
            
            const threadId = msg.threadId;
            const from = msg.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'from')?.value;
            const subject = msg.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'subject')?.value;
            const snippet = msg.snippet || '';
            
            // No need to check for existing message since this is a new account
            await ctx.db.insert("gmailMessages", {
              userId,
              email,
              messageId,
              threadId,
              from,
              subject,
              snippet,
              labelIds: msg.labelIds,
              historyId: msg.historyId,
              internalDate: msg.internalDate ? msg.internalDate.toString() : undefined,
              sizeEstimate: msg.sizeEstimate,
              data: msg,
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
            
            // Extract messages from the thread if available
            const threadMessages = thread.messages || [];
            const message_count = threadMessages.length;
            
            // Map the messages to the correct format
            const formattedMessages = threadMessages.map((m: any) => {
              const from = m.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'from')?.value;
              const subject = m.payload?.headers?.find((h: any) => h.name.toLowerCase() === 'subject')?.value;
              
              return {
                id: m.id,
                from,
                subject,
                snippet: m.snippet,
                label_ids: m.labelIds
              };
            });
            
            // No need to check for existing thread since this is a new account
            await ctx.db.insert("gmailThreads", {
              userId,
              email,
              threadId,
              snippet: thread.snippet,
              message_count,
              messages: formattedMessages,
              data: thread,
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
// Written by Aria
import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Note: Email filtering for content analysis has been moved to the backend
// (backend-new/app/gmail_toolkit/fetch_threads.py) to prevent spam/system emails
// from ever reaching the AI or being stored in Convex.

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

// Store Gmail thread
export const storeGmailThread = mutation({
  args: {
    userId: v.string(),
    email: v.string(),
    threadId: v.string(),
    data: v.any(), // All user-visible info is now inside 'data'
    message_count: v.optional(v.number()),
    messages: v.optional(v.array(v.any())),
    category: v.optional(v.union(
      v.literal("partnership"),
      v.literal("media"),
      v.literal("business"),
      v.literal("community"),
      v.literal("none")
    )),
  },
  handler: async (ctx, args) => {
    try {
      const now = Date.now();
      
      // Note: Email filtering now happens upstream in backend fetch_threads.py
      // All threads reaching this point have already been filtered for quality
      
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
          category: args.category,
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
          category: args.category,
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
          
          for (const msg of messages) {
            totalMessages++;
            const messageId = msg.id || msg.messageId;
            if (!messageId) {
              console.warn("Skipping message with undefined messageId:", JSON.stringify(msg));
              continue;
            }
            const threadId = msg.threadId;
            const data = msg.data || msg;
            
            // Note: Email filtering now happens upstream in backend fetch_threads.py
            // All messages reaching this point have already been filtered for quality
            
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
                threadId,
                data,
                category: msg.category || undefined,
                updatedAt: now,
              });
              storedMessages++;
            } else {
              await ctx.db.insert("gmailMessages", {
                userId,
                email,
                messageId,
                threadId,
                data,
                category: msg.category || undefined,
                createdAt: now,
                updatedAt: now,
              });
              storedMessages++;
            }
          }
          
          // Log storage statistics (filtering now happens upstream)
          console.log("Gmail message storage completed for " + email + ":", {
            totalMessages,
            storedMessages,
          });
        }
        
        // Store threads if provided
        if (Array.isArray(threads)) {
          let totalThreads = 0;
          let storedThreads = 0;
          
          for (const thread of threads) {
            totalThreads++;
            const threadId = thread.id || thread.threadId;
            if (!threadId) {
              console.warn("Skipping thread with undefined threadId:", JSON.stringify(thread));
              continue;
            }
            
            const data = thread.data || thread;
            
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
                category: thread.category || undefined,
                updatedAt: now,
              });
              storedThreads++;
            } else {
              await ctx.db.insert("gmailThreads", {
                userId,
                email,
                threadId,
                data,
                category: thread.category || undefined,
                createdAt: now,
                updatedAt: now,
              });
              storedThreads++;
            }
          }
          
          // Log thread storage statistics (filtering now happens upstream)
          console.log("Gmail thread storage completed for " + email + ":", {
            totalThreads,
            storedThreads
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
              console.warn("Skipping message with undefined messageId:", JSON.stringify(msg));
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
              category: msg.category || undefined,
              createdAt: now,
              updatedAt: now,
            });
          }
        }
        
        if (Array.isArray(threads)) {
          for (const thread of threads) {
            const threadId = thread.id || thread.threadId;
            if (!threadId) {
              console.warn("Skipping thread with undefined threadId:", JSON.stringify(thread));
              continue;
            }
            const data = thread.data || thread;
            await ctx.db.insert("gmailThreads", {
              userId,
              email,
              threadId,
              data,
              category: thread.category || undefined,
              createdAt: now,
              updatedAt: now,
            });
          }
        }
        
        return { status: "created", accountId };
      }
    } catch (error) {
      console.error('Error storing Gmail profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error("Failed to store Gmail profile: " + errorMessage);
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

// Update Gmail batch analysis status for the async task system
export const updateGmailBatchAnalysisStatus = mutation({
  args: {
    userId: v.string(),
    gmailAccountId: v.string(),
    statusUpdate: v.object({
      status: v.string(),
      task_id: v.string(),
      started_at: v.optional(v.string()),
      completed_at: v.optional(v.string()),
      progress: v.optional(v.number()),
      error: v.optional(v.string()),
    }),
    insights: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const { userId, gmailAccountId, statusUpdate, insights } = args;
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
        // Update existing batch analysis with status and insights
        const updateData: any = {
          status: statusUpdate,
          updatedAt: now,
        };
        
        // Add insights if provided
        if (insights !== null && insights !== undefined) {
          updateData.insights = insights;
        }
        
        await ctx.db.patch(existingAnalysis._id, updateData);
        return { status: "updated", analysisId: existingAnalysis._id };
      } else {
        // Insert new batch analysis with status
        const insertData: any = {
          userId,
          gmailAccountId,
          status: statusUpdate,
          analysisType: "batch",
          createdAt: now,
          updatedAt: now,
        };
        
        // Add insights if provided
        if (insights !== null && insights !== undefined) {
          insertData.insights = insights;
        }
        
        const id = await ctx.db.insert("gmailBatchAnalysis", insertData);
        return { status: "created", analysisId: id };
      }
    } catch (error) {
      console.error(`Error updating Gmail batch analysis status for user ${userId}:`, error);
      throw new Error(`Failed to update Gmail batch analysis status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

// Delete all Gmail threads and messages for a user (optionally for a specific email)
export const deleteAllGmailThreadsAndMessages = mutation({
  args: { userId: v.string(), email: v.optional(v.string()) },
  handler: async (ctx, args) => {
    let totalDeleted = 0;
    for (const collection of ["gmailThreads", "gmailMessages"]) {
      let items;
      if (args.email) {
        items = await ctx.db
          .query(collection as any)
          .withIndex("by_email", (q) => q.eq("email", args.email))
          .filter(q => q.eq(q.field("userId"), args.userId))
          .collect();
      } else {
        items = await ctx.db
          .query(collection as any)
          .withIndex("by_userId", (q) => q.eq("userId", args.userId))
          .collect();
      }
      for (const item of items) {
        await ctx.db.delete(item._id);
        totalDeleted++;
      }
    }
    return { success: true, itemsDeleted: totalDeleted };
  },
});

// Update Gmail thread category
export const updateGmailThreadCategory = mutation({
  args: {
    userId: v.string(),
    threadId: v.string(),
    category: v.union(
      v.literal("partnership"),
      v.literal("media"),
      v.literal("business"),
      v.literal("community"),
      v.literal("none")
    ),
  },
  handler: async (ctx, args) => {
    try {
      // Find the thread by threadId and userId
      const existingThread = await ctx.db
        .query("gmailThreads")
        .withIndex("by_threadId", (q) => q.eq("threadId", args.threadId))
        .filter((q) => q.eq(q.field("userId"), args.userId))
        .first();

      if (!existingThread) {
        throw new Error(`Gmail thread not found: ${args.threadId}`);
      }

      // Update the category
      await ctx.db.patch(existingThread._id, {
        category: args.category,
        updatedAt: Date.now(),
      });

      console.log(`Updated Gmail thread ${args.threadId} category to ${args.category}`);
      return { status: "success", threadId: existingThread._id, category: args.category };
    } catch (error) {
      console.error('Error updating Gmail thread category:', error);
      throw new Error(`Failed to update thread category: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});
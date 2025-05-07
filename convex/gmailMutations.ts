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
    snippet: v.string(),
    historyId: v.optional(v.string()),
    internalDate: v.optional(v.number()),
    labelIds: v.optional(v.array(v.string())),
    payload: v.any(),
    sizeEstimate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const timestamp = Date.now();
      
      // Check if the message already exists
      const existingMessage = await ctx.db
        .query("gmailData")
        .withIndex("by_resource_id", (q) => q.eq("resourceId", args.messageId))
        .filter((q) => 
          q.eq(q.field("userId"), args.userId) && 
          q.eq(q.field("email"), args.email) &&
          q.eq(q.field("resourceType"), "message")
        )
        .first();

      if (existingMessage) {
        // Update existing message
        await ctx.db.patch(existingMessage._id, {
          snippet: args.snippet,
          historyId: args.historyId,
          internalDate: args.internalDate,
          labelIds: args.labelIds,
          data: args.payload,
          sizeEstimate: args.sizeEstimate,
          timestamp,
        });
        return { status: "updated", messageId: existingMessage._id };
      } else {
        // Insert new message
        const messageId = await ctx.db.insert("gmailData", {
          userId: args.userId,
          email: args.email,
          resourceType: "message",
          resourceId: args.messageId,
          threadId: args.threadId,
          snippet: args.snippet,
          historyId: args.historyId,
          internalDate: args.internalDate,
          labelIds: args.labelIds,
          data: args.payload,
          sizeEstimate: args.sizeEstimate,
          timestamp,
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
    snippet: v.string(),
    historyId: v.optional(v.string()),
    messages: v.array(v.string()),
    threadData: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    try {
      const timestamp = Date.now();
      
      // Check if the thread already exists
      const existingThread = await ctx.db
        .query("gmailData")
        .withIndex("by_resource_id", (q) => q.eq("resourceId", args.threadId))
        .filter((q) => 
          q.eq(q.field("userId"), args.userId) && 
          q.eq(q.field("email"), args.email) &&
          q.eq(q.field("resourceType"), "thread")
        )
        .first();

      // Prepare the thread data object
      const data = args.threadData || {
        messages: args.messages,
        snippet: args.snippet,
        historyId: args.historyId,
      };

      if (existingThread) {
        // Update existing thread
        await ctx.db.patch(existingThread._id, {
          snippet: args.snippet,
          historyId: args.historyId,
          messages: args.messages,
          data,
          timestamp,
        });
        return { status: "updated", threadId: existingThread._id };
      } else {
        // Insert new thread
        const threadId = await ctx.db.insert("gmailData", {
          userId: args.userId,
          email: args.email,
          resourceType: "thread",
          resourceId: args.threadId,
          snippet: args.snippet,
          historyId: args.historyId,
          messages: args.messages,
          data,
          timestamp,
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
      // Delete Gmail data (accounts, messages, and threads)
      let gmailData;
      
      if (email) {
        // Delete only data for the specified email
        gmailData = await ctx.db
          .query("gmailData")
          .withIndex("by_email", (q) => q.eq("userId", userId).eq("email", email))
          .collect();
      } else {
        // Delete all data for this user
        gmailData = await ctx.db
          .query("gmailData")
          .withIndex("by_user", (q) => q.eq("userId", userId))
          .collect();
        
        // If no specific email is provided, also delete tokens
        const tokens = await ctx.db
          .query("gmailTokens")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .collect();

        for (const token of tokens) {
          await ctx.db.delete(token._id);
        }
      }
      
      // Delete all collected data items
      for (const data of gmailData) {
        await ctx.db.delete(data._id);
      }

      return { 
        success: true, 
        itemsDeleted: gmailData.length 
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
      const timestamp = Date.now();
      const results = [];
      
      for (const message of args.messages) {
        // Check if the message already exists
        const existingMessage = await ctx.db
          .query("gmailData")
          .withIndex("by_resource_id", (q) => q.eq("resourceId", message.messageId))
          .filter((q) => 
            q.eq(q.field("userId"), args.userId) && 
            q.eq(q.field("email"), args.email) &&
            q.eq(q.field("resourceType"), "message")
          )
          .first();

        if (existingMessage) {
          // Update existing message
          await ctx.db.patch(existingMessage._id, {
            snippet: message.snippet,
            historyId: message.historyId,
            internalDate: message.internalDate,
            labelIds: message.labelIds,
            data: message.payload,
            sizeEstimate: message.sizeEstimate,
            timestamp,
          });
          results.push({ messageId: message.messageId, status: "updated" });
        } else {
          // Insert new message
          await ctx.db.insert("gmailData", {
            userId: args.userId,
            email: args.email,
            resourceType: "message",
            resourceId: message.messageId,
            threadId: message.threadId,
            snippet: message.snippet,
            historyId: message.historyId,
            internalDate: message.internalDate,
            labelIds: message.labelIds,
            data: message.payload,
            sizeEstimate: message.sizeEstimate,
            timestamp,
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
    email: v.string(),
    profile: v.object({
      emailAddress: v.string(),
      messagesTotal: v.optional(v.number()),
      threadsTotal: v.optional(v.number()),
      historyId: v.optional(v.string()),
      labelsTotal: v.optional(v.number()),
    }),
    profileData: v.any(), // Full Gmail profile data
  },
  handler: async (ctx, args) => {
    try {
      const timestamp = Date.now();
      
      // Check if the account already exists
      const existingAccount = await ctx.db
        .query("gmailData")
        .withIndex("by_resource_id", (q) => q.eq("resourceId", args.email))
        .filter((q) => 
          q.eq(q.field("userId"), args.userId) && 
          q.eq(q.field("resourceType"), "account")
        )
        .first();

      if (existingAccount) {
        // Update existing account
        await ctx.db.patch(existingAccount._id, {
          data: args.profileData,
          messagesTotal: args.profile.messagesTotal,
          threadsTotal: args.profile.threadsTotal,
          historyId: args.profile.historyId,
          labelsTotal: args.profile.labelsTotal,
          timestamp,
        });
        return { status: "updated", accountId: existingAccount._id };
      } else {
        // Insert new account
        const accountId = await ctx.db.insert("gmailData", {
          userId: args.userId,
          email: args.email,
          resourceType: "account",
          resourceId: args.email, // Use the email as the resource ID for accounts
          data: args.profileData,
          messagesTotal: args.profile.messagesTotal,
          threadsTotal: args.profile.threadsTotal,
          historyId: args.profile.historyId,
          labelsTotal: args.profile.labelsTotal,
          timestamp,
        });
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
      const timestamp = Date.now();
      
      // Check if the account already exists
      const existingAccount = await ctx.db
        .query("gmailData")
        .withIndex("by_resource_id", (q) => q.eq("resourceId", args.email))
        .filter((q) => 
          q.eq(q.field("userId"), args.userId) && 
          q.eq(q.field("resourceType"), "account")
        )
        .first();

      if (existingAccount) {
        // Update just the profile metrics
        await ctx.db.patch(existingAccount._id, {
          messagesTotal: args.profileData.messagesTotal,
          threadsTotal: args.profileData.threadsTotal,
          historyId: args.profileData.historyId,
          labelsTotal: args.profileData.labelsTotal,
          timestamp,
        });
        return { status: "updated", accountId: existingAccount._id };
      } else {
        // For profile updates, we require the account to exist first
        throw new Error(`Cannot update profile data: Account ${args.email} not found for user ${args.userId}`);
      }
    } catch (error) {
      console.error('Error updating Gmail profile data:', error);
      throw new Error(`Failed to update Gmail profile data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
}); 
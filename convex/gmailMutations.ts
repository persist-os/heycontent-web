// Written by Aria
import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { updateGmailTokenArgsValidator, storeGmailProfileArgsValidator } from "./types/gmail";

// Update Gmail tokens
export const updateGmailToken = mutation({
  args: updateGmailTokenArgsValidator,
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

// Disconnect Gmail - removes tokens and account data
export const disconnectGmail = mutation({
  args: { 
    userId: v.string(),
    email: v.optional(v.string()) // Optional: if provided, only disconnect this specific email
  },
  handler: async (ctx, args) => {
    const { userId, email } = args;

    try {
      let totalDeleted = 0;
      
      // Delete gmailAccounts
      let accounts;
      if (email) {
        accounts = await ctx.db
          .query("gmailAccounts")
          .withIndex("by_email", (q) => q.eq("email", email))
          .filter(q => q.eq(q.field("userId"), userId))
          .collect();
      } else {
        accounts = await ctx.db
          .query("gmailAccounts")
          .withIndex("by_userId", (q) => q.eq("userId", userId))
          .collect();
      }
      
      for (const account of accounts) {
        await ctx.db.delete(account._id);
        totalDeleted++;
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

// Save just the profile data, updating if it exists
export const saveProfileData = mutation({
  args: storeGmailProfileArgsValidator,
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

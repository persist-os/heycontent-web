// Written by Aria
import { v } from "convex/values";
import { query } from "./_generated/server";
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

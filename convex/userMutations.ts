import { mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";

function generateReferralCode(username: string, name: string) {
    // Extract a clean name component (max 8 chars for better readability)
    const nameBase = (name || username || 'user')
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, '') // remove special chars (note: using A-Z since string is uppercase)
      .slice(0, 8);

    // Add an alphabet part (random capital letter A-Z)
    const alphabetPart = String.fromCharCode(Math.floor(Math.random() * 26) + 65);

    // Add a short numeric segment for variety (100-999)
    const numericPart = 100 + Math.floor(Math.random() * 900);
 
    // Combine into a referral code
    return `${nameBase}${alphabetPart}${numericPart}`;
  }
  

export const create_user = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    image: v.optional(v.string()),
    userId: v.string(),
    username: v.string(),
    referralCode: v.optional(v.string()),
    referredBy: v.optional(v.string()),
  },
  handler: async ({ db }, args) => {
    const now = Date.now();
    // Check if user exists by email
    const existing = await db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    let referralCode = args.referralCode;
    if (!args.referralCode) {
      // Generate referral code based on username and name
      referralCode = generateReferralCode(args.username, args.name);
    }

    if (existing) {
      // Update user with all fields
      await db.patch(existing._id, {
        name: args.name,
        email: args.email,
        image: args.image,
        userId: args.userId,
        username: args.username,
        referredBy: args.referredBy,
        updatedAt: now,
      });
      return { updated: true, id: existing._id };
    } else {
      // Create new user
      const id = await db.insert("users", {
        name: args.name,
        email: args.email,
        image: args.image,
        userId: args.userId,
        username: args.username,
        referralCode: referralCode,
        referredBy: args.referredBy,
        createdAt: now,
        updatedAt: now,
      });
      return { created: true, id };
    }
  },
});


export const updateUserStripeData = mutation({
  args: {
    userId: v.string(),
    updates: v.object({
      stripeCustomerId: v.optional(v.string()),
      stripeSubscriptionId: v.optional(v.string()),
      // Add more Stripe/user fields here as needed
    })
  },
  handler: async ({ db }, args) => {
    const user = await db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    await db.patch(user._id, {
      ...args.updates,
      updatedAt: Date.now(),
    });
    return { success: true, userId: user._id };
  },
});

// Delete all user data
export const deleteUserAndData = mutation({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const { userId } = args;
    let summary: Record<string, any> = {};
    // 1. Delete from all Convex tables that have userId
    const tables = [
      { name: "users", index: "by_userId" },
      { name: "personas", index: "by_userId" },
      { name: "conversations", index: "by_user" },
      { name: "notes", index: "by_user" },
      { name: "api_keys", index: "user_id" },
      { name: "rate_limits", index: "by_user_resource" },
      { name: "gmailTokens", index: "by_userId" },
      { name: "gmailAccounts", index: "by_userId" },
      { name: "gmailThreads", index: "by_userId" },
      { name: "gmailMessages", index: "by_userId" },
      { name: "gmailHistory", index: "by_userId" },
      { name: "youtubeTokens", index: "by_userId" },
      { name: "youtubeChannels", index: "by_userId" },
      { name: "youtubeVideos", index: "by_userId" },
      { name: "instagramTokens", index: "by_userId" },
      { name: "instagramData", index: "by_user" },
      { name: "instagramAccounts", index: "by_userId" },
      { name: "instagramPosts", index: "by_userId" },
      { name: "usageHistory", index: "by_user" },
      { name: "sessions", index: "by_user" },
      { name: "usageEvents", index: "by_user" },
      { name: "ubpSettings", index: "by_user" },
    ];
    for (const table of tables) {
      let deleted = 0;
      let items;
      try {
        items = await ctx.runQuery(api[`${table.name}Queries`] ? api[`${table.name}Queries`][`listByUserId`] : api[`${table.name}Queries`]?.list, { userId });
      } catch {
        items = await ctx.runQuery(api[`${table.name}Queries`] ? api[`${table.name}Queries`][`listByUserId`] : api[`${table.name}Queries`]?.list, { userId });
      }
      if (!items) continue;
      for (const item of items) {
        await ctx.runMutation(api[`${table.name}Mutations`] ? api[`${table.name}Mutations`][`delete`] : api[`${table.name}Mutations`]?.delete, { id: item._id });
        deleted++;
      }
      summary[table.name] = deleted;
    }
    return summary;
  },
});
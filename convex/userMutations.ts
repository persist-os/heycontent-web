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
    username: v.optional(v.string()),
    referralCode: v.optional(v.string()),
    referredBy: v.optional(v.string()),
    subscription: v.optional(v.any()),

  },
  handler: async ({ db }, args) => {
    const now = Date.now();
    
    // Debug log the arguments received
    console.log('[Convex] create_user args:', {
      name: args.name,
      email: args.email,
      userId: args.userId,
      username: args.username,
      referredBy: args.referredBy,
      hasReferredBy: !!args.referredBy,
      referredByLength: args.referredBy?.length || 0
    });
    
    // Check if user exists by email
    const existing = await db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    let referralCode = args.referralCode;
    if (!args.referralCode) {
      // Generate referral code based on username and name
      referralCode = generateReferralCode(args.username ?? '', args.name);
    }

    if (existing) {
      // Update user with all fields
      const updateData = {
        name: args.name,
        email: args.email,
        image: args.image,
        userId: args.userId,
        updatedAt: now,
        ...(args.username !== undefined ? { username: args.username } : {}),
        ...(args.referredBy !== undefined ? { referredBy: args.referredBy } : {}),
        ...(args.subscription ? { subscription: args.subscription } : {}),
      };
      
      console.log('[Convex] Updating existing user with data:', updateData);
      
      await db.patch(existing._id, updateData);
      console.log('[Convex] Updated user', { id: existing._id, email: args.email, referredBy: args.referredBy });
      return { updated: true, id: existing._id };
    } else {
      // Create new user
      const newUserData = {
        name: args.name,
        email: args.email,
        image: args.image,
        userId: args.userId,
        username: args.username ?? '',
        referralCode: referralCode,
        referredBy: args.referredBy ?? '',
        createdAt: now,
        updatedAt: now,
        ...(args.subscription ? { subscription: args.subscription } : {}),
      };
      
      console.log('[Convex] Creating new user with data:', newUserData);
      
      const id = await db.insert("users", newUserData);
      console.log('[Convex] Created user', { id, email: args.email, referredBy: args.referredBy });
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
    const summary: Record<string, any> = { errors: [] };
    // 1. Validate user exists
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (!user) throw new Error("User not found");
    const BATCH_SIZE = 50;
    // Helper for batch deletion
    async function batchDelete(table: string, getQuery: () => Promise<any[]>) {
      let deleted = 0;
      const errors: any[] = [];
      let hasMore = true;
      while (hasMore) {
        const items = await getQuery();
        if (!items || items.length === 0) break;
        for (const item of items) {
          try {
            await ctx.db.delete(item._id);
            deleted++;
          } catch (err) {
            errors.push({ id: item._id, error: String(err) });
          }
        }
        hasMore = items.length === BATCH_SIZE;
      }
      summary[table] = { deleted, errors };
      if (errors.length > 0) summary.errors.push({ table, errors });
    }
    // Users
    await batchDelete("users", () =>
      ctx.db.query("users").withIndex("by_userId", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    // Personas
    await batchDelete("personas", () =>
      ctx.db.query("personas").withIndex("by_userId", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    // Conversations
    await batchDelete("conversations", () =>
      ctx.db.query("conversations").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    // Notes
    await batchDelete("notes", () =>
      ctx.db.query("notes").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    // api_keys (no index)
    await batchDelete("api_keys", async () => {
      const all = await ctx.db.query("api_keys").take(BATCH_SIZE * 2);
      return all.filter((item) => item.user_id === userId).slice(0, BATCH_SIZE);
    });
    // rate_limits
    await batchDelete("rate_limits", () =>
      ctx.db.query("rate_limits").withIndex("by_user_resource", (q) => q.eq("user_id", userId)).take(BATCH_SIZE)
    );
    // gmailTokens
    await batchDelete("gmailTokens", () =>
      ctx.db.query("gmailTokens").withIndex("by_userId", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    // gmailAccounts
    await batchDelete("gmailAccounts", () =>
      ctx.db.query("gmailAccounts").withIndex("by_userId", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    // gmailThreads
    await batchDelete("gmailThreads", () =>
      ctx.db.query("gmailThreads").withIndex("by_userId", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    // gmailMessages
    await batchDelete("gmailMessages", () =>
      ctx.db.query("gmailMessages").withIndex("by_userId", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    // gmailHistory
    await batchDelete("gmailHistory", () =>
      ctx.db.query("gmailHistory").withIndex("by_userId", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    // youtubeTokens
    await batchDelete("youtubeTokens", () =>
      ctx.db.query("youtubeTokens").withIndex("by_userId", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    // youtubeChannels
    await batchDelete("youtubeChannels", () =>
      ctx.db.query("youtubeChannels").withIndex("by_userId", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    // youtubeVideos
    await batchDelete("youtubeVideos", () =>
      ctx.db.query("youtubeVideos").withIndex("by_userId", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    // instagramTokens
    await batchDelete("instagramTokens", () =>
      ctx.db.query("instagramTokens").withIndex("by_userId", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    // instagramAccounts
    await batchDelete("instagramAccounts", () =>
      ctx.db.query("instagramAccounts").withIndex("by_userId", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    // instagramPosts
    await batchDelete("instagramPosts", () =>
      ctx.db.query("instagramPosts").withIndex("by_userId", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    // usageEvents
    await batchDelete("usageEvents", () =>
      ctx.db.query("usageEvents").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    return summary;
  },
});
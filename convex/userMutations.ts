import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { v } from "convex/values";

export const updateUser = mutation(async ({ db }, { userId, updates }: { userId: Id<"users">, updates: any }) => {
  if (!userId || !updates) throw new Error("Missing userId or updates");
  // You may need to adjust the collection name and update logic
  await db.patch(userId, updates);
  return { success: true };
});

export const create_user = mutation(async ({ db }, { name, email, image, userId, username, referralCode, referredBy }: {
  name: string,
  email: string,
  image?: string,
  userId: string,
  username?: string,
  referralCode?: string,
  referredBy?: string,
}) => {
  const now = Date.now();

  // Try to find an existing user by userId (preferred) or email (fallback)
  let existingUser = await db.query("users").withIndex("by_userId", q => q.eq("userId", userId)).first();
  if (!existingUser && email) {
    existingUser = await db.query("users").withIndex("by_email", q => q.eq("email", email)).first();
  }

  if (existingUser) {
    // Only update fields that are safe to update (never overwrite referralCode or referredBy)
    const updates: Record<string, any> = {};
    if (name && name !== existingUser.name) updates.name = name;
    if (typeof image !== 'undefined' && image !== existingUser.image) updates.image = image;
    if (username && username !== existingUser.username) updates.username = username;
    updates.updatedAt = now;
    // Only patch if there are changes
    if (Object.keys(updates).length > 1 || (Object.keys(updates).length === 1 && !updates.hasOwnProperty('updatedAt'))) {
      await db.patch(existingUser._id, updates);
    } else {
      // Always update updatedAt
      await db.patch(existingUser._id, { updatedAt: now });
    }
    return { success: true, userId: existingUser._id, alreadyExisted: true };
  }

  // If no user exists, create a new one
  // Generate a unique referral code if not provided
  let finalReferralCode = referralCode || '';
  if (!finalReferralCode) {
    // Generate a referral code that includes the user's name
    // Extract first name or use first part of email if name is not available
    let namePrefix = '';
    if (name && name.trim()) {
      // Get first name and convert to uppercase
      namePrefix = name.trim().split(' ')[0].toUpperCase().substring(0, 4);
    } else if (email) {
      // Use part of email before @ symbol
      namePrefix = email.split('@')[0].toUpperCase().substring(0, 4);
    }
    
    // If we still don't have a prefix, use a default
    if (!namePrefix) {
      namePrefix = 'USER';
    }
    
    // Add random characters to ensure uniqueness
    const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
    finalReferralCode = `${namePrefix}-${randomPart}`;
    
    // Ensure uniqueness by checking for duplicates
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 10) {
      const existingWithCode = await db.query("users")
        .withIndex("by_referralCode", q => q.eq("referralCode", finalReferralCode))
        .first();
      if (!existingWithCode) {
        isUnique = true;
      } else {
        // Generate a new random part
        const newRandomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
        finalReferralCode = `${namePrefix}-${newRandomPart}`;
        attempts++;
      }
    }
  }

  // Final safety check to ensure referral code is never empty
  if (!finalReferralCode) {
    // In the extremely unlikely case we still don't have a referral code
    // Generate a fallback code using the user's name/email and timestamp
    let prefix = 'USER';
    if (name && name.trim()) {
      prefix = name.trim().split(' ')[0].toUpperCase().substring(0, 4);
    } else if (email) {
      prefix = email.split('@')[0].toUpperCase().substring(0, 4);
    }
    
    // Add timestamp to ensure uniqueness
    const timestamp = Date.now().toString().substring(8, 12);
    finalReferralCode = `${prefix}-${timestamp}`;
  }
  
  const id = await db.insert("users", {
    name,
    email,
    image,
    userId,
    username: username ?? '',
    referralCode: finalReferralCode,
    referredBy: referredBy ?? '',
    createdAt: now,
    updatedAt: now,
  });
  return { success: true, userId: id, alreadyExisted: false };
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

// Gmail quota optimization - update lastGmailFetch timestamp
export const updateLastGmailFetch = mutation({
  args: {
    userId: v.string(),
    timestamp: v.optional(v.number()),
  },
  handler: async ({ db }, args) => {
    const user = await db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    const now = Date.now();
    await db.patch(user._id, {
      lastGmailFetch: args.timestamp || now,
      updatedAt: now,
    });
    
    return { success: true, userId: user._id, timestamp: args.timestamp || now };
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
    // instagramAccounts
    await batchDelete("instagramAccounts", () =>
      ctx.db.query("instagramAccounts").withIndex("by_userId", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    // instagramPosts
    await batchDelete("instagramPosts", () =>
      ctx.db.query("instagramPosts").withIndex("by_userId", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    // instagramTrackerAnalysis
    await batchDelete("instagramTrackerAnalysis", () =>
      ctx.db.query("instagramTrackerAnalysis").withIndex("by_userId", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    // instagramBatchAnalysis
    await batchDelete("instagramBatchAnalysis", () =>
      ctx.db.query("instagramBatchAnalysis").withIndex("by_userId", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    // usageEvents
    await batchDelete("usageEvents", () =>
      ctx.db.query("usageEvents").withIndex("by_user", (q) => q.eq("userId", userId)).take(BATCH_SIZE)
    );
    return summary;
  },
});

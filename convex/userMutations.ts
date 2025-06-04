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
  const id = await db.insert("users", {
    name,
    email,
    image,
    userId,
    username: username ?? '',
    referralCode: referralCode ?? '',
    referredBy: referredBy ?? '',
    createdAt: now,
    updatedAt: now,
  });
  return { success: true, userId: id };
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

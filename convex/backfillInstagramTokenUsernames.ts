import { mutation } from "./_generated/server";

/**
 * Backfill/migration script to add the username field to all existing instagramTokens records.
 * Usage: Run this as a Convex mutation or admin script.
 */
export const backfillInstagramTokenUsernames = mutation({
  args: {},
  handler: async (ctx) => {
    const tokens = await ctx.db.query("instagramTokens").collect();
    let updated = 0;
    for (const token of tokens) {
      // If username is missing, set as empty string (or fetch from another source if available)
      if (!token.username) {
        await ctx.db.patch(token._id, { username: "" });
        updated++;
      }
    }
    return { updated };
  },
});

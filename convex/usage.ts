import { query } from "./_generated/server";
import { v } from "convex/values";

function getCurrentMonthString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export const getCurrentUsage = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const month = getCurrentMonthString();
    const usage = await ctx.db
      .query("usage")
      .withIndex("by_user_month", (q) => q.eq("userId", args.userId).eq("month", month))
      .first();

    // Calculate next reset date (first day of next month)
    const now = new Date();
    const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    return {
      completions: usage?.completions ?? 0,
      fastRequests: usage?.fastRequests ?? 0,
      slowRequests: usage?.slowRequests ?? 0,
      overageCharges: usage?.overageCharges ?? 0,
      nextResetDate: nextReset.toISOString(),
    };
  },
}); 
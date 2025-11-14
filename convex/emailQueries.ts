import { query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Email history queries.
 * Pattern 2: Backend-to-Convex Bridge
 */

export const getEmailHistory = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const emails = await ctx.db
      .query("emailSends")
      .order("desc")
      .take(args.limit || 50);
    
    return emails;
  },
});

export const getEmailStats = query({
  args: {},
  handler: async (ctx) => {
    const allEmails = await ctx.db.query("emailSends").collect();
    
    const totalSent = allEmails.reduce((sum, email) => sum + email.sentCount, 0);
    const totalFiltered = allEmails.reduce((sum, email) => sum + email.filteredCount, 0);
    const totalEmails = allEmails.length;
    
    return {
      totalEmails,
      totalSent,
      totalFiltered,
      totalRecipients: totalSent + totalFiltered,
    };
  },
});


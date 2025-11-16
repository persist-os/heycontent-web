import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { emailSendCreateValidator } from "./types/email";

/**
 * Email tracking mutations.
 * Pattern 2: Backend-to-Convex Bridge
 */

export const logEmailSend = mutation({
  args: emailSendCreateValidator,
  handler: async (ctx, args) => {
    const emailSendId = await ctx.db.insert("emailSends", {
      senderUserId: args.senderUserId,
      recipients: args.recipients,
      subject: args.subject,
      sentCount: args.sentCount,
      filteredCount: args.filteredCount,
      sentAt: Date.now(),
    });
    
    return { success: true, emailSendId };
  },
});


import { query } from "./_generated/server";
import { v } from "convex/values";

// Query all social connection status entries
export const getAllSocialConnectionStatus = query({
  handler: async (ctx) => {
    return await ctx.db.query("socialConnectionStatus").collect();
  },
});

// Query all YouTube data
export const getAllYouTubeData = query({
  handler: async (ctx) => {
    return await ctx.db.query("youtubeData").collect();
  },
});

// Query all Gmail data
export const getAllGmailData = query({
  handler: async (ctx) => {
    return await ctx.db.query("gmailData").collect();
  },
}); 
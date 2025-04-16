import { query } from "./_generated/server";
import { v } from "convex/values";

export const getUserIdFromToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    return args.token;
  }
}); 
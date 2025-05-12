import { mutation } from "./_generated/server";
import { v } from "convex/values";

function generateReferralCode(username: string, name: string) {
    const base = (username || name || 'user')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '') // remove special chars
      .slice(0, 12); // limit length for readability
  
    const suffix = Math.random().toString(36).slice(2, 6); // 4-char alphanumeric
  
    return `${base}${suffix}`;
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

    // Generate referral code based on username and name
    const referralCode = generateReferralCode(args.username, args.name);

    if (existing) {
      // Update user with all fields
      await db.patch(existing._id, {
        name: args.name,
        email: args.email,
        image: args.image,
        userId: args.userId,
        username: args.username,
        referralCode: referralCode,
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
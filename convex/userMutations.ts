import { mutation } from "./_generated/server";
import { v } from "convex/values";

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

    let referralCode = args.referralCode;
    if (!args.referralCode) {
      // Generate referral code based on username and name
      referralCode = generateReferralCode(args.username, args.name);
    }

    if (existing) {
      // Update user with all fields
      await db.patch(existing._id, {
        name: args.name,
        email: args.email,
        image: args.image,
        userId: args.userId,
        username: args.username,
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
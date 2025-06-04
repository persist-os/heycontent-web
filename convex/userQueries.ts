import { query } from "./_generated/server";
import { v } from "convex/values";

export const list = query({
  args: {},
  handler: async (ctx, args) => {
    return await ctx.db.query("users").collect();
  },
});

export const getUserDetails = query({
    args: { email: v.string() },
    handler: async ({ db }, { email }) => {
      const user = await db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", email))
        .first();
      
      if (!user) return null;
      
      return {
        id: user._id,
        email: user.email,
        name: user.name,
        image: user.image,
        userId: user.userId,
        username: user.username || '',
        referralCode: user.referralCode || '',
        referredBy: user.referredBy || '',
        createdAt: new Date(user._creationTime).toISOString()
      };
    },
  });
  
  export const checkReferralCode = query({
  args: { referralCode: v.string() },
  handler: async ({ db }, { referralCode }) => {
    const user = await db
      .query("users")
      .withIndex("by_referralCode", (q) => q.eq("referralCode", referralCode))
      .first();
    if (user) {
      return { 
        valid: true, 
        userId: user.userId,
        referrerName: user.name,
        referrerUsername: user.username || '',
        referrerEmail: user.email
      };
    } else {
      return { valid: false };
    }
  },
});

export const getUserByEmail = query({
    args: { email: v.string() },
    handler: async (ctx, args) => {
      return await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email))
        .first()
    }
  })

export const getUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first()
  }
})

export const getUserByStripeCustomerId = query({
  args: { stripeCustomerId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_stripeCustomerId", (q) => q.eq("stripeCustomerId", args.stripeCustomerId))
      .first()
  }
})

export const getUserByStripeSubscriptionId = query({
  args: { stripeSubscriptionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("stripeSubscriptionId"), args.stripeSubscriptionId))
      .first()
  }
})
  
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
    handler: async (ctx, args) => {
      const user = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", args.email))
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
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_referralCode", (q) => q.eq("referralCode", args.referralCode))
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

export const getUserInfo = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
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

// Gmail quota optimization - get lastGmailFetch timestamp
export const getLastGmailFetch = query({
  args: { userId: v.string() },
  returns: v.union(v.number(), v.null()),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
    
    if (!user) return null;
    
    return user.lastGmailFetch || null;
  },
});

// Email preferences - get email subscription status by email
export const getEmailPreferences = query({
  args: { email: v.string() },
  returns: v.union(
    v.object({
      emailUnsubscribed: v.optional(v.boolean()),
      found: v.literal(true)
    }),
    v.object({
      found: v.literal(false)
    })
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();
    
    if (!user) {
      return { found: false };
    }
    
    return {
      found: true,
      emailUnsubscribed: user.emailUnsubscribed
    };
  },
});
  
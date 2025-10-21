// @ts-nocheck
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

export const checkUsernameAvailability = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    if (!args.username || args.username.trim().length === 0) {
      return { available: false, error: "Username cannot be empty" };
    }

    // Validate username format (alphanumeric + underscore, 3-20 chars)
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(args.username)) {
      return { 
        available: false, 
        error: "Username must be 3-20 characters long and contain only letters, numbers, and underscores" 
      };
    }

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    return { 
      available: !existingUser,
      error: existingUser ? "Username is already taken" : null
    };
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

// User preferences - get user preferences including language
export const getUserPreferences = query({
  args: { userId: v.string() },
  returns: v.union(
    v.object({
      showPersonaToFriends: v.boolean(),
      allowFriendRequests: v.boolean(),
      friendRequestNotifications: v.boolean(),
      language: v.optional(v.string()),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    try {
      const preferences = await ctx.db
        .query("user_preferences")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .first();
      
      if (!preferences) {
        // Return safe defaults if no preferences exist yet
        return {
          showPersonaToFriends: false,
          allowFriendRequests: true,
          friendRequestNotifications: true,
          language: "en",
        };
      }
      
      return {
        showPersonaToFriends: preferences.showPersonaToFriends,
        allowFriendRequests: preferences.allowFriendRequests,
        friendRequestNotifications: preferences.friendRequestNotifications,
        language: preferences.language,
      };
    } catch (error) {
      // If the table doesn't exist yet or there's an error, return safe defaults
      console.error("Error fetching user preferences:", error);
      return {
        showPersonaToFriends: false,
        allowFriendRequests: true,
        friendRequestNotifications: true,
        language: "en",
      };
    }
  },
});
  
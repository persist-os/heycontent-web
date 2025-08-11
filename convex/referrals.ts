import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Process a new referral when someone signs up
export const processReferral = mutation({
  args: { 
    referrerId: v.id("users"),
    referredUserId: v.id("users"),
    referralCode: v.string()
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Check if referrer already has a referrals record
    const existingReferral = await ctx.db
      .query("referrals")
      .withIndex("by_referrer", (q) => q.eq("referrerId", args.referrerId))
      .unique();
    
    if (existingReferral) {
      // Update existing record
      const updatedReferredUsers = [
        ...existingReferral.referredUsers,
        {
          userId: args.referredUserId,
          referralCode: args.referralCode,
          referredAt: now
        }
      ];
      
      await ctx.db.patch(existingReferral._id, {
        referredUsers: updatedReferredUsers,
        totalReferred: updatedReferredUsers.length,
        lastReferralDate: now
      });
    } else {
      // Create new record
      await ctx.db.insert("referrals", {
        referrerId: args.referrerId,
        referredUsers: [{
          userId: args.referredUserId,
          referralCode: args.referralCode,
          referredAt: now
        }],
        totalReferred: 1,
        firstReferralDate: now,
        lastReferralDate: now
      });
    }
    
    // Update user stats
    await ctx.db.patch(args.referrerId, {
      referralStats: {
        totalReferred: (existingReferral?.totalReferred || 0) + 1,
        firstReferralDate: existingReferral?.firstReferralDate || now,
        lastReferralDate: now
      }
    });
  }
});

// Get referral details for a specific user (as referrer)
export const getUserReferralDetails = query({
  args: { userId: v.id("users") },
  returns: v.object({
    totalReferred: v.number(),
    firstReferralDate: v.optional(v.number()),
    lastReferralDate: v.optional(v.number()),
    referredUsers: v.array(v.object({
      userId: v.id("users"),
      referralCode: v.string(),
      referredAt: v.number(),
      userName: v.string(),
      userEmail: v.string()
    }))
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    const referralRecord = await ctx.db
      .query("referrals")
      .withIndex("by_referrer", (q) => q.eq("referrerId", args.userId))
      .unique();
    
    if (!referralRecord) {
      return {
        totalReferred: 0,
        firstReferralDate: undefined,
        lastReferralDate: undefined,
        referredUsers: []
      };
    }
    
    // Get names and emails for all referred users
    const referredUsersWithNames = await Promise.all(
      referralRecord.referredUsers.map(async (referredUser) => {
        const userDoc = await ctx.db.get(referredUser.userId);
        return {
          userId: referredUser.userId,
          referralCode: referredUser.referralCode,
          referredAt: referredUser.referredAt,
          userName: userDoc?.name || "Unknown",
          userEmail: userDoc?.email || "Unknown"
        };
      })
    );
    
    return {
      totalReferred: referralRecord.totalReferred,
      firstReferralDate: referralRecord.firstReferralDate,
      lastReferralDate: referralRecord.lastReferralDate,
      referredUsers: referredUsersWithNames
    };
  }
});

// Get all referral data for admin dashboard
export const getAllReferralData = query({
  args: {},
  returns: v.array(v.any()),
  handler: async (ctx, args) => {
    const referrals = await ctx.db.query("referrals").collect();
    
    const referralsWithNames = await Promise.all(
      referrals.map(async (referral) => {
        const referrer = await ctx.db.get(referral.referrerId);
        const referredUsersWithNames = await Promise.all(
          referral.referredUsers.map(async (referredUser) => {
            const user = await ctx.db.get(referredUser.userId);
            return {
              ...referredUser,
              userName: user?.name || "Unknown",
              userEmail: user?.email || "Unknown"
            };
          })
        );
        
        return {
          ...referral,
          referrerName: referrer?.name || "Unknown",
          referrerEmail: referrer?.email || "Unknown",
          referredUsers: referredUsersWithNames
        };
      })
    );
    
    return referralsWithNames;
  }
});

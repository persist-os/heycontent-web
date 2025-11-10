import { v } from "convex/values";

export const referralSchemaFields = {
  referrerId: v.id("users"),
  referredUsers: v.array(v.object({
    userId: v.id("users"),
    referralCode: v.string(),
    referredAt: v.number(),
  })),
  totalReferred: v.number(),
  firstReferralDate: v.optional(v.number()),
  lastReferralDate: v.optional(v.number()),
};

export const referralValidator = v.object(referralSchemaFields);


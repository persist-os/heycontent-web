import { v } from "convex/values";

// Gmail Token Schema Fields
export const gmailTokenSchemaFields = {
  userId: v.string(),
  accessToken: v.string(),
  refreshToken: v.string(),
  expiryDate: v.number(),
  scope: v.string(),
  lastRefreshed: v.number(),
  tokenType: v.string(),
};

// Gmail Token Validator
export const gmailTokenValidator = v.object(gmailTokenSchemaFields);

// Validator for updating Gmail token (used in mutations)
export const updateGmailTokenArgsValidator = v.object({
  userId: v.string(),
  accessToken: v.string(),
  refreshToken: v.string(),
  expiryDate: v.number(),
  scope: v.string(),
  tokenType: v.string(),
});

// Validator for getting Gmail token (used in queries)
export const getGmailTokenArgsValidator = v.object({
  userId: v.string(),
});

// Gmail Account Schema Fields (for profile data)
export const gmailAccountSchemaFields = {
  userId: v.string(),
  email: v.string(),
  messagesTotal: v.optional(v.number()),
  threadsTotal: v.optional(v.number()),
  historyId: v.optional(v.string()),
  labelsTotal: v.optional(v.number()),
  data: v.optional(v.object({
    messagesTotal: v.optional(v.number()),
    threadsTotal: v.optional(v.number()),
    historyId: v.optional(v.string()),
    labelsTotal: v.optional(v.number()),
  })),
  createdAt: v.number(),
  updatedAt: v.number(),
};

// Gmail Account Validator
export const gmailAccountValidator = v.object(gmailAccountSchemaFields);

// Validator for storing Gmail profile (used in mutations)
export const storeGmailProfileArgsValidator = v.object({
  userId: v.string(),
  email: v.string(),
  profileData: v.object({
    messagesTotal: v.optional(v.number()),
    threadsTotal: v.optional(v.number()),
    historyId: v.optional(v.string()),
    labelsTotal: v.optional(v.number()),
  }),
});


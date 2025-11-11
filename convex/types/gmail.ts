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


import { v } from "convex/values";

export const clientTypeValidator = v.union(
  v.literal("web"),
  v.literal("extension")
);

export const apiKeySchemaFields = {
  user_id: v.string(),
  hashed_key: v.string(),
  created_at: v.number(),
  clientType: clientTypeValidator,
  rate_tier: v.optional(v.string()),
  scopes: v.optional(v.array(v.string())),
  status: v.optional(v.string()),
};


export const apiKeyValidator = v.object(apiKeySchemaFields);


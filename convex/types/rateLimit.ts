import { v } from "convex/values";

export const rateLimitSchemaFields = {
  user_id: v.string(),
  resource: v.string(),
  timestamps: v.array(v.number()),
  lastUpdated: v.number(),
};

export const rateLimitValidator = v.object(rateLimitSchemaFields);


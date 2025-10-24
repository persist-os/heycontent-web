import { v } from "convex/values";

export const usageEventSchemaFields = {
  userId: v.string(),
  timestamp: v.number(),
  model: v.string(),
  status: v.string(),
  qty: v.number(),
  endpoint: v.optional(v.string()),
  method: v.optional(v.string()),
  path: v.optional(v.string()),
  statusCode: v.optional(v.number()),
  userAgent: v.optional(v.string()),
  ip: v.optional(v.string()),
  requestId: v.optional(v.string()),
};

export const usageEventValidator = v.object(usageEventSchemaFields);


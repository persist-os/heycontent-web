import { v } from "convex/values";

export const agnoRunEventSchemaFields = {
  runId: v.string(),
  agentId: v.optional(v.string()),
  agentType: v.optional(v.string()),
  agentName: v.optional(v.string()),
  userId: v.optional(v.string()),
  sessionId: v.optional(v.string()),
  eventType: v.string(),
  event: v.any(),
  createdAt: v.number(),
  customType: v.optional(v.string()),
  telemetryContext: v.optional(v.any()),
  metadata: v.optional(v.any()),
};

export const agnoRunEventValidator = v.object(agnoRunEventSchemaFields);

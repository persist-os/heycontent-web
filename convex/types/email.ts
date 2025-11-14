import { v } from "convex/values";

/**
 * Email tracking validators.
 * Pattern 3: Schema & Data Law (Pydantic ↔ Convex)
 */

export const emailSendValidator = v.object({
  senderUserId: v.optional(v.string()),
  recipients: v.array(v.string()),
  subject: v.string(),
  sentCount: v.number(),
  filteredCount: v.number(),
  sentAt: v.number(),
});

export const emailSendCreateValidator = v.object({
  senderUserId: v.optional(v.string()),
  recipients: v.array(v.string()),
  subject: v.string(),
  sentCount: v.number(),
  filteredCount: v.number(),
});

export const emailSendSchemaFields = {
  senderUserId: v.optional(v.string()),
  recipients: v.array(v.string()),
  subject: v.string(),
  sentCount: v.number(),
  filteredCount: v.number(),
  sentAt: v.number(),
};


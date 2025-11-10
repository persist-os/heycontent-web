import { v } from "convex/values";
import { jobTypeValidator, jobPriorityValidator } from "./backgroundJobs";

export const backgroundJobStatusValidator = v.union(
  v.literal("queued"),
  v.literal("running"),
  v.literal("completed"),
  v.literal("failed"),
  v.literal("cancelled")
);

export const backgroundJobSchemaFields = {
  // Core identification
  jobId: v.string(),              // Redis message ID (e.g. "1234567890-0")
  userId: v.string(),
  
  // Job classification
  type: jobTypeValidator,         // Import from types/backgroundJobs.ts
  payload: v.any(),               // Job-specific payload data
  
  // Status tracking
  status: backgroundJobStatusValidator,
  priority: jobPriorityValidator,  // Import from types/backgroundJobs.ts
  
  // Timing
  createdAt: v.number(),
  startedAt: v.optional(v.number()),
  completedAt: v.optional(v.number()),
  
  // Results and errors
  result: v.optional(v.any()),
  error: v.optional(v.string()),
  
  // Retry tracking
  attempts: v.number(),
  maxAttempts: v.number(),
  
  // Worker metadata
  workerId: v.optional(v.string()),
};

export const backgroundJobValidator = v.object(backgroundJobSchemaFields);


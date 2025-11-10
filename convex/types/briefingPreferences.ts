import { v } from "convex/values";

export const minimumPriorityValidator = v.union(
  v.literal("critical"),
  v.literal("high"),
  v.literal("medium"),
  v.literal("low")
);

export const dreamReportFrequencyValidator = v.union(
  v.literal("nightly"),
  v.literal("weekly"),
  v.literal("never")
);

export const summaryDepthValidator = v.union(
  v.literal("brief"),
  v.literal("standard"),
  v.literal("detailed")
);

export const briefingPreferencesSchemaFields = {
  userId: v.string(),
  
  // Category Filters
  enabledCategories: v.object({
    crystal: v.boolean(),
    widget: v.boolean(),
    collaboration: v.boolean(),
    dream: v.boolean(),
    system: v.boolean()
  }),
  
  // Priority Filter
  minimumPriority: minimumPriorityValidator,
  
  // Display Preferences
  maxBriefersVisible: v.number(),
  animationsEnabled: v.boolean(),
  soundEnabled: v.boolean(),
  
  // Notification Channels
  notificationChannels: v.object({
    inApp: v.boolean(),
    email: v.boolean(),
    push: v.boolean()
  }),
  
  // Digest Preferences
  dailyDigest: v.boolean(),
  digestTime: v.string(), // e.g., "08:00"
  weeklyReport: v.boolean(),
  
  // Dream Reports
  enableDreamReports: v.boolean(),
  dreamReportFrequency: dreamReportFrequencyValidator,
  
  // AI Summarization
  aiSummarization: v.boolean(),
  summaryDepth: summaryDepthValidator,
  
  createdAt: v.number(),
  updatedAt: v.number()
};

export const briefingPreferencesValidator = v.object(briefingPreferencesSchemaFields);


import { v } from "convex/values";

export const translationMethodValidator = v.union(
  v.literal("ai"),                // AI-generated (Gemini)
  v.literal("manual"),            // Manually entered
  v.literal("edited")             // AI-generated, then manually edited
);

export const translationSchemaFields = {
  // Cache key
  sourceText: v.string(),           // Original text (usually English)
  sourceTextHash: v.string(),       // SHA-256 hash for fast lookup
  sourceLang: v.string(),           // ISO 639-1 code (e.g., "en")
  targetLang: v.string(),           // ISO 639-1 code (e.g., "ko", "ja", "es")
  
  // Translation
  translatedText: v.string(),       // The translated text
  translationMethod: translationMethodValidator,
  
  // Context (helps with context-aware translation)
  context: v.optional(v.string()),  // Where it's used (e.g., "button.save", "heading.welcome")
  componentPath: v.optional(v.string()), // Component path for tracking
  
  // Usage tracking
  usageCount: v.number(),           // How many times requested
  firstUsedAt: v.number(),          // When first user encountered this
  lastUsedAt: v.number(),           // Most recent request
  
  // Quality control
  verified: v.boolean(),            // Manually verified/approved
  needsReview: v.optional(v.boolean()), // Flagged for review
  version: v.number(),              // For translation updates/improvements
  
  // Metadata
  translatedBy: v.optional(v.string()), // userId who first triggered or manually edited
  reviewedBy: v.optional(v.string()),   // userId who verified
  notes: v.optional(v.string()),        // Admin notes about translation
  
  createdAt: v.number(),
  updatedAt: v.number(),
};

export const translationValidator = v.object(translationSchemaFields);

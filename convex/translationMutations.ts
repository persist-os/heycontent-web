import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { hashTranslationKey } from "./lib/hash";

/**
 * Save a new translation to cache
 * Called after AI translates something for the first time
 */
export const saveTranslation = mutation({
  args: {
    sourceText: v.string(),
    sourceLang: v.string(),
    targetLang: v.string(),
    translatedText: v.string(),
    translationMethod: v.union(
      v.literal("ai"),
      v.literal("manual"),
      v.literal("edited")
    ),
    context: v.optional(v.string()),
    componentPath: v.optional(v.string()),
    translatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const {
      sourceText,
      sourceLang,
      targetLang,
      translatedText,
      translationMethod,
      context,
      componentPath,
      translatedBy,
    } = args;
    
    // Generate hash
    const sourceTextHash = hashTranslationKey(sourceText);
    
    // Check if already exists (race condition protection)
    const existing = await ctx.db
      .query("translations")
      .withIndex("by_hash_and_lang", (q) =>
        q.eq("sourceTextHash", sourceTextHash).eq("targetLang", targetLang)
      )
      .first();
    
    if (existing) {
      // Already cached by another request, just update usage
      await ctx.db.patch(existing._id, {
        usageCount: existing.usageCount + 1,
        lastUsedAt: Date.now(),
      });
      return existing._id;
    }
    
    // Create new translation
    const now = Date.now();
    const translationId = await ctx.db.insert("translations", {
      sourceText,
      sourceTextHash,
      sourceLang,
      targetLang,
      translatedText,
      translationMethod,
      context,
      componentPath,
      usageCount: 1,
      firstUsedAt: now,
      lastUsedAt: now,
      verified: false,
      version: 1,
      translatedBy,
      createdAt: now,
      updatedAt: now,
    });
    
    return translationId;
  },
});

/**
 * Batch save multiple translations
 * For pre-translating common strings
 */
export const saveBatchTranslations = mutation({
  args: {
    translations: v.array(
      v.object({
        sourceText: v.string(),
        sourceLang: v.string(),
        targetLang: v.string(),
        translatedText: v.string(),
        context: v.optional(v.string()),
      })
    ),
    translationMethod: v.union(
      v.literal("ai"),
      v.literal("manual"),
      v.literal("edited")
    ),
    translatedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { translations, translationMethod, translatedBy } = args;
    
    const now = Date.now();
    const savedIds = [];
    
    for (const translation of translations) {
      const { sourceText, sourceLang, targetLang, translatedText, context } =
        translation;
      
      const sourceTextHash = hashTranslationKey(sourceText);
      
      // Check if exists
      const existing = await ctx.db
        .query("translations")
        .withIndex("by_hash_and_lang", (q) =>
          q.eq("sourceTextHash", sourceTextHash).eq("targetLang", targetLang)
        )
        .first();
      
      if (!existing) {
        const id = await ctx.db.insert("translations", {
          sourceText,
          sourceTextHash,
          sourceLang,
          targetLang,
          translatedText,
          translationMethod,
          context,
          usageCount: 0,
          firstUsedAt: now,
          lastUsedAt: now,
          verified: translationMethod === "manual",
          version: 1,
          translatedBy,
          createdAt: now,
          updatedAt: now,
        });
        savedIds.push(id);
      }
    }
    
    return {
      saved: savedIds.length,
      skipped: translations.length - savedIds.length,
    };
  },
});

/**
 * Update an existing translation (for manual refinement)
 */
export const updateTranslation = mutation({
  args: {
    translationId: v.id("translations"),
    translatedText: v.string(),
    verified: v.optional(v.boolean()),
    needsReview: v.optional(v.boolean()),
    notes: v.optional(v.string()),
    reviewedBy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const {
      translationId,
      translatedText,
      verified,
      needsReview,
      notes,
      reviewedBy,
    } = args;
    
    const existing = await ctx.db.get(translationId);
    if (!existing) {
      throw new Error("Translation not found");
    }
    
    await ctx.db.patch(translationId, {
      translatedText,
      translationMethod: "edited",
      verified: verified ?? existing.verified,
      needsReview: needsReview ?? existing.needsReview,
      notes: notes ?? existing.notes,
      reviewedBy: reviewedBy ?? existing.reviewedBy,
      version: existing.version + 1,
      updatedAt: Date.now(),
    });
    
    return translationId;
  },
});

/**
 * Delete a translation (admin only)
 */
export const deleteTranslation = mutation({
  args: {
    translationId: v.id("translations"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.translationId);
    return { success: true };
  },
});

/**
 * Mark translation for review
 */
export const flagForReview = mutation({
  args: {
    translationId: v.id("translations"),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { translationId, reason } = args;
    
    await ctx.db.patch(translationId, {
      needsReview: true,
      notes: reason,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});

/**
 * Verify a translation as correct
 */
export const verifyTranslation = mutation({
  args: {
    translationId: v.id("translations"),
    reviewedBy: v.string(),
  },
  handler: async (ctx, args) => {
    const { translationId, reviewedBy } = args;
    
    await ctx.db.patch(translationId, {
      verified: true,
      needsReview: false,
      reviewedBy,
      updatedAt: Date.now(),
    });
    
    return { success: true };
  },
});


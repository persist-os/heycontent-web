import { query } from "./_generated/server";
import { v } from "convex/values";
import { hashTranslationKey } from "./lib/hash";

/**
 * Get a cached translation from Convex
 * Returns immediately if exists, otherwise returns null (triggers AI translation)
 */
export const getTranslation = query({
  args: {
    sourceText: v.string(),
    sourceLang: v.string(),
    targetLang: v.string(),
  },
  handler: async (ctx, args) => {
    const { sourceText, sourceLang, targetLang } = args;
    
    // Same language = no translation needed
    if (sourceLang === targetLang) {
      return {
        translatedText: sourceText,
        cached: true,
        method: "same_language"
      };
    }
    
    // Generate hash for fast lookup
    const sourceTextHash = hashTranslationKey(sourceText);
    
    // Check cache
    const cached = await ctx.db
      .query("translations")
      .withIndex("by_hash_and_lang", (q) =>
        q.eq("sourceTextHash", sourceTextHash).eq("targetLang", targetLang)
      )
      .first();
    
    if (cached) {
      return {
        translatedText: cached.translatedText,
        cached: true,
        method: cached.translationMethod,
        verified: cached.verified,
        usageCount: cached.usageCount
      };
    }
    
    // Not in cache
    return null;
  },
});

/**
 * Batch get translations for multiple strings
 * Optimized for translating entire pages at once
 */
export const getBatchTranslations = query({
  args: {
    texts: v.array(v.string()),
    sourceLang: v.string(),
    targetLang: v.string(),
  },
  handler: async (ctx, args) => {
    const { texts, sourceLang, targetLang } = args;
    
    if (sourceLang === targetLang) {
      return texts.map(text => ({
        sourceText: text,
        translatedText: text,
        cached: true
      }));
    }
    
    const results = await Promise.all(
      texts.map(async (text) => {
        const hash = hashTranslationKey(text);
        
        const cached = await ctx.db
          .query("translations")
          .withIndex("by_hash_and_lang", (q) =>
            q.eq("sourceTextHash", hash).eq("targetLang", targetLang)
          )
          .first();
        
        if (cached) {
          return {
            sourceText: text,
            translatedText: cached.translatedText,
            cached: true,
            verified: cached.verified
          };
        }
        
        return {
          sourceText: text,
          translatedText: null,
          cached: false
        };
      })
    );
    
    return results;
  },
});

/**
 * Get all translations for a specific language
 * Useful for admin panel to review translations
 */
export const getTranslationsForLanguage = query({
  args: {
    targetLang: v.string(),
    limit: v.optional(v.number()),
    verified: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { targetLang, limit = 100, verified } = args;
    
    let query = ctx.db
      .query("translations")
      .withIndex("by_target_lang", (q) => q.eq("targetLang", targetLang));
    
    if (verified !== undefined) {
      query = ctx.db
        .query("translations")
        .withIndex("by_verification", (q) =>
          q.eq("verified", verified).eq("targetLang", targetLang)
        );
    }
    
    const translations = await query
      .order("desc")
      .take(limit);
    
    return translations;
  },
});

/**
 * Get translation statistics for analytics
 */
export const getTranslationStats = query({
  args: {
    targetLang: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { targetLang } = args;
    
    const translations = targetLang
      ? await ctx.db
          .query("translations")
          .withIndex("by_target_lang", (q) => q.eq("targetLang", targetLang))
          .collect()
      : await ctx.db.query("translations").collect();
    
    const stats = {
      total: translations.length,
      verified: translations.filter(t => t.verified).length,
      needsReview: translations.filter(t => t.needsReview).length,
      totalUsage: translations.reduce((sum, t) => sum + t.usageCount, 0),
      byMethod: {
        ai: translations.filter(t => t.translationMethod === "ai").length,
        manual: translations.filter(t => t.translationMethod === "manual").length,
        edited: translations.filter(t => t.translationMethod === "edited").length,
      },
      languages: targetLang ? [targetLang] : [...new Set(translations.map(t => t.targetLang))],
    };
    
    return stats;
  },
});

/**
 * Get most used untranslated strings
 * Helps prioritize what to pre-translate
 */
export const getMostRequestedStrings = query({
  args: {
    targetLang: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { targetLang, limit = 50 } = args;
    
    const translations = await ctx.db
      .query("translations")
      .withIndex("by_target_lang", (q) => q.eq("targetLang", targetLang))
      .order("desc")
      .take(1000); // Get a larger sample
    
    // Sort by usage count
    const sorted = translations
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, limit);
    
    return sorted.map(t => ({
      sourceText: t.sourceText,
      translatedText: t.translatedText,
      usageCount: t.usageCount,
      verified: t.verified,
      needsReview: t.needsReview,
    }));
  },
});


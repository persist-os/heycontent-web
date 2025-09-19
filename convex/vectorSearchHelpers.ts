// @ts-nocheck
import { action, mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { api } from "./_generated/api";
import { generateEmbedding } from "./vectorSearchEmbeddings";

// Google Gemini API endpoint for embeddings
const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent";

/**
 * Enhance search query to improve matching
 */
export function enhanceSearchQuery(query: string): string {
  console.log('🔍 [QUERY ENHANCEMENT] Original query:', query);
  
  let enhancedQuery = query.toLowerCase();
  
  // Common abbreviations and expansions
  const abbreviations: Record<string, string> = {
    'gbm': 'general body meeting gbm',
    'gm': 'general meeting gm',
    'exec': 'executive board exec',
    'e-board': 'executive board eboard e-board',
    'eboard': 'executive board eboard e-board',
    'mtg': 'meeting mtg',
    'event': 'event gathering activity',
    'club': 'club organization group',
    'org': 'organization club org',
    'social': 'social event gathering party',
    'networking': 'networking professional career connect',
    'partnership': 'partnership collaboration sponsor business',
    'newsletter': 'newsletter email subscription marketing',
    'collab': 'collaboration partnership email business',
  };
  
  // Expand abbreviations
  for (const [abbrev, expansion] of Object.entries(abbreviations)) {
    if (enhancedQuery.includes(abbrev)) {
      enhancedQuery = enhancedQuery.replace(new RegExp(`\\b${abbrev}\\b`, 'gi'), expansion);
    }
  }
  
  // Add context for better semantic understanding
  if (enhancedQuery.includes('meeting') || enhancedQuery.includes('gbm') || enhancedQuery.includes('general body')) {
    enhancedQuery += ' meeting event organization club announcement';
  }
  
  if (enhancedQuery.includes('post') && enhancedQuery.includes('club')) {
    enhancedQuery += ' social media announcement update';
  }
  
  if (enhancedQuery.includes('partnership') || enhancedQuery.includes('collab') || enhancedQuery.includes('sponsor')) {
    enhancedQuery += ' partnership collaboration business professional opportunity';
  }
  
  console.log('🔍 [QUERY ENHANCEMENT] Enhanced query:', enhancedQuery);
  return enhancedQuery;
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Search for relevant content using cosine similarity
 */
export const searchRelevantContent = action({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
    contentTypes: v.optional(v.array(v.union(
      v.literal("conversation"),
      v.literal("note"),
      v.literal("crystal_shard"),
    ))),
    minSimilarity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    console.log('🎯 [TRUE VECTOR SEARCH DEBUG] REAL vector search with embeddings called!');
    console.log('🎯 [TRUE VECTOR SEARCH DEBUG] Query:', args.query);
    console.log('🎯 [TRUE VECTOR SEARCH DEBUG] User ID:', args.userId);
    console.log('🎯 [TRUE VECTOR SEARCH DEBUG] Content types:', args.contentTypes);
    console.log('🎯 [TRUE VECTOR SEARCH DEBUG] Min similarity threshold:', args.minSimilarity || 0.3);
    console.log('🎯 [TRUE VECTOR SEARCH DEBUG] This function uses Google embeddings and cosine similarity!');
    console.log('🎯 [TRUE VECTOR SEARCH DEBUG] If you see this log, then REAL vector search is being used.');
    
    try {
      // Enhance the query for better matching
      const enhancedQuery = enhanceSearchQuery(args.query);
      
      // Generate embedding for the enhanced query
      const queryEmbedding = await generateEmbedding(enhancedQuery);
      console.log('🎯 [TRUE VECTOR SEARCH DEBUG] Generated query embedding with dimension:', queryEmbedding.length);

      // Get all user embeddings
      const userEmbeddings = await ctx.runQuery(internal.vectorSearchQueries.getAllUserEmbeddings, {
        userId: args.userId,
        contentTypes: args.contentTypes,
      });
      
      console.log('🎯 [TRUE VECTOR SEARCH DEBUG] Found', userEmbeddings.length, 'user embeddings to compare against');

      // Calculate similarities and sort
      const similarities = userEmbeddings.map((doc) => {
        const score = cosineSimilarity(queryEmbedding, doc.embedding);
        return {
          ...doc,
          score,
        };
      });

      // Apply similarity threshold (default: 0.3, which is decent for semantic similarity)
      const minThreshold = args.minSimilarity || 0.3;
      const filteredSimilarities = similarities.filter(item => item.score >= minThreshold);
      
      console.log('🎯 [TRUE VECTOR SEARCH DEBUG] After similarity threshold (>= ' + minThreshold + '):', filteredSimilarities.length, 'results remain');
      
      // Log score distribution for debugging
      const scoreDistribution = similarities
        .sort((a, b) => b.score - a.score)
        .slice(0, 10)
        .map(item => ({
          title: item.title.substring(0, 50) + '...',
          contentType: item.contentType,
          score: Math.round(item.score * 1000) / 1000
        }));
      console.log('🎯 [TRUE VECTOR SEARCH DEBUG] Top 10 similarity scores:', scoreDistribution);

      // Sort by similarity and take top results
      filteredSimilarities.sort((a, b) => b.score - a.score);
      const topResults = filteredSimilarities.slice(0, args.limit || 5);
      
      console.log('🎯 [TRUE VECTOR SEARCH DEBUG] Returning', topResults.length, 'top results');
      console.log('🎯 [TRUE VECTOR SEARCH DEBUG] Result content types:', topResults.map(r => r.contentType));
      
      return topResults;
    } catch (error) {
      console.error("❌ [TRUE VECTOR SEARCH DEBUG] Error searching content:", error);
      throw error;
    }
  },
});



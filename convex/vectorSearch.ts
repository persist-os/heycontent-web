// @ts-nocheck
// @ts-nocheck
import { action, query, internalQuery, internalAction } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { contentTypesArrayValidator } from "./types/embeddings";

/**
 * Vector Search System
 * 
 * ⚠️ IMPORTANT: Embedding generation is handled automatically in the BACKEND:
 * - Notes: backend-new/app/agents/smart_notes/note_processor.py
 * - Conversations: backend-new/app/agents/chat_engine/services/chat_api_service.py
 * - Crystals: backend-new/app/agents/persona_crystallization/crystal_dam/
 * 
 * This file ONLY handles:
 * - Reading existing embeddings
 * - Vector similarity search
 * - Hybrid search (vector + keyword)
 */

const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent";
const MAX_PAYLOAD_BYTES = 35000; // Conservative limit (Google API limit is 36000, leave buffer for JSON overhead)

/**
 * Calculate the size of the request body in bytes
 */
function calculatePayloadSize(queryText: string): number {
  const requestBody = {
    model: "models/text-embedding-004",
    content: {
      parts: [{ text: queryText }],
    },
    taskType: "RETRIEVAL_QUERY",
  };
  return new TextEncoder().encode(JSON.stringify(requestBody)).length;
}

/**
 * Truncate query text to fit within payload size limit using binary search
 * Similar to backend embedding_service.py _preprocess_content pattern
 * NEVER throws - always returns a valid query, even if minimal
 */
function truncateQueryToFit(queryText: string, maxBytes: number): string {
  const baseRequestBody = {
    model: "models/text-embedding-004",
    content: {
      parts: [{ text: "" }],
    },
    taskType: "RETRIEVAL_QUERY",
  };
  
  // Calculate overhead (base JSON structure without text)
  const overheadBytes = new TextEncoder().encode(JSON.stringify(baseRequestBody)).length;
  const availableBytes = maxBytes - overheadBytes;
  
  // If overhead exceeds limit, return minimal query (should never happen, but be safe)
  if (availableBytes <= 0) {
    console.warn(`⚠️ [HYBRID SEARCH] Payload overhead (${overheadBytes} bytes) exceeds limit (${maxBytes} bytes), using minimal query`);
    return queryText.substring(0, Math.min(100, queryText.length));
  }
  
  // Binary search for optimal truncation point
  let start = 0;
  let end = queryText.length;
  let bestLength = 0;
  
  while (start <= end) {
    const mid = Math.floor((start + end) / 2);
    const testText = queryText.substring(0, mid);
    const testBody = { ...baseRequestBody, content: { parts: [{ text: testText }] } };
    const testBytes = new TextEncoder().encode(JSON.stringify(testBody)).length;
    
    if (testBytes <= maxBytes) {
      bestLength = mid;
      start = mid + 1;
    } else {
      end = mid - 1;
    }
  }
  
  // If binary search found nothing, use conservative fallback (should never happen, but be safe)
  if (bestLength === 0) {
    console.warn(`⚠️ [HYBRID SEARCH] Binary search found no valid length, using conservative truncation`);
    // Try progressively smaller sizes until we find one that fits
    for (let len = Math.min(1000, queryText.length); len > 0; len -= 100) {
      const testText = queryText.substring(0, len);
      const testBody = { ...baseRequestBody, content: { parts: [{ text: testText }] } };
      const testBytes = new TextEncoder().encode(JSON.stringify(testBody)).length;
      if (testBytes <= maxBytes) {
        bestLength = len;
        break;
      }
    }
    // Final fallback: at least return first 100 chars
    if (bestLength === 0) {
      bestLength = Math.min(100, queryText.length);
    }
  }
  
  const truncated = queryText.substring(0, bestLength);
  if (truncated.length < queryText.length) {
    console.warn(`⚠️ [HYBRID SEARCH] Query truncated from ${queryText.length} to ${truncated.length} chars to fit payload limit`);
  }
  
  return truncated;
}

/**
 * BM25 Tokenization
 * Splits text on whitespace, lowercases, removes punctuation
 */
function tokenize(text: string): string[] {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  // Remove punctuation, lowercase, split on whitespace
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ') // Replace punctuation with space
    .split(/\s+/) // Split on whitespace
    .filter(token => token.length > 0); // Remove empty tokens
}

/**
 * Calculate term frequency (TF) for a term in a document
 */
function calculateTermFrequency(term: string, tokens: string[]): number {
  let count = 0;
  for (const token of tokens) {
    if (token === term) {
      count++;
    }
  }
  return count;
}

/**
 * Calculate inverse document frequency (IDF) for a term across corpus
 */
function calculateIDF(term: string, allDocTokens: string[][]): number {
  let documentsContainingTerm = 0;
  for (const docTokens of allDocTokens) {
    if (docTokens.includes(term)) {
      documentsContainingTerm++;
    }
  }
  
  if (documentsContainingTerm === 0) {
    return 0; // Term not found in any document
  }
  
  const totalDocuments = allDocTokens.length;
  // IDF = log((N - n + 0.5) / (n + 0.5))
  // Where N = total documents, n = documents containing term
  // Using standard BM25 IDF formula
  return Math.log((totalDocuments - documentsContainingTerm + 0.5) / (documentsContainingTerm + 0.5));
}

/**
 * Calculate BM25 score for a document
 * BM25 formula: score = IDF * (TF * (k1 + 1)) / (TF + k1 * (1 - b + b * (docLength / avgDocLength)))
 * Default params: k1=1.5, b=0.75 (standard BM25 parameters)
 */
function calculateBM25Score(
  queryTokens: string[],
  docTokens: string[],
  allDocTokens: string[][],
  k1: number = 1.5,
  b: number = 0.75
): number {
  if (queryTokens.length === 0 || docTokens.length === 0) {
    return 0;
  }
  
  // Calculate average document length
  const totalLength = allDocTokens.reduce((sum, tokens) => sum + tokens.length, 0);
  const avgDocLength = totalLength / allDocTokens.length;
  
  // Calculate BM25 score for each query term and sum
  let totalScore = 0;
  const docLength = docTokens.length;
  
  for (const queryTerm of queryTokens) {
    // Calculate TF for this term in this document
    const tf = calculateTermFrequency(queryTerm, docTokens);
    
    if (tf === 0) {
      continue; // Term not in document, skip
    }
    
    // Calculate IDF for this term
    const idf = calculateIDF(queryTerm, allDocTokens);
    
    if (idf === 0) {
      continue; // Term not in corpus, skip
    }
    
    // BM25 formula
    const numerator = tf * (k1 + 1);
    const denominator = tf + k1 * (1 - b + b * (docLength / avgDocLength));
    const termScore = idf * (numerator / denominator);
    
    totalScore += termScore;
  }
  
  return totalScore;
}

/**
 * Normalize BM25 score to 0-1 range for combination with embedding scores
 * Uses min-max normalization with fallback
 */
function normalizeBM25Score(bm25Score: number, allBM25Scores: number[]): number {
  if (allBM25Scores.length === 0 || bm25Score === 0) {
    return 0;
  }
  
  const minScore = Math.min(...allBM25Scores);
  const maxScore = Math.max(...allBM25Scores);
  
  if (maxScore === minScore) {
    // All scores are the same, return 0.5 (neutral)
    return 0.5;
  }
  
  // Normalize to 0-1 range
  return (bm25Score - minScore) / (maxScore - minScore);
}

/**
 * True hybrid search that combines BM25 keyword matching with embedding similarity.
 * 
 * Features:
 * - BM25 algorithm for exact term matching, acronyms, and proper nouns
 * - Embedding similarity for semantic understanding
 * - Intelligent scoring: final_score = 0.7 * embedding_score + 0.3 * bm25_score (default)
 * - Handles edge cases: exact terms, acronyms, proper nouns (BM25) + natural language (embeddings)
 * 
 * This is the true hybrid retrieval system (BM25 + embeddings), not just vector search.
 */
export const trueHybridSearch = action({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
    contentTypes: contentTypesArrayValidator,
    minSimilarity: v.optional(v.number()),
  },
  returns: v.array(v.object({
    contentId: v.string(),
    contentType: v.string(),
    title: v.string(),
    content: v.string(),
    embedding: v.array(v.float64()),
    score: v.number(),
  })),
  handler: async (ctx, args) => {
    try {
      // Validate query
      if (!args.query || typeof args.query !== 'string' || args.query.trim().length === 0) {
        return [];
      }

      // Generate embedding for the query
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error("GOOGLE_API_KEY environment variable is required");
      }

      // Safeguard: Validate and truncate query if payload exceeds limit
      let queryText = args.query.trim();
      const payloadSize = calculatePayloadSize(queryText);
      
      if (payloadSize > MAX_PAYLOAD_BYTES) {
        console.warn(`⚠️ [HYBRID SEARCH] Payload size ${payloadSize} bytes exceeds limit ${MAX_PAYLOAD_BYTES}, truncating query`);
        queryText = truncateQueryToFit(queryText, MAX_PAYLOAD_BYTES);
        
        // Verify truncation worked (should always succeed, but log if it didn't)
        const finalPayloadSize = calculatePayloadSize(queryText);
        if (finalPayloadSize > MAX_PAYLOAD_BYTES) {
          console.warn(`⚠️ [HYBRID SEARCH] Payload still ${finalPayloadSize} bytes after truncation, attempting additional truncation`);
          // One more aggressive truncation attempt
          queryText = truncateQueryToFit(queryText, MAX_PAYLOAD_BYTES - 1000); // Extra buffer
        }
      }

      const requestBody = {
        model: "models/text-embedding-004",
        content: {
          parts: [{ text: queryText }],
        },
        taskType: "RETRIEVAL_QUERY",
      };

      const response = await fetch(`${GOOGLE_API_URL}?key=${apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = `Google API error: ${response.status} ${response.statusText}. ${errorText}`;
        
        // Check for payload size errors - if this happens, truncate more aggressively and retry once
        if (response.status === 400 && errorText.includes("payload size")) {
          console.error(`❌ [HYBRID SEARCH] Payload size error detected. Original query length: ${args.query.length}, Truncated length: ${queryText.length}`);
          console.error(`❌ [HYBRID SEARCH] Attempting more aggressive truncation and retry`);
          
          // More aggressive truncation with extra buffer
          queryText = truncateQueryToFit(args.query.trim(), MAX_PAYLOAD_BYTES - 2000);
          
          // Retry once with truncated query
          const retryRequestBody = {
            model: "models/text-embedding-004",
            content: {
              parts: [{ text: queryText }],
            },
            taskType: "RETRIEVAL_QUERY",
          };
          
          const retryResponse = await fetch(`${GOOGLE_API_URL}?key=${apiKey}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(retryRequestBody),
          });
          
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            if (retryData.embedding && retryData.embedding.values) {
              console.log(`✅ [HYBRID SEARCH] Retry succeeded after aggressive truncation`);
              // Continue with retry data
              const queryEmbedding = retryData.embedding.values;
              
              // Get user embeddings
              const userEmbeddings = await ctx.runQuery(internal.vectorSearch.getUserEmbeddings, {
                userId: args.userId,
                contentTypes: args.contentTypes
              });
              
              // Tokenize query for BM25
              const queryTokens = tokenize(args.query);
              
              // Tokenize all documents for BM25 (combine title + content)
              const allDocTokens: string[][] = userEmbeddings.map(doc => {
                const combinedText = `${doc.title || ''} ${doc.content || ''}`;
                return tokenize(combinedText);
              });
              
              // Calculate embedding similarities and BM25 scores
              const results = userEmbeddings.map((doc, index) => {
                try {
                  let embeddingScore = 0;
                  
                  // Calculate embedding similarity if valid
                  if (doc.embedding && Array.isArray(doc.embedding) && doc.embedding.length === queryEmbedding.length) {
                    // Cosine similarity calculation
                    let dotProduct = 0;
                    let normA = 0;
                    let normB = 0;
                    
                    for (let i = 0; i < queryEmbedding.length; i++) {
                      const queryVal = queryEmbedding[i];
                      const docVal = doc.embedding[i];
                      
                      if (typeof queryVal !== 'number' || typeof docVal !== 'number' || isNaN(queryVal) || isNaN(docVal)) {
                        continue;
                      }
                      
                      dotProduct += queryVal * docVal;
                      normA += queryVal * queryVal;
                      normB += docVal * docVal;
                    }
                    
                    const score = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
                    embeddingScore = isNaN(score) || !isFinite(score) ? 0 : score;
                  }
                  
                  // Calculate BM25 score
                  const docTokens = allDocTokens[index];
                  const bm25Score = calculateBM25Score(queryTokens, docTokens, allDocTokens);
                  
                  return {
                    contentId: doc.contentId,
                    contentType: doc.contentType,
                    title: doc.title,
                    content: doc.content,
                    embedding: doc.embedding,
                    embeddingScore,
                    bm25Score,
                    docTokens,
                  };
                } catch (error) {
                  return {
                    contentId: doc.contentId,
                    contentType: doc.contentType,
                    title: doc.title,
                    content: doc.content,
                    embedding: doc.embedding,
                    embeddingScore: 0,
                    bm25Score: 0,
                    docTokens: [],
                  };
                }
              });
              
              // Normalize BM25 scores to 0-1 range
              const allBM25Scores = results.map(r => r.bm25Score);
              const normalizedResults = results.map(r => ({
                ...r,
                normalizedBM25Score: normalizeBM25Score(r.bm25Score, allBM25Scores),
              }));
              
              // Combine scores: final_score = 0.7 * embedding_score + 0.3 * bm25_score
              const combinedResults = normalizedResults.map(r => ({
                contentId: r.contentId,
                contentType: r.contentType,
                title: r.title,
                content: r.content,
                embedding: r.embedding,
                score: 0.7 * r.embeddingScore + 0.3 * r.normalizedBM25Score,
              }));

              // Apply similarity threshold and sort by combined score
              const minThreshold = args.minSimilarity || 0.35;
              const filteredResults = combinedResults
                .filter(item => item.score >= minThreshold)
                .sort((a, b) => b.score - a.score);
              
              // Return top results up to limit
              const limit = args.limit || 50;
              return filteredResults.slice(0, limit);
            }
          }
          
          // If retry also failed, log but don't throw - return empty results
          console.error(`❌ [HYBRID SEARCH] Retry also failed, returning empty results`);
          return [];
        }
        
        throw new Error(errorMessage);
      }

      const data = await response.json();
      if (!data.embedding || !data.embedding.values) {
        throw new Error('Invalid embedding response structure');
      }

      const queryEmbedding = data.embedding.values;
      
      // Get user embeddings
      const userEmbeddings = await ctx.runQuery(internal.vectorSearch.getUserEmbeddings, {
        userId: args.userId,
        contentTypes: args.contentTypes
      });
      
      // Tokenize query for BM25
      const queryTokens = tokenize(args.query);
      
      // Tokenize all documents for BM25 (combine title + content)
      const allDocTokens: string[][] = userEmbeddings.map(doc => {
        const combinedText = `${doc.title || ''} ${doc.content || ''}`;
        return tokenize(combinedText);
      });
      
      // Calculate embedding similarities and BM25 scores
      const results = userEmbeddings.map((doc, index) => {
        try {
          let embeddingScore = 0;
          
          // Calculate embedding similarity if valid
          if (doc.embedding && Array.isArray(doc.embedding) && doc.embedding.length === queryEmbedding.length) {
            // Cosine similarity calculation
            let dotProduct = 0;
            let normA = 0;
            let normB = 0;
            
            for (let i = 0; i < queryEmbedding.length; i++) {
              const queryVal = queryEmbedding[i];
              const docVal = doc.embedding[i];
              
              if (typeof queryVal !== 'number' || typeof docVal !== 'number' || isNaN(queryVal) || isNaN(docVal)) {
                continue;
              }
              
              dotProduct += queryVal * docVal;
              normA += queryVal * queryVal;
              normB += docVal * docVal;
            }
            
            const score = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
            embeddingScore = isNaN(score) || !isFinite(score) ? 0 : score;
          }
          
          // Calculate BM25 score
          const docTokens = allDocTokens[index];
          const bm25Score = calculateBM25Score(queryTokens, docTokens, allDocTokens);
          
          return {
            contentId: doc.contentId,
            contentType: doc.contentType,
            title: doc.title,
            content: doc.content,
            embedding: doc.embedding,
            embeddingScore,
            bm25Score,
            docTokens,
          };
        } catch (error) {
          return {
            contentId: doc.contentId,
            contentType: doc.contentType,
            title: doc.title,
            content: doc.content,
            embedding: doc.embedding,
            embeddingScore: 0,
            bm25Score: 0,
            docTokens: [],
          };
        }
      });
      
      // Normalize BM25 scores to 0-1 range
      const allBM25Scores = results.map(r => r.bm25Score);
      const normalizedResults = results.map(r => ({
        ...r,
        normalizedBM25Score: normalizeBM25Score(r.bm25Score, allBM25Scores),
      }));
      
      // Combine scores: final_score = 0.7 * embedding_score + 0.3 * bm25_score
      const combinedResults = normalizedResults.map(r => ({
        contentId: r.contentId,
        contentType: r.contentType,
        title: r.title,
        content: r.content,
        embedding: r.embedding,
        score: 0.7 * r.embeddingScore + 0.3 * r.normalizedBM25Score,
      }));

      // Apply similarity threshold and sort by combined score
      const minThreshold = args.minSimilarity || 0.35;
      const filteredResults = combinedResults
        .filter(item => item.score >= minThreshold)
        .sort((a, b) => b.score - a.score);
      
      // Return top results up to limit
      const limit = args.limit || 50;
      return filteredResults.slice(0, limit);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const isPayloadError = errorMessage.includes("payload size") || errorMessage.includes("Payload size");
      
      if (isPayloadError) {
        console.error("❌ [HYBRID SEARCH] Payload size error:", errorMessage);
        console.error(`❌ [HYBRID SEARCH] Original query length: ${args.query?.length || 0} chars`);
      } else {
        console.error("❌ [HYBRID SEARCH] Error:", error);
      }
      
      return [];
    }
  },
});

/**
 * Internal query to get user embeddings (used by actions)
 */
export const getUserEmbeddings = internalQuery({
  args: {
    userId: v.string(),
    contentTypes: contentTypesArrayValidator,
  },
  handler: async (ctx, args) => {
    try {
      console.log('🔍 [GET USER EMBEDDINGS] Starting query for user:', args.userId);
      console.log('🔍 [GET USER EMBEDDINGS] Content types filter:', args.contentTypes);
      
      const query = ctx.db
        .query("contentEmbeddings")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId));
      
      let results;
      // Apply content type filter if specified
      if (args.contentTypes && args.contentTypes.length > 0) {
        console.log('🔍 [GET USER EMBEDDINGS] Applying content type filter for:', args.contentTypes);
        results = await query
          .filter((q) => {
            let filter = q.eq(q.field("contentType"), args.contentTypes![0]);
            for (let i = 1; i < args.contentTypes!.length; i++) {
              filter = q.or(filter, q.eq(q.field("contentType"), args.contentTypes![i]));
            }
            return filter;
          })
          .collect();
      } else {
        console.log('🔍 [GET USER EMBEDDINGS] No content type filter, getting all embeddings');
        results = await query.collect();
      }
      
      // Log detailed breakdown of what we found
      const contentTypeCounts = results.reduce((acc, embedding) => {
        acc[embedding.contentType] = (acc[embedding.contentType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('🔍 [GET USER EMBEDDINGS] Found embeddings:', {
        total: results.length,
        byType: contentTypeCounts
      });
      
      return results;
    } catch (error) {
      console.error('❌ [GET USER EMBEDDINGS] Error fetching embeddings:', error);
      console.error('❌ [GET USER EMBEDDINGS] Error details:', {
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack',
        userId: args.userId,
        contentTypes: args.contentTypes
      });
      // Return empty array to prevent cascading failures
      return [];
    }
  },
});

/**
 * Fetch embeddings by content IDs
 * Used by clustering to get pre-computed shard embeddings
 */
export const getEmbeddingsByContentIds = internalQuery({
  args: {
    userId: v.string(),
    contentType: v.string(),
    contentIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      console.log(`🔍 [GET EMBEDDINGS BY IDS] Fetching ${args.contentIds.length} ${args.contentType} embeddings for user ${args.userId}`);
      console.log(`🔍 [GET EMBEDDINGS BY IDS] Requested content IDs: ${args.contentIds.slice(0, 3)}${args.contentIds.length > 3 ? '...' : ''}`);
      
      // Query all embeddings for this user and content type
      const allEmbeddings = await ctx.db
        .query("contentEmbeddings")
        .withIndex("by_user_type", (q) => 
          q.eq("userId", args.userId).eq("contentType", args.contentType)
        )
        .collect();
      
      console.log(`🔍 [GET EMBEDDINGS BY IDS] Found ${allEmbeddings.length} total ${args.contentType} embeddings for user ${args.userId}`);
      
      // DEBUG: Log all available content IDs
      const availableContentIds = allEmbeddings.map(e => e.contentId);
      console.log(`🔍 [GET EMBEDDINGS BY IDS] Available content IDs: ${availableContentIds.slice(0, 5)}${availableContentIds.length > 5 ? '...' : ''}`);
      
      // Filter to only requested content IDs
      const contentIdSet = new Set(args.contentIds);
      const results = allEmbeddings.filter(e => contentIdSet.has(e.contentId));
      
      // DEBUG: Log which IDs were found vs missing
      const foundIds = results.map(r => r.contentId);
      const missingIds = args.contentIds.filter(id => !foundIds.includes(id));
      
      console.log(`🔍 [GET EMBEDDINGS BY IDS] Found IDs: ${foundIds.slice(0, 3)}${foundIds.length > 3 ? '...' : ''}`);
      if (missingIds.length > 0) {
        console.log(`⚠️ [GET EMBEDDINGS BY IDS] Missing IDs: ${missingIds.slice(0, 3)}${missingIds.length > 3 ? '...' : ''}`);
      }
      
      console.log(`✅ [GET EMBEDDINGS BY IDS] Found ${results.length}/${args.contentIds.length} embeddings`);
      
      return results;
    } catch (error) {
      console.error('❌ [GET EMBEDDINGS BY IDS] Error:', error);
      return [];
    }
  },
});

/**
 * Get average embedding for multiple content items
 * STRUCTURAL FIX: Uses embeddings stored directly in shard records (no separate table lookup)
 */
export const getAverageEmbedding = internalAction({
  args: {
    userId: v.string(),
    contentType: v.string(),
    contentIds: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      console.log(`🔍 [GET AVERAGE EMBEDDING] Getting average for ${args.contentIds.length} ${args.contentType} items`);
      
      // STRUCTURAL FIX: Get embeddings directly from shard records
      if (args.contentType === "shard") {
        const shards = await ctx.runQuery(internal.shardQueries.getShardsByIdsInternal, {
          userId: args.userId,
          shardIds: args.contentIds
        });
        
        if (!shards || shards.length === 0) {
          throw new Error(`No shards found for ${args.contentType} IDs`);
        }
        
        // Extract embeddings from shard records
        const embeddings = shards
          .filter(shard => shard.embedding && Array.isArray(shard.embedding))
          .map(shard => shard.embedding);
        
        if (embeddings.length === 0) {
          throw new Error(`No embeddings found in shard records for ${args.contentType} IDs`);
        }
        
        // Calculate average embedding
        const embeddingLength = embeddings[0].length;
        const avgEmbedding = new Array(embeddingLength).fill(0);
        
        for (const embedding of embeddings) {
          for (let i = 0; i < embeddingLength; i++) {
            avgEmbedding[i] += embedding[i];
          }
        }
        
        for (let i = 0; i < embeddingLength; i++) {
          avgEmbedding[i] /= embeddings.length;
        }
        
        console.log(`✅ [GET AVERAGE EMBEDDING] Averaged ${embeddings.length} ${args.contentType} embeddings from shard records`);
        return avgEmbedding;
      }
      
      // Fallback to content_embeddings table for other content types
      const embeddings = await ctx.runQuery(internal.vectorSearch.getEmbeddingsByContentIds, {
        userId: args.userId,
        contentType: args.contentType,
        contentIds: args.contentIds,
      });
      
      if (!embeddings || embeddings.length === 0) {
        throw new Error(`No embeddings found for ${args.contentType} IDs`);
      }
      
      // Calculate average embedding
      const embeddingLength = embeddings[0].embedding.length;
      const avgEmbedding = new Array(embeddingLength).fill(0);
      
      for (const doc of embeddings) {
        for (let i = 0; i < embeddingLength; i++) {
          avgEmbedding[i] += doc.embedding[i];
        }
      }
      
      for (let i = 0; i < embeddingLength; i++) {
        avgEmbedding[i] /= embeddings.length;
      }
      
      console.log(`✅ [GET AVERAGE EMBEDDING] Averaged ${embeddings.length} ${args.contentType} embeddings`);
      return avgEmbedding;
      
    } catch (error) {
      console.error('❌ [GET AVERAGE EMBEDDING] Error:', error);
      throw error;
    }
  },
});

/**
 * Search using pre-computed embedding (no generation needed)
 * Used by attachment detector to find similar crystals using shard cluster embeddings
 */
export const searchByEmbedding = internalAction({
  args: {
    userId: v.string(),
    embedding: v.array(v.float64()),
    contentTypes: contentTypesArrayValidator,
    limit: v.optional(v.number()),
    threshold: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      // Get user's embeddings from database
      const userEmbeddings = await ctx.runQuery(internal.vectorSearch.getUserEmbeddings, {
        userId: args.userId,
        contentTypes: args.contentTypes
      });

      // Calculate similarities with provided embedding
      const similarities = userEmbeddings.map((doc) => {
        try {
          if (!doc.embedding || !Array.isArray(doc.embedding) || doc.embedding.length !== args.embedding.length) {
            return {
              contentId: doc.contentId,
              contentType: doc.contentType,
              title: doc.title,
              content: doc.content,
              embedding: doc.embedding,
              score: 0,
            };
          }

          // Cosine similarity calculation
          let dotProduct = 0;
          let normA = 0;
          let normB = 0;

          for (let i = 0; i < args.embedding.length; i++) {
            const queryVal = args.embedding[i];
            const docVal = doc.embedding[i];

            if (typeof queryVal !== 'number' || typeof docVal !== 'number' || isNaN(queryVal) || isNaN(docVal)) {
              continue;
            }

            dotProduct += queryVal * docVal;
            normA += queryVal * queryVal;
            normB += docVal * docVal;
          }

          const score = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
          const finalScore = isNaN(score) || !isFinite(score) ? 0 : score;

          return {
            contentId: doc.contentId,
            contentType: doc.contentType,
            title: doc.title,
            content: doc.content,
            embedding: doc.embedding,
            score: finalScore,
          };
        } catch (error) {
          return {
            contentId: doc.contentId,
            contentType: doc.contentType,
            title: doc.title,
            content: doc.content,
            embedding: doc.embedding,
            score: 0,
          };
        }
      });

      // Apply similarity threshold and sort by score
      const minThreshold = args.threshold || 0.35;
      const filteredSimilarities = similarities
        .filter(item => item.score >= minThreshold)
        .sort((a, b) => b.score - a.score);

      // Return top results up to limit
      const limit = args.limit || 50;
      const results = filteredSimilarities.slice(0, limit);

      console.log(`✅ [SEARCH BY EMBEDDING] Found ${results.length} results above threshold ${minThreshold}`);
      return results;

    } catch (error) {
      console.error('❌ [SEARCH BY EMBEDDING] Error:', error);
      return [];
    }
  },
});

/**
 * Migration action: Update all existing "crystal" content types to "cognitive_field"
 * This ensures backwards compatibility while transitioning to the new type
 */
export const migrateCrystalContentTypes = action({
  args: {},
  handler: async (ctx) => {
    try {
      console.log('🔄 [MIGRATION] Starting migration of crystal content types to cognitive_field');

      // Get all embeddings with contentType "crystal"
      const crystalEmbeddings = await ctx.db
        .query("contentEmbeddings")
        .filter((q) => q.eq(q.field("contentType"), "crystal"))
        .collect();

      console.log(`🔄 [MIGRATION] Found ${crystalEmbeddings.length} crystal embeddings to migrate`);

      let migratedCount = 0;

      // Update each embedding to use "cognitive_field" instead of "crystal"
      for (const embedding of crystalEmbeddings) {
        try {
          await ctx.db.patch(embedding._id, {
            contentType: "cognitive_field"
          });
          migratedCount++;
        } catch (error) {
          console.error(`❌ [MIGRATION] Failed to migrate embedding ${embedding._id}:`, error);
        }
      }

      console.log(`✅ [MIGRATION] Successfully migrated ${migratedCount}/${crystalEmbeddings.length} crystal embeddings to cognitive_field`);
      return {
        success: true,
        migratedCount,
        totalFound: crystalEmbeddings.length
      };

    } catch (error) {
      console.error('❌ [MIGRATION] Error during crystal content type migration:', error);
      return {
        success: false,
        error: error.message,
        migratedCount: 0,
        totalFound: 0
      };
    }
  },
});

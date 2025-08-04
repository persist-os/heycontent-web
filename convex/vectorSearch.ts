// @ts-nocheck
import { action, mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { api } from "./_generated/api";

// Google Gemini API endpoint for embeddings
const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent";

/**
 * Enhance search query to improve matching
 */
function enhanceSearchQuery(query: string): string {
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
    'email': 'email thread message gmail',
    'mail': 'email thread message gmail mail',
    'thread': 'email thread conversation gmail',
    'partnership': 'partnership collaboration sponsor business email',
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
    enhancedQuery += ' instagram social media announcement update';
  }
  
  if (enhancedQuery.includes('email') || enhancedQuery.includes('mail') || enhancedQuery.includes('thread')) {
    enhancedQuery += ' email gmail correspondence communication message';
  }
  
  if (enhancedQuery.includes('partnership') || enhancedQuery.includes('collab') || enhancedQuery.includes('sponsor')) {
    enhancedQuery += ' partnership collaboration business email professional opportunity';
  }
  
  console.log('🔍 [QUERY ENHANCEMENT] Enhanced query:', enhancedQuery);
  return enhancedQuery;
}

/**
 * Generate embeddings using Google's text-embedding-004 model
 */
async function generateEmbedding(text: string): Promise<number[]> {
  console.log('🔥 [GOOGLE API DEBUG] generateEmbedding called with text length:', text.length);
  
  // Additional safety check for text length
  if (!text || text.trim().length === 0) {
    throw new Error("Cannot generate embedding for empty text");
  }
  
  // For search queries, ensure they're not too long
  const textBytes = new TextEncoder().encode(text).length;
  if (textBytes > 30000) {
    console.warn('⚠️ [GOOGLE API DEBUG] Search query too large, truncating');
    // For search queries, we can be more aggressive with truncation
    let truncatedText = text;
    while (new TextEncoder().encode(truncatedText).length > 30000 && truncatedText.length > 100) {
      truncatedText = truncatedText.substring(0, Math.floor(truncatedText.length * 0.9));
    }
    text = truncatedText + '...';
    console.log('✅ [GOOGLE API DEBUG] Query truncated to', text.length, 'characters');
  }
  
  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error('❌ [GOOGLE API DEBUG] No API key found');
    throw new Error("GOOGLE_API_KEY environment variable is required");
  }

  console.log('🔥 [GOOGLE API DEBUG] API key exists, making request to Google...');
  const url = `${GOOGLE_API_URL}?key=${apiKey}`;
  console.log('🔥 [GOOGLE API DEBUG] Request URL:', url.replace(apiKey, '[REDACTED]'));

  const requestBody = {
    model: "models/text-embedding-004",
    content: {
      parts: [{ text }],
    },
    taskType: "RETRIEVAL_DOCUMENT",
  };

  const requestBodyString = JSON.stringify(requestBody);
  const requestBytes = new TextEncoder().encode(requestBodyString).length;
  
  console.log('🔥 [GOOGLE API DEBUG] Request body structure:', {
    model: requestBody.model,
    taskType: requestBody.taskType,
    textLength: text.length,
    textBytes: new TextEncoder().encode(text).length,
    requestBytes: requestBytes,
    textPreview: text.substring(0, 100) + '...'
  });
  
  // Check if request is too large
  if (requestBytes > 36000) {
    console.error('❌ [GOOGLE API DEBUG] Request payload too large:', requestBytes, 'bytes (limit: 36000)');
    throw new Error(`Request payload size (${requestBytes} bytes) exceeds Google API limit (36000 bytes)`);
  }

  // Retry logic for transient errors
  const maxRetries = 3;
  let lastError: any = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔥 [GOOGLE API DEBUG] Making fetch request (attempt ${attempt}/${maxRetries})...`);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

          console.log('🔥 [GOOGLE API DEBUG] Response status:', response.status);
      console.log('🔥 [GOOGLE API DEBUG] Response ok:', response.ok);
      console.log('🔥 [GOOGLE API DEBUG] Response status text:', response.statusText);

      if (!response.ok) {
        let errorText = '';
        try {
          errorText = await response.text();
          console.error('❌ [GOOGLE API DEBUG] Error response body:', errorText);
        } catch (e) {
          console.error('❌ [GOOGLE API DEBUG] Could not read error response');
        }
        
        const error = new Error(`Failed to generate embedding: ${response.status} ${response.statusText}. ${errorText}`);
        
        // Check if this is a retryable error
        if (response.status >= 500 || response.status === 429) {
          console.log(`⚠️ [GOOGLE API DEBUG] Retryable error (${response.status}), will retry...`);
          lastError = error;
          if (attempt < maxRetries) {
            // Wait before retrying (exponential backoff)
            const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
            console.log(`⏳ [GOOGLE API DEBUG] Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
        }
        
        throw error;
      }

      console.log('🔥 [GOOGLE API DEBUG] Parsing response JSON...');
      const data = await response.json();
      console.log('🔥 [GOOGLE API DEBUG] Response data structure:', {
        hasEmbedding: !!data.embedding,
        hasValues: !!(data.embedding && data.embedding.values),
        valuesLength: data.embedding?.values?.length || 0
      });

      if (!data.embedding || !data.embedding.values) {
        console.error('❌ [GOOGLE API DEBUG] Invalid response structure:', data);
        throw new Error('Invalid embedding response structure');
      }

      console.log('✅ [GOOGLE API DEBUG] Successfully generated embedding with dimension:', data.embedding.values.length);
      return data.embedding.values;

    } catch (error: any) {
      console.error(`❌ [GOOGLE API DEBUG] Fetch error (attempt ${attempt}):`, error);
      console.error('❌ [GOOGLE API DEBUG] Error type:', typeof error);
      console.error('❌ [GOOGLE API DEBUG] Error message:', error.message);
      
      lastError = error;
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
      
      // For other errors, wait and retry
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`⏳ [GOOGLE API DEBUG] Waiting ${delay}ms before retry...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // If we get here, all retries failed
  throw lastError || new Error('Failed to generate embedding after all retries');
}

/**
 * Preprocess content for embedding generation
 * Handles content truncation and optimization for different content types
 */
function preprocessContentForEmbedding(content: string, contentType: string): string {
  console.log('🔧 [PREPROCESS] Preprocessing content for embedding');
  console.log('🔧 [PREPROCESS] Content type:', contentType);
  console.log('🔧 [PREPROCESS] Original length:', content.length);
  
  let processedContent = content;
  
  // Content type specific preprocessing
  switch (contentType) {
    case 'gmail_thread':
      // For Gmail threads, prioritize subject and first few messages
      if (processedContent.includes('Subject:') && processedContent.includes('Messages:')) {
        const subjectMatch = processedContent.match(/Subject: ([^\n]+)/);
        const messagesMatch = processedContent.match(/Messages:\n([\s\S]*)/);
        
        if (subjectMatch && messagesMatch) {
          const subject = subjectMatch[1];
          const messages = messagesMatch[1];
          
          // Take first 2-3 messages and truncate if needed
          const messageLines = messages.split('\n');
          const firstMessages = messageLines.slice(0, 20).join('\n'); // ~2-3 messages
          
          processedContent = `Subject: ${subject}\n\nMessages:\n${firstMessages}`;
          console.log('🔧 [PREPROCESS] Gmail thread optimized');
        }
      }
      break;
      
    case 'youtube_video':
      // For YouTube videos, prioritize title and description
      if (processedContent.includes('YouTube Video:') && processedContent.includes('Description:')) {
        const titleMatch = processedContent.match(/YouTube Video: ([^\n]+)/);
        const descMatch = processedContent.match(/Description: ([\s\S]*?)(?:\n\n|$)/);
        
        if (titleMatch && descMatch) {
          const title = titleMatch[1];
          const description = descMatch[1].substring(0, 1000); // Limit description
          
          processedContent = `YouTube Video: ${title}\n\nDescription: ${description}`;
          console.log('🔧 [PREPROCESS] YouTube video optimized');
        }
      }
      break;
      
    case 'instagram_post':
      // For Instagram posts, keep caption and comments but limit
      if (processedContent.length > 2000) {
        processedContent = processedContent.substring(0, 2000) + '...';
        console.log('🔧 [PREPROCESS] Instagram post truncated');
      }
      break;
      
    case 'note':
      // For notes, keep structure but limit length
      if (processedContent.length > 3000) {
        processedContent = processedContent.substring(0, 3000) + '...';
        console.log('🔧 [PREPROCESS] Note truncated');
      }
      break;
      
    case 'conversation':
      // For conversations, keep recent messages
      if (processedContent.length > 2500) {
        processedContent = processedContent.substring(0, 2500) + '...';
        console.log('🔧 [PREPROCESS] Conversation truncated');
      }
      break;
  }
  
  // Google's API has a 36,000 byte limit for the entire request payload
  // We need to account for JSON overhead, so we'll be conservative
  const maxBytes = 30000; // Conservative limit to account for JSON overhead
  
  // Calculate the byte size of the text content
  const textBytes = new TextEncoder().encode(processedContent).length;
  console.log('📊 [PREPROCESS] Content byte size:', textBytes, 'bytes');
  
  if (textBytes > maxBytes) {
    console.log('⚠️ [PREPROCESS] Content too large, truncating from', textBytes, 'bytes');
    
    // Binary search to find the right truncation point
    let start = 0;
    let end = processedContent.length;
    let bestLength = 0;
    
    while (start <= end) {
      const mid = Math.floor((start + end) / 2);
      const testText = processedContent.substring(0, mid);
      const testBytes = new TextEncoder().encode(testText).length;
      
      if (testBytes <= maxBytes) {
        bestLength = mid;
        start = mid + 1;
      } else {
        end = mid - 1;
      }
    }
    
    processedContent = processedContent.substring(0, bestLength) + '...';
    const finalBytes = new TextEncoder().encode(processedContent).length;
    console.log('✅ [PREPROCESS] Truncated to', bestLength, 'characters,', finalBytes, 'bytes');
  }
  
  console.log('✅ [PREPROCESS] Final content length:', processedContent.length);
  return processedContent;
}

/**
 * Calculate cosine similarity between two vectors
 */
function cosineSimilarity(a: number[], b: number[]): number {
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
 * Generate and store embedding for content
 */
export const createEmbedding = action({
  args: {
    userId: v.string(),
    contentId: v.string(),
    contentType: v.union(
      v.literal("conversation"),
      v.literal("instagram_post"),
      v.literal("youtube_video"),
      v.literal("gmail_thread"),
      v.literal("note")
    ),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('🚀 [EMBEDDING DEBUG] createEmbedding action called');
    console.log('🚀 [EMBEDDING DEBUG] Args:', {
      userId: args.userId,
      contentId: args.contentId,
      contentType: args.contentType,
      title: args.title,
      contentLength: args.content.length
    });
    
    try {
      // Check if Google API key exists
      const apiKey = process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        console.error('❌ [EMBEDDING DEBUG] GOOGLE_API_KEY not found in environment variables');
        throw new Error("GOOGLE_API_KEY environment variable is required");
      }
      console.log('✅ [EMBEDDING DEBUG] Google API key found, length:', apiKey.length);

      // Preprocess content for embedding generation
      const processedContent = preprocessContentForEmbedding(args.content, args.contentType);

      console.log('🚀 [EMBEDDING DEBUG] Calling Google API to generate embedding...');
      console.log('🚀 [EMBEDDING DEBUG] Content preview:', processedContent.substring(0, 200) + '...');
      console.log('🚀 [EMBEDDING DEBUG] Final content byte size:', new TextEncoder().encode(processedContent).length, 'bytes');
      
      // Generate embedding
      const embedding = await generateEmbedding(processedContent);
      console.log('✅ [EMBEDDING DEBUG] Embedding generated successfully, dimension:', embedding.length);

      console.log('🚀 [EMBEDDING DEBUG] Storing embedding in database...');
      // Store in database
      const embeddingId = await ctx.runMutation(internal.vectorSearch.storeEmbedding, {
        userId: args.userId,
        contentId: args.contentId,
        contentType: args.contentType,
        title: args.title,
        content: processedContent, // Use processed content
        embedding,
      });

      console.log('✅ [EMBEDDING DEBUG] Embedding stored successfully with ID:', embeddingId);
      return embeddingId;
      
    } catch (error: any) {
      console.error('❌ [EMBEDDING DEBUG] Error in createEmbedding:', error);
      console.error('❌ [EMBEDDING DEBUG] Error message:', error.message);
      console.error('❌ [EMBEDDING DEBUG] Error stack:', error.stack);
      
      // Log specific error details
      if (error.message?.includes('fetch')) {
        console.error('❌ [EMBEDDING DEBUG] Network/Fetch error - Google API might be unreachable');
      }
      if (error.message?.includes('API')) {
        console.error('❌ [EMBEDDING DEBUG] Google API error - check API key and quota');
      }
      if (error.message?.includes('database') || error.message?.includes('mutation')) {
        console.error('❌ [EMBEDDING DEBUG] Database storage error');
      }
      
      throw error; // Re-throw to propagate to caller
    }
  },
});

/**
 * Store embedding in database (internal)
 */
export const storeEmbedding = internalMutation({
  args: {
    userId: v.string(),
    contentId: v.string(),
    contentType: v.union(
      v.literal("conversation"),
      v.literal("instagram_post"),
      v.literal("youtube_video"),
      v.literal("gmail_thread"),
      v.literal("note")
    ),
    title: v.string(),
    content: v.string(),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    console.log('💾 [DATABASE DEBUG] storeEmbedding called');
    console.log('💾 [DATABASE DEBUG] Args:', {
      userId: args.userId,
      contentId: args.contentId,
      contentType: args.contentType,
      title: args.title,
      contentLength: args.content.length,
      embeddingDimension: args.embedding.length
    });

    try {
      console.log('💾 [DATABASE DEBUG] Checking for existing embedding...');
      // Check if embedding already exists
      const existing = await ctx.db
        .query("contentEmbeddings")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("contentId"), args.contentId))
        .first();

      if (existing) {
        console.log('💾 [DATABASE DEBUG] Found existing embedding, updating...');
        // Update existing embedding
        await ctx.db.patch(existing._id, {
          title: args.title,
          content: args.content,
          embedding: args.embedding,
          updatedAt: Date.now(),
        });
        console.log('✅ [DATABASE DEBUG] Successfully updated existing embedding:', existing._id);
        return existing._id;
      } else {
        console.log('💾 [DATABASE DEBUG] No existing embedding found, creating new...');
        // Create new embedding
        const newId = await ctx.db.insert("contentEmbeddings", {
          userId: args.userId,
          contentId: args.contentId,
          contentType: args.contentType,
          title: args.title,
          content: args.content,
          embedding: args.embedding,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
        console.log('✅ [DATABASE DEBUG] Successfully created new embedding:', newId);
        return newId;
      }
    } catch (error: any) {
      console.error('❌ [DATABASE DEBUG] Error in storeEmbedding:', error);
      console.error('❌ [DATABASE DEBUG] Error message:', error.message);
      console.error('❌ [DATABASE DEBUG] Error stack:', error.stack);
      throw error;
    }
  },
});

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
      v.literal("instagram_post"),
      v.literal("youtube_video"),
      v.literal("gmail_thread"),
      v.literal("note")
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
      const userEmbeddings = await ctx.runQuery(internal.vectorSearch.getAllUserEmbeddings, {
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

/**
 * Check which platforms are connected for a user
 */
async function checkPlatformConnections(ctx: any, userId: string) {
  const connections = {
    youtube: false,
    instagram: false,
    gmail: false,
  };
  
  try {
    // Check YouTube connection
    try {
      const youtubeTokens = await ctx.runQuery(api.youtubeQueries.getYouTubeTokens, { userId });
      connections.youtube = !!(youtubeTokens && youtubeTokens.length > 0);
      console.log('🔀 [PLATFORM CHECK] YouTube connected:', connections.youtube);
    } catch (error) {
      console.error("Error checking YouTube connection:", error);
      connections.youtube = false;
    }
    
    // Check Instagram connection
    try {
      const instagramAccount = await ctx.runQuery(api.instagramQueries.getInstagramAccount, { userId });
      connections.instagram = !!instagramAccount;
      console.log('🔀 [PLATFORM CHECK] Instagram connected:', connections.instagram);
    } catch (error) {
      console.error("Error checking Instagram connection:", error);
      connections.instagram = false;
    }
    
    // Check Gmail connection
    try {
      const gmailAccounts = await ctx.runQuery(api.gmailQueries.getGmailAccounts, { userId });
      connections.gmail = !!(gmailAccounts && gmailAccounts.length > 0);
      console.log('🔀 [PLATFORM CHECK] Gmail connected:', connections.gmail);
    } catch (error) {
      console.error("Error checking Gmail connection:", error);
      connections.gmail = false;
    }
    
  } catch (error) {
    console.error("Error in checkPlatformConnections:", error);
    // Return all false if there's a general error
    return {
      youtube: false,
      instagram: false,
      gmail: false,
    };
  }
  
  console.log('🔀 [PLATFORM CHECK] Final connections:', connections);
  return connections;
}

/**
 * Get all embeddings for a user with optional content type filter (internal)
 */
export const getAllUserEmbeddings = internalQuery({
  args: {
    userId: v.string(),
    contentTypes: v.optional(v.array(v.union(
      v.literal("conversation"),
      v.literal("instagram_post"),
      v.literal("youtube_video"),
      v.literal("gmail_thread"),
      v.literal("note")
    ))),
  },
  handler: async (ctx, args) => {
    let embeddings = await ctx.db
      .query("contentEmbeddings")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter by content types if specified
    if (args.contentTypes && args.contentTypes.length > 0) {
      embeddings = embeddings.filter(e => args.contentTypes!.includes(e.contentType));
    }

    return embeddings;
  },
});

/**
 * Get all embeddings for a user (for debugging/admin)
 */
export const getUserEmbeddings = query({
  args: {
    userId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("contentEmbeddings")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit || 20);
  },
});

/**
 * Delete embedding for specific content
 */
export const deleteEmbedding = mutation({
  args: {
    userId: v.string(),
    contentId: v.string(),
  },
  handler: async (ctx, args) => {
    const embedding = await ctx.db
      .query("contentEmbeddings")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("contentId"), args.contentId))
      .first();

    if (embedding) {
      await ctx.db.delete(embedding._id);
      return true;
    }
    return false;
  },
});

/**
 * Bulk generate embeddings for all existing user content (conversations and notes)
 * This is a one-time setup function to populate embeddings for existing data
 */
export const generateEmbeddingsForExistingContent = action({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('🚀 [EMBEDDING GENERATION] Starting bulk embedding generation for user:', args.userId);
    
    const results = {
      conversations: { processed: 0, succeeded: 0, failed: 0 },
      notes: { processed: 0, succeeded: 0, failed: 0 },
      errors: [] as string[]
    };

    try {
      // Generate embeddings for conversations
      console.log('🚀 [EMBEDDING GENERATION] Processing conversations...');
      const conversations = await ctx.runQuery(api.chatQueries.getHistory, { userId: args.userId, limit: 100 });
      
      for (const conv of conversations) {
        results.conversations.processed++;
        try {
          // Combine all messages into searchable content
          const searchableContent = `${conv.title}\n\n${conv.messages.map((m: any) => `${m.role}: ${m.content}`).join('\n')}`;
          
          console.log(`🚀 [EMBEDDING GENERATION] Processing conversation: "${conv.title}"`);
          
          await ctx.runAction(api.vectorSearch.createEmbedding, {
            userId: args.userId,
            contentId: conv._id,
            contentType: "conversation" as const,
            title: conv.title,
            content: searchableContent,
          });
          
          results.conversations.succeeded++;
          console.log(`✅ [EMBEDDING GENERATION] Conversation "${conv.title}" embedded successfully`);
        } catch (error: any) {
          results.conversations.failed++;
          const errorMsg = `Failed to embed conversation "${conv.title}": ${error.message}`;
          console.error('❌ [EMBEDDING GENERATION]', errorMsg);
          results.errors.push(errorMsg);
        }
      }

      // Generate embeddings for notes
      console.log('🚀 [EMBEDDING GENERATION] Processing notes...');
      const notesResult = await ctx.runQuery(api.noteQueries.getUserNotes, { userId: args.userId, numItems: 1000 });
      
      for (const note of notesResult.page) {
        results.notes.processed++;
        try {
          // Combine title and content for searchable content
          const searchableContent = `${note.title}\n\n${note.content || ''}`;
          
          console.log(`🚀 [EMBEDDING GENERATION] Processing note: "${note.title}"`);
          
          await ctx.runAction(api.vectorSearch.createEmbedding, {
            userId: args.userId,
            contentId: note._id,
            contentType: "note" as const,
            title: note.title,
            content: searchableContent,
          });
          
          results.notes.succeeded++;
          console.log(`✅ [EMBEDDING GENERATION] Note "${note.title}" embedded successfully`);
        } catch (error: any) {
          results.notes.failed++;
          const errorMsg = `Failed to embed note "${note.title}": ${error.message}`;
          console.error('❌ [EMBEDDING GENERATION]', errorMsg);
          results.errors.push(errorMsg);
        }
      }

      console.log('🎉 [EMBEDDING GENERATION] Bulk generation complete!', results);
      return results;
      
    } catch (error: any) {
      console.error('💥 [EMBEDDING GENERATION] Fatal error during bulk generation:', error);
      results.errors.push(`Fatal error: ${error.message}`);
      return results;
    }
  },
});

/**
 * Check if user has any embeddings
 */
export const hasUserEmbeddings = query({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const embedding = await ctx.db
      .query("contentEmbeddings")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    return {
      hasEmbeddings: !!embedding,
      count: embedding ? await ctx.db
        .query("contentEmbeddings")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .collect()
        .then(results => results.length) : 0
    };
  },
});

/**
 * Delete all embeddings for a user
 */
export const deleteAllUserEmbeddings = mutation({
  args: {
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('🗑️ [EMBEDDING DELETE] Starting deletion for user:', args.userId);
    
    try {
      // Get all user embeddings
      const embeddings = await ctx.db
        .query("contentEmbeddings")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .collect();

      console.log('🗑️ [EMBEDDING DELETE] Found', embeddings.length, 'embeddings to delete');

      // Delete all embeddings
      let deleted = 0;
      for (const embedding of embeddings) {
        await ctx.db.delete(embedding._id);
        deleted++;
      }

      console.log('✅ [EMBEDDING DELETE] Successfully deleted', deleted, 'embeddings');
      
      return {
        success: true,
        deletedCount: deleted,
        message: `Successfully deleted ${deleted} embeddings`
      };
    } catch (error: any) {
      console.error('❌ [EMBEDDING DELETE] Error deleting embeddings:', error);
      throw error;
    }
  },
});

/**
 * Hybrid search that combines vector similarity with keyword matching and platform quotas
 */
export const hybridSearchContentWithQuotas = action({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
    contentTypes: v.optional(v.array(v.union(
      v.literal("conversation"),
      v.literal("instagram_post"),
      v.literal("youtube_video"),
      v.literal("gmail_thread"),
      v.literal("note")
    ))),
    minSimilarity: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    console.log('🔀 [HYBRID QUOTA SEARCH] Starting hybrid search with quotas');
    console.log('🔀 [HYBRID QUOTA SEARCH] Query:', args.query);
    
    try {
      // Step 1: Check platform connections (with error handling)
      console.log('🔀 [HYBRID QUOTA SEARCH] Step 1: Checking platform connections...');
      let platformConnections;
      try {
        platformConnections = await checkPlatformConnections(ctx, args.userId);
        console.log('🔀 [HYBRID QUOTA SEARCH] Platform connections:', platformConnections);
      } catch (error) {
        console.error('🔀 [HYBRID QUOTA SEARCH] Platform check failed:', error);
        // Default to no connections if check fails
        platformConnections = { youtube: false, instagram: false, gmail: false };
      }
      
      // Step 2: Generate embedding for the query (with error handling)
      console.log('🔀 [HYBRID QUOTA SEARCH] Step 2: Generating query embedding...');
      let queryEmbedding;
      try {
        const enhancedQuery = enhanceSearchQuery(args.query);
        console.log('🔀 [HYBRID QUOTA SEARCH] Enhanced query:', enhancedQuery.substring(0, 100) + '...');
        queryEmbedding = await generateEmbedding(enhancedQuery);
        console.log('🔀 [HYBRID QUOTA SEARCH] Query embedding generated, dimension:', queryEmbedding.length);
      } catch (error) {
        console.error('🔀 [HYBRID QUOTA SEARCH] Embedding generation failed:', error);
        throw new Error(`Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Step 3: Get all user embeddings (with error handling)
      console.log('🔀 [HYBRID QUOTA SEARCH] Step 3: Fetching user embeddings...');
      let userEmbeddings;
      try {
        userEmbeddings = await ctx.runQuery(internal.vectorSearch.getAllUserEmbeddings, {
          userId: args.userId,
          contentTypes: args.contentTypes,
        });
        console.log('🔀 [HYBRID QUOTA SEARCH] User embeddings fetched:', userEmbeddings.length);
      } catch (error) {
        console.error('🔀 [HYBRID QUOTA SEARCH] User embeddings fetch failed:', error);
        throw new Error(`Failed to fetch user embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
      
      // Step 4: Calculate similarities (with error handling)
      console.log('🔀 [HYBRID QUOTA SEARCH] Step 4: Calculating similarities...');
      let similarities;
      try {
        similarities = userEmbeddings.map((doc, index) => {
          try {
            const score = cosineSimilarity(queryEmbedding, doc.embedding);
            return {
              ...doc,
              score,
            };
          } catch (error) {
            console.error(`🔀 [HYBRID QUOTA SEARCH] Similarity calc failed for doc ${index}:`, error);
            return {
              ...doc,
              score: 0, // Default to 0 if calculation fails
            };
          }
        });
        console.log('🔀 [HYBRID QUOTA SEARCH] Similarities calculated for', similarities.length, 'documents');
      } catch (error) {
        console.error('🔀 [HYBRID QUOTA SEARCH] Similarity calculation failed:', error);
        throw new Error(`Failed to calculate similarities: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }

      // Step 5: Apply similarity threshold and filtering
      console.log('🔀 [HYBRID QUOTA SEARCH] Step 5: Applying filters...');
      const minThreshold = args.minSimilarity || 0.35;
      const filteredSimilarities = similarities.filter(item => item.score >= minThreshold);
      console.log('🔀 [HYBRID QUOTA SEARCH] After threshold filtering:', filteredSimilarities.length, 'items remain');
      
      // Sort by similarity score
      filteredSimilarities.sort((a, b) => b.score - a.score);
      
      // Step 6: Group by content type
      console.log('🔀 [HYBRID QUOTA SEARCH] Step 6: Grouping by content type...');
      const contentByType = {
        youtube_video: filteredSimilarities.filter(item => item.contentType === 'youtube_video'),
        instagram_post: filteredSimilarities.filter(item => item.contentType === 'instagram_post'),
        conversation: filteredSimilarities.filter(item => item.contentType === 'conversation'),
        gmail_thread: filteredSimilarities.filter(item => item.contentType === 'gmail_thread'),
        note: filteredSimilarities.filter(item => item.contentType === 'note'),
      };
      
      console.log('🔀 [HYBRID QUOTA SEARCH] Content distribution:', {
        youtube: contentByType.youtube_video.length,
        instagram: contentByType.instagram_post.length,
        conversations: contentByType.conversation.length,
        gmail: contentByType.gmail_thread.length,
        notes: contentByType.note.length,
      });
      
      // Step 7: Apply platform-specific quotas
      console.log('🔀 [HYBRID QUOTA SEARCH] Step 7: Applying quotas...');
      const selectedResults: Array<{
        contentId: string;
        contentType: string;
        title: string;
        content: string;
        embedding: number[];
        score: number;
      }> = [];
      
      // Force include top YouTube videos if connected
      if (platformConnections.youtube && contentByType.youtube_video.length > 0) {
        const topYouTube = contentByType.youtube_video.slice(0, 2);
        selectedResults.push(...topYouTube);
        console.log('🔀 [HYBRID QUOTA SEARCH] Added', topYouTube.length, 'YouTube videos (forced)');
      }
      
      // Force include top Instagram posts if connected
      if (platformConnections.instagram && contentByType.instagram_post.length > 0) {
        const topInstagram = contentByType.instagram_post.slice(0, 2);
        selectedResults.push(...topInstagram);
        console.log('🔀 [HYBRID QUOTA SEARCH] Added', topInstagram.length, 'Instagram posts (forced)');
      }
      
      // Add conversations (max 4)
      if (contentByType.conversation.length > 0) {
        const topConversations = contentByType.conversation.slice(0, 4);
        selectedResults.push(...topConversations);
        console.log('🔀 [HYBRID QUOTA SEARCH] Added', topConversations.length, 'conversations (max 4)');
      }
      
      // Add emails (max 2 if relevant)
      if (contentByType.gmail_thread.length > 0) {
        const topEmails = contentByType.gmail_thread.slice(0, 2);
        selectedResults.push(...topEmails);
        console.log('🔀 [HYBRID QUOTA SEARCH] Added', topEmails.length, 'emails (max 2)');
      }
      
      // Fill remaining slots with best matches while respecting quotas
      const targetTotal = args.limit || 10;
      const remainingSlots = targetTotal - selectedResults.length;
      
      if (remainingSlots > 0) {
        console.log('🔀 [HYBRID QUOTA SEARCH] Filling', remainingSlots, 'remaining slots...');
        
        // Get unused content items, respecting quotas
        const usedIds = new Set(selectedResults.map(item => item.contentId));
        const unusedContent = filteredSimilarities.filter(item => !usedIds.has(item.contentId));
        
        // Apply quota limits to unused content
        const quotaLimitedUnused = [];
        const quotaLimits = {
          youtube_video: platformConnections.youtube ? 2 : 0,
          instagram_post: platformConnections.instagram ? 2 : 0,
          conversation: 4,
          gmail_thread: 2,
          note: remainingSlots,
        };
        
        // Count current content by type
        const currentCounts = {
          youtube_video: selectedResults.filter(item => item.contentType === 'youtube_video').length,
          instagram_post: selectedResults.filter(item => item.contentType === 'instagram_post').length,
          conversation: selectedResults.filter(item => item.contentType === 'conversation').length,
          gmail_thread: selectedResults.filter(item => item.contentType === 'gmail_thread').length,
          note: selectedResults.filter(item => item.contentType === 'note').length,
        };
        
        for (const item of unusedContent) {
          if (quotaLimitedUnused.length >= remainingSlots) break;
          
          const currentCount = currentCounts[item.contentType] || 0;
          const quota = quotaLimits[item.contentType];
          
          if (quota === undefined || currentCount < quota) {
            quotaLimitedUnused.push(item);
            currentCounts[item.contentType] = currentCount + 1;
          }
        }
        
        selectedResults.push(...quotaLimitedUnused);
        console.log('🔀 [HYBRID QUOTA SEARCH] Added', quotaLimitedUnused.length, 'additional items to fill remaining slots');
      }
      
      // Step 8: Final processing
      console.log('🔀 [HYBRID QUOTA SEARCH] Step 8: Final processing...');
      // Sort final results by score
      selectedResults.sort((a, b) => b.score - a.score);
      
      // Take final limit
      const finalResults = selectedResults.slice(0, targetTotal);
      
      console.log('🔀 [HYBRID QUOTA SEARCH] Final results:', {
        total: finalResults.length,
        youtube: finalResults.filter(item => item.contentType === 'youtube_video').length,
        instagram: finalResults.filter(item => item.contentType === 'instagram_post').length,
        conversations: finalResults.filter(item => item.contentType === 'conversation').length,
        emails: finalResults.filter(item => item.contentType === 'gmail_thread').length,
        notes: finalResults.filter(item => item.contentType === 'note').length,
      });
      
      return finalResults;
      
    } catch (error) {
      console.error("❌ [HYBRID QUOTA SEARCH] Error:", error);
      console.error("❌ [HYBRID QUOTA SEARCH] Error stack:", error instanceof Error ? error.stack : 'No stack trace');
      // Re-throw with more context
      throw new Error(`Hybrid search with quotas failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Get embedding count for a specific platform/content type
 */
export const getPlatformEmbeddingCount = query({
  args: {
    userId: v.string(),
    contentType: v.union(
      v.literal("conversation"),
      v.literal("instagram_post"),
      v.literal("youtube_video"),
      v.literal("gmail_thread"),
      v.literal("note")
    ),
  },
  handler: async (ctx, args) => {
    console.log(`🔍 [PLATFORM COUNT] Checking ${args.contentType} embeddings for user:`, args.userId);
    
    try {
      const embeddings = await ctx.db
        .query("contentEmbeddings")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .filter((q) => q.eq(q.field("contentType"), args.contentType))
        .collect();

      const count = embeddings.length;
      const hasEmbeddings = count > 0;
      
      console.log(`✅ [PLATFORM COUNT] Found ${count} ${args.contentType} embeddings`);
      
      return {
        hasEmbeddings,
        count
      };
    } catch (error: any) {
      console.error(`❌ [PLATFORM COUNT] Error checking ${args.contentType} embeddings:`, error);
      return { hasEmbeddings: false, count: 0 };
    }
  },
});

/**
 * Debug function to analyze embeddings and similarity scores
 */
export const debugSearchQuery = action({
  args: {
    userId: v.string(),
    query: v.string(),
  },
  handler: async (ctx, args) => {
    console.log('🐛 [DEBUG SEARCH] Analyzing search for query:', args.query);
    
    try {
      // Get all user embeddings
      const userEmbeddings = await ctx.runQuery(internal.vectorSearch.getAllUserEmbeddings, {
        userId: args.userId,
      });
      
      console.log('🐛 [DEBUG SEARCH] Total embeddings for user:', userEmbeddings.length);
      
      // Show content type distribution
      const contentTypes = userEmbeddings.reduce((acc: Record<string, number>, doc) => {
        acc[doc.contentType] = (acc[doc.contentType] || 0) + 1;
        return acc;
      }, {});
      console.log('🐛 [DEBUG SEARCH] Content type distribution:', contentTypes);
      
      // Show some sample content
      console.log('🐛 [DEBUG SEARCH] Sample Instagram posts:');
      userEmbeddings
        .filter(doc => doc.contentType === 'instagram_post')
        .slice(0, 3)
        .forEach((doc, i) => {
          console.log(`🐛 [DEBUG SEARCH] Instagram Post ${i + 1}:`, {
            title: doc.title,
            contentPreview: doc.content.substring(0, 200) + '...'
          });
        });
      
      // Test similarity with the query
      const enhancedQuery = enhanceSearchQuery(args.query);
      const queryEmbedding = await generateEmbedding(enhancedQuery);
      
      console.log('🐛 [DEBUG SEARCH] Enhanced query:', enhancedQuery);
      
      // Calculate similarities for Instagram posts specifically
      const instagramPosts = userEmbeddings.filter(doc => doc.contentType === 'instagram_post');
      const instagramSimilarities = instagramPosts.map(doc => ({
        title: doc.title,
        content: doc.content.substring(0, 100) + '...',
        score: cosineSimilarity(queryEmbedding, doc.embedding)
      })).sort((a, b) => b.score - a.score);
      
      console.log('🐛 [DEBUG SEARCH] Top 5 Instagram post similarities:');
      instagramSimilarities.slice(0, 5).forEach((item, i) => {
        console.log(`🐛 [DEBUG SEARCH] ${i + 1}. Score: ${Math.round(item.score * 1000) / 1000}, Title: ${item.title}`);
      });
      
      return {
        totalEmbeddings: userEmbeddings.length,
        contentTypes,
        instagramPostCount: instagramPosts.length,
        topInstagramSimilarities: instagramSimilarities.slice(0, 5),
        enhancedQuery
      };
      
    } catch (error) {
      console.error('🐛 [DEBUG SEARCH] Error:', error);
      throw error;
    }
  },
});

/**
 * DEBUG: Simplified hybrid search to test components individually
 */
export const debugHybridSearchWithQuotas = action({
  args: {
    userId: v.string(),
    query: v.string(),
    limit: v.optional(v.number()),
    testStep: v.optional(v.string()), // Which step to test: "platform", "embedding", "similarity", "full"
  },
  handler: async (ctx, args) => {
    console.log('🐛 [DEBUG SEARCH] Starting debug hybrid search');
    console.log('🐛 [DEBUG SEARCH] Test step:', args.testStep || 'full');
    console.log('🐛 [DEBUG SEARCH] Query:', args.query);
    
    try {
      const testStep = args.testStep || 'full';
      
      if (testStep === 'platform' || testStep === 'full') {
        console.log('🐛 [DEBUG SEARCH] Testing platform connections...');
        
        // Simple platform check using proper action database access
        const connections = {
          youtube: false,
          instagram: false,
          gmail: false,
        };
        
        try {
          // Use the existing checkPlatformConnections function
          const platformResult = await checkPlatformConnections(ctx, args.userId);
          console.log('🐛 [DEBUG SEARCH] Platform connections result:', platformResult);
          
          if (testStep === 'platform') {
            return [{ 
              contentId: 'test', 
              contentType: 'note', 
              title: 'Platform Test Success', 
              content: JSON.stringify(platformResult),
              embedding: [0.1, 0.2, 0.3],
              score: 1.0 
            }];
          }
        } catch (e) {
          console.log('🐛 [DEBUG SEARCH] Platform check failed:', e);
          
          if (testStep === 'platform') {
            return [{ 
              contentId: 'test', 
              contentType: 'note', 
              title: 'Platform Test Failed', 
              content: `Platform check error: ${e instanceof Error ? e.message : 'Unknown error'}`,
              embedding: [0.1, 0.2, 0.3],
              score: 1.0 
            }];
          }
        }
      }
      
      if (testStep === 'embedding' || testStep === 'full') {
        console.log('🐛 [DEBUG SEARCH] Testing embedding generation...');
        
        // Test with simple query
        const testQuery = 'test query';
        console.log('🐛 [DEBUG SEARCH] Generating embedding for:', testQuery);
        
        const embedding = await generateEmbedding(testQuery);
        console.log('🐛 [DEBUG SEARCH] Embedding generated, dimension:', embedding.length);
        
        if (testStep === 'embedding') {
          return [{ 
            contentId: 'test', 
            contentType: 'note', 
            title: 'Embedding Test Success', 
            content: `Generated ${embedding.length}D embedding`,
            embedding: embedding.slice(0, 3), // Just first 3 dims for test
            score: 1.0 
          }];
        }
      }
      
      if (testStep === 'similarity' || testStep === 'full') {
        console.log('🐛 [DEBUG SEARCH] Testing similarity calculation...');
        
        // Get just 1 user embedding for testing
        const userEmbeddings = await ctx.runQuery(internal.vectorSearch.getAllUserEmbeddings, {
          userId: args.userId,
        });
        
        console.log('🐛 [DEBUG SEARCH] User embeddings count:', userEmbeddings.length);
        
        if (userEmbeddings.length > 0) {
          const testEmbedding = [0.1, 0.2, 0.3]; // Simple test embedding
          const similarity = cosineSimilarity(testEmbedding, userEmbeddings[0].embedding.slice(0, 3));
          console.log('🐛 [DEBUG SEARCH] Similarity calculation worked:', similarity);
          
          if (testStep === 'similarity') {
            return [{ 
              contentId: 'test', 
              contentType: 'note', 
              title: 'Similarity Test Success', 
              content: `Calculated similarity: ${similarity}`,
              embedding: testEmbedding,
              score: similarity 
            }];
          }
        }
      }
      
      // If we get here, all individual tests passed
      console.log('🐛 [DEBUG SEARCH] All individual tests passed, returning success');
      return [{ 
        contentId: 'debug-success', 
        contentType: 'note', 
        title: 'Debug Test Complete', 
        content: 'All debug steps completed successfully',
        embedding: [0.1, 0.2, 0.3],
        score: 1.0 
      }];
      
    } catch (error) {
      console.error('🐛 [DEBUG SEARCH] Error in debug search:', error);
      console.error('🐛 [DEBUG SEARCH] Error stack:', error instanceof Error ? error.stack : 'No stack');
      throw new Error(`Debug search failed at step ${args.testStep}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
});

/**
 * Automatically generate embeddings for new or updated content
 */
export const autoCreateEmbedding = action({
  args: {
    userId: v.string(),
    contentId: v.string(),
    contentType: v.union(
      v.literal("conversation"),
      v.literal("instagram_post"),
      v.literal("youtube_video"),
      v.literal("gmail_thread"),
      v.literal("note")
    ),
    title: v.string(),
    content: v.string(),
    triggerType: v.union(
      v.literal("content_update"),
      v.literal("platform_connection"),
      v.literal("automatic_update")
    ),
    platform: v.optional(v.union(
      v.literal("instagram"),
      v.literal("youtube"),
      v.literal("gmail"),
      v.literal("conversations"),
      v.literal("notes"),
      v.literal("all")
    )),
  },
  handler: async (ctx, args) => {
    console.log('🤖 [AUTO EMBEDDING] Auto-creating embedding for:', {
      userId: args.userId,
      contentId: args.contentId,
      contentType: args.contentType,
      title: args.title.substring(0, 50) + '...',
      triggerType: args.triggerType,
      platform: args.platform
    });

    try {
      // Create the embedding
      await ctx.runAction(api.vectorSearch.createEmbedding, {
        userId: args.userId,
      contentId: args.contentId,
        contentType: args.contentType,
        title: args.title,
        content: args.content,
      });

      // Record the automatic update
      await ctx.runMutation(internal.vectorSearch.recordEmbeddingUpdate, {
        userId: args.userId,
        type: args.triggerType,
      platform: args.platform,
        contentType: args.contentType,
        contentId: args.contentId,
        itemsProcessed: 1,
        itemsSucceeded: 1,
        itemsFailed: 0,
      });

      console.log('✅ [AUTO EMBEDDING] Successfully created embedding for:', args.contentId);
      return { success: true };
    } catch (error: any) {
      console.error('❌ [AUTO EMBEDDING] Failed to create embedding:', error);
      
      // Record the failed update
      await ctx.runMutation(internal.vectorSearch.recordEmbeddingUpdate, {
        userId: args.userId,
        type: args.triggerType,
        platform: args.platform,
        contentType: args.contentType,
        contentId: args.contentId,
        itemsProcessed: 1,
        itemsSucceeded: 0,
        itemsFailed: 1,
      });

      return { success: false, error: error.message };
    }
  },
});

/**
 * Automatically create embeddings for multiple content items
 */
export const autoCreateEmbeddingsBatch = action({
  args: {
    userId: v.string(),
    items: v.array(v.object({
      contentId: v.string(),
      contentType: v.union(
        v.literal("conversation"),
        v.literal("instagram_post"),
        v.literal("youtube_video"),
        v.literal("gmail_thread"),
        v.literal("note")
      ),
      title: v.string(),
      content: v.string(),
    })),
    triggerType: v.union(
      v.literal("content_update"),
      v.literal("platform_connection"),
      v.literal("automatic_update")
    ),
    platform: v.optional(v.union(
      v.literal("instagram"),
      v.literal("youtube"),
      v.literal("gmail"),
      v.literal("conversations"),
      v.literal("notes"),
      v.literal("all")
    )),
  },
  handler: async (ctx, args) => {
    console.log('🤖 [AUTO EMBEDDING BATCH] Processing', args.items.length, 'items for user:', args.userId);

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const item of args.items) {
      results.processed++;
      try {
        await ctx.runAction(api.vectorSearch.autoCreateEmbedding, {
          userId: args.userId,
          contentId: item.contentId,
          contentType: item.contentType,
          title: item.title,
          content: item.content,
          triggerType: args.triggerType,
          platform: args.platform,
        });
        results.succeeded++;
      } catch (error: any) {
        results.failed++;
        const errorMsg = `Failed to embed ${item.contentType} "${item.title}": ${error.message}`;
        results.errors.push(errorMsg);
        console.error('❌ [AUTO EMBEDDING BATCH]', errorMsg);
      }
    }

    // Record the batch update
    await ctx.runMutation(internal.vectorSearch.recordEmbeddingUpdate, {
      userId: args.userId,
      type: args.triggerType,
      platform: args.platform,
      itemsProcessed: results.processed,
      itemsSucceeded: results.succeeded,
      itemsFailed: results.failed,
    });

    console.log('✅ [AUTO EMBEDDING BATCH] Completed:', results);
    return results;
  },
});

/**
 * Automatically create embeddings for new platform content after refresh
 */
export const autoCreateEmbeddingsForNewPlatformContent = action({
  args: {
    userId: v.string(),
    platform: v.union(
      v.literal("instagram"),
      v.literal("youtube"),
      v.literal("gmail")
    ),
    triggerType: v.union(
      v.literal("platform_connection"),
      v.literal("automatic_update")
    ),
  },
  handler: async (ctx, args) => {
    console.log('🤖 [AUTO EMBEDDING PLATFORM] Creating embeddings for new', args.platform, 'content for user:', args.userId);

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[]
    };

    try {
      let items: Array<{ contentId: string; contentType: string; title: string; content: string }> = [];

      // Fetch recent content based on platform
      switch (args.platform) {
        case "instagram":
          const instagramPosts = await ctx.runQuery(api.instagramQueries.getAllInstagramPosts, { userId: args.userId });
          items = instagramPosts.map((post: any) => {
            const caption = post.data?.caption || '';
            const username = post.data?.username || 'Unknown User';
            const mediaType = post.data?.media_type || 'Unknown';
            const likeCount = post.data?.like_count || 0;
            const commentsCount = post.data?.comments_count || 0;
            const timestamp = post.data?.timestamp ? new Date(post.data.timestamp).toLocaleDateString() : 'Unknown date';
          
          const hashtags = caption.match(/#[a-zA-Z0-9_]+/g) || [];
          const hashtagText = hashtags.length > 0 ? `\n\nHashtags: ${hashtags.join(' ')}` : '';
          
          const mentions = caption.match(/@[a-zA-Z0-9_.]+/g) || [];
          const mentionText = mentions.length > 0 ? `\n\nMentions: ${mentions.join(' ')}` : '';
          
          const engagementText = `\n\nEngagement: ${likeCount} likes, ${commentsCount} comments`;
          
            const title = `${username} - ${mediaType} Post (${timestamp})`;
            const content = [
            `Instagram Post by ${username}`,
            `Posted: ${timestamp}`,
            `Media Type: ${mediaType}`,
            `Caption: ${caption}`,
            hashtagText,
            mentionText,
            engagementText,
            `\n\nContext: This is an Instagram ${mediaType.toLowerCase()} post by ${username} with ${likeCount} likes and ${commentsCount} comments.`
          ].filter(Boolean).join('\n');

            return {
              contentId: post._id,
              contentType: "instagram_post" as const,
              title,
              content
            };
          });
        break;

        case "youtube":
          const youtubeResult = await ctx.runQuery(api.youtubeQueries.getYouTubeVideos, { 
            userId: args.userId, 
            limit: 50,
            paginationOpts: { numItems: 50, cursor: null }
          });
          items = youtubeResult.videos.map((video: any) => {
            const description = video.snippet?.description || '';
            const channelTitle = video.snippet?.channel?.title || 'Unknown Channel';
          
          let analysisText = '';
            if (video.analysisMarkdown) {
              analysisText = `\n\nAnalysis: ${video.analysisMarkdown}`;
            } else if (video.analysis && typeof video.analysis === 'object') {
              analysisText = `\n\nAnalysis: ${JSON.stringify(video.analysis)}`;
            }
            
            const title = video.snippet?.title || `YouTube Video ${video.videoId}`;
            const content = `YouTube Video: ${title}\n\nChannel: ${channelTitle}\n\nDescription: ${description}${analysisText}`;

            return {
              contentId: video._id,
              contentType: "youtube_video" as const,
              title,
              content
            };
          });
        break;

        case "gmail":
          const gmailResult = await ctx.runQuery(api.gmailQueries.getGmailThreadsPaginated, { 
            userId: args.userId,
            paginationOpts: { numItems: 50, cursor: null }
          });
          items = gmailResult.page.map((thread: any) => {
            const subject = thread.subject || thread.data?.subject || 'No Subject';
            const from = thread.from || thread.data?.from || 'Unknown Sender';
            const snippet = thread.snippet || thread.data?.snippet || '';
            const messageCount = thread.message_count || thread.data?.messageCount || 1;
          
          let messageDetails = '';
            if (thread.messages && Array.isArray(thread.messages) && thread.messages.length > 0) {
              messageDetails = '\n\nMessages:\n' + thread.messages
              .slice(0, 3)
              .map((msg: any, index: number) => `${index + 1}. From: ${msg.from || 'Unknown'}\n   Subject: ${msg.subject || subject}\n   Content: ${(msg.snippet || '').substring(0, 200)}`)
              .join('\n');
          }
          
          let analysisText = '';
            if (thread.analysis && typeof thread.analysis === 'object') {
              analysisText = `\n\nAnalysis: ${JSON.stringify(thread.analysis)}`;
            }
            
            const title = `Email Thread: ${subject}`;
            const content = `Gmail Thread: ${subject}\n\nFrom: ${from}\n\nSnippet: ${snippet}\n\nMessage Count: ${messageCount}${messageDetails}${analysisText}`;

            return {
              contentId: thread._id,
              contentType: "gmail_thread" as const,
        title,
              content
            };
          });
        break;
      }

      // Create embeddings for all items
      for (const item of items) {
        results.processed++;
        try {
          await ctx.runAction(api.vectorSearch.autoCreateEmbedding, {
            userId: args.userId,
            contentId: item.contentId,
            contentType: item.contentType,
            title: item.title,
            content: item.content,
            triggerType: args.triggerType,
            platform: args.platform,
          });
          results.succeeded++;
        } catch (error: any) {
          results.failed++;
          const errorMsg = `Failed to embed ${item.contentType} "${item.title}": ${error.message}`;
          results.errors.push(errorMsg);
          console.error('❌ [AUTO EMBEDDING PLATFORM]', errorMsg);
        }
      }

      // Record the batch update
      await ctx.runMutation(internal.vectorSearch.recordEmbeddingUpdate, {
        userId: args.userId,
        type: args.triggerType,
        platform: args.platform,
        itemsProcessed: results.processed,
        itemsSucceeded: results.succeeded,
        itemsFailed: results.failed,
      });

      console.log('✅ [AUTO EMBEDDING PLATFORM] Completed for', args.platform, ':', results);
      return results;

    } catch (error: any) {
      console.error('❌ [AUTO EMBEDDING PLATFORM] Error:', error);
      return {
        processed: 0,
        succeeded: 0,
        failed: 1,
        errors: [error.message]
      };
    }
  },
});

/**
 * Record embedding update in tracking table (internal)
 */
export const recordEmbeddingUpdate = internalMutation({
  args: {
    userId: v.string(),
    type: v.union(
      v.literal("manual_update"),
      v.literal("automatic_update"),
      v.literal("platform_connection"),
      v.literal("content_update")
    ),
    platform: v.optional(v.union(
      v.literal("instagram"),
      v.literal("youtube"),
      v.literal("gmail"),
      v.literal("conversations"),
      v.literal("notes"),
      v.literal("all")
    )),
    contentType: v.optional(v.union(
      v.literal("conversation"),
      v.literal("instagram_post"),
      v.literal("youtube_video"),
      v.literal("gmail_thread"),
      v.literal("note")
    )),
    contentId: v.optional(v.string()),
    itemsProcessed: v.optional(v.number()),
    itemsSucceeded: v.optional(v.number()),
    itemsFailed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("embeddingUpdates", {
      userId: args.userId,
      updatedAt: Date.now(),
      type: args.type,
      platform: args.platform,
      contentType: args.contentType,
      contentId: args.contentId,
      itemsProcessed: args.itemsProcessed || 0,
      itemsSucceeded: args.itemsSucceeded || 0,
      itemsFailed: args.itemsFailed || 0,
    });
  },
});

/**
 * Get the last embedding update time for a user
 */
export const getLastEmbeddingUpdate = query({
  args: { userId: v.string() },
  returns: v.union(v.number(), v.null()),
  handler: async (ctx, args) => {
    try {
      const lastUpdate = await ctx.db
        .query("embeddingUpdates")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .order("desc")
        .first();
      
      return lastUpdate?.updatedAt || null;
    } catch (error) {
      console.error('Error getting last embedding update:', error);
      return null;
    }
  },
});

/**
 * Get recent embedding updates for a user
 */
export const getRecentEmbeddingUpdates = query({
  args: { 
    userId: v.string(),
    limit: v.optional(v.number())
  },
  returns: v.array(v.object({
    _id: v.id("embeddingUpdates"),
    _creationTime: v.number(),
    userId: v.string(),
    updatedAt: v.number(),
    type: v.union(
      v.literal("manual_update"),
      v.literal("automatic_update"),
      v.literal("platform_connection"),
      v.literal("content_update")
    ),
    platform: v.optional(v.union(
      v.literal("instagram"),
      v.literal("youtube"),
      v.literal("gmail"),
      v.literal("conversations"),
      v.literal("notes"),
      v.literal("all")
    )),
    contentType: v.optional(v.union(
      v.literal("conversation"),
      v.literal("instagram_post"),
      v.literal("youtube_video"),
      v.literal("gmail_thread"),
      v.literal("note")
    )),
    contentId: v.optional(v.string()),
    itemsProcessed: v.optional(v.number()),
    itemsSucceeded: v.optional(v.number()),
    itemsFailed: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    try {
      const updates = await ctx.db
        .query("embeddingUpdates")
        .withIndex("by_userId", (q) => q.eq("userId", args.userId))
        .order("desc")
        .take(args.limit || 5);
      
      return updates;
    } catch (error) {
      console.error('Error getting recent embedding updates:', error);
      return [];
    }
  },
});

/**
 * Update the last embedding update time for a user
 */
export const updateLastEmbeddingUpdate = mutation({
  args: { 
    userId: v.string(),
    type: v.union(
      v.literal("manual_update"),
      v.literal("automatic_update"),
      v.literal("platform_connection"),
      v.literal("content_update")
    ),
    platform: v.optional(v.union(
      v.literal("instagram"),
      v.literal("youtube"),
      v.literal("gmail"),
      v.literal("conversations"),
      v.literal("notes"),
      v.literal("all")
    )),
    contentType: v.optional(v.union(
      v.literal("conversation"),
      v.literal("instagram_post"),
      v.literal("youtube_video"),
      v.literal("gmail_thread"),
      v.literal("note")
    )),
    contentId: v.optional(v.string()),
    itemsProcessed: v.optional(v.number()),
    itemsSucceeded: v.optional(v.number()),
    itemsFailed: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      await ctx.db.insert("embeddingUpdates", {
        userId: args.userId,
        updatedAt: Date.now(),
        type: args.type,
        platform: args.platform,
        contentType: args.contentType,
        contentId: args.contentId,
        itemsProcessed: args.itemsProcessed,
        itemsSucceeded: args.itemsSucceeded,
        itemsFailed: args.itemsFailed,
      });
      return true;
    } catch (error) {
      console.error('Error updating last embedding update time:', error);
      return false;
    }
  },
});
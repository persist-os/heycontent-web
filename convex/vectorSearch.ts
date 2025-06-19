import { action, mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { api } from "./_generated/api";

// Google Gemini API endpoint for embeddings
const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent";

/**
 * Generate embeddings using Google's text-embedding-004 model
 */
async function generateEmbedding(text: string): Promise<number[]> {
  console.log('🔥 [GOOGLE API DEBUG] generateEmbedding called with text length:', text.length);
  
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

  console.log('🔥 [GOOGLE API DEBUG] Request body structure:', {
    model: requestBody.model,
    taskType: requestBody.taskType,
    textLength: text.length,
    textPreview: text.substring(0, 100) + '...'
  });

  try {
    console.log('🔥 [GOOGLE API DEBUG] Making fetch request...');
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
      
      throw new Error(`Failed to generate embedding: ${response.status} ${response.statusText}. ${errorText}`);
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
    console.error('❌ [GOOGLE API DEBUG] Fetch error:', error);
    console.error('❌ [GOOGLE API DEBUG] Error type:', typeof error);
    console.error('❌ [GOOGLE API DEBUG] Error message:', error.message);
    throw error;
  }
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

      // Truncate content if it's too long for the API
      let processedContent = args.content;
      const maxContentLength = 60000; // Google's limit is around 60K characters
      if (processedContent.length > maxContentLength) {
        console.log('⚠️ [EMBEDDING DEBUG] Content too long, truncating from', processedContent.length, 'to', maxContentLength);
        processedContent = processedContent.substring(0, maxContentLength) + '...';
      }

      console.log('🚀 [EMBEDDING DEBUG] Calling Google API to generate embedding...');
      console.log('🚀 [EMBEDDING DEBUG] Content preview:', processedContent.substring(0, 200) + '...');
      
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
  },
  handler: async (ctx, args) => {
    console.log('🎯 [TRUE VECTOR SEARCH DEBUG] REAL vector search with embeddings called!');
    console.log('🎯 [TRUE VECTOR SEARCH DEBUG] Query:', args.query);
    console.log('🎯 [TRUE VECTOR SEARCH DEBUG] User ID:', args.userId);
    console.log('🎯 [TRUE VECTOR SEARCH DEBUG] This function uses Google embeddings and cosine similarity!');
    console.log('🎯 [TRUE VECTOR SEARCH DEBUG] If you see this log, then REAL vector search is being used.');
    
    try {
      // Generate embedding for query
      const queryEmbedding = await generateEmbedding(args.query);

      // Get all user embeddings
      const userEmbeddings = await ctx.runQuery(internal.vectorSearch.getAllUserEmbeddings, {
        userId: args.userId,
        contentTypes: args.contentTypes,
      });

      // Calculate similarities and sort
      const similarities = userEmbeddings.map((doc) => ({
        ...doc,
        score: cosineSimilarity(queryEmbedding, doc.embedding),
      }));

      // Sort by similarity and take top results
      similarities.sort((a, b) => b.score - a.score);
      
      return similarities.slice(0, args.limit || 5);
    } catch (error) {
      console.error("Error searching content:", error);
      throw error;
    }
  },
});

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
      const notes = await ctx.runQuery(api.notes.getNotesByUser, { userId: args.userId });
      
      for (const note of notes) {
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
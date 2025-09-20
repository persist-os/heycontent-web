// @ts-nocheck
import { action, mutation, query, internalMutation, internalQuery } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { api } from "./_generated/api";

// Google Gemini API endpoint for embeddings
const GOOGLE_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent";

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
    case 'crystal':
      // For crystal shards, keep the exact quote
      if (processedContent.length > 3000) {
        processedContent = processedContent.substring(0, 3000) + '...';
        console.log('🔧 [PREPROCESS] Crystal shard truncated');
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
 * Generate embeddings using Google's text-embedding-004 model (internal function)
 */
async function generateEmbeddingInternal(text: string): Promise<number[]> {
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
 * Generate embedding for text (Convex action - can be called from backend via HTTP)
 */
export const generateEmbedding = action({
  args: {
    text: v.string(),
  },
  returns: v.array(v.float64()),
  handler: async (ctx, args) => {
    console.log('🚀 [GENERATE EMBEDDING ACTION] Called with text length:', args.text.length);
    
    try {
      const embedding = await generateEmbeddingInternal(args.text);
      console.log('✅ [GENERATE EMBEDDING ACTION] Successfully generated embedding with dimension:', embedding.length);
      return embedding;
    } catch (error: any) {
      console.error('❌ [GENERATE EMBEDDING ACTION] Error:', error);
      throw error;
    }
  },
});

/**
 * Generate and store embedding for content
 */
export const createEmbedding = action({
  args: {
    userId: v.string(),
    contentId: v.string(),
    contentType: v.union(
      v.literal("conversation"),
      v.literal("note"),
      v.literal("crystal"),
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
      const embedding = await generateEmbeddingInternal(processedContent);
      console.log('✅ [EMBEDDING DEBUG] Embedding generated successfully, dimension:', embedding.length);

      console.log('🚀 [EMBEDDING DEBUG] Storing embedding in database...');
      // Store in database
      const embeddingId = await ctx.runMutation(internal.vectorSearchEmbeddings.storeEmbedding, {
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
      v.literal("note"),
      v.literal("crystal"),
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
          
          await ctx.runAction(api.vectorSearchEmbeddings.createEmbedding, {
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
          
          await ctx.runAction(api.vectorSearchEmbeddings.createEmbedding, {
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

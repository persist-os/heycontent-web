import { ChatResponseData } from '../types';
import { ContentContext } from '../types';

import dotenv from 'dotenv';

dotenv.config();

import { getApiKey } from '@/app/lib/api-helpers';

// Add Convex client import for direct function calls
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Add types for vector search
interface VectorSearchResult {
  contentType: string;
  title: string;
  content: string;
  score?: number;
  _id: string;
}

interface VectorSearchResponse {
  success: boolean;
  context: string;
  relevantContent: Array<{
    title: string;
    contentType: string;
    score: number;
  }>;
  prompt: string;
  error?: string;
}

/**
 * Generate embeddings for all existing user content (one-time setup)
 */
export async function generateEmbeddingsForUser(userId: string): Promise<any> {
  console.log('🚀 [EMBEDDING SETUP] Starting embedding generation for user:', userId);
  
  const results = {
    conversations: { processed: 0, succeeded: 0, failed: 0, skipped: 0 },
    notes: { processed: 0, succeeded: 0, failed: 0, skipped: 0 },
    errors: [] as string[]
  };

  try {
    // Get all conversations
    const conversations = await convex.query(api.chatQueries.getHistory, { userId, limit: 100 });
    console.log('🚀 [EMBEDDING SETUP] Found', conversations.length, 'conversations');
    
    for (const conv of conversations) {
      results.conversations.processed++;
      
      // Validate conversation data
      if (!conv || !conv._id || !conv.title || !conv.messages || !Array.isArray(conv.messages)) {
        console.warn(`⚠️ [EMBEDDING SETUP] Skipping invalid conversation:`, {
          hasConv: !!conv,
          hasId: !!(conv && conv._id),
          hasTitle: !!(conv && conv.title),
          hasMessages: !!(conv && conv.messages),
          isArrayMessages: !!(conv && conv.messages && Array.isArray(conv.messages))
        });
        results.conversations.skipped++;
        continue;
      }

      // Skip conversations with no messages or very short content
      if (conv.messages.length === 0) {
        console.warn(`⚠️ [EMBEDDING SETUP] Skipping conversation "${conv.title}" - no messages`);
        results.conversations.skipped++;
        continue;
      }

      try {
        // Create searchable content with validation
        const messageContent = conv.messages
          .filter((m: any) => m && typeof m.content === 'string' && m.content.trim().length > 0)
          .map((m: any) => `${m.role || 'unknown'}: ${m.content}`)
          .join('\n');

        if (messageContent.trim().length === 0) {
          console.warn(`⚠️ [EMBEDDING SETUP] Skipping conversation "${conv.title}" - no valid message content`);
          results.conversations.skipped++;
          continue;
        }

        const searchableContent = `${conv.title}\n\n${messageContent}`;
        
        // Skip if content is too short to be meaningful
        if (searchableContent.trim().length < 10) {
          console.warn(`⚠️ [EMBEDDING SETUP] Skipping conversation "${conv.title}" - content too short`);
          results.conversations.skipped++;
          continue;
        }

        console.log(`🚀 [EMBEDDING SETUP] Processing conversation: "${conv.title}" (${searchableContent.length} chars)`);
        
        await convex.action(api.vectorSearch.createEmbedding, {
          userId,
          contentId: conv._id,
          contentType: "conversation" as const,
          title: conv.title,
          content: searchableContent,
        });
        
        results.conversations.succeeded++;
        console.log(`✅ [EMBEDDING SETUP] Conversation "${conv.title}" embedded successfully`);
        
      } catch (error: any) {
        results.conversations.failed++;
        const errorMsg = `Failed to embed conversation "${conv.title}": ${error.message}`;
        console.error('❌ [EMBEDDING SETUP]', errorMsg);
        results.errors.push(errorMsg);
        
        // Continue processing other conversations even if one fails
        continue;
      }
    }

    // Get all notes
    const notes = await convex.query(api.notes.getNotesByUser, { userId });
    console.log('🚀 [EMBEDDING SETUP] Found', notes.length, 'notes');
    
    for (const note of notes) {
      results.notes.processed++;
      
      // Validate note data
      if (!note || !note._id || !note.title) {
        console.warn(`⚠️ [EMBEDDING SETUP] Skipping invalid note:`, {
          hasNote: !!note,
          hasId: !!(note && note._id),
          hasTitle: !!(note && note.title)
        });
        results.notes.skipped++;
        continue;
      }

      try {
        const searchableContent = `${note.title}\n\n${note.content || ''}`;
        
        // Skip if content is too short to be meaningful
        if (searchableContent.trim().length < 5) {
          console.warn(`⚠️ [EMBEDDING SETUP] Skipping note "${note.title}" - content too short`);
          results.notes.skipped++;
          continue;
        }
        
        console.log(`🚀 [EMBEDDING SETUP] Processing note: "${note.title}" (${searchableContent.length} chars)`);
        
        await convex.action(api.vectorSearch.createEmbedding, {
          userId,
          contentId: note._id,
          contentType: "note" as const,
          title: note.title,
          content: searchableContent,
        });
        
        results.notes.succeeded++;
        console.log(`✅ [EMBEDDING SETUP] Note "${note.title}" embedded successfully`);
        
      } catch (error: any) {
        results.notes.failed++;
        const errorMsg = `Failed to embed note "${note.title}": ${error.message}`;
        console.error('❌ [EMBEDDING SETUP]', errorMsg);
        results.errors.push(errorMsg);
        
        // Continue processing other notes even if one fails
        continue;
      }
    }

    console.log('🎉 [EMBEDDING SETUP] Generation complete!', results);
    return results;
    
  } catch (error: any) {
    console.error('💥 [EMBEDDING SETUP] Fatal error:', error);
    results.errors.push(`Fatal error: ${error.message}`);
    return results;
  }
}

/**
 * Search for relevant content using vector search - DIRECT CONVEX CALL (bypasses broken HTTP)
 */
async function searchRelevantContent(
  query: string,
  userId: string,
  onStatusUpdate?: (status: string) => void
): Promise<VectorSearchResponse | null> {
  console.log('🚨 [FRONTEND DEBUG] searchRelevantContent called - TRYING VECTOR EMBEDDINGS FIRST!');
  console.log('🚨 [FRONTEND DEBUG] Query:', query);
  console.log('🚨 [FRONTEND DEBUG] User ID:', userId);
  
  try {
    onStatusUpdate?.('🔍 Searching for relevant content...');
    
    // Try vector search first
    try {
      console.log('🎯 [FRONTEND DEBUG] Attempting vector search with embeddings...');
      
      const vectorResults = await convex.action(api.vectorSearch.searchRelevantContent, {
        userId,
        query,
        limit: 5
      });

      if (vectorResults && vectorResults.length > 0) {
        console.log('🎉 [FRONTEND DEBUG] VECTOR SEARCH SUCCESS! Found', vectorResults.length, 'results using embeddings');
        
        const result = {
          success: true,
          context: vectorResults.map((item: any) => `${item.contentType}: ${item.title}\n${item.content.substring(0, 500)}...`).join('\n\n'),
          relevantContent: vectorResults.map((item: any) => ({
            title: item.title,
            contentType: item.contentType,
            score: item.score
          })),
          prompt: `Based on the user's previous content:\n\n${vectorResults.map((item: any) => `${item.contentType}: ${item.title}\n${item.content.substring(0, 500)}...`).join('\n\n')}\n\nUser query: ${query}\n\nPlease provide a helpful response that takes into account the user's existing content and context.`
        };

        onStatusUpdate?.(`✅ Found ${vectorResults.length} relevant items using AI embeddings`);
        return result;
      } else {
        console.log('🔍 [FRONTEND DEBUG] Vector search returned no results');
      }
    } catch (vectorError) {
      console.error('❌ [FRONTEND DEBUG] Vector search failed, falling back to text search:', vectorError);
    }

    // Fall back to text-based search if vector search fails
    console.log('🚨 [FRONTEND DEBUG] Falling back to text-based search via chatWithContext');
    
    const result = await convex.action(api.chatMutations.chatWithContext, {
      userId,
      query
    });

    console.log('🚨 [FRONTEND DEBUG] Text search call successful!', result);

    if (result && result.relevantContent?.length > 0) {
      console.log('📊 Text Search Results:', {
        query,
        foundItems: result.relevantContent.length,
        relevantContent: result.relevantContent.map((item: any) => ({
          title: item.title,
          type: item.contentType,
          score: item.score
        }))
      });
      
      onStatusUpdate?.(`✅ Found ${result.relevantContent.length} relevant items using text search`);
      
      return {
        success: true,
        context: result.context,
        relevantContent: result.relevantContent,
        prompt: result.prompt
      };
    }

    console.log('🔍 No relevant content found for query:', query);
    return null;
  } catch (error) {
    console.error('🚨 [FRONTEND DEBUG] All search methods failed:', error);
    onStatusUpdate?.('⚠️ Search completed with errors');
    return null;
  }
}

/**
 * Send a chat message to the API with integrated vector search
 */
export async function sendChatMessage(
  content: string, 
  isFirstMessage: boolean, 
  sessionId: string | null,
  contentContext?: ContentContext | null,
  hasContextInjection?: boolean,
  onStatusUpdate?: (status: string) => void
): Promise<ChatResponseData> {
  console.log('🐛 [DEBUG] sendChatMessage called with:', {
    content: content.substring(0, 50) + '...',
    isFirstMessage,
    sessionId,
    hasContextInjection,
    contentContext: !!contentContext
  });

  // Get API key - make sure we have one before proceeding
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error('You are not authenticated. Please log in again.');
  }

  console.log('🐛 [DEBUG] Got API key, length:', apiKey.length);

  // Get user ID directly from Firebase/cookies (much simpler!)
  const { getCurrentUserId } = await import('@/app/lib/api-helpers');
  const userId = getCurrentUserId();
  
  console.log('🐛 [DEBUG] Got user ID directly:', userId);

  // Perform vector search if we have a user ID
  let vectorSearchResults: VectorSearchResponse | null = null;
  let enhancedQuery = content;
  
  console.log('🐛 [DEBUG] Vector search conditions check:', {
    hasUserId: !!userId,
    userId: userId,
    hasContextInjection: !!hasContextInjection,
    shouldPerformSearch: !!(userId && !hasContextInjection)
  });
  
  if (userId && !hasContextInjection) { // Don't search if we already have context injection
    console.log('🐛 [DEBUG] STARTING VECTOR SEARCH - conditions met!');
    onStatusUpdate?.('🔍 Searching your content...');
    vectorSearchResults = await searchRelevantContent(content, userId, onStatusUpdate);
    
    console.log('🐛 [DEBUG] Vector search completed, results:', {
      hasResults: !!vectorSearchResults,
      hasContext: !!(vectorSearchResults && vectorSearchResults.context),
      itemCount: vectorSearchResults?.relevantContent?.length || 0
    });
    
    if (vectorSearchResults && vectorSearchResults.context) {
      // Inject the vector search context into the query
      enhancedQuery = `Based on the user's previous content and context:\n\n${vectorSearchResults.context}\n\n---\n\nUser query: ${content}\n\nPlease provide a helpful response that takes into account the user's existing content and context. If the retrieved content is relevant, reference it naturally in your response.`;
      
      console.log('💡 Enhanced Query with Vector Context:', {
        originalQuery: content,
        contextLength: vectorSearchResults.context.length,
        relevantItems: vectorSearchResults.relevantContent.length,
        enhancedQueryPreview: enhancedQuery.substring(0, 200) + '...'
      });
    }
  } else {
    console.log('🐛 [DEBUG] SKIPPING VECTOR SEARCH - conditions not met:', {
      reason: !userId ? 'No user ID' : hasContextInjection ? 'Has context injection' : 'Unknown'
    });
  }

  onStatusUpdate?.('🧠 Generating response...');

  // Always set is_first_message to true when isFirstMessage is true
  // This ensures the first message is ALWAYS properly flagged
  const isFirstMessageBool = isFirstMessage;
  
  const requestBody: any = {
    query: enhancedQuery, // Use enhanced query with vector context
    is_first_message: isFirstMessageBool
  };

  // Add context injection flag to help backend understand the message type
  if (hasContextInjection || vectorSearchResults) {
    requestBody.has_context_injection = true;
    requestBody.context_enhanced = true;
  }

  // Add vector search metadata if available
  if (vectorSearchResults) {
    requestBody.vector_search_metadata = {
      foundRelevantContent: true,
      relevantItemsCount: vectorSearchResults.relevantContent.length,
      searchQuery: content // Store original query
    };
  }

  // Handle session ID based on whether this is a first message or continuing conversation
  if (isFirstMessageBool) {
    // For new conversations, explicitly set session_id to null
    requestBody.session_id = null;
    console.log('Sending first message - session_id set to null for new conversation');
  } else if (sessionId) {
    // For continuing conversations, use the conversation ID as session_id
    requestBody.session_id = sessionId;
    console.log('Continuing existing conversation - session_id set to:', sessionId);
  } else {
    // This shouldn't happen, but handle gracefully
    console.warn('Non-first message without session ID - this may cause issues');
    requestBody.session_id = null;
  }

  // Include content context if available
  if (contentContext) {
    requestBody.content_context = {
      platform: contentContext.platform,
      content_id: contentContext.contentId,
      title: contentContext.title,
      analysis: contentContext.analysis,
      thumbnail_url: contentContext.thumbnailUrl,
      published_at: contentContext.publishedAt,
      metrics: contentContext.metrics,
      content: contentContext.content
    };
  }

  // Do NOT include user_id in the request body; backend extracts it from API key

  // Add this right before the fetch call
  console.log('📤 SENDING MESSAGE TO BACKEND:', {
    is_first_message: requestBody.is_first_message,
    session_id: requestBody.session_id,
    current_session_id: sessionId,
    expected_behavior: isFirstMessageBool ? 'CREATE_NEW_CONVERSATION' : 'CONTINUE_EXISTING_CONVERSATION',
    conversation_to_continue: isFirstMessageBool ? 'N/A' : sessionId,
    endpoint: '/api/chat/message',
    has_content_context: !!contentContext,
    has_vector_search_context: !!vectorSearchResults,
    vector_search_items: vectorSearchResults?.relevantContent?.length || 0,
    content_context: contentContext ? {
      platform: contentContext.platform,
      contentId: contentContext.contentId,
      title: contentContext.title,
      hasAnalysis: !!contentContext.analysis
    } : null
  });

  const response = await fetch('/api/chat/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  const data = await response.json();

  // Add this right after receiving the response
  console.log('📥 RECEIVED RESPONSE FROM BACKEND:', {
    session_id_returned: data.session_id,
    session_id_expected: sessionId,
    response_length: data.chat_response?.length,
    conversation_context: isFirstMessageBool ? 'NEW' : 'EXISTING',
    session_id_changed: sessionId !== data.session_id,
    response_preview: data.chat_response?.substring(0, 100) + '...',
    full_response_structure: Object.keys(data),
    used_vector_context: !!vectorSearchResults
  });

  // Add vector search metadata to the response for debugging
  if (vectorSearchResults) {
    data.vector_search_metadata = {
      foundRelevantContent: true,
      relevantItemsCount: vectorSearchResults.relevantContent.length,
      relevantContent: vectorSearchResults.relevantContent
    };
  }

  return data;
}

/**
 * Load conversation by ID
 */
export async function loadConversation(id: string) {
  try {
    // Get API key for authentication - same pattern as sendChatMessage
    const apiKey = await getApiKey();
    if (!apiKey) {
      throw new Error('You are not authenticated. Please log in again.');
    }

    const response = await fetch(`/api/chat/conversation/${id}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to load conversation: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to load conversation:', error);
    throw error;
  }
}

/**
 * Check if user has embeddings
 */
export async function checkUserEmbeddings(userId: string): Promise<{ hasEmbeddings: boolean; count: number }> {
  try {
    const result = await convex.query(api.vectorSearch.hasUserEmbeddings, { userId });
    return result;
  } catch (error: any) {
    console.error('Error checking user embeddings:', error);
    return { hasEmbeddings: false, count: 0 };
  }
}

/**
 * Delete all embeddings for user
 */
export async function deleteAllUserEmbeddings(userId: string): Promise<{ success: boolean; deletedCount: number; message: string }> {
  console.log('🗑️ [EMBEDDING DELETE] Starting deletion for user:', userId);
  
  try {
    const result = await convex.mutation(api.vectorSearch.deleteAllUserEmbeddings, { userId });
    console.log('✅ [EMBEDDING DELETE] Deletion completed:', result);
    return result;
  } catch (error: any) {
    console.error('❌ [EMBEDDING DELETE] Deletion failed:', error);
    return { 
      success: false, 
      deletedCount: 0, 
      message: `Failed to delete embeddings: ${error.message}` 
    };
  }
}

// We no longer generate local session IDs
// All session IDs should come from the backend

/**
 * Search Service
 *
 * Handles embeddings and vector search functionality for the thinking lab.
 * Extracted from legacy chat system with human-friendly messaging.
 */

import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"

// Initialize Convex client
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

// Import centralized types
import type { VectorSearchResult, VectorSearchResponse, EmbeddingProcessingResult } from '@/app/dashboard/thinking_lab/types'

// Re-export types from centralized location (no duplication)
export type { VectorSearchResult, VectorSearchResponse, EmbeddingProcessingResult }

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

function sanitizeContentForPrompt(content: string): string {
  if (!content) return ''
  
  // Limit content length for better performance
  const maxLength = 500
  if (content.length > maxLength) {
    return content.substring(0, maxLength) + '...'
  }
  
  return content
}

// =============================================================================
// VECTOR SEARCH
// =============================================================================

/**
 * Search for relevant content using vector search with human-friendly updates
 */
export async function searchRelevantContent(
  query: string,
  userId: string,
  onStatusUpdate?: (status: string) => void,
  searchLimit: number = 10
): Promise<VectorSearchResponse | null> {
  try {
    onStatusUpdate?.('Looking through your content - finding what might be helpful...')
    
    // Use the working standard hybrid search
    try {
      console.log('🎯 [SEARCH SERVICE] Using standard hybrid search')
      
      const vectorResults = await convex.action(api.vectorSearch.hybridSearchContentWithQuotas, {
        userId,
        query,
        limit: searchLimit,
        contentTypes: ["conversation", "note", "crystal"],
        minSimilarity: 0.35 // Only return results with >35% similarity
      })

      if (vectorResults && vectorResults.length > 0) {
        console.log('🎉 [SEARCH SERVICE] Found', vectorResults.length, 'results')
        console.log('🔍 [SEARCH SERVICE] Content types found:', vectorResults.map((item: any) => item.contentType))
        console.log('🔍 [SEARCH SERVICE] Similarity scores:', vectorResults.map((item: any) => ({ 
          title: item.title.substring(0, 30) + '...', 
          contentType: item.contentType, 
          score: Math.round(item.score * 1000) / 1000 
        })))
        
        // Human-friendly status update
        onStatusUpdate?.(`Found ${vectorResults.length} potentially helpful items - discovered some good stuff!`)
        
        const result = {
          success: true,
          context: vectorResults.map((item: any) => {
            const sanitizedContent = sanitizeContentForPrompt(item.content)
            return `${item.contentType}: ${item.title}\n${sanitizedContent}...`
          }).join('\n\n'),
          relevantContent: vectorResults.map((item: any) => ({
            title: item.title,
            contentType: item.contentType,
            score: item.score,
            summary: item.content // Keep the actual content for grading
          })),
          prompt: `Based on the user's previous content:\n\n${vectorResults.map((item: any) => {
            const sanitizedContent = sanitizeContentForPrompt(item.content)
            return `${item.contentType}: ${item.title}\n${sanitizedContent}...`
          }).join('\n\n')}\n\nUser query: ${query}\n\nPlease provide a helpful response that takes into account the user's existing content and context.`
        }

        return result
      } else {
        console.warn('[SEARCH SERVICE] Standard hybrid search returned no results')
        onStatusUpdate?.('No helpful content found in your library')
      }
    } catch (standardError) {
      console.error('[SEARCH SERVICE] Standard hybrid search failed:', standardError)
    }

    // Final fallback to chatWithContext
    console.log('[SEARCH SERVICE] Trying final fallback to chatWithContext...')
    const result = await convex.action(api.chatMutations.chatWithContext, {
      userId,
      query
    })

    if (result && result.relevantContent?.length > 0) {
      onStatusUpdate?.(`Found ${result.relevantContent.length} helpful items - good stuff discovered!`)
      
      return {
        success: true,
        context: result.context,
        relevantContent: result.relevantContent,
        prompt: result.prompt
      }
    }

    console.warn('No relevant content found for query:', query)
    onStatusUpdate?.('No helpful content found in your library')
    return null
  } catch (error) {
    console.error('🚨 [SEARCH SERVICE] All search methods failed:', error)
    onStatusUpdate?.('Something went wrong with the search, but we\'ll keep going!')
    return null
  }
}

// =============================================================================
// EMBEDDING GENERATION
// =============================================================================

/**
 * Generate embeddings for a specific platform with progress updates
 */
export async function generateEmbeddingsForPlatform(
  userId: string, 
  platform: 'conversations' | 'notes'
): Promise<EmbeddingProcessingResult> {
  
  const results: EmbeddingProcessingResult = {
    [platform]: { processed: 0, succeeded: 0, failed: 0, skipped: 0 },
    conversations: { processed: 0, succeeded: 0, failed: 0, skipped: 0 },
    notes: { processed: 0, succeeded: 0, failed: 0, skipped: 0 },
    errors: []
  }

  try {
    switch (platform) {
      case 'conversations':
        // Get conversations only
        const conversations = await convex.query(api.chatQueries.getHistory, { userId, limit: 100 })
        
        for (const conv of conversations) {
          results.conversations.processed++
          
          if (!conv || !conv._id || !conv.title || !conv.messages || !Array.isArray(conv.messages)) {
            console.warn(`⚠️ [EMBEDDING] Skipping invalid conversation`)
            results.conversations.skipped++
            continue
          }

          if (conv.messages.length === 0) {
            console.warn(`⚠️ [EMBEDDING] Skipping conversation "${conv.title}" - no messages`)
            results.conversations.skipped++
            continue
          }

          try {
            const messageContent = conv.messages
              .filter((m: any) => m && typeof m.content === 'string' && m.content.trim().length > 0)
              .map((m: any) => `${m.role || 'unknown'}: ${m.content}`)
              .join('\n')

            if (messageContent.trim().length === 0) {
              console.warn(`⚠️ [EMBEDDING] Skipping conversation "${conv.title}" - no valid message content`)
              results.conversations.skipped++
              continue
            }

            const searchableContent = `${conv.title}\n\n${messageContent}`
            
            if (searchableContent.trim().length < 10) {
              console.warn(`⚠️ [EMBEDDING] Skipping conversation "${conv.title}" - content too short`)
              results.conversations.skipped++
              continue
            }

            await convex.action(api.vectorSearchEmbeddings.createEmbedding, {
              userId,
              contentId: conv._id,
              contentType: "conversation" as const,
              title: conv.title,
              content: searchableContent,
            })
            
            results.conversations.succeeded++
            
          } catch (error: any) {
            results.conversations.failed++
            const errorMsg = `Failed to embed conversation "${conv.title}": ${error.message}`
            console.error('❌ [EMBEDDING]', errorMsg)
            results.errors.push(errorMsg)
            continue
          }
        }
        break

      case 'notes':
        // Get notes only
        const notesResult = await convex.query(api.noteQueries.getUserNotes, { userId, numItems: 1000 })
        
        for (const note of notesResult.page) {
          results.notes.processed++
          
          if (!note || !note._id || !note.title) {
            console.warn(`⚠️ [EMBEDDING] Skipping invalid note`)
            results.notes.skipped++
            continue
          }

          try {
            const searchableContent = `${note.title}\n\n${note.content || ''}`
            
            if (searchableContent.trim().length < 5) {
              console.warn(`⚠️ [EMBEDDING] Skipping note "${note.title}" - content too short`)
              results.notes.skipped++
              continue
            }
            
            await convex.action(api.vectorSearchEmbeddings.createEmbedding, {
              userId,
              contentId: note._id,
              contentType: "note" as const,
              title: note.title,
              content: searchableContent,
            })
            
            results.notes.succeeded++
            
          } catch (error: any) {
            results.notes.failed++
            const errorMsg = `Failed to embed note "${note.title}": ${error.message}`
            console.error('❌ [EMBEDDING]', errorMsg)
            results.errors.push(errorMsg)
            continue
          }
        }
        break
    }

  } catch (error: any) {
    const errorMsg = `Failed to process ${platform}: ${error.message}`
    console.error('❌ [EMBEDDING]', errorMsg)
    results.errors.push(errorMsg)
  }

  return results
}

/**
 * Generate embeddings for all user content
 */
export async function generateAllEmbeddings(userId: string): Promise<EmbeddingProcessingResult> {
  try {
    // Process both conversations and notes
    const conversationResults = await generateEmbeddingsForPlatform(userId, 'conversations')
    const noteResults = await generateEmbeddingsForPlatform(userId, 'notes')

    return {
      conversations: conversationResults.conversations,
      notes: noteResults.notes,
      errors: [...conversationResults.errors, ...noteResults.errors]
    }
  } catch (error: any) {
    console.error('❌ [EMBEDDING] Failed to generate all embeddings:', error)
    return {
      conversations: { processed: 0, succeeded: 0, failed: 1, skipped: 0 },
      notes: { processed: 0, succeeded: 0, failed: 1, skipped: 0 },
      errors: [`Failed to generate embeddings: ${error.message}`]
    }
  }
}

/**
 * Check if user has any embeddings
 */
export async function checkEmbeddingStatus(userId: string): Promise<{ hasEmbeddings: boolean; count: number }> {
  try {
    // TODO: Implement proper embedding count check
    // This is a placeholder - update based on your Convex schema
    return { hasEmbeddings: true, count: 0 }
  } catch (error) {
    console.error('❌ [EMBEDDING] Failed to check embedding status:', error)
    return { hasEmbeddings: false, count: 0 }
  }
}

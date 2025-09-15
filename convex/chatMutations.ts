import { mutation, action } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { internal } from "./_generated/api";

export const createConversation = mutation({
    args: {
      userId: v.string(),
      title: v.string(),
      messages: v.array(v.object({
        content: v.string(),
        role: v.union(v.literal("user"), v.literal("assistant")),
        timestamp: v.number(),
        context: v.optional(v.string()),
      })),
    },
    handler: async (ctx, args) => {
      const conversationId = await ctx.db.insert("conversations", {
        userId: args.userId,
        title: args.title,
        messages: args.messages,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        starred: false,
      });

      // Note: Embeddings will be created automatically on next heartbeat
      console.log('📝 [CONVERSATION] Embedding will be created on next heartbeat sync');

      // NEW: Schedule frontend persona crystallization (non-blocking)
      try {
        await ctx.scheduler.runAfter(2000, api.chatMutations.triggerFrontendPersonaCrystallization, {
          userId: args.userId,
          conversationId
        });
        console.log('🧠 [TRACE EXTRACTION] Scheduled frontend persona crystallization for conversation:', conversationId);
      } catch (error) {
        console.error('❌ [TRACE EXTRACTION] Failed to schedule frontend persona crystallization:', conversationId, error);
        // Don't fail the conversation creation if scheduling fails
      }

      return conversationId;
    },
  });
  
export const addMessageToConversation = mutation({
args: {
    userId: v.string(),
    conversationId: v.id("conversations"),
    message: v.object({
      content: v.string(),
      role: v.union(v.literal("user"), v.literal("assistant")),
      timestamp: v.number(),
      context: v.optional(v.string()),
    }),
},
handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.userId !== args.userId) {
      throw new Error("Conversation not found or access denied");
    }

    const updatedMessages = [...conversation.messages, args.message];
    
    await ctx.db.patch(args.conversationId, {
      messages: updatedMessages,
      updatedAt: Date.now(),
    });

    // Note: Embeddings will be updated automatically on next heartbeat
    console.log('📝 [CONVERSATION] Embedding will be updated on next heartbeat sync');

    // NEW: Schedule frontend persona crystallization (non-blocking)
    try {
      await ctx.scheduler.runAfter(2000, api.chatMutations.triggerFrontendPersonaCrystallization, {
        userId: args.userId,
        conversationId: args.conversationId
      });
      console.log('🧠 [TRACE EXTRACTION] Scheduled frontend persona crystallization for message update:', args.conversationId);
    } catch (error) {
      console.error('❌ [TRACE EXTRACTION] Failed to schedule frontend persona crystallization for message update:', args.conversationId, error);
      // Don't fail the message update if scheduling fails
    }

    return args.conversationId;
},
});

export const deleteConversation = mutation({
args: {
    conversationId: v.string(),
    userId: v.string(),
},
handler: async (ctx, args) => {
    // Use direct ID lookup for reliable conversation fetching
    const doc = await ctx.db.get(args.conversationId as any);

    if (!doc) {
        throw new Error("Conversation not found");
    }

    // Type check to ensure it's a conversation document
    if (!('userId' in doc) || !('messages' in doc)) {
        throw new Error("Invalid document type - not a conversation");
    }

    const conversation = doc as any; // Type assertion after validation

    // Verify ownership
    if (conversation.userId !== args.userId) {
        throw new Error("Unauthorized access to conversation");
    }

    // Delete the conversation
    await ctx.db.delete(conversation._id);
    return { success: true };
},
});

export const starConversation = mutation({
args: {
    conversationId: v.string(),
    userId: v.string(),
},
handler: async (ctx, args) => {
    // Use direct ID lookup for reliable conversation fetching
    const doc = await ctx.db.get(args.conversationId as any);

    if (!doc) {
        throw new Error("Conversation not found");
    }

    // Type check to ensure it's a conversation document
    if (!('userId' in doc) || !('messages' in doc)) {
        throw new Error("Invalid document type - not a conversation");
    }

    const conversation = doc as any; // Type assertion after validation

    // Verify ownership
    if (conversation.userId !== args.userId) {
        throw new Error("Unauthorized access to conversation");
    }

    // Toggle the starred status
    await ctx.db.patch(conversation._id, {
    starred: !conversation.starred,
    updatedAt: Date.now(),
    });

    return { success: true, starred: !conversation.starred };
},
});

/**
 * Action to trigger frontend persona crystallization
 * This stores a trigger event that the frontend can poll for
 */
export const triggerFrontendPersonaCrystallization = action({
  args: {
    userId: v.string(),
    conversationId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    try {
      console.log('🎯 [FRONTEND TRIGGER] Creating persona crystallization trigger for conversation:', args.conversationId);
      
      // Store a trigger event that the frontend can detect
      await ctx.runMutation(api.chatMutations.createPersonaCrystallizationTrigger, {
        user_id: args.userId,
        conversation_id: args.conversationId,
        trigger_type: 'conversation_update',
        metadata: {
          timestamp: Date.now(),
          source: 'chat_mutation'
        }
      });
      
      console.log('✅ [FRONTEND TRIGGER] Persona crystallization trigger created successfully');
    } catch (error) {
      console.error('❌ [FRONTEND TRIGGER] Failed to create persona crystallization trigger:', error);
      // Don't throw - this is a background process
    }
  }
});

/**
 * Mutation to create a persona crystallization trigger event
 */
export const createPersonaCrystallizationTrigger = mutation({
  args: {
    user_id: v.string(),
    conversation_id: v.id("conversations"),
    trigger_type: v.string(),
    metadata: v.any()
  },
  returns: v.id("persona_crystallization_triggers"),
  handler: async (ctx, args) => {
    console.log('📝 [TRIGGER MUTATION] Creating crystallization trigger:', args.trigger_type);
    
    return await ctx.db.insert("persona_crystallization_triggers", {
      user_id: args.user_id,
      conversation_id: args.conversation_id,
      trigger_type: args.trigger_type,
      metadata: args.metadata,
      processed: false,
      created_at: Date.now()
    });
  }
});

/**
 * Enhanced chat action that searches for relevant content before responding
 */
export const chatWithContext = action({
  args: {
    userId: v.string(),
    query: v.string(),
    conversationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log("🔍 [VECTOR SEARCH DEBUG] Starting chatWithContext");
    console.log("🔍 [VECTOR SEARCH DEBUG] Input query:", args.query);
    console.log("🔍 [VECTOR SEARCH DEBUG] User ID:", args.userId);
    
    try {
      // Try to use REAL vector search first (with embeddings)
      console.log("🔍 [VECTOR SEARCH DEBUG] Attempting REAL vector search with embeddings...");
      let relevantContent: any[] = [];
      
      try {
        const vectorResults = await ctx.runAction(api.vectorSearch.searchRelevantContent, {
          userId: args.userId,
          query: args.query,
          limit: 5
        });
        
        if (vectorResults && vectorResults.length > 0) {
          console.log("🎯 [VECTOR SEARCH SUCCESS] Found", vectorResults.length, "results using embeddings!");
          relevantContent = vectorResults.map((item: any) => ({
            contentType: item.contentType,
            title: item.title,
            content: item.content,
            score: item.score,
            _id: item.contentId
          }));
        } else {
          console.log("🎯 [VECTOR SEARCH] No results from embedding search, checking if embeddings exist...");
          
          // Check if user has any embeddings
          const userEmbeddings = await ctx.runQuery(api.vectorSearch.getUserEmbeddings, { userId: args.userId, limit: 1 });
          if (!userEmbeddings || userEmbeddings.length === 0) {
            console.log("⚠️ [VECTOR SEARCH] No embeddings found for user. Falling back to text search.");
            console.log("💡 [VECTOR SEARCH] Hint: Run embedding generation first!");
            relevantContent = await searchUserContentTextBased(ctx, args.userId, args.query);
          } else {
            console.log("🔍 [VECTOR SEARCH] User has embeddings but no matches found for this query");
            relevantContent = [];
          }
        }
      } catch (embeddingError) {
        console.error("❌ [VECTOR SEARCH] Error with embedding search, falling back to text search:", embeddingError);
        relevantContent = await searchUserContentTextBased(ctx, args.userId, args.query);
      }
      
      console.log("🔍 [VECTOR SEARCH DEBUG] Search completed!");
      console.log("🔍 [VECTOR SEARCH DEBUG] Found", relevantContent.length, "relevant items");
      console.log("🔍 [VECTOR SEARCH DEBUG] Relevant content details:");
      relevantContent.forEach((item, index) => {
        console.log(`🔍 [VECTOR SEARCH DEBUG] Item ${index + 1}:`, {
          contentType: item.contentType,
          title: item.title,
          score: item.score,
          contentPreview: item.content.substring(0, 100) + "...",
          contentLength: item.content.length
        });
      });
      
      // Build context string from relevant content
      const contextString = relevantContent
        .map(item => `${item.contentType}: ${item.title}\n${item.content.substring(0, 500)}...`)
        .join('\n\n');
      
      console.log("🔍 [VECTOR SEARCH DEBUG] Built context string:");
      console.log("🔍 [VECTOR SEARCH DEBUG] Context length:", contextString.length);
      console.log("🔍 [VECTOR SEARCH DEBUG] Context preview:", contextString.substring(0, 200) + "...");
      
      // Create a contextual prompt
      const contextualPrompt = `Based on the user's previous content:\n${contextString}\n\nUser query: ${args.query}\n\nPlease provide a helpful response that takes into account the user's existing content and context.`;
      
      console.log("🔍 [VECTOR SEARCH DEBUG] Final prompt length:", contextualPrompt.length);
      
      // Here you would integrate with your preferred LLM
      // For now, return the context and query for integration
      const result = {
        context: contextString,
        query: args.query,
        relevantContent: relevantContent.map(item => ({
          title: item.title,
          contentType: item.contentType,
          score: item.score || 0
        })),
        prompt: contextualPrompt
      };
      
      console.log("🔍 [VECTOR SEARCH DEBUG] Returning result with", result.relevantContent.length, "items");
      return result;
    } catch (error) {
      console.error("🔍 [VECTOR SEARCH DEBUG] Error in chatWithContext:", error);
      return {
        context: "",
        query: args.query,
        relevantContent: [],
        prompt: args.query,
        error: "Failed to search for relevant content"
      };
    }
  },
});

/**
 * Simple content search using basic text matching (FALLBACK)
 */
async function searchUserContentTextBased(ctx: any, userId: string, query: string) {
  console.log("📝 [TEXT SEARCH FALLBACK] Using text-based search as fallback");
  console.log("📝 [TEXT SEARCH FALLBACK] Original query:", query);
  
  const queryLower = query.toLowerCase();
  console.log("📝 [TEXT SEARCH FALLBACK] Lowercase query:", queryLower);
  
  const results: any[] = [];
  
  try {
    console.log("📝 [TEXT SEARCH FALLBACK] Searching conversations...");
    // Search conversations
    const conversations = await ctx.runQuery(api.chatQueries.getHistory, { userId, limit: 20 });
    console.log("📝 [TEXT SEARCH FALLBACK] Found", conversations.length, "conversations to search");
    
    for (const conv of conversations) {
      const content = conv.messages.map((m: any) => m.content).join(' ').toLowerCase();
      const titleMatches = conv.title.toLowerCase().includes(queryLower);
      const contentMatches = content.includes(queryLower);
      
      if (contentMatches || titleMatches) {
        console.log("📝 [TEXT SEARCH FALLBACK] MATCH FOUND in conversation:");
        console.log("📝 [TEXT SEARCH FALLBACK] - Title:", conv.title);
        console.log("📝 [TEXT SEARCH FALLBACK] - Title matches:", titleMatches);
        console.log("📝 [TEXT SEARCH FALLBACK] - Content matches:", contentMatches);
        console.log("📝 [TEXT SEARCH FALLBACK] - Content preview:", content.substring(0, 100) + "...");
        
        results.push({
          contentType: 'conversation',
          title: conv.title,
          content: conv.messages.map((m: any) => `${m.role}: ${m.content}`).join('\n'),
          score: 0.8,
          _id: conv._id
        });
      }
    }
    console.log("📝 [TEXT SEARCH FALLBACK] Conversation search complete. Found", results.filter(r => r.contentType === 'conversation').length, "matches");
  } catch (error) {
    console.error("📝 [TEXT SEARCH FALLBACK] Error searching conversations:", error);
  }
  
  try {
    console.log("📝 [TEXT SEARCH FALLBACK] Searching notes...");
    // Search notes - using the correct query name
    const notesResult = await ctx.runQuery(api.noteQueries.getUserNotes, { userId, numItems: 1000 });
    console.log("📝 [TEXT SEARCH FALLBACK] Found", notesResult.page.length, "notes to search");
    
    for (const note of notesResult.page) {
      const titleMatches = note.title.toLowerCase().includes(queryLower);
      const contentMatches = note.content && note.content.toLowerCase().includes(queryLower);
      
      if (titleMatches || contentMatches) {
        console.log("📝 [TEXT SEARCH FALLBACK] MATCH FOUND in note:");
        console.log("📝 [TEXT SEARCH FALLBACK] - Title:", note.title);
        console.log("📝 [TEXT SEARCH FALLBACK] - Title matches:", titleMatches);
        console.log("📝 [TEXT SEARCH FALLBACK] - Content matches:", contentMatches);
        console.log("📝 [TEXT SEARCH FALLBACK] - Content preview:", (note.content || '').substring(0, 100) + "...");
        
        results.push({
          contentType: 'note',
          title: note.title,
          content: note.content || '',
          score: 0.9,
          _id: note._id
        });
      }
    }
    console.log("📝 [TEXT SEARCH FALLBACK] Notes search complete. Found", results.filter(r => r.contentType === 'note').length, "matches");
  } catch (error) {
    console.error("📝 [TEXT SEARCH FALLBACK] Error searching notes:", error);
  }
  
  console.log("📝 [TEXT SEARCH FALLBACK] Total results before slicing:", results.length);
  console.log("📝 [TEXT SEARCH FALLBACK] All results summary:");
  results.forEach((result, index) => {
    console.log(`📝 [TEXT SEARCH FALLBACK] Result ${index + 1}: ${result.contentType} - "${result.title}" (score: ${result.score})`);
  });
  
  const finalResults = results.slice(0, 5); // Return top 5 results
  console.log("📝 [TEXT SEARCH FALLBACK] Returning", finalResults.length, "results (top 5)");
  return finalResults;
}
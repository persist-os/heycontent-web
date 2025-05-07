import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';
import { getUserIdFromToken } from '@/app/lib/getUserIdFromToken';

export async function POST(request: Request) {
  const requestId = Math.random().toString(36).substring(7);

  console.log(`[${requestId}] Saving chat conversation`, {
    timestamp: new Date().toISOString()
  });

  try {
    const token = cookies().get('firebase-auth-token')?.value;
    if (!token) {
      console.warn(`[${requestId}] Authentication failed: No token found`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Initialize Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL || '');

    // Get the user ID from the token
    const userId = await getUserIdFromToken(token);
    if (!userId) {
      console.warn(`[${requestId}] Invalid token: Could not get user ID`);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { messages, title, sessionId, conversationId } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      console.warn(`[${requestId}] Invalid request: Missing or empty messages array`);
      return NextResponse.json({ error: 'Messages are required' }, { status: 400 });
    }

    // Format messages for Convex
    const formattedMessages = messages.map(msg => ({
      content: msg.content,
      role: msg.role,
      timestamp: new Date(msg.timestamp).getTime()
    }));

    // Generate a title if not provided
    const chatTitle = title || `Chat from ${new Date().toLocaleString()}`;

    // Use conversationId if provided (prioritize it over sessionId)
    // If not, use sessionId as the conversationId to ensure continuity
    const targetConversationId = conversationId || sessionId;

    // Check if sessionId is from a new chat session
    // If it begins with the backend's format (UUID), treat it as a potential new conversation
    const isNewBackendSession = typeof sessionId === 'string' && 
      sessionId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    
    // Force a new conversation if it's a new backend session without an existing conversationId
    if (isNewBackendSession && !conversationId) {
      console.log(`[${requestId}] Detected new backend session ID, creating new conversation:`, {
        sessionId,
        userId,
        messageCount: formattedMessages.length
      });

      // Create a new conversation in Convex with the backend session ID
      const newConversationId = await convex.mutation(api.chat.createConversation, {
        userId,
        title: chatTitle,
        messages: formattedMessages
      });

      console.log(`[${requestId}] Successfully created new conversation for new session`, {
        sessionId,
        conversationId: newConversationId,
        messageCount: formattedMessages.length
      });

      return NextResponse.json({
        success: true,
        conversationId: newConversationId,
        metadata: {
          request_id: requestId,
          timestamp: new Date().toISOString(),
          action: 'created'
        }
      });
    }

    // Check if we're updating an existing conversation
    if (targetConversationId) {
      console.log(`[${requestId}] Updating existing conversation:`, {
        conversationId: targetConversationId,
        userId,
        messageCount: formattedMessages.length
      });

      try {
        // First check if the conversation exists
        const existingConversation = await convex.query(api.chat.getConversation, {
          userId,
          conversationId: targetConversationId
        });

        if (!existingConversation) {
          console.log(`[${requestId}] Conversation ID ${targetConversationId} not found, creating new conversation instead`);
          // Continue to create new conversation below
        } else {
          // Get the latest message only
          const latestUserMessage = [...formattedMessages].reverse().find(msg => msg.role === 'user');
          const latestAssistantMessage = [...formattedMessages].reverse().find(msg => msg.role === 'assistant');
          
          // Update with the most recent messages if available
          if (latestUserMessage && latestAssistantMessage) {
            // Add user message first
            await convex.mutation(api.chat.addMessageToConversation, {
              conversationId: targetConversationId,
              userId,
              message: latestUserMessage
            });
            
            // Then add assistant response
            const result = await convex.mutation(api.chat.addMessageToConversation, {
              conversationId: targetConversationId,
              userId,
              message: latestAssistantMessage
            });

            console.log(`[${requestId}] Successfully updated conversation with user & assistant messages`, {
              conversationId: targetConversationId,
              result
            });

            return NextResponse.json({
              success: true,
              conversationId: targetConversationId,
              metadata: {
                request_id: requestId,
                timestamp: new Date().toISOString(),
                action: 'updated'
              }
            });
          } else if (latestUserMessage) {
            // Add just the user message if that's all we have
            const result = await convex.mutation(api.chat.addMessageToConversation, {
              conversationId: targetConversationId,
              userId,
              message: latestUserMessage
            });

            console.log(`[${requestId}] Successfully updated conversation with user message only`, {
              conversationId: targetConversationId,
              result
            });

            return NextResponse.json({
              success: true,
              conversationId: targetConversationId,
              metadata: {
                request_id: requestId,
                timestamp: new Date().toISOString(),
                action: 'updated'
              }
            });
          }
        }
      } catch (error) {
        console.error(`[${requestId}] Error checking/updating conversation:`, error);
        console.log(`[${requestId}] Falling back to creating new conversation`);
        // Continue to create new conversation
      }
    }

    // Default behavior: create a new conversation
    console.log(`[${requestId}] Creating new conversation:`, {
      userId,
      title: chatTitle,
      messageCount: formattedMessages.length,
      firstMessage: formattedMessages[0]?.content?.substring(0, 50),
      lastMessage: formattedMessages[formattedMessages.length - 1]?.content?.substring(0, 50)
    });

    // Save conversation to Convex
    const newConversationId = await convex.mutation(api.chat.createConversation, {
      userId,
      title: chatTitle,
      messages: formattedMessages
    });

    console.log(`[${requestId}] Successfully saved new conversation`, {
      conversationId: newConversationId,
      messageCount: messages.length
    });

    return NextResponse.json({
      success: true,
      conversationId: newConversationId,
      metadata: {
        request_id: requestId,
        timestamp: new Date().toISOString(),
        action: 'created'
      }
    });
  } catch (error) {
    console.error(`[${requestId}] Failed to save conversation`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}

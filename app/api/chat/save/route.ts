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

    // If we have an existing conversationId, add the latest message instead of creating a new conversation
    if (conversationId) {
      console.log(`[${requestId}] Updating existing conversation:`, {
        conversationId,
        userId,
        messageCount: formattedMessages.length
      });

      // Get the latest message only
      const latestMessage = formattedMessages[formattedMessages.length - 1];
      
      if (latestMessage) {
        const result = await convex.mutation(api.chat.addMessageToConversation, {
          conversationId,
          userId,
          message: latestMessage
        });

        console.log(`[${requestId}] Successfully updated conversation`, {
          conversationId,
          result
        });

        return NextResponse.json({
          success: true,
          conversationId,
          metadata: {
            request_id: requestId,
            timestamp: new Date().toISOString(),
            action: 'updated'
          }
        });
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

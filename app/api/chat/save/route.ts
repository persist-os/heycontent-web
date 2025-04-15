import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

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
    const userId = await convex.query(api.queries.getUserIdFromToken, { token });
    if (!userId) {
      console.warn(`[${requestId}] Invalid token: Could not get user ID`);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { messages, title, sessionId } = body;

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

    console.log(`[${requestId}] Formatted conversation for saving:`, {
      userId,
      title: chatTitle,
      messageCount: formattedMessages.length,
      firstMessage: formattedMessages[0]?.content?.substring(0, 50),
      lastMessage: formattedMessages[formattedMessages.length - 1]?.content?.substring(0, 50)
    });

    // Save conversation to Convex
    const conversationId = await convex.mutation(api.chat.createConversation, {
      userId,
      title: chatTitle,
      messages: formattedMessages
    });

    console.log(`[${requestId}] Successfully saved conversation`, {
      conversationId,
      messageCount: messages.length
    });

    return NextResponse.json({
      success: true,
      conversationId,
      metadata: {
        request_id: requestId,
        timestamp: new Date().toISOString()
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

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

export async function GET(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[${requestId}] Fetching conversation`, {
    chatId: params.chatId,
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

    // We need to add a function to get a specific conversation by ID
    // For now, we'll fetch all conversations and filter on the client side
    const conversations = await convex.query(api.chat.getHistory, { 
      userId
    });

    // Find the specific conversation
    const conversation = conversations.find(conv => conv._id === params.chatId);
    
    if (!conversation) {
      console.warn(`[${requestId}] Conversation not found: ${params.chatId}`);
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Format the conversation for the frontend
    const formattedConversation = {
      id: conversation._id,
      title: conversation.title || 'Untitled Chat',
      messages: conversation.messages.map((msg, index) => ({
        id: index,
        content: msg.content,
        chat_response: msg.content,
        role: msg.role,
        timestamp: new Date(msg.timestamp).toISOString()
      })),
      createdAt: new Date(conversation.createdAt).toISOString(),
      updatedAt: new Date(conversation.updatedAt).toISOString(),
      starred: conversation.starred || false
    };

    console.log(`[${requestId}] Successfully fetched conversation ${params.chatId}`);

    return NextResponse.json({
      conversation: formattedConversation,
      metadata: {
        request_id: requestId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(`[${requestId}] Failed to fetch conversation`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}

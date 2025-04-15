import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

export async function POST(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  const requestId = Math.random().toString(36).substring(7);
  
  console.log(`[${requestId}] Toggling star status for chat`, {
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

    // Star the conversation
    const result = await convex.mutation(api.chat.starConversation, {
      conversationId: params.chatId,
      userId
    });

    console.log(`[${requestId}] Successfully toggled star status for chat ${params.chatId}`, {
      starred: result.starred
    });

    return NextResponse.json({
      success: true,
      starred: result.starred,
      metadata: {
        request_id: requestId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(`[${requestId}] Failed to toggle star status`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}

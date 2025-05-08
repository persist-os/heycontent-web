import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { getUserIdFromToken } from '@/app/lib/getUserIdFromToken';

export async function GET(request: Request) {
  const requestId = Math.random().toString(36).substring(7);
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  console.log(`[${requestId}] Fetching chat history`, {
    limit,
    timestamp: new Date().toISOString()
  });

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('firebase-auth-token')?.value;
    if (!token) {
      console.warn(`[${requestId}] Authentication failed: No token found`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user ID from the token using local utility
    const userId = await getUserIdFromToken(token);
    if (!userId) {
      console.warn(`[${requestId}] Invalid token: Could not get user ID`);
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Fetch conversations from Convex
    const conversations = await fetchQuery(api.chat.getHistory, {
      userId,
      limit
    });

    // Map Convex data to the format expected by the frontend
    const formattedConversations = conversations.map(conv => ({
      id: conv._id,
      topic: conv.title || 'Untitled Chat',
      preview: conv.messages[0]?.content || '',
      starred: conv.starred || false,
      messages: conv.messages.map((msg, index) => ({
        id: index,
        content: msg.content,
        role: msg.role,
        timestamp: new Date(msg.timestamp).toISOString()
      }))
    }));

    console.log(`[${requestId}] Successfully fetched ${formattedConversations.length} conversations`);

    return NextResponse.json({
      conversations: formattedConversations,
      metadata: {
        request_id: requestId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(`[${requestId}] Failed to fetch chat history`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });

    return NextResponse.json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}
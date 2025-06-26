import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { getUserIdFromToken } from '@/app/lib/getUserIdFromToken';
import { validateApiKey } from '@/app/lib/validateApiKey';

// Function to clean message content by removing backend context
function cleanMessageContent(content: string, role: string): string {
  // Only clean user messages that might have context prepended
  if (role !== 'user') {
    return content;
  }

  // Check if the message starts with [Context] and remove everything up to the actual user message
  const contextPattern = /^\[Context\][\s\S]*?\n\n/;
  const cleanedContent = content.replace(contextPattern, '');
  
  return cleanedContent.trim();
}

export async function GET(request: Request) {
  const requestId = Math.random().toString(36).substring(7);
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20', 10);

  console.log(`[${requestId}] Fetching chat history`, {
    limit,
    timestamp: new Date().toISOString()
  });

  try {
    // Try to get token from Authorization header first, then cookie
    let token: string | undefined | null = undefined;
    const authHeader = request.headers.get('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log(`[${requestId}] Token found in Authorization header`);
    } else {
      const cookieStore = await cookies();
      token = cookieStore.get('firebase-auth-token')?.value;
      if (token) {
        console.log(`[${requestId}] Token found in firebase-auth-token cookie`);
      }
    }
    if (!token) {
      console.warn(`[${requestId}] Authentication failed: No token found in header or cookie`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let userId: string | null = null;

    // Check if this is a custom API key (starts with 'heycontent_')
    if (token.startsWith('heycontent_')) {
      console.log(`[${requestId}] Detected custom API key format`);
      const validation = validateApiKey(token);
      if (validation.isValid && validation.userId) {
        userId = validation.userId;
        console.log(`[${requestId}] Successfully validated API key for userId: ${userId}`);
      } else {
        console.warn(`[${requestId}] Invalid API key format`);
        return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
      }
    } else {
      // Fall back to Firebase token validation
      console.log(`[${requestId}] Attempting Firebase token validation`);
      userId = await getUserIdFromToken(token);
      if (!userId) {
        console.warn(`[${requestId}] Invalid Firebase token: Could not get user ID. Token: ${token.substring(0, 10)}...`);
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
      console.log(`[${requestId}] Firebase token validated for userId: ${userId}`);
    }

    // Fetch conversations from Convex
    console.log(`[${requestId}] About to fetch conversations from Convex for userId: ${userId}`);
    const conversations = await fetchQuery(api.chatQueries.getHistory, {
      userId,
      limit
    });

    console.log(`[${requestId}] Successfully fetched ${conversations.length} conversations`);

    // Map Convex data to the format expected by the frontend
    const formattedConversations = conversations.map(conv => {
      // Clean the first message for preview
      const firstMessage = conv.messages?.[0];
      const cleanedPreview = firstMessage 
        ? cleanMessageContent(firstMessage.content, firstMessage.role)
        : 'No preview available';

      console.log(`[${requestId}] Processing conversation:`, {
        id: conv._id,
        title: conv.title,
        _creationTime: conv._creationTime,
        createdAt: conv.createdAt
      });

      return {
        id: conv._id,
        topic: conv.title || 'Untitled Chat',
        preview: cleanedPreview,
        starred: conv.starred || false,
        createdAt: conv._creationTime || conv.createdAt,
        messages: conv.messages?.map((msg, index) => ({
          id: index,
          content: cleanMessageContent(msg.content, msg.role),
          role: msg.role,
          timestamp: msg.timestamp ? new Date(msg.timestamp).toISOString() : new Date().toISOString()
        })) || []
      };
    });

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
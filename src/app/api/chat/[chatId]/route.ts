import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchMutation } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { getUserIdFromToken } from '@/app/lib/getUserIdFromToken';
import { validateApiKey } from '@/app/lib/validateApiKey';

export async function DELETE(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  const requestId = Math.random().toString(36).substring(7);
  const { chatId } = await params; // Await params for Next.js 15 compatibility
  
  console.log(`[${requestId}] Deleting chat`, {
    chatId,
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

    // Delete the conversation using fetchMutation
    console.log(`[${requestId}] Deleting conversation from Convex for userId: ${userId}, chatId: ${chatId}`);
    await fetchMutation(api.chatMutations.deleteConversation, {
      conversationId: chatId,
      userId
    });

    console.log(`[${requestId}] Successfully deleted chat ${chatId}`);

    return NextResponse.json({
      success: true,
      metadata: {
        request_id: requestId,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error(`[${requestId}] Failed to delete chat`, {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'An unexpected error occurred'
    }, { status: 500 });
  }
}

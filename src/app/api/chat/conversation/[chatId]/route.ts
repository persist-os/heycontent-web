import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { getUserIdFromToken } from '@/app/lib/getUserIdFromToken';
import { validateApiKey } from '@/app/lib/validateApiKey';

// Function to extract content IDs from message content
function extractContentIds(content: string): string[] {
  const contentIdPattern = /@\[([^\]]+)\]@/g;
  const contentIds: string[] = [];
  let match;
  
  while ((match = contentIdPattern.exec(content)) !== null) {
    contentIds.push(match[1]);
  }
  
  return contentIds;
}

// Function to clean message content by removing backend context and converting content IDs to titles
async function cleanMessageContent(content: string, role: string, userId: string): Promise<string> {
  // Only clean user messages that might have context prepended
  if (role !== 'user') {
    return content;
  }

  let cleanedContent = content;

  // Strategy 1: Extract after an explicit user label (case-insensitive), supporting multiple variants
  const lower = cleanedContent.toLowerCase();
  const labelVariants = [
    'user message:',
    'user question:',
    "user's message:",
    "user's question:",
  ];
  let bestIdx = -1;
  let bestLabel = '';
  for (const lbl of labelVariants) {
    const idx = lower.lastIndexOf(lbl);
    if (idx !== -1 && idx >= bestIdx) {
      bestIdx = idx;
      bestLabel = lbl;
    }
  }
  if (bestIdx !== -1) {
    cleanedContent = cleanedContent.slice(bestIdx + bestLabel.length).trimStart();
  } else {
    // Strategy 2: Remove any leading [Context ...] block up to the first double newline
    cleanedContent = cleanedContent.replace(/^\[Context[^\]]*\][\s\S]*?\n\n/, '');
  }

  // Extract content IDs and convert them to titles
  const contentIds = extractContentIds(cleanedContent);
  if (contentIds.length > 0) {
    try {
      const titles = await fetchQuery(api.notes.getContentTitlesByPrefixedIds, {
        prefixedIds: contentIds,
        userId
      });
      
      // Replace content IDs with titles
      cleanedContent = cleanedContent.replace(/@\[([^\]]+)\]@/g, (match, contentId) => {
        const title = titles[contentId];
        return title ? `@${title}` : match;
      });
    } catch (error) {
      console.error('Error fetching content titles:', error);
      // If there's an error, keep the original content IDs
    }
  }
  
  // Remove any trailing generic instruction blocks injected by backend prompts
  cleanedContent = cleanedContent.replace(/\n+Please help[\s\S]*$/i, '');

  // Remove leading markdown emphasis/bullets like "** " or "* " or "__ "
  cleanedContent = cleanedContent.replace(/^\s*(\*{1,3}|_{1,3})\s+/, '');

  return cleanedContent.trim();
}

export async function GET(
  request: Request,
  { params }: { params: { chatId: string } }
) {
  const requestId = Math.random().toString(36).substring(7);
  const { chatId } = await params; // Await params for Next.js 15 compatibility
  
  console.log(`[${requestId}] Fetching conversation`, {
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

    // Check if this is a custom API key (starts with 'heycontext_')
    if (token.startsWith('heycontext_')) {
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

    // Use the direct getConversation query for better performance
    console.log(`[${requestId}] Fetching conversation from Convex for userId: ${userId}, chatId: ${chatId}`);
    const conversation = await fetchQuery(api.chatQueries.getConversation, { 
      userId,
      conversationId: chatId
    });
    
    if (!conversation) {
      console.warn(`[${requestId}] Conversation not found: ${chatId}`);
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Format the conversation for the frontend
    const cleanedTitle = conversation.title ? await cleanMessageContent(conversation.title, 'user', userId) : 'Untitled Chat';
    
    const formattedConversation = {
      id: conversation._id,
      title: cleanedTitle,
      messages: await Promise.all(conversation.messages.map(async (msg: any, index: any) => {
        const cleanedContent = await cleanMessageContent(msg.content, msg.role, userId);
        return {
          id: index,
          content: cleanedContent,
          chat_response: cleanedContent,
          role: msg.role,
          timestamp: new Date(msg.timestamp).toISOString()
        };
      })),
      createdAt: new Date(conversation.createdAt).toISOString(),
      updatedAt: new Date(conversation.updatedAt).toISOString(),
      starred: conversation.starred || false
    };

    console.log(`[${requestId}] Successfully fetched conversation ${chatId}`, {
      messageCount: formattedConversation.messages.length
    });

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

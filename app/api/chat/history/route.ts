import { NextResponse } from 'next/server'
import { auth } from '@/app/auth'
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error('Missing NEXT_PUBLIC_CONVEX_URL');
}

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export const runtime = 'nodejs'

type Conversation = {
  _id: Id<"conversations">;
  title: string;
  messages: Array<{
    content: string;
    role: string;
    timestamp: number;
  }>;
  createdAt: number;
  updatedAt: number;
  starred: boolean;
};

export async function GET(req: Request) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        conversations: [],
        success: false,
        error: 'Unauthorized'
      })
    }

    const conversations = await convex.query(api.chat.getHistory, { 
      userId: session.user.id,
      limit: 5 
    });

    return NextResponse.json({
      conversations: conversations.map((conv: Conversation) => ({
        id: conv._id,
        topic: conv.title || 'Untitled Chat',
        preview: conv.messages?.[0]?.content || 'No messages',
        date: new Date(conv.createdAt).toLocaleDateString(),
        messages: conv.messages || [],
        starred: conv.starred || false
      })),
      success: true
    })

  } catch (error) {
    console.error('Failed to fetch chat history:', error)
    return NextResponse.json({ 
      conversations: [],
      success: false,
      error: 'Internal Server Error'
    })
  }
} 
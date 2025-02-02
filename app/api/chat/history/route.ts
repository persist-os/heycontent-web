import { NextResponse } from 'next/server'
import { auth } from '@/app/auth'
import prisma from '@/app/lib/prisma'
import type { Conversation, Message } from '@prisma/client'

export const runtime = 'nodejs'

type ConversationWithMessages = Conversation & {
  messages: Message[]
}

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

    const conversations = await prisma.conversation.findMany({
      where: {
        userId: session.user.id
      },
      include: {
        messages: {
          orderBy: {
            timestamp: 'asc'
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      take: 5
    })

    return NextResponse.json({
      conversations: conversations.map((conv: ConversationWithMessages) => ({
        id: conv.id,
        topic: conv.title || 'Untitled Chat',
        preview: conv.messages[0]?.content || 'No messages',
        date: new Date(conv.createdAt).toLocaleDateString(),
        messages: conv.messages,
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
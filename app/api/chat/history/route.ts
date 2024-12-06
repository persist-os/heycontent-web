import { NextResponse } from 'next/server'
import { auth } from '@/app/auth'
import { prisma } from '@/lib/db'

export const runtime = 'nodejs'

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
      conversations: conversations.map(conv => ({
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
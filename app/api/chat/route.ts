import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { SocialMediaService } from '@/app/lib/services/social-media'
import { Message } from '@/app/types/conversation'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message } = await req.json()
    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    const socialService = new SocialMediaService()
    
    // Process the message and generate response
    const response = await socialService.processMessage(message)
    
    return NextResponse.json({ response })
  } catch (error) {
    console.error('Error in chat route:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 

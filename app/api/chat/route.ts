import { NextResponse } from 'next/server'
import { auth } from '../../../app/auth'
import { actionableInsights } from '@/data/insights'
import { AIActionableInsight } from '@/types/index'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ 
        error: 'Unauthorized',
        success: false 
      }, { status: 401 })
    }

    const body = await req.json()
    const { message, insightId } = body

    if (insightId) {
      const insight = actionableInsights.find((i: AIActionableInsight) => i.id === Number(insightId))
      if (insight) {
        return NextResponse.json({
          id: Date.now(),
          content: `I see you're interested in "${insight.opportunity.title}". Let me help you with that.
          
          This opportunity has ${insight.opportunity.confidence}% confidence because:
          ${insight.context.why.join('\n- ')}
          
          Would you like to:
          1. Discuss the action steps
          2. Learn more about the potential impact
          3. See similar opportunities`,
          role: 'assistant',
          timestamp: new Date().toISOString(),
          success: true
        })
      }
    }

    return NextResponse.json({
      id: Date.now(),
      content: "I understand. How can I help you with that?",
      role: 'assistant',
      timestamp: new Date().toISOString(),
      success: true
    })

  } catch (error) {
    console.error('[CHAT_ERROR]', error)
    return NextResponse.json({ 
      error: 'Internal Server Error',
      success: false 
    }, { status: 500 })
  }
} 
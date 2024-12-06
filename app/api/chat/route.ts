import { NextResponse } from 'next/server'
import { auth } from '../../../app/auth'
import { actionableInsights } from '@/data/insights'
import { AIActionableInsight } from '@/types'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    const { message, insightId } = body

    // Only send one response
    if (insightId) {
      const insight = actionableInsights.find((i: AIActionableInsight) => i.id === Number(insightId))
      if (insight) {
        // Send a single, more detailed response
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
          timestamp: new Date().toISOString()
        })
      }
    }

    // Default response
    return NextResponse.json({
      id: Date.now(),
      content: "I understand. How can I help you with that?",
      role: 'assistant',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('[CHAT_ERROR]', error)
    return new NextResponse('Internal Error', { status: 500 })
  }
} 
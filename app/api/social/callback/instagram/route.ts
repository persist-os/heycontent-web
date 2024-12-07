import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/db'

// Handle GET requests (webhook verification)
export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams
    const mode = searchParams.get('hub.mode')
    const token = searchParams.get('hub.verify_token')
    const challenge = searchParams.get('hub.challenge')

    console.log('Verification attempt:', { mode, token, challenge })

    // Verify webhook
    if (mode === 'subscribe' && token === process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN) {
      console.log('Instagram Webhook verified!')
      return new Response(challenge)
    }

    console.log('Verification failed:', { mode, token })
    return new Response('Forbidden', { status: 403 })
  } catch (error) {
    console.error('Verification error:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

// Handle POST requests (webhook events)
export async function POST(request: Request) {
  try {
    const headersList = await headers()
    const signature = headersList.get('x-hub-signature')
    
    if (!signature) {
      return new Response('Signature required', { status: 400 })
    }

    const body = await request.json()
    console.log('Received Instagram webhook:', body)

    // Handle different types of updates
    if (body.object === 'instagram') {
      for (const entry of body.entry) {
        if (entry.changes) {
          for (const change of entry.changes) {
            await handleWebhookEvent(change.field, change.value)
          }
        }
      }
    }

    return new Response('OK')
  } catch (error) {
    console.error('Error processing Instagram webhook:', error)
    return new Response('Internal Server Error', { status: 500 })
  }
}

// Generic handler for all webhook events
async function handleWebhookEvent(field: string, value: any) {
  try {
    const eventTypes = {
      comments: 'comment',
      live_comments: 'live_comment',
      message_reactions: 'reaction',
      messages: 'message',
      messaging_optins: 'optin',
      messaging_postbacks: 'postback',
      messaging_referral: 'referral',
      messaging_seen: 'seen'
    } as const

    type EventType = typeof eventTypes[keyof typeof eventTypes]

    const eventType = eventTypes[field as keyof typeof eventTypes] || field

    await prisma.socialUpdate.create({
      data: {
        platform: 'instagram',
        type: eventType,
        data: value,
        userId: value.userId || 'system'
      }
    })

    console.log(`Processed ${eventType} event:`, value)
  } catch (error) {
    console.error(`Error handling ${field} event:`, error)
  }
} 
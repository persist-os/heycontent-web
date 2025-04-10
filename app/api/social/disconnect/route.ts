import { NextResponse } from 'next/server'
import { auth } from '@/app/auth'
import { SocialPlatform } from '@/app/types/social-platforms'
import { api } from '@/convex/_generated/api'
import { fetchMutation } from 'convex/nextjs'

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { platform } = body as { platform: SocialPlatform }

    if (!platform) {
      return NextResponse.json({ error: 'Platform is required' }, { status: 400 })
    }

    // Update the social account to be disconnected using Convex
    await fetchMutation(api.social.disconnect, {
      userId: session.user.id,
      platform
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[SOCIAL_DISCONNECT_ERROR]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 
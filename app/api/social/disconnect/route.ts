import { NextResponse } from 'next/server'
import { getServerSession } from '@/app/lib/server-auth'
import { SocialPlatform } from '@/app/types/social-platforms'
import { api } from '@/convex/_generated/api'
import { fetchMutation } from 'convex/nextjs'

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { platform } = await req.json() as { platform: SocialPlatform }
    
    if (!platform) {
      return NextResponse.json({ error: 'Platform is required' }, { status: 400 })
    }

    // Call the appropriate disconnect mutation based on platform
    switch (platform) {
      case 'youtube':
        await fetchMutation(api.youtubeMutations.disconnectYouTube, {
          userId: session.user.id
        })
        break
      // Add other platforms as needed
      default:
        return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error disconnecting platform:', error)
    return NextResponse.json(
      { error: 'Failed to disconnect platform' },
      { status: 500 }
    )
  }
} 
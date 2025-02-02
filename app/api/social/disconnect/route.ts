import { NextResponse } from 'next/server'
import { auth } from '@/app/auth'
import prisma from '@/app/lib/prisma'
import { SocialPlatform } from '@/app/types/social-platforms'

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

    // Update the social account to be disconnected
    await prisma.socialAccount.update({
      where: {
        userId_platform: {
          userId: session.user.id,
          platform
        }
      },
      data: {
        isConnected: false,
        accessToken: '',  // Clear tokens for security
        refreshToken: '',
        expiresAt: { set: null }
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('[SOCIAL_DISCONNECT_ERROR]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 
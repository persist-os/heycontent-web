import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get connected platforms from database
    const connectedAccounts = await prisma.socialAccount.findMany({
      where: {
        userId: session.user.id,
        isConnected: true
      },
      select: {
        platform: true
      }
    })

    return NextResponse.json({
      platforms: connectedAccounts.map(account => account.platform)
    })

  } catch (error) {
    console.error('[CONNECTED_PLATFORMS_ERROR]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 
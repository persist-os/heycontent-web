import { NextResponse } from 'next/server'
import { auth } from '@/app/auth'
import prisma from '@/app/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get connected platforms from database with more details
    const connectedAccounts = await prisma.socialAccount.findMany({
      where: {
        userId: session.user.id,
        isConnected: true
      },
      select: {
        platform: true,
        username: true,
        metadata: true,
        updatedAt: true,
        accessToken: true,
        expiresAt: true
      }
    })

    return NextResponse.json({
      accounts: connectedAccounts.map(account => ({
        platform: account.platform,
        username: account.username,
        metadata: account.metadata,
        lastUpdated: account.updatedAt,
        isActive: account.accessToken && (!account.expiresAt || new Date(account.expiresAt) > new Date())
      }))
    })

  } catch (error) {
    console.error('[CONNECTED_PLATFORMS_ERROR]', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
} 
import { NextResponse } from 'next/server'
import { auth } from '@/app/lib/auth'
import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"

interface SocialAccountResponse {
  platform: string;
  username: string | null;
  metadata: any;
  updatedAt: number;
  isActive: boolean;
}

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
  throw new Error('Missing NEXT_PUBLIC_CONVEX_URL');
}

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      console.error('[CONNECTED_PLATFORMS_ERROR] No authenticated user found')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get connected platforms from Convex
    const connectedAccounts = await convex.query(api.social.getConnectedAccounts, { 
      userId: session.user.id 
    }).catch(error => {
      console.error('[CONNECTED_PLATFORMS_ERROR] Convex query failed:', error)
      throw error
    });

    if (!connectedAccounts) {
      return NextResponse.json({ accounts: [] })
    }

    const responseAccounts: SocialAccountResponse[] = connectedAccounts.map(account => ({
      platform: account.platform,
      username: account.username || null,
      metadata: account.metadata || {},
      updatedAt: account.updatedAt || Date.now(),
      isActive: Boolean(account.isActive ?? (account.accessToken && (!account.expiresAt || new Date(account.expiresAt) > new Date())))
    }));

    return NextResponse.json({ accounts: responseAccounts })

  } catch (error) {
    console.error('[CONNECTED_PLATFORMS_ERROR]', error)
    return NextResponse.json({ 
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 
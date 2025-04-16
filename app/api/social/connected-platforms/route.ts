import { NextResponse } from 'next/server'
import { getServerSession } from '@/app/lib/server-auth'
import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"
import { adminAuth } from '@/app/lib/firebase-admin'

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

export async function GET(request: Request) {
  try {
    console.log('Connected platforms: Getting server session');

    // Log all headers for debugging
    const headers: Record<string, string> = {};
    request.headers.forEach((value, key) => {
      headers[key] = key.toLowerCase() === 'authorization' ? 'Bearer [REDACTED]' : value;
    });
    console.log('Request headers:', headers);

    let sessionData = await getServerSession();
    console.log('Session result:', sessionData ? 'Session found' : 'No session found');

    if (!sessionData?.user?.id) {
      console.error('[CONNECTED_PLATFORMS_ERROR] No authenticated user found');

      // Get the token from the Authorization header as a fallback
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
          console.log('Trying to verify token from Authorization header');
          const token = authHeader.substring(7);
          const decodedToken = await adminAuth.verifyIdToken(token);

          if (decodedToken && decodedToken.uid) {
            console.log('Token verified successfully, using user ID:', decodedToken.uid);

            // Create a session object with the user information from the verified token
            sessionData = {
              user: {
                id: decodedToken.uid,
                email: decodedToken.email || null,
                name: decodedToken.name || null,
                image: decodedToken.picture || null
              }
            };
          } else {
            console.error('Token verification failed');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
          }
        } catch (tokenError) {
          console.error('Error verifying token:', tokenError);
          return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
      } else {
        console.error('No Authorization header found');
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    console.log('Connected platforms: User authenticated, ID:', sessionData.user.id);

    // Get connected platforms from Convex
    console.log('Fetching connected accounts for user:', sessionData.user.id);

    const connectedAccounts = await convex.query(api.social.getConnectedAccounts, {
      userId: sessionData.user.id
    }).catch(error => {
      console.error('[CONNECTED_PLATFORMS_ERROR] Convex query failed:', error)
      throw error
    });

    console.log('Raw connected accounts from Convex:', connectedAccounts);

    if (!connectedAccounts || connectedAccounts.length === 0) {
      console.log('No connected accounts found');
      return NextResponse.json({ accounts: [] })
    }

    const responseAccounts: SocialAccountResponse[] = connectedAccounts.map(account => {
      const formattedAccount = {
        platform: account.platform,
        username: account.username || null,
        metadata: account.metadata || {},
        updatedAt: account.updatedAt || Date.now(),
        isActive: Boolean(account.isConnected ?? true)
      };

      console.log(`Formatted account for ${account.platform}:`, formattedAccount);
      return formattedAccount;
    });

    return NextResponse.json({ accounts: responseAccounts })

  } catch (error) {
    console.error('[CONNECTED_PLATFORMS_ERROR]', error)
    return NextResponse.json({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
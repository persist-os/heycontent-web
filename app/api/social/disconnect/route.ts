import { NextResponse } from 'next/server'
import { getServerSession, getFirebaseToken } from '@/app/lib/server-auth'
import { SocialPlatform } from '@/app/types/social-platforms'
import { api } from '@/convex/_generated/api'
import { fetchMutation } from 'convex/nextjs'
import { adminAuth } from '@/app/lib/firebase-admin'

export async function POST(req: Request) {
  try {
    // Try session-based authentication first
    let session = await getServerSession();
    let userId: string | null = session?.user?.id || null;

    // If no session, try to extract and verify the token directly
    if (!userId) {
      const token = await getFirebaseToken();
      console.log(
        '[DISCONNECT] Fallback: token from header/cookie:',
        typeof token,
        token && typeof token === 'string' ? token.substring(0, 20) + '...' : null
      );
      if (typeof token === 'string') {
        try {
          const decoded = await adminAuth.verifyIdToken(token);
          userId = decoded.uid;
          console.log('[DISCONNECT] Token verified for user:', userId);
        } catch (err) {
          console.error('[DISCONNECT] Token verification failed:', err);
        }
      } else {
        console.error('[DISCONNECT] Token is not a string or is null:', typeof token, token);
      }
    }

    if (!userId) {
      console.error('[DISCONNECT] Unauthorized: no valid session or token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { platform } = await req.json() as { platform: SocialPlatform };
    if (!platform) {
      return NextResponse.json({ error: 'Platform is required' }, { status: 400 });
    }

    // Call the appropriate disconnect mutation based on platform
    switch (platform) {
      case 'youtube':
        await fetchMutation(api.youtubeMutations.disconnectYouTube, {
          userId
        });
        break;
      // Add other platforms as needed
      default:
        return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error disconnecting platform:', error);
    return NextResponse.json(
      { error: 'Failed to disconnect platform' },
      { status: 500 }
    );
  }
}
 
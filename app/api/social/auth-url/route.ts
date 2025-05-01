import { NextResponse } from 'next/server';
import { getServerSession } from '@/app/lib/server-auth';
import { SocialPlatform } from '@/app/types/social-platforms';
import { adminAuth } from '@/app/lib/firebase-admin';
import { auth } from '@/app/lib/auth';
import { PLATFORM_CONFIGS, Platform, PLATFORM_AUTH_URL_BUILDERS } from './config';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  console.group('Auth URL Generation');

  const { searchParams } = new URL(request.url);
  const platform = searchParams.get('platform') as Platform;
  const useFacebook = searchParams.get('useFacebook') === 'true';

  console.log('Request details:', {
    platform,
    useFacebook,
    url: request.url
  });

  // Log all headers for debugging
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = key.toLowerCase() === 'authorization' ? 'Bearer [REDACTED]' : value;
  });
  console.log('Request headers:', headers);

  try {
    console.log('Auth URL: Getting server session');
    let sessionData = await getServerSession();
    console.log('Session result:', sessionData ? 'Session found' : 'No session found');

    if (!sessionData?.user?.id) {
      console.error('No authenticated user found');

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

    console.log('Auth URL: User authenticated, ID:', sessionData.user.id);

    const config = PLATFORM_CONFIGS[platform];
    if (!config) {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    if (!config.clientId || !config.redirectUri) {
      throw new Error(`Missing configuration for ${platform}`);
    }

    const state = Buffer.from(JSON.stringify({
      userId: sessionData.user.id,
      platform,
      useFacebook
    })).toString('base64');

    // Use platform-agnostic URL builder from config
    const builder = PLATFORM_AUTH_URL_BUILDERS[platform];
    if (!builder) {
      throw new Error(`Invalid platform: ${platform}`);
    }
    const authUrl = builder(config, state, useFacebook);
    console.log(`Generated ${platform} auth URL:`, authUrl);
    return NextResponse.json({ authUrl });

  } catch (error) {
    console.error('Auth URL error:', {
      error,
      platform,
      message: error instanceof Error ? error.message : 'Unknown error'
    });
    return NextResponse.json({ error: 'Failed to generate auth URL' }, { status: 500 });
  } finally {
    console.groupEnd();
  }
}
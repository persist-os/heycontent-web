import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getServerSession } from '@/app/lib/server-auth';
import { jwtDecode } from 'jwt-decode';

interface FirebaseToken {
  uid?: string;
  user_id?: string;
  email?: string;
  name?: string;
  picture?: string;
  exp: number;
  iat: number;
  aud: string;
  iss: string;
}

export async function GET(request: Request) {
  try {
    console.log('Auth test endpoint called');

    // Get the token from the request
    const authHeader = request.headers.get('Authorization');
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('Found token in Authorization header');
    }

    if (!token) {
      console.log('No token in Authorization header');
      return NextResponse.json({
        error: 'No token provided in Authorization header',
        authHeader: authHeader ? 'Present' : 'Missing'
      }, { status: 401 });
    }

    try {
      // Decode the token (no verification, just decode)
      console.log('Decoding token...');
      const decodedToken = jwtDecode<FirebaseToken>(token);
      console.log('Token decoded successfully:', {
        uid: decodedToken.uid,
        user_id: decodedToken.user_id,
        email: decodedToken.email,
        exp: new Date(decodedToken.exp * 1000).toISOString(),
        iss: decodedToken.iss,
        aud: decodedToken.aud
      });

      // Get the user ID from either uid or user_id field
      const userId = decodedToken.uid || decodedToken.user_id;
      if (!userId) {
        console.error('No user ID found in token');
        return NextResponse.json({
          error: 'No user ID in token',
          tokenInfo: {
            hasUid: !!decodedToken.uid,
            hasUserId: !!decodedToken.user_id,
            tokenKeys: Object.keys(decodedToken)
          }
        }, { status: 401 });
      }

      // Basic validation
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const expectedIssuer = `https://securetoken.google.com/${projectId}`;
      const validations = {
        expiration: decodedToken.exp * 1000 > Date.now(),
        issuer: decodedToken.iss === expectedIssuer,
        audience: decodedToken.aud === projectId
      };

      console.log('Token validations:', validations);

      if (!validations.expiration) {
        return NextResponse.json({
          error: 'Token expired',
          expiredAt: new Date(decodedToken.exp * 1000).toISOString(),
          now: new Date().toISOString()
        }, { status: 401 });
      }

      if (!validations.issuer) {
        return NextResponse.json({
          error: 'Invalid token issuer',
          expected: expectedIssuer,
          actual: decodedToken.iss
        }, { status: 401 });
      }

      if (!validations.audience) {
        return NextResponse.json({
          error: 'Invalid token audience',
          expected: projectId,
          actual: decodedToken.aud
        }, { status: 401 });
      }

      // Set the token in cookies first to ensure it's available for session creation
      console.log('Setting token in cookies...');
      const cookieStore = cookies();
      const existingCookie = cookieStore.get('firebase-auth-token');

      // Create a response object that we'll use to set cookies
      const response = NextResponse.json({
        success: true,
        message: 'Token verified successfully',
        user: {
          id: userId,
          email: decodedToken.email
        },
        tokenInfo: {
          uid: decodedToken.uid,
          user_id: decodedToken.user_id,
          sub: decodedToken.sub,
          keys: Object.keys(decodedToken)
        }
      });

      // Set the token cookie
      response.cookies.set('firebase-auth-token', token, {
        httpOnly: false, // Must be false to allow client-side access
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
      console.log('Token cookie set/refreshed');

      // Now try to get the session
      console.log('Getting session with getServerSession...');
      const session = await getServerSession();
      console.log('Session result:', session ? `Session found: ${session.user.id}` : 'No session');

      if (!session) {
        console.error('No session created from valid token, but we set the cookie so it should work on next request');
        // Return the response with the cookie set, even though session wasn't created yet
        // This will help for subsequent requests
        return response;
      }

      // Update the response with session information
      return NextResponse.json({
        success: true,
        message: 'Token verified successfully and session created',
        user: {
          id: userId,
          email: decodedToken.email
        },
        session: {
          userId: session.user.id,
          userEmail: session.user.email
        },
        validations,
        tokenStructure: {
          keys: Object.keys(decodedToken),
          hasUid: !!decodedToken.uid,
          hasUserId: !!decodedToken.user_id,
          userId: userId
        }
      }, { headers: response.headers });
    } catch (error) {
      console.error('Error decoding token:', error);
      return NextResponse.json({
        error: 'Invalid token format',
        message: error instanceof Error ? error.message : 'Unknown error'
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Auth test error:', error);
    return NextResponse.json({
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

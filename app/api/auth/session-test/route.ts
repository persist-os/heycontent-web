import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/app/lib/firebase-admin';
import { getServerSession } from '@/app/lib/server-auth';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: Request) {
  try {
    console.log('Session test endpoint called');

    // Get the token from the request
    const { token } = await request.json();
    const authHeader = request.headers.get('Authorization');

    if (!token && (!authHeader || !authHeader.startsWith('Bearer '))) {
      console.log('No token provided');
      return NextResponse.json({
        error: 'No token provided',
        authHeader: authHeader ? 'Present' : 'Missing'
      }, { status: 400 });
    }

    // Use the token from the Authorization header if available
    const bearerToken = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : token;

    // Verify the token with Firebase Admin
    console.log('Verifying token with Firebase Admin...');
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(bearerToken);
      console.log('Token verified successfully for user:', decodedToken.uid);
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError);
      return NextResponse.json({
        error: 'Invalid token',
        details: verifyError instanceof Error ? verifyError.message : 'Unknown error'
      }, { status: 401 });
    }

    // Check if user exists in Convex
    console.log('Checking if user exists in Convex...');
    let convexUser;
    try {
      convexUser = await convex.query(api.users.getUserById, { userId: decodedToken.uid });

      if (!convexUser) {
        console.log('User not found in Convex, creating user...');
        try {
          // Create user in Convex if not exists
          await convex.action(api.auth.createUser, {
            userId: decodedToken.uid,
            name: decodedToken.name || 'Unknown User',
            email: decodedToken.email || '',
            image: decodedToken.picture || ''
          });
          console.log('User created in Convex');

          // Fetch the user again to confirm creation
          convexUser = await convex.query(api.queries.getUserById, { userId: decodedToken.uid });
        } catch (createError) {
          console.error('Failed to create user in Convex:', createError);
        }
      } else {
        console.log('User found in Convex, updating user information...');
        try {
          // Update user in Convex to ensure data is in sync
          await convex.action(api.auth.updateUser, {
            userId: decodedToken.uid,
            name: decodedToken.name || convexUser.name || 'Unknown User',
            email: decodedToken.email || convexUser.email || '',
            image: decodedToken.picture || convexUser.image || ''
          });
          console.log('User updated in Convex');

          // Fetch the user again to confirm update
          convexUser = await convex.query(api.queries.getUserById, { userId: decodedToken.uid });
        } catch (updateError) {
          console.error('Failed to update user in Convex:', updateError);
        }
      }
    } catch (convexError) {
      console.error('Error querying Convex:', convexError);
    }

    // Get the session using getServerSession
    console.log('Getting session with getServerSession...');
    const session = await getServerSession();
    console.log('Session result:', session ? `Session found: ${session.user.id}` : 'No session');

    // Set the token in a cookie for the middleware
    console.log('Setting token in cookie...');
    const cookieStore = cookies();
    const existingCookie = cookieStore.get('firebase-auth-token');

    const response = NextResponse.json({
      success: true,
      message: 'Session diagnosis complete',
      tokenVerified: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture
      },
      session: session ? {
        userId: session.user.id,
        userEmail: session.user.email
      } : null,
      cookieExists: !!existingCookie,
      convexUserExists: !!convexUser,
      convexUser: convexUser || null
    });

    // Set the Firebase auth token cookie if it doesn't exist or refresh it
    response.cookies.set('firebase-auth-token', bearerToken, {
      httpOnly: false, // Must be false to allow client-side access
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7 // 1 week
    });
    console.log('Token cookie set/refreshed');

    return response;
  } catch (error) {
    console.error('Session debug error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

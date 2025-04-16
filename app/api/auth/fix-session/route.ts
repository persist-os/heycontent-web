import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { adminAuth } from '@/app/lib/firebase-admin';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export async function POST(request: Request) {
  try {
    console.log('Fix session endpoint called');

    // Log all headers for debugging
    const headers = {};
    request.headers.forEach((value, key) => {
      headers[key] = key.toLowerCase() === 'authorization' ? 'Bearer [REDACTED]' : value;
    });
    console.log('Request headers:', headers);

    // Get the token from the request
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.error('Failed to parse request body:', e);
      body = {};
    }

    const { token } = body;
    const authHeader = request.headers.get('Authorization');

    if (!token && (!authHeader || !authHeader.startsWith('Bearer '))) {
      console.log('No token provided');
      return NextResponse.json({
        error: 'No token provided',
        authHeader: authHeader ? 'Present' : 'Missing'
      }, { status: 400 });
    }

    // Use the token from the Authorization header if available
    let bearerToken = authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.substring(7)
      : token;

    // Ensure bearerToken is a string
    if (bearerToken && typeof bearerToken === 'object') {
      console.log('Token is an object, attempting to extract token string');
      // If it has a token property, use that
      if (bearerToken.token && typeof bearerToken.token === 'string') {
        console.log('Using token.token property');
        bearerToken = bearerToken.token;
      } else {
        // Try to stringify the object
        try {
          bearerToken = JSON.stringify(bearerToken);
          console.log('Converted token object to string');
        } catch (e) {
          console.error('Failed to stringify token object:', e);
          return NextResponse.json({
            error: 'Invalid token format',
            details: 'Token is not a string and could not be converted to a string'
          }, { status: 400 });
        }
      }
    }

    // Verify the token with Firebase Admin
    console.log('Verifying token with Firebase Admin...');
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(bearerToken, true); // Force token refresh check
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
          convexUser = await convex.query(api.users.getUserById, { userId: decodedToken.uid });
        } catch (createError) {
          console.error('Failed to create user in Convex:', createError);
        }
      } else {
        console.log('User found in Convex');

        // Check if user data needs to be updated
        const needsUpdate = (
          (decodedToken.name && decodedToken.name !== convexUser.name) ||
          (decodedToken.email && decodedToken.email !== convexUser.email) ||
          (decodedToken.picture && decodedToken.picture !== convexUser.image)
        );

        if (needsUpdate) {
          console.log('User information needs updating...');
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
            convexUser = await convex.query(api.users.getUserById, { userId: decodedToken.uid });
          } catch (updateError) {
            console.error('Failed to update user in Convex:', updateError);
          }
        } else {
          console.log('User information is up to date, no update needed');
        }
      }
    } catch (convexError) {
      console.error('Error querying Convex:', convexError);
    }

    // Set the token in a cookie for the middleware
    console.log('Setting token in cookie...');
    const cookieStore = cookies();
    const existingCookie = cookieStore.get('firebase-auth-token');

    const response = NextResponse.json({
      success: true,
      message: 'Session fix attempted',
      tokenVerified: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        picture: decodedToken.picture
      },
      cookieExists: !!existingCookie,
      convexUserExists: !!convexUser,
      convexUser: convexUser || null
    });

    // Set the Firebase auth token cookie only if it doesn't exist or has changed
    if (!existingCookie || existingCookie.value !== bearerToken) {
      response.cookies.set('firebase-auth-token', bearerToken, {
        httpOnly: false, // Must be false to allow client-side access
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
      console.log('Token cookie set/refreshed');
    } else {
      console.log('Token cookie already exists and is up to date');
    }

    return response;
  } catch (error) {
    console.error('Session fix error:', error);
    return NextResponse.json({
      success: false,
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

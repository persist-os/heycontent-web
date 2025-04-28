import { NextResponse } from 'next/server';
import { adminAuth } from '@/app/lib/firebase-admin';
import { getServerSession } from '@/app/lib/server-auth';

export async function POST(request: Request) {
  try {
    console.log('Admin test endpoint called');

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

    try {
      console.log('Verifying token with Firebase Admin...');
      const decodedToken = await adminAuth.verifyIdToken(bearerToken);
      console.log('Token verified successfully for user:', decodedToken.uid);

      // Get the session using getServerSession
      console.log('Getting session with getServerSession...');
      const session = await getServerSession();
      console.log('Session result:', session ? `Session found: ${session.user.id}` : 'No session');

      return NextResponse.json({
        success: true,
        message: 'Token verified successfully',
        user: {
          uid: decodedToken.uid,
          email: decodedToken.email,
          name: decodedToken.name,
          picture: decodedToken.picture
        },
        session: session ? {
          userId: session.user.id,
          userEmail: session.user.email
        } : null
      });
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError);
      return NextResponse.json({
        error: 'Invalid token',
        details: verifyError instanceof Error ? verifyError.message : 'Unknown error'
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Admin test error:', error);
    return NextResponse.json({
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

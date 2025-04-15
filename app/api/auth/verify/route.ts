import { NextResponse } from 'next/server';
import { adminAuth } from '../../../lib/firebase-admin';

export async function POST(request: Request) {
  try {
    const { token } = await request.json();
    console.log('Verifying token...');

    if (!token) {
      console.log('No token provided');
      return NextResponse.json({ error: 'No token provided' }, { status: 400 });
    }

    try {
      console.log('Token received, verifying with Firebase Admin...');
      const decodedToken = await adminAuth.verifyIdToken(token);
      console.log('Token verified successfully for user:', decodedToken.uid);

      return NextResponse.json({ 
        uid: decodedToken.uid,
        success: true 
      });
    } catch (verifyError) {
      console.error('Token verification failed:', verifyError);
      return NextResponse.json({ 
        error: 'Invalid token',
        details: verifyError instanceof Error ? verifyError.message : 'Unknown error'
      }, { status: 401 });
    }
  } catch (error) {
    console.error('Token verification error:', error);
    return NextResponse.json({ 
      error: 'Server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 
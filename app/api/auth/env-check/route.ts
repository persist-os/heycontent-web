import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check Firebase environment variables
    const firebaseConfig = {
      hasApiKey: !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      hasAuthDomain: !!process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      hasStorageBucket: !!process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      hasMessagingSenderId: !!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      hasAppId: !!process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    };

    // Check Firebase Admin environment variables
    const firebaseAdminConfig = {
      hasProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      clientEmailFormat: process.env.FIREBASE_CLIENT_EMAIL?.includes('@') && 
                        process.env.FIREBASE_CLIENT_EMAIL?.includes('.iam.gserviceaccount.com'),
      privateKeyFormat: process.env.FIREBASE_PRIVATE_KEY?.includes('BEGIN PRIVATE KEY') &&
                        process.env.FIREBASE_PRIVATE_KEY?.includes('END PRIVATE KEY')
    };

    return NextResponse.json({
      firebase: firebaseConfig,
      firebaseAdmin: firebaseAdminConfig,
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    console.error('Environment check error:', error);
    return NextResponse.json({
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

import { NextResponse } from 'next/server'
import { adminAuth } from '@/app/lib/firebase-admin'
import { proxyApiKeyRequest } from '../utils/apiKeyProxy';
import { logger, updateOrCreateConvexUser, mapAuthErrorCodeToMessage, redactToken } from '../firebase/helpers';
import { fetchQuery } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';

export async function POST(request: Request) {
  const requestId = `auth-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  
  try {
    const body = await request.json()
    logger.info('Processing authentication request', { 
      requestId, 
      action: body.action, 
      email: body.email,
      hasPassword: !!body.password,
      hasIdToken: !!body.idToken,
      userAgent: request.headers.get('user-agent'),
      clientIp: request.headers.get('x-forwarded-for') || 'unknown'
    });

    const { email, password, action, idToken, name, username, referredBy } = body

      logger.info('Attempting login', { requestId, email })
      const loginStartTime = Date.now();
      try {
        // First verify the user exists and is not disabled
        const userRecord = await adminAuth.getUserByEmail(email)
        // Create a custom token for the user
        const customToken = await adminAuth.createCustomToken(userRecord.uid);
        logger.debug('Firebase custom token generated for user', { 
          requestId, 
          tokenPreview: redactToken(customToken),
          tokenLength: customToken?.length
        });
        logger.info('Login successful', { 
          requestId, 
          email: userRecord.email,
          userId: userRecord.uid,
          processingTime: Date.now() - loginStartTime
        });
        await updateOrCreateConvexUser(
  userRecord.uid,
  userRecord.displayName || name || '',
  userRecord.email || email,
  userRecord.photoURL || '',
  username || '',
  referredBy || ''
);
        return NextResponse.json({
          success: true,
          redirect: '/chat',
          customToken,
          message: 'Use this customToken with Firebase Auth client SDK to sign in, then send your ID token to the backend for API requests.'
        });
      } catch (error: any) {
        const errorCode = error.code || 'unknown';
        logger.warn('Login failed', { 
          requestId, 
          email, 
          errorCode,
          errorMessage: error.message,
          processingTime: Date.now() - loginStartTime
        });
        
        if (errorCode === 'auth/user-not-found') {
          return NextResponse.json(
            { error: 'No account found with this email' },
            { status: 400 }
          )
        }
        if (errorCode === 'auth/wrong-password') {
          return NextResponse.json(
            { error: 'Incorrect password' },
            { status: 400 }
          );
        }
        
        // Send appropriate error response based on error type
        const statusCode = error.code?.includes('auth/') ? 400 : 500;
        const errorMessage = statusCode === 400 ? (error.message || 'Authentication failed') : 'Internal server error';
        
        logger.error('Unexpected login error', error, { requestId, email });
        return NextResponse.json(
          { error: errorMessage },
          { status: statusCode }
        )
      logger.warn('Invalid action provided', { requestId, action })
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (err: any) {
    logger.error('Authentication request failed', err, {
      requestId,
      errorCode: err.code || 'unknown',
      path: request.url,
      method: request.method
    });
    const errorMessage = mapAuthErrorCodeToMessage(err.code);
    return NextResponse.json({ error: errorMessage }, { status: 400 });
  }
}
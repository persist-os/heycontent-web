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

      logger.info('Attempting registration', { requestId, email })
      const registrationStartTime = Date.now();
      // Defensive check for required fields
      if (!name || !username) {
        logger.warn('Missing required registration fields', { requestId, email, name, username });
        return NextResponse.json({ error: 'Name and username are required' }, { status: 400 });
      }
      try {
        const userRecord = await adminAuth.createUser({
          email,
          password,
        })
        // Update Firebase user profile with displayName
        await adminAuth.updateUser(userRecord.uid, { displayName: name });
        // Create a custom token for the user
        const customToken = await adminAuth.createCustomToken(userRecord.uid)
        logger.debug('Firebase custom token generated for new user', { 
          requestId, 
          tokenPreview: redactToken(customToken),
          tokenLength: customToken?.length
        });
        logger.info('Registration successful', { 
          requestId, 
          email: userRecord.email,
          userId: userRecord.uid,
          processingTime: Date.now() - registrationStartTime
        });
        // Always use body values for Convex
        // Log the fields we're receiving for better debugging
        logger.debug('Registration fields received', {
          requestId,
          email, 
          name, 
          username: username || 'not provided',
          referredBy: referredBy || 'not provided'
        });

        // Make sure all fields are properly passed to Convex
        await updateOrCreateConvexUser(
          userRecord.uid,
          name,
          userRecord.email || email,
          '', // image: not provided at registration, can be set later
          username || '', // Ensure we pass empty string if undefined
          referredBy || '' // Ensure we pass empty string if undefined
        );
        return NextResponse.json({
          success: true,
          redirect: '/chat',
          customToken,
          message: 'Use this customToken with Firebase Auth client SDK to sign in, then send your ID token to the backend for API requests.'
        });
      } catch (error: any) {
        const errorCode = error.code || 'unknown';
        logger.warn('Registration failed', { 
          requestId, 
          email, 
          errorCode,
          errorMessage: error.message,
          processingTime: Date.now() - registrationStartTime
        });
        
        if (errorCode === 'auth/email-already-in-use') {
          return NextResponse.json(
            { error: 'An account with this email already exists' },
            { status: 400 }
          )
        }
        
        logger.error('Unexpected registration error', error, { requestId, email });
        throw error
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
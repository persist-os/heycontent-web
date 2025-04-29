import { NextResponse } from 'next/server'
import { adminAuth } from '@/app/lib/firebase-admin'
import { proxyApiKeyRequest } from '../utils/apiKeyProxy';
import { api } from "@/convex/_generated/api"
import { fetchQuery, fetchMutation } from "convex/nextjs";
import { logger, ensureConvexUser, updateConvexUser, mapAuthErrorCodeToMessage, redactToken } from './helpers';

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

    const { email, password, action, idToken } = body

    if (action === 'login') {
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
        await ensureConvexUser({
  query: (fn: any, args: any) => fetchQuery(fn, args),
  action: (fn: any, args: any) => fetchMutation(fn, args)
}, userRecord, requestId);
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
      }
    } else if (action === 'register') {
      logger.info('Attempting registration', { requestId, email })
      const registrationStartTime = Date.now();
      try {
        const userRecord = await adminAuth.createUser({
          email,
          password,
          // No email verification required
        })
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
        await ensureConvexUser({
  query: (fn: any, args: any) => fetchQuery(fn, args),
  action: (fn: any, args: any) => fetchMutation(fn, args)
}, userRecord, requestId);
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
    } else if (action === 'google' || action === 'refresh' || action === 'getApiKey') {
      logger.info('Processing token-based auth', { requestId, action });
      const tokenAuthStartTime = Date.now();
      if (!idToken) {
        logger.warn('No ID token provided', { requestId, action });
        return NextResponse.json({ error: 'No ID token provided' }, { status: 400 });
      }
      logger.info('Processing token for authentication', { requestId, action, tokenLength: idToken.length });
      logger.debug('Received ID token from client', { requestId, tokenPreview: redactToken(idToken), tokenLength: idToken.length });
      // Verify the token with Firebase Admin
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      logger.info('Token successfully verified', {
        requestId,
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        authTime: new Date(decodedToken.auth_time * 1000).toISOString(),
        issuedAt: new Date(decodedToken.iat * 1000).toISOString(),
        verificationTime: Date.now() - tokenAuthStartTime,
        expiresAt: new Date(decodedToken.exp * 1000).toISOString(),
        provider: decodedToken.firebase?.sign_in_provider
      });
      logger.info('Firebase token verified successfully', { requestId, userId: decodedToken.uid, provider: decodedToken.firebase?.sign_in_provider });
      // Ensure user exists or update in Convex
      const convexUser = await fetchQuery(api.users.getUserById, { userId: decodedToken.uid });
      if (!convexUser) {
        await ensureConvexUser({
          query: (fn: any, args: any) => fetchQuery(fn, args),
          action: (fn: any, args: any) => fetchMutation(fn, args)
        }, { uid: decodedToken.uid, displayName: decodedToken.name, email: decodedToken.email, photoURL: decodedToken.picture }, requestId);
      } else {
        await updateConvexUser({
          query: (fn: any, args: any) => fetchQuery(fn, args),
          action: (fn: any, args: any) => fetchMutation(fn, args)
        }, decodedToken, convexUser, requestId);
      }
      // Call the /api/auth/key route to get an API key for this user
      let apiKeyData = null;
      try {
        apiKeyData = await proxyApiKeyRequest({ idToken, userId: decodedToken.uid });
      } catch (apiKeyError: any) {
        let errorMsg = typeof apiKeyError === 'object' && apiKeyError !== null && 'message' in apiKeyError
          ? (apiKeyError as any).message
          : String(apiKeyError);
        apiKeyData = { error: 'Exception fetching API key', details: errorMsg };
      }
      // Always redirect to /chat on success
      const response = NextResponse.json({
        success: true,
        redirect: '/chat',
        apiKey: apiKeyData?.apiKey,
        apiKeyData
      });
      response.cookies.set('firebase-auth-token', idToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
      return response;
    } else {
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
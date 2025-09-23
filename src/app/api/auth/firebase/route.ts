import { NextResponse } from 'next/server'
import { adminAuth } from '@/app/lib/firebase-admin'
import { proxyApiKeyRequest } from '../utils/apiKeyProxy';
import { logger, updateOrCreateConvexUser, mapAuthErrorCodeToMessage, redactToken } from './helpers';
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
      await updateOrCreateConvexUser(
  decodedToken.uid,
  decodedToken.name || name || '',
  decodedToken.email || email,
  decodedToken.picture || '',
  username, // Don't default to empty string - pass undefined if not provided
  referredBy // Don't default to empty string - pass undefined if not provided
);
      // Call the /api/auth/key route to get an API key for this user
      let apiKeyData = null;
      try {
        apiKeyData = await proxyApiKeyRequest({ idToken, userId: decodedToken.uid });
      } catch (apiKeyError: any) {
        const errorMsg = typeof apiKeyError === 'object' && apiKeyError !== null && 'message' in apiKeyError
          ? (apiKeyError as any).message
          : String(apiKeyError);
        apiKeyData = { error: 'Exception fetching API key', details: errorMsg };
      }
      // Always redirect to /chat on success
      // Extract apiKey from apiKeyData (either apiKeyData.apiKey or apiKeyData.data.key)
      const apiKey =
        apiKeyData?.apiKey ||
        (apiKeyData?.data && typeof apiKeyData.data.key === 'string' ? apiKeyData.data.key : undefined);
      const response = NextResponse.json({
        success: true,
        redirect: '/dashboard',
        apiKey,
        apiKeyData
      });
      
      // Set cookie with proper expiry tracking
      const tokenExpiry = Date.now() + (60 * 60 * 1000); // 1 hour from now
      response.cookies.set('firebase-auth-token', idToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 // 1 hour in seconds
      });
      
      // Also set the expiry timestamp cookie
      response.cookies.set('firebase-token-expiry', tokenExpiry.toString(), {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 // 1 hour in seconds
      });
      
      return response;
    
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
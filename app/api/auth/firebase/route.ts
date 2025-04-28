import { NextResponse } from 'next/server'
import { adminAuth } from '@/app/lib/firebase-admin'
import { proxyApiKeyRequest } from '../utils/apiKeyProxy';
import { cookies } from 'next/headers'
import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
const BACKEND_URL = 'https://backend.hicontent.co';
        
const requestId = `auth-key-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;


// Logger utility to standardize logging format
const logger = {
  info: (message: string, context: Record<string, any> = {}) => {
    console.log(`[INFO] [${new Date().toISOString()}] ${message}`, context);
  },
  warn: (message: string, context: Record<string, any> = {}) => {
    console.warn(`[WARN] [${new Date().toISOString()}] ${message}`, context);
  },
  error: (message: string, error: any, context: Record<string, any> = {}) => {
    console.error(`[ERROR] [${new Date().toISOString()}] ${message}`, { error: error?.message || error, stack: error?.stack, ...context });
  },
  debug: (message: string, context: Record<string, any> = {}) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`[DEBUG] [${new Date().toISOString()}] ${message}`, context);
    }
  }
};

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
        logger.debug('Firebase custom token generated for new user', { 
          requestId, 
          tokenPreview: customToken ? `${customToken.substring(0, 10)}...${customToken.substring(customToken.length - 5)}` : 'null',
          tokenLength: customToken?.length
        });
        logger.info('Registration successful', { 
          requestId, 
          email: userRecord.email,
          userId: userRecord.uid,
          processingTime: Date.now() - loginStartTime
        });

        // Ensure user exists in Convex
        try {
          const convexUser = await convex.query(api.users.getUserById, { userId: userRecord.uid });
          if (!convexUser) {
            logger.info('User not found in Convex, creating user...', { requestId, userId: userRecord.uid });
            const convexStartTime = Date.now();
            await convex.action(api.auth.createUser, {
              userId: userRecord.uid,
              name: userRecord.displayName || 'Unknown User',
              email: userRecord.email || '',
              image: userRecord.photoURL || ''
            });
            logger.info('User created in Convex', { 
              requestId, 
              userId: userRecord.uid,
              processingTime: Date.now() - convexStartTime
            });
          }
        } catch (convexError) {
          logger.error('Error with Convex user operation', convexError, { requestId, userId: userRecord.uid });
          // Continue with auth flow even if Convex operation fails
        }

        // Instead of returning or using the custom token directly, instruct the client to use it to sign in and obtain an ID token
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
          emailVerified: true // Set email as verified by default
        })

        // Create a custom token for the user
        const customToken = await adminAuth.createCustomToken(userRecord.uid)
        
        // Log the custom token with partial redaction for security
        logger.debug('Firebase custom token generated for new user', { 
          requestId, 
          tokenPreview: customToken ? `${customToken.substring(0, 10)}...${customToken.substring(customToken.length - 5)}` : 'null',
          tokenLength: customToken?.length
        });
        
        logger.info('Registration successful', { 
          requestId, 
          email: userRecord.email,
          userId: userRecord.uid,
          processingTime: Date.now() - registrationStartTime
        });

        // Ensure user exists in Convex
        try {
          const convexUser = await convex.query(api.users.getUserById, { userId: userRecord.uid })

          if (!convexUser) {
            logger.info('User not found in Convex, creating user...', { requestId, userId: userRecord.uid });
            const convexStartTime = Date.now();
            await convex.action(api.auth.createUser, {
              userId: userRecord.uid,
              name: userRecord.displayName || 'Unknown User',
              email: userRecord.email || '',
              image: userRecord.photoURL || ''
            });
            logger.info('User created in Convex', { 
              requestId, 
              userId: userRecord.uid,
              processingTime: Date.now() - convexStartTime
            });
          }
        } catch (convexError) {
          logger.error('Error with Convex user operation', convexError, { requestId, userId: userRecord.uid });
          // Continue with auth flow even if Convex operation fails
        }

        try {
          // Get the request body
          const body = await request.json();
          const { idToken, action } = body;
          
          if (!idToken) {
            console.warn(`[${requestId}] Missing idToken in request`);
            return NextResponse.json({ error: 'ID Token is required' }, { status: 400 });
          }
          
          console.log(`[${requestId}] Proxying API key request to backend`);
          
          // Forward the request to the actual backend
          console.log(`[${requestId}] Making API key request to ${BACKEND_URL}/api/v1/api-keys/`);
          
          const response = await fetch(`${BACKEND_URL}/api/v1/api-keys/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`
            },
            body: JSON.stringify({
              // The v1 API expects userId and doesn't need the action or idToken in the body
              // The idToken in the Authorization header is enough
              userId: body.userId
            }),
          });
          
          if (!response.ok) {
            const errorText = await response.text();
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch (e) {
              errorData = { message: errorText || 'Unknown error' };
            }
            
            console.error(`[${requestId}] Backend API error:`, {
              status: response.status,
              statusText: response.statusText,
              error: errorData,
              rawResponse: errorText.substring(0, 500) // Log first 500 chars in case it's a large response
            });
            
            // For debugging: pass through the full error details to the client
            return NextResponse.json(
              { 
                error: errorData.message || `Backend responded with status: ${response.status}`,
                details: errorData,
                status: response.status,
                requestId
              },
              { status: response.status }
            );
          }
          
          const data = await response.json();
          console.log(`[${requestId}] API key request successful`);
          
          return NextResponse.json(data);
        } catch (error) {
          console.error(`[${requestId}] Error processing API key request:`, error);
          return NextResponse.json(
            { error: 'Internal Server Error', message: error instanceof Error ? error.message : 'An unexpected error occurred' },
            { status: 500 }
          );
        }

        const response = NextResponse.json({
          success: true,
          redirect: '/chat',
          customToken
        })

        // Set the Firebase auth token cookie
        response.cookies.set('firebase-auth-token', customToken, {
          httpOnly: false,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24 * 7 // 1 week
        })

        return response
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
    } else if (action === 'google' || action === 'refresh') {
      logger.info('Processing token-based auth', { requestId, action });
      const tokenAuthStartTime = Date.now();
      
      if (!idToken) {
        logger.warn('No ID token provided', { requestId, action });
        return NextResponse.json(
          { error: 'No ID token provided' },
          { status: 400 }
        )
      }

      logger.info('Processing token for authentication', { requestId, action, tokenLength: idToken.length });
      
      // Log the received ID token (partial for security)
      logger.debug('Received ID token from client', { 
        requestId,
        tokenPreview: idToken ? `${idToken.substring(0, 10)}...${idToken.substring(idToken.length - 5)}` : 'null',
        tokenLength: idToken.length
      });

      // Verify the token with Firebase Admin
      const decodedToken = await adminAuth.verifyIdToken(idToken)
      
      // Log the decoded token information with appropriate context
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
      })
      
      logger.info('Firebase token verified successfully', { 
        requestId, 
        userId: decodedToken.uid,
        provider: decodedToken.firebase?.sign_in_provider 
      })

      // Ensure user exists in Convex
      try {
        const convexUser = await convex.query(api.users.getUserById, { userId: decodedToken.uid })

        if (!convexUser) {
          logger.info('User not found in Convex, creating user...', { requestId, userId: decodedToken.uid });
          const convexStartTime = Date.now();
          await convex.action(api.auth.createUser, {
            userId: decodedToken.uid,
            name: decodedToken.name || 'Unknown User',
            email: decodedToken.email || '',
            image: decodedToken.picture || ''
          });
          logger.info('User created in Convex', { 
            requestId, 
            userId: decodedToken.uid,
            processingTime: Date.now() - convexStartTime
          })
        } else {
          logger.info('User found in Convex, updating user information...', { requestId, userId: decodedToken.uid });
          const updateStartTime = Date.now();
          await convex.action(api.auth.updateUser, {
            userId: decodedToken.uid,
            name: decodedToken.name || convexUser.name || 'Unknown User',
            email: decodedToken.email || convexUser.email || '',
            image: decodedToken.picture || convexUser.image || ''
          });
          logger.info('User updated in Convex', { 
            requestId, 
            userId: decodedToken.uid,
            processingTime: Date.now() - updateStartTime
          })
        }
      } catch (convexError) {
        logger.error('Error with Convex user operation', convexError, { requestId, userId: decodedToken.uid });
      }
      
      // Call the /api/auth/key route to get an API key for this user
      let apiKeyData = null;
      try {
        // Use shared utility for API key proxy
        apiKeyData = await proxyApiKeyRequest({ idToken, userId: decodedToken.uid });
      } catch (apiKeyError) {
        apiKeyData = { error: 'Exception fetching API key', details: apiKeyError?.message || apiKeyError };
      }

      // Create the response with authentication data and API key data
      const response = NextResponse.json({
        success: true,
        redirect: action === 'refresh' ? undefined : '/chat',
        apiKey: apiKeyData?.apiKey,
        apiKeyData
      });

      // Set the Firebase auth token cookie
      response.cookies.set('firebase-auth-token', idToken, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      })

      return response
    } else {
      logger.warn('Invalid action provided', { requestId, action })
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }
  } catch (err: any) {
    logger.error('Authentication request failed', err, {
      requestId,
      errorCode: err.code || 'unknown',
      path: request.url,
      method: request.method
    });
    let errorMessage = 'Something went wrong'

    switch (err.code) {
      case 'auth/invalid-email':
        errorMessage = 'Invalid email address'
        break
      case 'auth/user-disabled':
        errorMessage = 'This account has been disabled'
        break
      case 'auth/user-not-found':
        errorMessage = 'No account found with this email'
        break
      case 'auth/wrong-password':
        errorMessage = 'Incorrect password'
        break
      case 'auth/email-already-in-use':
        errorMessage = 'An account with this email already exists'
        break
      case 'auth/weak-password':
        errorMessage = 'Password is too weak'
        break
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 400 }
    )
  }
}
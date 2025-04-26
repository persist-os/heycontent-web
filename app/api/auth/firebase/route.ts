import { NextResponse } from 'next/server'
import { adminAuth } from '@/app/lib/firebase-admin'
import { cookies } from 'next/headers'
import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

// Helper function to generate API key via backend API
async function generateApiKey(idToken: string) {
  try {
    console.log('Using Firebase ID token for backend authentication')
    const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/v1/api-keys/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`
      },
      body: JSON.stringify({
        scopes: ["all"],
        rate_tier: "standard"
      })
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to generate API key');
    }
    
    console.log('API key generated successfully');
    return data.data; // Return the data object containing the API key
  } catch (error) {
    console.error('Error generating API key:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Auth request body:', { ...body, password: body.password ? '[REDACTED]' : undefined })

    const { email, password, action, idToken } = body

    if (action === 'login') {
      console.log('Attempting login for:', email)
      try {
        // First verify the user exists and is not disabled
        const userRecord = await adminAuth.getUserByEmail(email)
        
        // Create a custom token for the user
        const customToken = await adminAuth.createCustomToken(userRecord.uid)
        
        // Log the custom token
        console.log('Firebase custom token:', customToken)
        
        console.log('Login successful, setting token for user:', userRecord.email)

        // Ensure user exists in Convex
        try {
          const convexUser = await convex.query(api.users.getUserById, { userId: userRecord.uid })

          if (!convexUser) {
            console.log('User not found in Convex, creating user...')
            await convex.action(api.auth.createUser, {
              userId: userRecord.uid,
              name: userRecord.displayName || 'Unknown User',
              email: userRecord.email || '',
              image: userRecord.photoURL || ''
            })
            console.log('User created in Convex')
          }
        } catch (convexError) {
          console.error('Error with Convex user:', convexError)
        }

        // The API key will be generated later by the frontend using the ID token
        // This simplifies our backend code and ensures we're using the proper ID token

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
        if (error.code === 'auth/user-not-found') {
          return NextResponse.json(
            { error: 'No account found with this email' },
            { status: 400 }
          )
        }
        if (error.code === 'auth/wrong-password') {
          return NextResponse.json(
            { error: 'Incorrect password' },
            { status: 400 }
          )
        }
        console.error('Login error:', error)
        return NextResponse.json(
          { error: 'Authentication failed' },
          { status: 400 }
        )
      }
    } else if (action === 'register') {
      console.log('Attempting registration for:', email)
      try {
        const userRecord = await adminAuth.createUser({
          email,
          password,
          emailVerified: true // Set email as verified by default
        })

        // Create a custom token for the user
        const customToken = await adminAuth.createCustomToken(userRecord.uid)
        
        // Log the custom token
        console.log('Firebase custom token:', customToken)
        
        console.log('Login successful, setting token for user:', userRecord.email)

        // Ensure user exists in Convex
        try {
          const convexUser = await convex.query(api.users.getUserById, { userId: userRecord.uid })

          if (!convexUser) {
            console.log('User not found in Convex, creating user...')
            await convex.action(api.auth.createUser, {
              userId: userRecord.uid,
              name: userRecord.displayName || 'Unknown User',
              email: userRecord.email || '',
              image: userRecord.photoURL || ''
            })
            console.log('User created in Convex')
          }
        } catch (convexError) {
          console.error('Error with Convex user:', convexError)
        }

        // The API key will be generated later by the frontend using the ID token
        // This simplifies our backend code and ensures we're using the proper ID token

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
        if (error.code === 'auth/email-already-in-use') {
          return NextResponse.json(
            { error: 'An account with this email already exists' },
            { status: 400 }
          )
        }
        throw error
      }
    } else if (action === 'google' || action === 'refresh') {
      if (!idToken) {
        console.log('No ID token provided for action:', action)
        return NextResponse.json(
          { error: 'No ID token provided' },
          { status: 400 }
        )
      }

      console.log('Setting token for action:', action)
      
      // Log the received ID token (full token for debugging)
      console.log('Firebase ID token (received from client):', idToken)

      // Verify the token with Firebase Admin
      const decodedToken = await adminAuth.verifyIdToken(idToken)
      
      // Log the decoded token information
      console.log('Decoded Firebase token payload:', {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
        authTime: new Date(decodedToken.auth_time * 1000).toISOString(),
        issuedAt: new Date(decodedToken.iat * 1000).toISOString(),
        expiresAt: new Date(decodedToken.exp * 1000).toISOString(),
        provider: decodedToken.firebase?.sign_in_provider
      })
      
      console.log('Token verified successfully for user:', decodedToken.uid)

      // Ensure user exists in Convex
      try {
        const convexUser = await convex.query(api.users.getUserById, { userId: decodedToken.uid })

        if (!convexUser) {
          console.log('User not found in Convex, creating user...')
          await convex.action(api.auth.createUser, {
            userId: decodedToken.uid,
            name: decodedToken.name || 'Unknown User',
            email: decodedToken.email || '',
            image: decodedToken.picture || ''
          })
          console.log('User created in Convex')
        } else {
          console.log('User found in Convex, updating user information...')
          await convex.action(api.auth.updateUser, {
            userId: decodedToken.uid,
            name: decodedToken.name || convexUser.name || 'Unknown User',
            email: decodedToken.email || convexUser.email || '',
            image: decodedToken.picture || convexUser.image || ''
          })
          console.log('User updated in Convex')
        }
      } catch (convexError) {
        console.error('Error with Convex user:', convexError)
        // Continue even if Convex operations fail
      }

      // Check and generate API key if needed
      let apiKey = null;
      try {
        const apiKeyStatus = await convex.query(api.apiKeysQueries.get, { userId: decodedToken.uid });
        if (!apiKeyStatus.exists) {
          console.log('No active API key found for user, generating one...');
          
          // Here we have a proper ID token from the client
          console.log('Using Firebase ID token for backend authentication');
          
          // Use the provided ID token to authenticate with the backend API
          const apiKeyData = await generateApiKey(idToken);
          apiKey = apiKeyData; // Store the API key data
          console.log('API key generated for user:', decodedToken.uid);
        } else {
          console.log('User already has an active API key.');
        }
      } catch (apiKeyError) {
        console.error('Error checking/generating API key:', apiKeyError);
        // Decide if this error should prevent login or just be logged
      }

      const response = NextResponse.json({
        success: true,
        redirect: action === 'refresh' ? undefined : '/chat',
        apiKey // Include the API key in the response
      })

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
      console.log('Invalid action provided:', action)
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }
  } catch (err: any) {
    console.error('Auth error:', err)
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
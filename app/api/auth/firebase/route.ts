import { NextResponse } from 'next/server'
import { adminAuth } from '@/app/lib/firebase-admin'
import { cookies } from 'next/headers'
import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

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
        
        if (!userRecord.emailVerified) {
          console.log('Login attempt with unverified email:', email)
          return NextResponse.json(
            { error: 'UNVERIFIED_EMAIL' },
            { status: 401 }
          )
        }

        // Create a custom token for the user
        const customToken = await adminAuth.createCustomToken(userRecord.uid)
        
        // Get the ID token
        const idToken = await adminAuth.createCustomToken(userRecord.uid)

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
          } else {
            console.log('User found in Convex, updating user information...')
            await convex.action(api.auth.updateUser, {
              userId: userRecord.uid,
              name: userRecord.displayName || convexUser.name || 'Unknown User',
              email: userRecord.email || convexUser.email || '',
              image: userRecord.photoURL || convexUser.image || ''
            })
            console.log('User updated in Convex')
          }
        } catch (convexError) {
          console.error('Error with Convex user:', convexError)
          // Continue even if Convex operations fail
        }

        const response = NextResponse.json({
          success: true,
          redirect: '/chat',
          customToken // Send the custom token to the client
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
          emailVerified: false
        })

        // Send verification email
        await adminAuth.generateEmailVerificationLink(email)

        console.log('Registration successful, verification email sent to:', email)

        return NextResponse.json({
          success: true,
          redirect: `/verify-email?email=${encodeURIComponent(email)}`
        })
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

      // Verify the token with Firebase Admin
      const decodedToken = await adminAuth.verifyIdToken(idToken)
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

      const response = NextResponse.json({
        success: true,
        redirect: action === 'refresh' ? undefined : '/chat'
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
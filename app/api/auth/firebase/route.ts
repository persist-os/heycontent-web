import { NextResponse } from 'next/server'
import { auth } from '@/app/lib/firebase'
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithPopup
} from 'firebase/auth'
import { cookies } from 'next/headers'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Auth request body:', { ...body, password: body.password ? '[REDACTED]' : undefined })
    
    const { email, password, action, idToken } = body

    if (!auth) {
      console.error('Firebase auth not initialized')
      return NextResponse.json(
        { error: 'Authentication service is not available' },
        { status: 500 }
      )
    }

    if (action === 'login') {
      console.log('Attempting login for:', email)
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      if (!user.emailVerified) {
        console.log('Login attempt with unverified email:', email)
        return NextResponse.json(
          { error: 'UNVERIFIED_EMAIL' },
          { status: 401 }
        )
      }

      const token = await user.getIdToken()
      console.log('Login successful, setting token for user:', user.email)
      
      const response = NextResponse.json({ 
        success: true,
        redirect: '/chat'
      })

      // Set the Firebase auth token cookie
      response.cookies.set('firebase-auth-token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      })

      return response
    } else if (action === 'register') {
      console.log('Attempting registration for:', email)
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      await sendEmailVerification(user)
      console.log('Registration successful, verification email sent to:', email)

      return NextResponse.json({ 
        success: true,
        redirect: `/verify-email?email=${encodeURIComponent(email)}`
      })
    } else if (action === 'google' || action === 'refresh') {
      if (!idToken) {
        console.log('No ID token provided for action:', action)
        return NextResponse.json(
          { error: 'No ID token provided' },
          { status: 400 }
        )
      }

      console.log('Setting token for action:', action)
      const response = NextResponse.json({ 
        success: true,
        redirect: action === 'refresh' ? undefined : '/chat'
      })

      // Set the Firebase auth token cookie
      response.cookies.set('firebase-auth-token', idToken, {
        httpOnly: true,
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
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
    const { email, password, action, idToken } = await request.json()

    if (!auth) {
      return NextResponse.json(
        { error: 'Authentication service is not available' },
        { status: 500 }
      )
    }

    if (action === 'login') {
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
        redirect: action === 'refresh' ? undefined : '/'
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
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }
  } catch (err: any) {
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
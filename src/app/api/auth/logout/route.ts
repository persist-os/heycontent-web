import { NextResponse } from 'next/server'
import { getFirebaseAuth } from '@/app/lib/firebase'
import { signOut } from 'firebase/auth'

export async function POST() {
  try {
    console.log('Starting logout process...')

    // Create response object first
    const response = NextResponse.json({ success: true })

    // Clear the Firebase auth token cookie
    console.log('Clearing auth token cookie...')
    response.cookies.set('firebase-auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0 // Expire immediately
    })

    // Add header to trigger client-side cleanup
    response.headers.set('x-signout', 'true')

    // Sign out from Firebase last, after we've set up the response
    if (auth) {
      try {
        console.log('Attempting Firebase signOut...')
        await signOut(auth)
        console.log('Firebase signOut successful')
      } catch (firebaseError) {
        console.error('Firebase signOut error:', firebaseError)
        // Don't throw here, we still want to return the response with cleared cookies
      }
    } else {
      console.warn('Firebase auth not initialized')
    }

    console.log('Logout process completed successfully')
    return response
  } catch (error) {
    console.error('Logout error:', error)
    // Return a more detailed error response
    return NextResponse.json(
      { 
        error: 'Failed to logout',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
} 
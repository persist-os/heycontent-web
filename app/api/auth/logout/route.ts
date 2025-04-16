import { NextResponse } from 'next/server'
import { auth } from '@/app/lib/firebase'
import { signOut } from 'firebase/auth'

export async function POST() {
  try {
    // Sign out from Firebase
    if (auth) {
      await signOut(auth)
    }

    // Create response with cleared cookies
    const response = NextResponse.json({ success: true })

    // Clear the Firebase auth token cookie
    response.cookies.set('firebase-auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0 // Expire immediately
    })

    // Add header to trigger client-side cleanup
    response.headers.set('x-signout', 'true')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    return NextResponse.json(
      { error: 'Failed to logout' },
      { status: 500 }
    )
  }
} 
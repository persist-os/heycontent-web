import { NextResponse } from 'next/server'

export async function POST() {
  try {
    // Create a response object
    const response = NextResponse.json({ success: true })

    // Clear the Firebase auth token cookie (client and httpOnly for SSR safety)
    response.cookies.set('firebase-auth-token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0 // Expire immediately
    })
    // Also clear the client-accessible cookie (if set)
    response.cookies.set('firebase-auth-token', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    })

    // Add header to trigger client-side cleanup if needed
    response.headers.set('x-signout', 'true')

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
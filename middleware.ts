import { auth } from './app/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isAuthPage = req.nextUrl.pathname === '/login' || 
                    req.nextUrl.pathname === '/register' ||
                    req.nextUrl.pathname === '/forgot-password' ||
                    req.nextUrl.pathname === '/reset-password'
  const isProtectedRoute = 
    req.nextUrl.pathname.startsWith('/chat') ||
    req.nextUrl.pathname.startsWith('/ai-insights') ||
    req.nextUrl.pathname.startsWith('/audience') ||
    req.nextUrl.pathname.startsWith('/partnerships') ||
    req.nextUrl.pathname.startsWith('/settings')
  const isSignOut = req.nextUrl.pathname.startsWith('/api/auth/signout')

  // Allow sign out requests to pass through
  if (isSignOut) {
    return NextResponse.next()
  }

  // If logged in and trying to access auth pages, redirect to chat
  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/chat', req.url))
  }

  // If not logged in and trying to access protected routes, redirect to login
  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    '/',  // Add root path
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/chat/:path*',
    '/ai-insights/:path*',
    '/audience/:path*',
    '/partnerships/:path*',
    '/settings/:path*'
  ]
} 
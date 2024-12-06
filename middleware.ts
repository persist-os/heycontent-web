import { auth } from './app/auth'
import { NextResponse } from 'next/server'

// Add this to exclude auth routes from middleware
const excludedPaths = ['/api/auth', '/_next', '/static', '/favicon.ico']

export default auth((req) => {
  // Skip middleware for excluded paths
  if (excludedPaths.some(path => req.nextUrl.pathname.startsWith(path))) {
    return NextResponse.next()
  }

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

  if (isSignOut) {
    return NextResponse.next()
  }

  if (isAuthPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/chat', req.url))
  }

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
})

// Keep your existing matcher config
export const config = {
  matcher: [
    '/',
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
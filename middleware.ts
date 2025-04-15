import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('firebase-auth-token')?.value;

  console.log('Middleware - Path:', pathname, 'Token exists:', !!token);

  // If token exists and trying to access auth pages, redirect to chat
  if (token && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
    console.log('Middleware - Token exists, redirecting to chat');
    return NextResponse.redirect(new URL('/chat', request.url));
  }

  // Allow access to auth pages and public assets only if no token
  if (!token && (
    pathname.startsWith('/login') || 
    pathname.startsWith('/register') || 
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/firebase')
  )) {
    console.log('Middleware - Allowing access to public route:', pathname);
    return NextResponse.next();
  }

  // If no token and trying to access protected route
  if (!token) {
    console.log('Middleware - No token found, redirecting to login');
    return NextResponse.redirect(new URL('/login', request.url));
  }

  console.log('Middleware - Allowing access to protected route:', pathname);
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 
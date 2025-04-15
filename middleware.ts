import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('firebase-auth-token')?.value;

  // Allow access to public routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/verify-email') ||
    pathname === '/'
  ) {
    // If user is already authenticated and trying to access auth pages, redirect to chat
    if (token && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
      console.log('Authenticated user trying to access auth page, redirecting to chat');
      return NextResponse.redirect(new URL('/chat', request.url));
    }

    const response = NextResponse.next();
    // Add security headers for public routes
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
    response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
    return response;
  }

  // If no token, redirect to login
  if (!token) {
    console.log('No token found, redirecting to login from path:', pathname);
    const response = NextResponse.redirect(new URL('/login', request.url));
    // Add security headers for redirect
    response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
    response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
    response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
    return response;
  }

  // If token exists, allow access
  const response = NextResponse.next();
  // Add security headers for authenticated routes
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin');
  response.headers.set('Cross-Origin-Embedder-Policy', 'credentialless');
  response.headers.set('Cross-Origin-Resource-Policy', 'cross-origin');
  return response;
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
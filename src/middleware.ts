import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isLocalhost(request: NextRequest) {
  const host = request.headers.get('host') || '';
  return host.startsWith('localhost') || host.startsWith('127.0.0.1');
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('firebase-auth-token')?.value;
  const { pathname } = request.nextUrl;

  // Public routes that don't need auth
  const publicRoutes = [
    '/_next',
    '/auth/api/auth',
    '/auth/login',
    '/auth/register',
    '/auth/verify-email',
    '/'
  ];

  // Check if the current path is a public route
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  // If it's a public route, allow access
  const local = isLocalhost(request);

  const connectSrc = [
    "'self'",
    "https://js.stripe.com",
    "https://api.stripe.com",
    "https://r.stripe.com",
    "https://identitytoolkit.googleapis.com",
    "https://va.vercel-scripts.com",
    "https://securetoken.googleapis.com",
    "wss://benevolent-basilisk-784.convex.cloud",
    "https://benevolent-basilisk-784.convex.cloud",
    "wss://whimsical-clownfish-162.convex.cloud",
    "https://whimsical-clownfish-162.convex.cloud",
    "wss://lovely-koala-465.convex.cloud",
    "https://lovely-koala-465.convex.cloud",
    "https://backend.hicontent.co",
    "http://127.0.0.1:8000",
    "http://localhost:8000",
  ];
 
  const CSP = [
    "default-src 'self'",
    `connect-src ${connectSrc.join(' ')}`,
    `script-src 'self' 'unsafe-inline'${local ? " 'unsafe-eval'" : ''} https://js.stripe.com https://va.vercel-scripts.com`,
    "frame-src https://js.stripe.com",
    "img-src 'self' data: https://*",
    "style-src 'self' 'unsafe-inline'",
  ].join('; ');

  if (isPublicRoute) {
    const response = NextResponse.next();
    response.headers.set('Content-Security-Policy', CSP);
    return response;
  }

  // If no token and not a public route, redirect to login
  if (!token) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  // If we have a token, allow access
  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', CSP);
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
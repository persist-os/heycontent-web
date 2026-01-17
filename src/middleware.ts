import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function isLocalhost(request: NextRequest) {
  const host = request.headers.get('host') || '';
  return host.startsWith('localhost') || host.startsWith('127.0.0.1');
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get('firebase-auth-token')?.value;
  const apiKey = request.cookies.get('apiKey')?.value;
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets (images, icons, manifests, etc.)
  // This prevents 401 errors on static file requests
  const staticAssetExtensions = ['.png', '.svg', '.ico', '.jpg', '.jpeg', '.webp', '.json', '.txt', '.xml', '.webmanifest', '.woff', '.woff2', '.ttf', '.eot'];
  const isStaticAsset = staticAssetExtensions.some(ext => pathname.endsWith(ext));
  
  if (isStaticAsset) {
    const response = NextResponse.next();
    // Set appropriate cache headers for static assets
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    return response;
  }

  // Gmail-style behavior: if logged in and on homepage, redirect to dashboard
  if (pathname === '/' && (token || apiKey)) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

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

  // CSP connect-src - uses wildcards for Convex and Cloud Run
  // Configure specific domains via environment variables if needed
  const connectSrc = [
    "'self'",
    "https://js.stripe.com",
    "https://api.stripe.com",
    "https://r.stripe.com",
    "https://identitytoolkit.googleapis.com",
    "https://va.vercel-scripts.com",
    "https://securetoken.googleapis.com",
    // Convex - allow all Convex cloud domains
    "wss://*.convex.cloud",
    "https://*.convex.cloud",
    // Backend - configure via NEXT_PUBLIC_BACKEND_URL
    process.env.NEXT_PUBLIC_BACKEND_URL || "",
    // Cloud Run backends - use wildcard pattern
    "https://*.run.app",
    // Local development
    "http://127.0.0.1:8000",
    "http://localhost:8000",
    // Google Cloud Functions - use wildcard
    "https://*.cloudfunctions.net",
    "https://storage.googleapis.com",
    "https://*.googleapis.com",
    "https://*.gstatic.com",
    "https://www.google.com",
  ].filter(Boolean);
 
  const CSP = [
    "default-src 'self'",
    `connect-src ${connectSrc.join(' ')}`,
    `script-src 'self' 'unsafe-inline'${local ? " 'unsafe-eval'" : ''} https://js.stripe.com https://va.vercel-scripts.com https://apis.google.com https://accounts.google.com https://www.googletagmanager.com https://googleads.g.doubleclick.net`,
    "frame-src 'self' https://js.stripe.com https://accounts.google.com https://*.firebaseapp.com https://www.googletagmanager.com",
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
    // Preserve query parameters when redirecting to login (e.g., reason=logged_in_elsewhere)
    const loginUrl = new URL('/auth/login', request.url);
    // Copy any existing query parameters from the current request
    request.nextUrl.searchParams.forEach((value, key) => {
      loginUrl.searchParams.set(key, value);
    });
    return NextResponse.redirect(loginUrl);
  }

  // If we have a token, allow access
  const response = NextResponse.next();
  response.headers.set('Content-Security-Policy', CSP);
  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - Static assets are handled by early return in middleware function
     */
    '/((?!api|_next/static|_next/image).*)',
  ],
};
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import { jwtDecode } from 'jwt-decode';

export async function GET(request: Request) {
  try {
    console.log('Debug endpoint called');
    
    // Get all headers
    const headersList = headers();
    const allHeaders: Record<string, string> = {};
    headersList.forEach((value, key) => {
      allHeaders[key] = value;
    });
    
    // Get all cookies
    const cookiesList = cookies();
    const allCookies: Record<string, string> = {};
    cookiesList.getAll().forEach(cookie => {
      allCookies[cookie.name] = cookie.value;
    });
    
    // Check for Firebase token
    const authHeader = headersList.get('Authorization');
    const firebaseCookie = cookiesList.get('firebase-auth-token');
    
    let tokenInfo = null;
    let tokenSource = null;
    
    // Try to decode token from Authorization header
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        tokenInfo = jwtDecode(token);
        tokenSource = 'Authorization header';
      } catch (e) {
        console.error('Failed to decode token from Authorization header:', e);
      }
    }
    
    // If no token from header, try cookie
    if (!tokenInfo && firebaseCookie) {
      try {
        tokenInfo = jwtDecode(firebaseCookie.value);
        tokenSource = 'Cookie';
      } catch (e) {
        console.error('Failed to decode token from cookie:', e);
      }
    }
    
    // Get environment variables
    const envVars = {
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      NODE_ENV: process.env.NODE_ENV,
    };
    
    return NextResponse.json({
      headers: allHeaders,
      cookies: Object.keys(allCookies).map(name => ({ 
        name, 
        value: name === 'firebase-auth-token' ? 'REDACTED' : allCookies[name]
      })),
      firebaseToken: {
        exists: !!firebaseCookie || (authHeader && authHeader.startsWith('Bearer ')),
        source: tokenSource,
        decoded: tokenInfo ? {
          uid: tokenInfo.uid,
          email: tokenInfo.email,
          iss: tokenInfo.iss,
          aud: tokenInfo.aud,
          exp: tokenInfo.exp ? new Date(tokenInfo.exp * 1000).toISOString() : null,
          iat: tokenInfo.iat ? new Date(tokenInfo.iat * 1000).toISOString() : null,
        } : null
      },
      environment: envVars
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ 
      error: 'Server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

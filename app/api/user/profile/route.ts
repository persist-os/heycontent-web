import { NextResponse } from "next/server"
import { getServerSession } from "@/app/lib/server-auth"
import { ConvexHttpClient } from "convex/browser"
import { api } from "@/convex/_generated/api"
import { cookies, headers } from "next/headers"
import { adminAuth } from '@/app/lib/firebase-admin'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

/**
 * Handle profile request with a valid session
 */
async function handleProfileRequest(session: any) {
  console.log('Profile: User authenticated, ID:', session.user.id);

  // Fetch user data
  const user = await convex.query(api.users.get, {
    userId: session.user.id
  })

  // Fetch persona data
  const persona = await convex.query(api.personas.getPersona, {
    userId: session.user.id
  })

  return NextResponse.json({
    success: true,
    user: {
      name: user?.name || '',
      email: session.user.email || '',
    },
    persona: persona ? {
      name: persona.name,
      currentState: persona.currentState,
      currentActivities: persona.currentActivities,
      aspirations: persona.aspirations
    } : null
  })
}

/**
 * Handle profile update request with a valid session
 */
async function handleProfileUpdateRequest(req: Request, session: any) {
  const { name, currentPersona, futureVision } = await req.json()

  // Update user profile in Convex
  const user = await convex.action(api.auth.updateUser, {
    userId: session.user.id,
    name,
    email: session.user.email || '',
    image: ''
  })

  // Update persona in Convex
  if (currentPersona || futureVision) {
    await convex.mutation(api.personas.updatePersona, {
      userId: session.user.id,
      currentPersona: currentPersona || '',
      futureVision: futureVision || '',
    })
  }

  // Fetch the current persona
  const persona = await convex.query(api.personas.getPersona, {
    userId: session.user.id
  })

  return NextResponse.json({
    success: true,
    user: {
      name: name || '',
      email: session.user.email || '',
    },
    persona: persona ? {
      name: persona.name,
      currentState: persona.currentState,
      currentActivities: persona.currentActivities,
      aspirations: persona.aspirations
    } : null
  })
}

export async function GET() {
  try {
    console.log('Profile: Getting user information');

    // Get token from Authorization header or cookie
    const authHeader = headers().get('Authorization');
    const cookieToken = cookies().get('firebase-auth-token')?.value;

    // Use token from Authorization header if available, otherwise use cookie
    let token = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
      console.log('Profile: Using token from Authorization header');
    } else if (cookieToken) {
      token = cookieToken;
      console.log('Profile: Using token from cookie');
    } else {
      console.error('Profile: No token found');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the token with Firebase Admin
    let userId;
    try {
      const decodedToken = await adminAuth.verifyIdToken(token);
      userId = decodedToken.uid;
      console.log('Profile: Token verified successfully for user:', userId);
    } catch (verifyError) {
      console.error('Profile: Token verification failed:', verifyError);
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    // Now that we have a verified userId, directly query Convex
    return await handleProfileRequest({ user: { id: userId } });
  } catch (error) {
    console.error('Profile fetch error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch profile',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function PUT(req: Request) {
  try {
    console.log('Profile PUT: Getting server session');

    // Log all cookies for debugging
    const allCookies = cookies().getAll();
    console.log('Profile PUT: All cookies:', allCookies.map(c => c.name));

    // Log auth header if present
    const authHeader = headers().get('Authorization');
    console.log('Profile PUT: Authorization header present:', !!authHeader);

    const session = await getServerSession();

    if (!session?.user?.id) {
      console.error('Profile PUT: No authenticated user found');

      // Try to fix the session by calling fix-session endpoint
      if (authHeader) {
        // Check if we've recently attempted to fix the session
        const lastFixAttempt = cookies().get('session-fix-attempt')?.value;
        const now = Date.now();
        const fiveMinutesAgo = now - 5 * 60 * 1000; // 5 minutes ago

        if (!lastFixAttempt || parseInt(lastFixAttempt) < fiveMinutesAgo) {
          console.log('Profile PUT: Attempting to fix session with auth header');
          try {
            // Make a server-side request to fix-session
            const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/auth/fix-session`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader
              },
              body: JSON.stringify({})
            });

            // Set a cookie to track when we last attempted to fix the session
            const responseWithCookie = NextResponse.next();
            responseWithCookie.cookies.set('session-fix-attempt', now.toString(), {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
              maxAge: 60 * 60 // 1 hour
            });

            if (response.ok) {
              console.log('Profile PUT: Session fix successful, retrying getServerSession');
              // Try again with the fixed session
              const fixedSession = await getServerSession();
              if (fixedSession?.user?.id) {
                console.log('Profile PUT: Session fixed successfully');
                // Continue with the fixed session
                const result = await handleProfileUpdateRequest(req, fixedSession);
                // Copy the session-fix-attempt cookie to the result
                const resultWithCookie = NextResponse.json(
                  await result.json(),
                  { status: result.status, headers: result.headers }
                );
                resultWithCookie.cookies.set('session-fix-attempt', now.toString(), {
                  httpOnly: true,
                  secure: process.env.NODE_ENV === 'production',
                  sameSite: 'lax',
                  path: '/',
                  maxAge: 60 * 60 // 1 hour
                });
                return resultWithCookie;
              }
            } else {
              console.error('Profile PUT: Session fix failed:', await response.text());
            }
          } catch (fixError) {
            console.error('Profile PUT: Error fixing session:', fixError);
          }
        } else {
          console.log('Profile PUT: Skipping session fix attempt, last attempt was too recent');
        }
      }

      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    return await handleProfileUpdateRequest(req, session);
  } catch (error) {
    console.error('Profile update error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update profile',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}
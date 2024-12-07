import { NextResponse } from 'next/server'
import { auth } from '@/app/auth'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new Response('Unauthorized', { status: 401 })
    }

    const searchParams = new URL(request.url).searchParams
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const error_reason = searchParams.get('error_reason')

    if (error || error_reason) {
      console.error('Instagram OAuth error:', { error, error_reason })
      return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=instagram_auth_failed`)
    }

    if (!code) {
      return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=no_code`)
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.INSTAGRAM_CLIENT_ID!,
        client_secret: process.env.INSTAGRAM_CLIENT_SECRET!,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/social/callback/instagram/oauth`,
        code
      })
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      console.error('Token exchange error:', tokenData)
      return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=token_exchange_failed`)
    }

    // Get long-lived token
    const longLivedTokenResponse = await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}&access_token=${tokenData.access_token}`)
    const longLivedTokenData = await longLivedTokenResponse.json()

    // Store the access token and user info
    await prisma.account.create({
      data: {
        userId: session.user.id,
        type: 'oauth',
        provider: 'instagram',
        providerAccountId: tokenData.user_id.toString(),
        access_token: longLivedTokenData.access_token,
        expires_at: Math.floor(Date.now() / 1000) + longLivedTokenData.expires_in,
        scope: 'instagram_basic,instagram_content_publish,instagram_manage_comments,instagram_manage_insights',
        token_type: 'bearer'
      }
    })

    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=instagram_connected`)
  } catch (error) {
    console.error('Instagram OAuth error:', error)
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=unknown`)
  }
} 
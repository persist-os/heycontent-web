import { NextResponse } from 'next/server';
import { auth } from '@/app/auth';
import prisma from '@/app/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const searchParams = new URL(request.url).searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const error_reason = searchParams.get('error_reason');
    const state = searchParams.get('state');

    if (error || error_reason) {
      console.error('OAuth error:', { error, error_reason });
      return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=auth_failed`);
    }

    if (!code || !state) {
      return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=no_code`);
    }

    // Decode state to determine auth path and user ID
    const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
    const useFacebook = stateData.useFacebook;
    const userId = stateData.userId;

    if (!userId) {
      return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=no_user`);
    }

    if (useFacebook) {
      return await handleFacebookAuth(code, userId);
    } else {
      return await handleInstagramBasicAuth(code, userId);
    }

  } catch (error) {
    console.error('Instagram OAuth error:', error);
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=unknown`);
  }
}

async function handleFacebookAuth(code: string, userId: string) {
  const clientId = process.env.FACEBOOK_APP_ID;
  const clientSecret = process.env.FACEBOOK_APP_SECRET;
  const redirectUri = process.env.INSTAGRAM_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing Facebook configuration');
  }

  // Exchange code for Facebook access token
  const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
  tokenUrl.searchParams.append('client_id', clientId);
  tokenUrl.searchParams.append('client_secret', clientSecret);
  tokenUrl.searchParams.append('redirect_uri', redirectUri);
  tokenUrl.searchParams.append('code', code);

  const tokenResponse = await fetch(tokenUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    cache: 'no-store',
  });

  const tokenData = await tokenResponse.json();

  if (tokenData.error) {
    console.error('Token exchange error:', tokenData);
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=token_exchange_failed`);
  }

  // Get Instagram account ID and access token
  const accountsResponse = await fetch(
    `https://graph.facebook.com/v18.0/me/accounts?access_token=${tokenData.access_token}`
  );
  const accountsData = await accountsResponse.json();

  if (!accountsData.data?.length) {
    console.error('No Facebook pages found');
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=no_pages_found`);
  }

  // Get Instagram Business Account ID
  const instagramResponse = await fetch(
    `https://graph.facebook.com/v18.0/${accountsData.data[0].id}?fields=instagram_business_account&access_token=${tokenData.access_token}`
  );
  const instagramData = await instagramResponse.json();

  if (!instagramData.instagram_business_account?.id) {
    console.error('No Instagram business account found');
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=no_instagram_account`);
  }

  // Get Instagram account details
  const profileResponse = await fetch(
    `https://graph.facebook.com/v18.0/${instagramData.instagram_business_account.id}?fields=username,profile_picture_url&access_token=${tokenData.access_token}`
  );
  const profileData = await profileResponse.json();

  await saveInstagramAccount(userId, {
    providerAccountId: instagramData.instagram_business_account.id,
    accessToken: tokenData.access_token,
    expiresAt: Math.floor(Date.now() / 1000) + tokenData.expires_in,
    username: profileData.username,
    scope: 'instagram_basic,instagram_content_publish,instagram_manage_insights,instagram_manage_comments,pages_show_list,pages_read_engagement',
    metadata: {
      instagramId: instagramData.instagram_business_account.id,
      pageId: accountsData.data[0].id,
      profilePicture: profileData.profile_picture_url,
      isFacebookConnected: true
    }
  });

  return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=instagram_connected`);
}

async function handleInstagramBasicAuth(code: string, userId: string) {
  const clientId = process.env.INSTAGRAM_BASIC_CLIENT_ID;
  const clientSecret = process.env.INSTAGRAM_BASIC_CLIENT_SECRET;
  const redirectUri = process.env.INSTAGRAM_BASIC_REDIRECT_URI;

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('Missing Instagram configuration');
  }

  // Exchange code for Instagram access token
  const tokenResponse = await fetch('https://api.instagram.com/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: redirectUri,
      code,
    }),
  });

  // Log the raw response for debugging
  const responseText = await tokenResponse.text();
  console.log('Instagram token exchange response:', responseText);
  
  let tokenData;
  try {
    tokenData = JSON.parse(responseText);
  } catch (error) {
    console.error('Failed to parse token response:', error);
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=invalid_response`);
  }

  if (tokenData.error) {
    console.error('Token exchange error:', tokenData);
    return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?error=token_exchange_failed`);
  }

  // Get long-lived token
  const longLivedTokenResponse = await fetch(
    `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${clientSecret}&access_token=${tokenData.access_token}`
  );
  const longLivedTokenData = await longLivedTokenResponse.json();

  // Get user profile
  const profileResponse = await fetch(
    `https://graph.instagram.com/me?fields=id,username,account_type&access_token=${longLivedTokenData.access_token}`
  );
  const profileData = await profileResponse.json();

  await saveInstagramAccount(userId, {
    providerAccountId: profileData.id,
    accessToken: longLivedTokenData.access_token,
    expiresAt: Math.floor(Date.now() / 1000) + longLivedTokenData.expires_in,
    username: profileData.username,
    scope: 'basic,user_profile,user_media',
    metadata: {
      instagramId: profileData.id,
      accountType: profileData.account_type,
      isFacebookConnected: false
    }
  });

  return Response.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/settings?success=instagram_connected`);
}

async function saveInstagramAccount(userId: string, data: any) {
  // Store the access token and user info
  await prisma.account.create({
    data: {
      userId: userId,
      type: 'oauth',
      provider: 'instagram',
      providerAccountId: data.providerAccountId,
      access_token: data.accessToken,
      expires_at: data.expiresAt,
      scope: data.scope,
      token_type: 'bearer'
    }
  });

  // Create/update social account record
  await prisma.socialAccount.upsert({
    where: {
      userId_platform: {
        userId: userId,
        platform: 'instagram'
      }
    },
    create: {
      platform: 'instagram',
      userId: userId,
      username: data.username,
      accessToken: data.accessToken,
      expiresAt: new Date(data.expiresAt * 1000),
      scope: data.scope,
      isConnected: true,
      metadata: data.metadata
    },
    update: {
      username: data.username,
      accessToken: data.accessToken,
      expiresAt: new Date(data.expiresAt * 1000),
      scope: data.scope,
      isConnected: true,
      metadata: data.metadata
    }
  });
}
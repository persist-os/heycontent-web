import { prisma } from "@/lib/prisma";
import { google } from 'googleapis';

export function getValidAccessToken(token: string | null): string {
  if (!token) {
    throw new Error("No access token available");
  }
  return token;
}

export async function refreshAccessToken(accountId: string): Promise<string> {
  const account = await prisma.account.findUnique({
    where: { id: accountId }
  });

  if (!account?.refresh_token) {
    throw new Error("No refresh token available");
  }

  try {
    // Implement token refresh logic based on provider
    switch (account.provider) {
      case 'google':
        // Refresh Google token
        const response = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            client_id: process.env.GOOGLE_CLIENT_ID!,
            client_secret: process.env.GOOGLE_CLIENT_SECRET!,
            refresh_token: account.refresh_token,
            grant_type: 'refresh_token',
          }),
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to refresh token');
        }

        // Update the account with new tokens
        await prisma.account.update({
          where: { id: account.id },
          data: {
            access_token: data.access_token,
            expires_at: Math.floor(Date.now() / 1000 + data.expires_in),
            token_type: data.token_type,
          },
        });

        return data.access_token;

      // Add other providers as needed
      default:
        throw new Error(`Unsupported provider: ${account.provider}`);
    }
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
}

export async function validateToken(userId: string, platform: string = 'youtube'): Promise<string> {
  try {
    // First, find the social account for this user and platform
    const socialAccount = await prisma.socialAccount.findUnique({
      where: {
        userId_platform: {
          userId: userId,
          platform: platform
        }
      }
    });

    if (!socialAccount) {
      throw new Error(`No ${platform} account found for user ${userId}`);
    }

    if (!socialAccount.isConnected) {
      throw new Error(`${platform} account is not connected for user ${userId}`);
    }

    console.log('Token status:', {
      platform,
      hasToken: !!socialAccount.accessToken,
      expiresAt: socialAccount.expiresAt,
      isExpired: socialAccount.expiresAt ? socialAccount.expiresAt < new Date() : true
    });

    // If token is expired and we have a refresh token, try to refresh
    if (socialAccount.expiresAt && socialAccount.expiresAt < new Date() && socialAccount.refreshToken) {
      console.log('Token expired, attempting refresh');
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        platform === 'youtube' ? process.env.YOUTUBE_REDIRECT_URI : `${process.env.NEXT_PUBLIC_APP_URL}/api/social/callback/gmail`
      );

      oauth2Client.setCredentials({
        refresh_token: socialAccount.refreshToken
      });

      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        
        // Update token in database
        await prisma.socialAccount.update({
          where: {
            userId_platform: {
              userId: userId,
              platform: platform
            }
          },
          data: {
            accessToken: credentials.access_token || '',
            refreshToken: credentials.refresh_token || socialAccount.refreshToken || '',
            expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
            tokenType: credentials.token_type || socialAccount.tokenType || 'Bearer',
            scope: credentials.scope || socialAccount.scope || ''
          }
        });

        if (!credentials.access_token) {
          throw new Error('Refresh token response did not include access token');
        }

        return credentials.access_token;
      } catch (refreshError: any) {
        console.error('Error refreshing token:', refreshError);
        throw new Error(`Failed to refresh ${platform} token: ${refreshError.message}`);
      }
    }

    if (!socialAccount.accessToken) {
      throw new Error(`No access token available for ${platform}`);
    }

    return socialAccount.accessToken;
  } catch (error) {
    console.error('Error validating token:', error);
    throw error;
  }
}

export async function getAccountStatus(userId: string, platform: string): Promise<{
  isValid: boolean;
  expiresIn?: number;
  error?: string;
}> {
  try {
    const socialAccount = await prisma.socialAccount.findUnique({
      where: {
        userId_platform: {
          userId: userId,
          platform: platform
        }
      }
    });

    if (!socialAccount) {
      return {
        isValid: false,
        error: `No ${platform} account found`
      };
    }

    const now = new Date();
    const expiresIn = socialAccount.expiresAt ? 
      Math.floor((socialAccount.expiresAt.getTime() - now.getTime()) / 1000) : 
      undefined;

    return {
      isValid: !!socialAccount.accessToken && socialAccount.isConnected && (!socialAccount.expiresAt || socialAccount.expiresAt > now),
      expiresIn,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Unknown error checking account status"
    };
  }
} 
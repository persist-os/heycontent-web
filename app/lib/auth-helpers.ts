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

export async function validateToken(accountId: string, platform: string = 'youtube') {
  try {
    const account = await prisma.socialAccount.findFirst({
      where: {
        userId: accountId,
        platform: platform,
        isConnected: true
      }
    });

    if (!account) {
      console.log(`No ${platform} account found for user ${accountId}`);
      return null;
    }

    console.log('Token status:', {
      hasToken: !!account.accessToken,
      expiresAt: account.expiresAt,
      isExpired: account.expiresAt ? account.expiresAt < new Date() : true
    });

    // If token is expired and we have a refresh token, try to refresh
    if (account.expiresAt && account.expiresAt < new Date() && account.refreshToken) {
      console.log('Token expired, attempting refresh');
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        platform === 'youtube' ? process.env.YOUTUBE_REDIRECT_URI : process.env.GMAIL_REDIRECT_URI
      );

      oauth2Client.setCredentials({
        refresh_token: account.refreshToken
      });

      const { credentials } = await oauth2Client.refreshAccessToken();
      
      // Update token in database
      await prisma.socialAccount.update({
        where: {
          userId_platform: {
            userId: accountId,
            platform: platform
          }
        },
        data: {
          accessToken: credentials.access_token,
          refreshToken: credentials.refresh_token || account.refreshToken,
          expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
          tokenType: credentials.token_type || account.tokenType,
          scope: credentials.scope || account.scope
        }
      });

      return credentials.access_token;
    }

    return account.accessToken;
  } catch (error) {
    console.error('Error validating token:', error);
    throw error;
  }
}

export async function getAccountStatus(accountId: string): Promise<{
  isValid: boolean;
  expiresIn?: number;
  error?: string;
}> {
  try {
    const account = await prisma.account.findUnique({
      where: { id: accountId }
    });

    if (!account) {
      return {
        isValid: false,
        error: "Account not found"
      };
    }

    const now = Math.floor(Date.now() / 1000);
    const expiresIn = account.expires_at ? account.expires_at - now : undefined;

    return {
      isValid: !!account.access_token && (!account.expires_at || account.expires_at > now),
      expiresIn,
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : "Unknown error checking account status"
    };
  }
} 
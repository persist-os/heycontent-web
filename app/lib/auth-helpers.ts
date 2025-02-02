import prisma from "@/app/lib/prisma";
import { google } from 'googleapis';
import { YOUTUBE_CONFIG, TokenValidationResult } from './config/youtube';
import { GMAIL_CONFIG } from './config/gmail';

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
    const socialAccount = await prisma.socialAccount.findUnique({
      where: {
        userId_platform: { userId, platform }
      }
    });

    if (!socialAccount) {
      throw new Error(`No ${platform} account found for user ${userId}`);
    }

    if (!socialAccount.isConnected) {
      throw new Error(`${platform} account is not connected for user ${userId}`);
    }

    const validationResult = await validateTokenStatus(socialAccount);
    
    if (!validationResult.isValid) {
      throw new Error(validationResult.error || `Invalid token for ${platform}`);
    }

    return validationResult.accessToken!;
  } catch (error: any) {
    console.error('Error validating token:', {
      error,
      message: error.message,
      stack: error.stack,
      userId,
      platform
    });
    throw error;
  }
}

async function validateTokenStatus(socialAccount: any): Promise<TokenValidationResult> {
  const now = new Date();
  const isExpired = socialAccount.expiresAt ? socialAccount.expiresAt < now : true;

  // Log token status for debugging
  console.log('Token status:', {
    platform: socialAccount.platform,
    hasToken: !!socialAccount.accessToken,
    expiresAt: socialAccount.expiresAt,
    isExpired,
    hasRefreshToken: !!socialAccount.refreshToken
  });

  // If token is valid and not expired, return it
  if (socialAccount.accessToken && !isExpired) {
    return {
      isValid: true,
      accessToken: socialAccount.accessToken,
      expiresAt: socialAccount.expiresAt
    };
  }

  // If no refresh token available, token is invalid
  if (!socialAccount.refreshToken) {
    return {
      isValid: false,
      error: socialAccount.platform === 'youtube' 
        ? YOUTUBE_CONFIG.ERROR_MESSAGES.MISSING_REFRESH_TOKEN
        : GMAIL_CONFIG.ERROR_MESSAGES.MISSING_REFRESH_TOKEN
    };
  }

  // Attempt to refresh the token
  try {
    const refreshResult = await refreshToken(socialAccount);
    return refreshResult;
  } catch (error: any) {
    return {
      isValid: false,
      error: error.message
    };
  }
}

async function refreshToken(socialAccount: any): Promise<TokenValidationResult> {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    socialAccount.platform === 'youtube' 
      ? YOUTUBE_CONFIG.OAUTH_ENDPOINTS.YOUTUBE 
      : YOUTUBE_CONFIG.OAUTH_ENDPOINTS.GMAIL
  );

  oauth2Client.setCredentials({
    refresh_token: socialAccount.refreshToken
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    if (!credentials.access_token) {
      throw new Error(socialAccount.platform === 'youtube' 
        ? YOUTUBE_CONFIG.ERROR_MESSAGES.TOKEN_REFRESH_FAILED
        : GMAIL_CONFIG.ERROR_MESSAGES.TOKEN_REFRESH_FAILED
      );
    }

    // Verify token info and scopes
    const tokenInfo = await oauth2Client.getTokenInfo(credentials.access_token);
    const requiredScopes = socialAccount.platform === 'youtube'
      ? YOUTUBE_CONFIG.REQUIRED_SCOPES
      : GMAIL_CONFIG.REQUIRED_SCOPES;
    
    const hasRequiredScopes = requiredScopes.every(scope => 
      tokenInfo.scopes?.includes(scope)
    );

    if (!hasRequiredScopes) {
      throw new Error(socialAccount.platform === 'youtube'
        ? YOUTUBE_CONFIG.ERROR_MESSAGES.MISSING_REQUIRED_SCOPES
        : GMAIL_CONFIG.ERROR_MESSAGES.MISSING_REQUIRED_SCOPES
      );
    }

    // Update token in database
    await prisma.socialAccount.update({
      where: {
        userId_platform: {
          userId: socialAccount.userId,
          platform: socialAccount.platform
        }
      },
      data: {
        accessToken: credentials.access_token,
        refreshToken: credentials.refresh_token || socialAccount.refreshToken,
        expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null,
        tokenType: credentials.token_type || 'Bearer',
        scope: credentials.scope || socialAccount.scope || ''
      }
    });

    return {
      isValid: true,
      accessToken: credentials.access_token,
      expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined
    };
  } catch (error: any) {
    console.error('Error refreshing token:', {
      error,
      message: error.message,
      stack: error.stack,
      platform: socialAccount.platform
    });
    throw new Error(`Failed to refresh token: ${error.message}`);
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

export async function fixMismatchedSocialAccounts(oldUserId: string, newUserId: string) {
  try {
    // Update all social accounts from old ID to new ID
    await prisma.socialAccount.updateMany({
      where: {
        userId: oldUserId,
      },
      data: {
        userId: newUserId,
      },
    });

    console.log('Successfully updated social account user IDs', {
      from: oldUserId,
      to: newUserId,
    });

    return true;
  } catch (error) {
    console.error('Error fixing mismatched social accounts:', error);
    throw error;
  }
} 
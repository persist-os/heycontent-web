export const YOUTUBE_CONFIG = {
  REQUIRED_SCOPES: [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube.force-ssl',
    'https://www.googleapis.com/auth/yt-analytics.readonly',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
    'openid'
  ] as const,
  
  OAUTH_ENDPOINTS: {
    YOUTUBE: process.env.YOUTUBE_REDIRECT_URI,
    GMAIL: `${process.env.NEXT_PUBLIC_APP_URL}/api/social/callback/gmail`
  },

  ERROR_MESSAGES: {
    NO_ACCESS_TOKEN: 'No access token available',
    MISSING_REFRESH_TOKEN: 'No refresh token available',
    TOKEN_REFRESH_FAILED: 'Failed to refresh token',
    MISSING_REQUIRED_SCOPES: 'Token is missing required scopes',
    INVALID_CREDENTIALS: 'Invalid credentials provided'
  }
} as const;

export type YouTubeScope = typeof YOUTUBE_CONFIG.REQUIRED_SCOPES[number];

export interface TokenValidationResult {
  valid: boolean;
  error?: string;
  newToken?: string;
  expiresAt?: number;
} 
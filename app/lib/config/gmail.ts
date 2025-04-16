export const GMAIL_CONFIG = {
  REQUIRED_SCOPES: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.labels',
    'https://mail.google.com/',
    'email',
    'profile',
    'openid'
  ],
  
  ERROR_MESSAGES: {
    NO_ACCESS_TOKEN: 'No Gmail access token available',
    MISSING_REFRESH_TOKEN: 'No Gmail refresh token available',
    TOKEN_REFRESH_FAILED: 'Failed to refresh Gmail token',
    MISSING_REQUIRED_SCOPES: 'Missing required Gmail scopes',
    INVALID_CREDENTIALS: 'Invalid Gmail credentials provided',
    NOT_CONNECTED: 'Gmail account not connected',
    UNAUTHORIZED: 'Unauthorized Gmail access',
    INVALID_TOKEN: 'Invalid or expired Gmail token',
    API_ERROR: 'Error accessing Gmail API'
  }
} as const;

export type GmailScope = typeof GMAIL_CONFIG.REQUIRED_SCOPES[number];

export interface GmailTokenValidationResult {
  isValid: boolean;
  accessToken?: string;
  error?: string;
  expiresAt?: Date;
  scopes?: string[];
} 
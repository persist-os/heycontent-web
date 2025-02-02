export const GMAIL_CONFIG = {
  REQUIRED_SCOPES: [
    'https://www.googleapis.com/auth/gmail.readonly',
    'https://www.googleapis.com/auth/gmail.modify',
    'https://www.googleapis.com/auth/gmail.labels'
  ] as const,
  
  ERROR_MESSAGES: {
    NO_ACCESS_TOKEN: 'No Gmail access token available',
    MISSING_REFRESH_TOKEN: 'No Gmail refresh token available',
    TOKEN_REFRESH_FAILED: 'Failed to refresh Gmail token',
    MISSING_REQUIRED_SCOPES: 'Gmail token is missing required scopes',
    INVALID_CREDENTIALS: 'Invalid Gmail credentials provided',
    NOT_CONNECTED: 'Gmail account not connected',
    UNAUTHORIZED: 'Unauthorized Gmail access'
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
import { google } from 'googleapis';
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

export const isTokenExpired = (expiryDate: number): boolean => {
  // Add a 5-minute buffer to ensure we refresh before actual expiration
  const bufferTime = 5 * 60 * 1000; // 5 minutes in milliseconds
  return Date.now() + bufferTime >= expiryDate;
};

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const refreshGmailToken = async (refreshToken: string, retryCount = 0): Promise<any> => {
  try {
    if (!refreshToken) {
      throw new Error('No refresh token provided');
    }

    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    const { credentials } = await oauth2Client.refreshAccessToken();
    
    if (!credentials.access_token || !credentials.expiry_date) {
      throw new Error('Invalid credentials received from Google');
    }

    // Update tokens in Convex
    await convex.mutation(api.gmailTokens.storeGmailTokens, {
      accessToken: credentials.access_token,
      refreshToken: credentials.refresh_token || refreshToken, // Keep existing refresh token if new one isn't provided
      expiryDate: credentials.expiry_date,
      scope: credentials.scope || 'https://www.googleapis.com/auth/gmail.readonly',
    });

    return credentials;
  } catch (error) {
    console.error('Error refreshing Gmail token:', error);
    
    // Retry logic for network errors or temporary issues
    if (retryCount < MAX_RETRIES && 
        (error instanceof Error && 
         (error.message.includes('network') || 
          error.message.includes('timeout') || 
          error.message.includes('ECONNRESET')))) {
      await sleep(RETRY_DELAY * Math.pow(2, retryCount)); // Exponential backoff
      return refreshGmailToken(refreshToken, retryCount + 1);
    }
    
    throw error;
  }
};

export const getValidGmailToken = async () => {
  try {
    const tokens = await convex.query(api.gmailTokens.getGmailTokens);
    
    if (!tokens) {
      throw new Error('No Gmail tokens found');
    }

    if (!tokens.refreshToken) {
      throw new Error('No refresh token available');
    }

    if (isTokenExpired(tokens.expiryDate)) {
      const newCredentials = await refreshGmailToken(tokens.refreshToken);
      return newCredentials.access_token!;
    }

    return tokens.accessToken;
  } catch (error) {
    console.error('Error getting valid Gmail token:', error);
    throw error;
  }
}; 
import { google } from 'googleapis';
import { api } from '@/convex/_generated/api';
import { ConvexHttpClient } from 'convex/browser';
import { storeGmailCredentials } from './auth';

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

// Helper: Check if token is expired or about to expire (within 2 minutes)
function isTokenExpired(expiryDate: number | undefined) {
  if (!expiryDate) return true;
  const now = Date.now();
  // 2 minutes buffer
  return now > expiryDate - 2 * 60 * 1000;
}

// Initialize the Gmail API client with refresh logic
const getGmailClient = async () => {
  let tokens = await convex.query(api.gmailTokens.getGmailTokens);
  if (!tokens) {
    throw new Error('No Gmail tokens found');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  oauth2Client.setCredentials({
    access_token: tokens.accessToken,
    refresh_token: tokens.refreshToken,
    expiry_date: tokens.expiryDate,
  });

  // Refresh if expired or about to expire
  if (isTokenExpired(tokens.expiryDate)) {
    if (!tokens.refreshToken) {
      throw new Error('No refresh token available to refresh Gmail access token');
    }
    try {
      const { credentials } = await oauth2Client.refreshAccessToken();
      // Update Convex with new tokens
      await storeGmailCredentials({
        access_token: credentials.access_token!,
        refresh_token: credentials.refresh_token || tokens.refreshToken,
        scope: credentials.scope || tokens.scope,
        expiry_date: credentials.expiry_date!,
      });
      // Update local tokens for this session
      oauth2Client.setCredentials({
        access_token: credentials.access_token!,
        refresh_token: credentials.refresh_token || tokens.refreshToken,
        expiry_date: credentials.expiry_date!,
      });
    } catch (err) {
      console.error('Failed to refresh Gmail access token:', err);
      throw err;
    }
  }

  return google.gmail({ version: 'v1', auth: oauth2Client });
};

// Fetch a list of message IDs
export const listMessages = async (maxResults: number = 10, pageToken?: string) => {
  try {
    const gmail = await getGmailClient();
    const response = await gmail.users.messages.list({
      userId: 'me',
      maxResults,
      pageToken,
    });

    return {
      messages: response.data.messages || [],
      nextPageToken: response.data.nextPageToken,
    };
  } catch (error) {
    console.error('Error fetching messages:', error);
    throw error;
  }
};

// Fetch a single message by ID
export const getMessage = async (messageId: string) => {
  try {
    const gmail = await getGmailClient();
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full',
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching message:', error);
    throw error;
  }
};

// Fetch a thread by ID
export const getThread = async (threadId: string) => {
  try {
    const gmail = await getGmailClient();
    const response = await gmail.users.threads.get({
      userId: 'me',
      id: threadId,
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching thread:', error);
    throw error;
  }
};

// Search messages with a query
export const searchMessages = async (query: string, maxResults: number = 10) => {
  try {
    const gmail = await getGmailClient();
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: query,
      maxResults,
    });

    return {
      messages: response.data.messages || [],
      nextPageToken: response.data.nextPageToken,
    };
  } catch (error) {
    console.error('Error searching messages:', error);
    throw error;
  }
};

// Get message attachments
export const getAttachment = async (messageId: string, attachmentId: string) => {
  try {
    const gmail = await getGmailClient();
    const response = await gmail.users.messages.attachments.get({
      userId: 'me',
      messageId,
      id: attachmentId,
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching attachment:', error);
    throw error;
  }
};

// Get message metadata (headers, subject, etc.)
export const getMessageMetadata = async (messageId: string) => {
  try {
    const gmail = await getGmailClient();
    const response = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'metadata',
      metadataHeaders: ['From', 'To', 'Subject', 'Date'],
    });

    return response.data;
  } catch (error) {
    console.error('Error fetching message metadata:', error);
    throw error;
  }
}; 
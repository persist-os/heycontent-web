import { google } from 'googleapis';

// Fetch Gmail token from backend (which stores it in Convex)
async function fetchGmailToken(): Promise<string> {
  const response = await fetch('/api/gmail/token', {
    method: 'GET',
    credentials: 'include',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch Gmail token from backend');
  }
  const data = await response.json();
  return data.access_token;
}

// Initialize the Gmail API client with refresh logic
const getGmailClient = async () => {
  const accessToken = await fetchGmailToken();
  // Partially written by Paing
const oauth2Client = new google.auth.OAuth2(
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET,
    process.env.GMAIL_REDIRECT_URI
  );
  oauth2Client.setCredentials({ access_token: accessToken });
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
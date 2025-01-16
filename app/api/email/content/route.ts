import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { google } from 'googleapis'
import type { gmail_v1 } from 'googleapis'
import { RAGSystem } from '@/lib/rag'
import { GmailService } from '@/lib/services/gmail'
import type { PartnershipEmail, PartnershipAnalysis } from '../../../types/social-platforms'

function decodeBase64(data: string) {
  try {
    return Buffer.from(data, 'base64').toString('utf-8');
  } catch (error) {
    console.error('Failed to decode base64:', error);
    return '';
  }
}

function extractBody(payload: any): string {
  if (!payload) return '';

  // If the message is not multipart
  if (payload.body?.data) {
    return decodeBase64(payload.body.data);
  }

  // If the message is multipart
  if (payload.parts) {
    for (const part of payload.parts) {
      // Look for text/plain parts first
      if (part.mimeType === 'text/plain' && part.body?.data) {
        return decodeBase64(part.body.data);
      }
    }
    
    // If no text/plain, try text/html
    for (const part of payload.parts) {
      if (part.mimeType === 'text/html' && part.body?.data) {
        return decodeBase64(part.body.data);
      }
      
      // Check nested parts
      if (part.parts) {
        const nestedBody = extractBody(part);
        if (nestedBody) return nestedBody;
      }
    }
  }

  return '';
}

function cleanEmailContent(content: string): string {
  return content
    // Remove email quotation markers and leading whitespace
    .replace(/^[>\s]+/gm, '')
    // Remove repeated newlines
    .replace(/\n{3,}/g, '\n\n')
    // Remove any remaining '>' characters
    .replace(/>/g, '')
    // Trim whitespace
    .trim();
}

interface EmailParticipant {
  email: string;
  name: string;
  role?: 'user' | 'sender' | 'recipient' | 'cc' | 'bcc';
  organization?: string;
}

interface ThreadContext {
  participants: EmailParticipant[];
  relationships: {
    [key: string]: {
      relatedTo: string;
      relationship: string;
    }[];
  };
}

function parseEmailAddress(emailStr: string): EmailParticipant {
  const match = emailStr.match(/(?:"?([^"]*)"?\s)?(?:<?(.+@[^>]+)>?)/);
  return {
    name: match?.[1] || '',
    email: match?.[2] || emailStr,
    role: 'sender'  // default role, will be updated based on context
  };
}

function extractParticipants(headers: gmail_v1.Schema$MessagePartHeader[]): EmailParticipant[] {
  const participants: EmailParticipant[] = [];
  
  const fromHeader = headers.find(h => h.name === 'From')?.value;
  const toHeader = headers.find(h => h.name === 'To')?.value;
  const ccHeader = headers.find(h => h.name === 'Cc')?.value;
  const bccHeader = headers.find(h => h.name === 'Bcc')?.value;

  if (fromHeader) {
    const sender = parseEmailAddress(fromHeader);
    sender.role = 'sender';
    participants.push(sender);
  }

  if (toHeader) {
    toHeader.split(',').forEach((recipient: string) => {
      const parsedRecipient = parseEmailAddress(recipient.trim());
      parsedRecipient.role = 'recipient';
      participants.push(parsedRecipient);
    });
  }

  if (ccHeader) {
    ccHeader.split(',').forEach((cc: string) => {
      const parsedCC = parseEmailAddress(cc.trim());
      parsedCC.role = 'cc';
      participants.push(parsedCC);
    });
  }

  if (bccHeader) {
    bccHeader.split(',').forEach((bcc: string) => {
      const parsedBCC = parseEmailAddress(bcc.trim());
      parsedBCC.role = 'bcc';
      participants.push(parsedBCC);
    });
  }

  return participants;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { messageId } = await req.json();
    if (!messageId) {
      return NextResponse.json({ error: 'Message ID is required' }, { status: 400 });
    }

    // Get user's connected Gmail account from socialAccounts
    const socialAccount = await prisma.socialAccount.findFirst({
      where: {
        userId: session.user.id,
        platform: 'gmail',
        isConnected: true
      }
    });

    if (!socialAccount || !socialAccount.accessToken) {
      return NextResponse.json({ error: 'Gmail account not connected or invalid tokens' }, { status: 400 });
    }

    // Initialize Gmail API
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL
    );

    const credentials: { [key: string]: string | undefined } = {
      access_token: socialAccount.accessToken,
      token_type: socialAccount.tokenType || undefined
    };

    if (socialAccount.refreshToken) {
      credentials.refresh_token = socialAccount.refreshToken;
    }

    if (socialAccount.scope) {
      credentials.scope = socialAccount.scope;
    }

    oauth2Client.setCredentials(credentials);

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    // Get user's email address from Gmail profile
    const profile = await gmail.users.getProfile({
      userId: 'me'
    });

    const userEmail = profile.data.emailAddress;

    // Get full email content
    const email = await gmail.users.messages.get({
      userId: 'me',
      id: messageId,
      format: 'full'
    });

    const headers = email.data.payload?.headers || [];
    const subject = headers.find(h => h.name === 'Subject')?.value || '';
    const participants = extractParticipants(headers);
    const date = headers.find(h => h.name === 'Date')?.value || '';

    // Update participant roles based on user context
    participants.forEach(p => {
      if (p.email === userEmail) {
        p.role = 'user';
      }
    });

    // Extract body from payload
    const body = extractBody(email.data.payload);

    // Get thread history with enhanced context
    const thread = await gmail.users.threads.get({
      userId: 'me',
      id: email.data.threadId || ''
    });

    const threadContext: ThreadContext = {
      participants: [...participants],
      relationships: {}
    };

    const threadMessages = thread.data.messages || [];
    const threadHistory = threadMessages.map(msg => {
      const headers = msg.payload?.headers || [];
      const msgParticipants = extractParticipants(headers);
      
      // Update thread context with new participants
      msgParticipants.forEach(p => {
        if (!threadContext.participants.some(existing => existing.email === p.email)) {
          threadContext.participants.push(p);
        }
      });

      const msgFrom = msgParticipants.find(p => p.role === 'sender');
      const isFromUser = msgFrom?.email === userEmail;

      return {
        id: msg.id || '',
        from: msgFrom?.email || '',
        fromName: msgFrom?.name || '',
        date: headers.find(h => h.name === 'Date')?.value || '',
        body: extractBody(msg.payload),
        isFromUser,
        participants: msgParticipants
      };
    });

    return NextResponse.json({
      id: email.data.id,
      threadId: email.data.threadId,
      subject,
      participants,
      date,
      body,
      threadHistory,
      threadContext,
      userEmail
    });

  } catch (error) {
    console.error('[EMAIL_CONTENT_ERROR]', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 
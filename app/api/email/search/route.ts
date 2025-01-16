import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'
import { google } from 'googleapis'
import { GmailService } from '@/lib/services/gmail'
import { EmailMessage } from '@/types/social-platforms'

interface EmailSearchParams {
  query: string;
  sender?: string;
  recipient?: string;
  date?: string;
  threadId?: string;
  skipCache?: boolean;
}

interface EmailSearchResponse {
  resultCount: number;
  emails: Array<{
    id: string;
    threadId: string;
    subject: string;
    from: string;
    to: string[];
    date: Date;
    body: string;
    labels: string[];
    isRead: boolean;
    isStarred: boolean;
  }>;
}

// Simple in-memory cache for API responses
const responseCache = new Map<string, {
  timestamp: number;
  data: EmailSearchResponse;
}>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(params: EmailSearchParams, userId: string): string {
  return JSON.stringify({
    ...params,
    userId
  });
}

function getCachedResponse(cacheKey: string): EmailSearchResponse | null {
  const cached = responseCache.get(cacheKey);
  if (!cached) return null;

  if (Date.now() - cached.timestamp > CACHE_TTL) {
    responseCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json() as EmailSearchParams;
    const { query = '', sender, recipient, date, threadId, skipCache = false } = body;

    // Check cache first unless explicitly skipped
    if (!skipCache) {
      const cacheKey = getCacheKey(body, session.user.id);
      const cachedResponse = getCachedResponse(cacheKey);
      if (cachedResponse) {
        return NextResponse.json(cachedResponse);
      }
    }

    // Find Gmail account in Account table
    const account = await prisma.account.findFirst({
      where: {
        userId: session.user.id,
        provider: 'google'
      }
    });

    if (!account) {
      return new NextResponse('Gmail account not connected', { status: 400 });
    }

    // Initialize Gmail service with the user ID
    const gmailService = new GmailService(session.user.id);

    // Build search query
    let searchQuery = query;
    if (sender) searchQuery += ` from:${sender}`;
    if (recipient) searchQuery += ` to:${recipient}`;
    if (date) searchQuery += ` after:${new Date(date).getTime() / 1000}`;
    if (threadId) searchQuery += ` threadId:${threadId}`;

    // Search emails
    const emails = await gmailService.searchEmails(searchQuery, 20);

    const response: EmailSearchResponse = {
      resultCount: emails.length,
      emails: emails.map(email => ({
        id: email.id,
        threadId: email.threadId,
        subject: email.subject,
        from: email.from,
        to: email.to,
        date: email.date,
        body: email.body,
        labels: email.labels,
        isRead: email.isRead,
        isStarred: email.isStarred || false
      }))
    };

    // Cache the response
    if (!skipCache) {
      const cacheKey = getCacheKey(body, session.user.id);
      responseCache.set(cacheKey, {
        timestamp: Date.now(),
        data: response
      });
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in email search:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 
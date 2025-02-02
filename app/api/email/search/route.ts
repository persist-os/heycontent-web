import { NextResponse } from 'next/server'
import { auth } from '@/app/auth'
import prisma from '@/app/lib/prisma'
import { google } from 'googleapis'
import { GmailService } from '@/app/lib/services/gmail'
import { EmailMessage } from '@/app/types/social-platforms'

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

function formatDateForGmail(dateStr: string): { after: string, before: string } {
  try {
    // Parse the input date string
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error('Invalid date');
    }

    // Format for Gmail API query using YYYY/MM/DD format
    const formatDate = (d: Date) => {
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, '0');
      const day = d.getDate().toString().padStart(2, '0');
      return `${year}/${month}/${day}`;
    };

    // Get next day for before: query
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    return {
      after: formatDate(date),
      before: formatDate(nextDay)
    };
  } catch (error) {
    console.error('Error formatting date:', error);
    throw error;
  }
}

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
    let searchQuery = '';
    const searchParts = [];
    
    // Add base query if provided
    if (query) searchParts.push(query);
    
    // Add sender if provided
    if (sender) searchParts.push(`from:${sender}`);
    
    // Add recipient if provided
    if (recipient) searchParts.push(`to:${recipient}`);
    
    // Handle date search
    if (date) {
      try {
        const searchDate = new Date(date);
        const year = searchDate.getFullYear();
        const month = (searchDate.getMonth() + 1).toString().padStart(2, '0');
        const day = searchDate.getDate().toString().padStart(2, '0');
        
        // Get the next day for the before: query
        const nextDay = new Date(searchDate);
        nextDay.setDate(nextDay.getDate() + 1);
        const nextYear = nextDay.getFullYear();
        const nextMonth = (nextDay.getMonth() + 1).toString().padStart(2, '0');
        const nextDay2 = nextDay.getDate().toString().padStart(2, '0');
        
        // Add date range in Gmail's preferred format
        searchParts.push(`after:${year}/${month}/${day} before:${nextYear}/${nextMonth}/${nextDay2}`);
      } catch (error) {
        console.error('Error formatting date for search:', error);
      }
    }
    
    // Add thread ID if provided
    if (threadId) searchParts.push(`threadId:${threadId}`);

    // Combine all parts with spaces
    searchQuery = searchParts.join(' ');
    console.log('Final search query:', searchQuery);

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
        labels: email.labels || [],
        isRead: email.isRead || false,
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
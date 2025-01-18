import { BaseTool } from './base-tool';
import { GmailService } from '@/lib/services/gmail';
import { z } from 'zod';
import type { EmailMessage, PartnershipEmail, EmailThread, ThreadMessage } from '../../../types/social-platforms';

// Simple in-memory cache for email searches
const searchCache = new Map<string, {
  timestamp: number;
  results: (EmailMessage | PartnershipEmail)[];
}>();

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class EmailSearchTool extends BaseTool {
  private gmailService: GmailService;
  name = 'email_search';
  description = 'Search through Gmail emails with optional filters for sender, date, and max results. Returns email content with thread context.';
  
  _schema = z.object({
    query: z.string().describe('The search query to find emails'),
    sender: z.string().optional().describe('Filter emails by sender email address'),
    date: z.string().optional().describe('Filter emails after this date'),
    maxResults: z.number().optional().describe('Maximum number of results to return'),
    includeThreads: z.boolean().optional().describe('Whether to include thread context'),
    labelIds: z.array(z.string()).optional().describe('Filter by specific Gmail labels'),
    skipCache: z.boolean().optional().describe('Whether to skip cache and force fresh search')
  });

  constructor(userId: string) {
    super();
    this.gmailService = new GmailService(userId);
  }

  private getCacheKey(args: z.infer<typeof this._schema>): string {
    return JSON.stringify({
      query: args.query,
      sender: args.sender,
      date: args.date,
      maxResults: args.maxResults,
      includeThreads: args.includeThreads,
      labelIds: args.labelIds
    });
  }

  private getCachedResults(cacheKey: string): (EmailMessage | PartnershipEmail)[] | null {
    const cached = searchCache.get(cacheKey);
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      searchCache.delete(cacheKey);
      return null;
    }

    return cached.results;
  }

  private buildSearchQuery(query: string, sender?: string, date?: string): string {
    // Initialize empty array for query parts
    const parts: string[] = [];
    
    // Ensure query is a string and handle undefined/null cases
    const safeQuery = (query || '').trim();
    
    // For recent emails search, use a date filter
    if (safeQuery.toLowerCase().includes('recent')) {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      parts.push(`after:${Math.floor(lastWeek.getTime() / 1000)}`);
      parts.push('!in:spam !in:trash');
    }

    // Check for direct "from:" queries first
    const fromMatch = safeQuery.match(/from:\s*([^\s]+)/i);
    if (fromMatch) {
      // If it's a direct from: query, use it as is
      parts.push(safeQuery);
    } else if (sender) {
      // If sender is provided as a parameter, format it properly
      parts.push(`from:${sender}`);
    } else {
      // Try to extract sender from the query
      const senderMatch = safeQuery.match(/(?:from|by|sent by)\s+([^.,\s]+(?:\s+[^.,\s]+)*)/i);
      if (senderMatch) {
        const extractedSender = senderMatch[1].trim();
        if (extractedSender) {
          parts.push(`from:${extractedSender}`);
        }
      } else if (!this.isCommonEmailTerms(safeQuery)) {
        // If no sender found and query is not just common terms, use it as a general search
        parts.push(safeQuery);
      }
    }
    
    // Add date filter if provided
    if (date) {
      try {
        const timestamp = new Date(date).getTime() / 1000;
        if (!isNaN(timestamp)) {
          parts.push(`after:${timestamp}`);
        }
      } catch (error) {
        console.warn('Invalid date provided:', date);
      }
    }
    
    // Return empty string if no valid parts (will be handled by calling method)
    return parts.join(' ');
  }

  private isCommonEmailTerms(query: string): boolean {
    const commonTerms = [
      'email', 'emails', 'message', 'messages', 'find', 'search', 'show', 'get',
      'recent', 'latest', 'last', 'new', 'unread', 'read', 'sent', 'received'
    ];
    const words = query.toLowerCase().split(/\s+/);
    return words.every(word => commonTerms.includes(word));
  }

  private formatSearchResults(messages: EmailMessage[]): EmailMessage[] {
    return messages.map(email => ({
      id: email.id,
      threadId: email.threadId || '',
      subject: email.subject,
      from: email.from,
      to: email.to,
      date: email.date,
      body: this.truncateBody(email.body),
      isRead: email.isRead,
      isStarred: email.isStarred,
      labels: email.labels || []
    }));
  }

  private truncateBody(body?: string): string {
    if (!body) return '';
    return body.length > 500 ? body.substring(0, 500) + '...' : body;
  }

  async _call(args: z.infer<typeof this._schema> | { input: string } | string): Promise<any> {
    try {
      // Handle different input types
      let query: string;
      let maxResults = 20;
      let includeThreads = true;
      let labelIds: string[] = [];
      let skipCache = false;

      if (typeof args === 'string') {
        query = args;
      } else if ('input' in args) {
        query = args.input;
      } else {
        query = args.query;
        maxResults = args.maxResults ?? 20;
        includeThreads = args.includeThreads ?? true;
        labelIds = args.labelIds ?? [];
        skipCache = args.skipCache ?? false;
      }

      // Check cache first unless explicitly skipped
      if (!skipCache) {
        const cacheKey = JSON.stringify({ query, maxResults, includeThreads, labelIds });
        const cachedResults = this.getCachedResults(cacheKey);
        if (cachedResults) {
          return {
            success: true,
            results: cachedResults,
            resultCount: cachedResults.length,
            formattedString: this.formatResultsAsString(cachedResults)
          };
        }
      }

      // Build search query - pass through valid Gmail queries
      const searchQuery = query.trim();
      if (!searchQuery) {
        return {
          success: false,
          error: "Empty search query",
          results: [],
          resultCount: 0,
          formattedString: "Please provide a search query."
        };
      }
      
      try {
        // Perform the search
        const messages = await this.gmailService.searchEmails(searchQuery, maxResults);
        const results = this.formatSearchResults(messages);

        // Cache results if successful
        if (!skipCache && messages.length > 0) {
          const cacheKey = JSON.stringify({ query, maxResults, includeThreads, labelIds });
          searchCache.set(cacheKey, {
            timestamp: Date.now(),
            results
          });
        }

        const formattedString = this.formatResultsAsString(results);
        return {
          success: true,
          results,
          resultCount: results.length,
          formattedString
        };

      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error('Unknown error occurred');
        if (error.message?.includes('Gmail authorization failed')) {
          const response = {
            success: false,
            error: 'Gmail authorization required',
            results: [],
            resultCount: 0,
            formattedString: "Please connect your Gmail account first to search emails."
          };
          console.error('Gmail auth error:', error);
          return response;
        }
        console.error('Error in email search:', error);
        return {
          success: false,
          error: error.message,
          results: [],
          resultCount: 0,
          formattedString: "I encountered an error while searching your emails. Please try again or rephrase your search."
        };
      }
    } catch (err: unknown) {
      console.error('Error in EmailSearchTool:', err);
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      return {
        success: false,
        error: error.message,
        results: [],
        resultCount: 0,
        formattedString: "An unexpected error occurred while searching emails."
      };
    }
  }

  private formatResultsAsString(results: (EmailMessage | PartnershipEmail)[]): string {
    if (results.length === 0) {
      return "No emails found matching the search criteria.";
    }

    const summary = `Found ${results.length} email(s):\n\n`;
    const formattedResults = results.map((email, index) => {
      const date = new Date(email.date).toLocaleString();
      return `Email ${index + 1}:
From: ${email.from}
Subject: ${email.subject}
Date: ${date}
Body: ${email.body ? this.truncateBody(email.body) : 'No content available'}
---`;
    }).join('\n\n');

    return summary + formattedResults;
  }

  private isPartnershipQuery(query: string): boolean {
    const partnershipKeywords = ['partnership', 'collaboration', 'sponsor', 'brand deal', 'promotion', 'advertising', 'affiliate', 'ambassador', 'influencer'];
    return partnershipKeywords.some(keyword => query.toLowerCase().includes(keyword));
  }

  private isPartnershipEmail(email: EmailMessage | PartnershipEmail): email is PartnershipEmail {
    return 'analysis' in email;
  }
} 
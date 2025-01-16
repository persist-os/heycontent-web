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
    const parts = [];
    
    // For recent emails search, use a date filter
    if (query.toLowerCase().includes('recent')) {
      const lastWeek = new Date();
      lastWeek.setDate(lastWeek.getDate() - 7);
      parts.push(`after:${Math.floor(lastWeek.getTime() / 1000)}`);
      parts.push('!in:spam !in:trash');
    }

    // Check for direct "from:" queries first
    const fromMatch = query.match(/from:\s*([^\s]+)/i);
    if (fromMatch) {
      parts.push(`from:${fromMatch[1]}`);
    } else if (sender) {
      // If sender is provided, use it directly
      parts.push(`from:${sender}`);
    } else {
      // Try to extract sender from the query
      const senderMatch = query.match(/(?:from|by|sent by)\s+([^.,\s]+(?:\s+[^.,\s]+)*)/i);
      if (senderMatch) {
        const extractedSender = senderMatch[1].trim();
        if (extractedSender) {
          parts.push(`from:${extractedSender}`);
        }
      } else if (!this.isCommonEmailTerms(query)) {
        // If no sender found and query is not just common terms, use it as a general search
        parts.push(query);
      }
    }
    
    // Add date filter if provided
    if (date) {
      const timestamp = new Date(date).getTime() / 1000;
      parts.push(`after:${timestamp}`);
    }
    
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

  async _call(args: z.infer<typeof this._schema>) {
    try {
      const { query, sender, date, maxResults = 20, includeThreads = true, labelIds, skipCache = false } = args;
      
      // Check cache first unless explicitly skipped
      if (!skipCache) {
        const cacheKey = this.getCacheKey(args);
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

      // Build search query
      let searchQuery = this.buildSearchQuery(query, sender, date);
      if (!searchQuery) {
        return {
          success: false,
          error: "Invalid search query",
          results: [],
          resultCount: 0,
          formattedString: "Could not build a valid search query from the provided terms."
        };
      }
      
      try {
        // First attempt: Direct search
        let messages = await this.gmailService.searchEmails(searchQuery, maxResults);

        // Second attempt: Try fuzzy search if no results
        if (messages.length === 0 && (sender || query.toLowerCase().includes('from'))) {
          const searchTerm = sender || query.match(/from\s+([a-zA-Z\s]+)(?:\s|$)/i)?.[1];
          if (searchTerm) {
            const fuzzyQuery = searchTerm.split(/[\s,]+/)
              .filter(part => part.length > 2)
              .map(part => `from:${part}`)
              .join(' OR ');
            if (fuzzyQuery) {
              messages = await this.gmailService.searchEmails(fuzzyQuery, maxResults);
            }
          }
        }

        // If still no results and it's a recent emails search, try without other filters
        if (messages.length === 0 && query.toLowerCase().includes('recent')) {
          const lastWeek = new Date();
          lastWeek.setDate(lastWeek.getDate() - 7);
          const recentQuery = `after:${Math.floor(lastWeek.getTime() / 1000)} !in:spam !in:trash`;
          messages = await this.gmailService.searchEmails(recentQuery, maxResults);
        }

        const results = this.formatSearchResults(messages);

        // Cache results only if the search was successful
        if (!skipCache && messages.length > 0) {
          const cacheKey = this.getCacheKey(args);
          searchCache.set(cacheKey, {
            timestamp: Date.now(),
            results
          });
        }

        return {
          success: true,
          results,
          resultCount: results.length,
          formattedString: this.formatResultsAsString(results)
        };

      } catch (err: unknown) {
        const error = err instanceof Error ? err : new Error('Unknown error occurred');
        if (error.message?.includes('Gmail authorization failed')) {
          throw new Error('Gmail authorization required');
        }
        console.error('Error in email search:', error);
        return {
          success: false,
          error: error.message,
          results: [],
          resultCount: 0,
          formattedString: "No emails found due to an error in the search."
        };
      }
    } catch (err: unknown) {
      console.error('Error in EmailSearchTool:', err);
      const error = err instanceof Error ? err : new Error('Unknown error occurred');
      throw error;
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
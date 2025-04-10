import { BaseTool } from './base-tool';
import { GmailService } from '../../../lib/services/gmail';
import { z } from 'zod';
import type { EmailMessage, PartnershipEmail, EmailThread, ThreadMessage } from '../../../types/social-platforms';
import { EmailContextManager } from '../email-context-manager';
import { EmailMemoryManagerImpl } from '../../../lib/memory/email-memory-manager';
import { AdvancedMemorySystem } from '../../../lib/memory/advanced-memory-system';
import { serviceStateManager } from '../../../lib/services/service-state-manager';
import { searchResultCache } from '../../services/search-result-cache';

// Simple in-memory cache for email searches
const searchCache = new Map<string, {
  timestamp: number;
  results: (EmailMessage | PartnershipEmail)[];
}>();

const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

interface EmailSearchResult {
  success: boolean;
  results: (EmailMessage | PartnershipEmail)[];
  resultCount: number;
  formattedString: string;
  source: 'memory' | 'api' | 'both' | 'cache' | 'cache_similar' | 'context';
  error?: string;
}

interface CrossPlatformContext {
  emailContext: (EmailMessage | PartnershipEmail)[];
  contentContext?: {
    type: 'video' | 'post' | 'analytics';
    data: any;
  };
  timestamp: number;
}

interface SearchError {
  code: string;
  message: string;
  type: 'auth' | 'rate_limit' | 'query' | 'service' | 'network' | 'unknown';
  retryable: boolean;
  context?: any;
}

interface SearchAttempt {
  strategy: string;
  query: string;
  timestamp: number;
  success: boolean;
  error?: SearchError;
  resultCount: number;
}

export class EmailSearchTool extends BaseTool {
  private emailContextManager: EmailContextManager;
  private emailMemoryManager: EmailMemoryManagerImpl;
  private gmailService: GmailService;
  private crossPlatformContext: CrossPlatformContext | null = null;
  
  name = 'email_search';
  description = 'Search through Gmail emails with optional filters for sender, date, and max results. Returns email content with thread context.';
  
  _schema = z.object({
    query: z.string().describe('The search query to find emails'),
    sender: z.string().optional().describe('Filter emails by sender email address'),
    date: z.string().optional().describe('Filter emails after this date'),
    maxResults: z.number().optional().describe('Maximum number of results to return'),
    includeThreads: z.boolean().optional().describe('Whether to include thread context'),
    labelIds: z.array(z.string()).optional().describe('Filter by specific Gmail labels'),
    skipCache: z.boolean().optional().describe('Whether to skip cache and force fresh search'),
    skipMemory: z.boolean().optional().describe('Whether to skip memory search and force API search')
  });

  private activeEmailContext: {
    emails: (EmailMessage | PartnershipEmail)[];
    lastQuery: string;
    timestamp: number;
  } | null = null;

  private searchAttempts: SearchAttempt[] = [];
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  constructor(
    userId: string, 
    emailContextManager: EmailContextManager,
    memorySystem: AdvancedMemorySystem
  ) {
    super();
    this.gmailService = new GmailService(userId);
    this.emailContextManager = emailContextManager;
    this.emailMemoryManager = new EmailMemoryManagerImpl(memorySystem);
  }

  private getCacheKey(args: z.infer<typeof this._schema>): string {
    return JSON.stringify({
      query: args.query,
      sender: args.sender,
      date: args.date,
      maxResults: args.maxResults,
      labelIds: args.labelIds
    });
  }

  private async ensureServiceReady(): Promise<boolean> {
    const state = await serviceStateManager.getState('gmail');
    
    if (!state.isAuthenticated || !state.isConnected) {
      return false;
    }
    
    return true;
  }

  private formatCrossPlatformResponse(
    emails: (EmailMessage | PartnershipEmail)[],
    query: string
  ): string {
    // Extract key requirements or topics from emails
    const emailTopics = emails.map(email => {
      const text = `${email.subject} ${email.snippet || email.body || ''}`;
      return {
        date: email.date,
        topics: this.extractKeyTopics(text),
        requirements: this.extractRequirements(text),
        type: this.detectEmailType(text),
        metrics: this.extractMetrics(text),
        sentiment: this.extractSentiment(text),
        actions: this.extractActions(text)
      };
    });

    // Group by type for better analysis
    const groupedByType = emailTopics.reduce((acc, email) => {
      if (!acc[email.type]) {
        acc[email.type] = [];
      }
      acc[email.type].push(email);
      return acc;
    }, {} as Record<string, typeof emailTopics[0][]>);

    // Format the analysis
    const typeAnalysis = Object.entries(groupedByType).map(([type, emails]) => `
${type} Emails (${emails.length}):
${emails.map((email, index) => `
Email ${index + 1} (${email.date.toLocaleDateString()}):
Topics: ${email.topics.join(', ') || 'None specified'}
Requirements: ${email.requirements.join(', ') || 'None specified'}
Metrics: ${Object.entries(email.metrics).map(([k, v]) => `${k}: ${v}`).join(', ') || 'None specified'}
Sentiment: ${email.sentiment || 'Neutral'}
Actions: ${email.actions.join(', ') || 'None specified'}
`).join('\n')}
`).join('\n');

    // Calculate overall statistics
    const stats = {
      totalEmails: emails.length,
      averageMetrics: this.calculateAverageMetrics(emailTopics),
      commonTopics: this.findCommonElements(emailTopics.map(e => e.topics)),
      commonRequirements: this.findCommonElements(emailTopics.map(e => e.requirements)),
      sentimentBreakdown: this.calculateSentimentBreakdown(emailTopics)
    };

    return `Here's my analysis of the email content:

OVERVIEW:
Total Emails: ${stats.totalEmails}
Common Topics: ${stats.commonTopics.join(', ')}
Overall Sentiment: ${this.determineOverallSentiment(stats.sentimentBreakdown)}

DETAILED ANALYSIS BY TYPE:
${typeAnalysis}

METRICS SUMMARY:
${Object.entries(stats.averageMetrics).map(([k, v]) => `Average ${k}: ${v}`).join('\n')}

SENTIMENT BREAKDOWN:
${Object.entries(stats.sentimentBreakdown).map(([k, v]) => `${k}: ${v}%`).join('\n')}

To fully compare this with your content, I would need access to:
1. Your content analytics
2. Performance metrics
3. Audience demographics

This would allow me to provide a detailed alignment analysis between the email requirements and your content performance.`;
  }

  private extractRequirements(text: string): string[] {
    const requirements: string[] = [];
    const patterns = [
      /(?:need|require|must have|should have|looking for) ([^.!?]+)/gi,
      /requirements?:?\s*([^.!?]+)/gi,
      /guidelines?:?\s*([^.!?]+)/gi,
      /criteria:?\s*([^.!?]+)/gi
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        requirements.push(match[1].trim());
      }
    });

    return Array.from(new Set(requirements));
  }

  private detectEmailType(text: string): string {
    if (/giveaway|contest|raffle/i.test(text)) return 'Giveaway/Contest';
    if (/sponsor|sponsorship|partnership|collab/i.test(text)) return 'Sponsorship';
    if (/review|feedback|opinion/i.test(text)) return 'Review Request';
    if (/promote|marketing|campaign/i.test(text)) return 'Promotion';
    return 'General';
  }

  private extractMetrics(text: string): Record<string, string> {
    const metrics: Record<string, string> = {};
    const patterns = {
      views: /(\d[\d,]+)\s*(?:views|impressions)/i,
      engagement: /(\d[\d,.]+%?)\s*engagement/i,
      duration: /(\d[\d,.]+)\s*(?:minutes|seconds|hrs?)/i,
      budget: /\$\s*(\d[\d,]+)/,
      followers: /(\d[\d,]+)\s*followers/i
    };

    Object.entries(patterns).forEach(([key, pattern]) => {
      const match = text.match(pattern);
      if (match) {
        metrics[key] = match[1];
      }
    });

    return metrics;
  }

  private generateNameVariations(name: string): string[] {
    // Remove any email addresses from the name
    const cleanName = name.replace(/<[^>]+>/, '').trim();
    
    // Split into parts (first name, last name, etc)
    const parts = cleanName.split(/\s+/);
    
    const variations: Set<string> = new Set();
    
    // Add original name
    variations.add(cleanName);
    
    // Add case variations
    variations.add(cleanName.toLowerCase());
    variations.add(cleanName.toUpperCase());
    variations.add(cleanName.charAt(0).toUpperCase() + cleanName.slice(1).toLowerCase());
    
    // If we have multiple parts, add variations with different orderings
    if (parts.length > 1) {
      // First name only
      variations.add(parts[0]);
      // Last name only
      variations.add(parts[parts.length - 1]);
      // First name + last initial
      variations.add(`${parts[0]} ${parts[parts.length - 1].charAt(0)}`);
      // First initial + last name
      variations.add(`${parts[0].charAt(0)} ${parts[parts.length - 1]}`);
      // Reversed order
      variations.add(parts.reverse().join(' '));
    }
    
    // Add initials
    if (parts.length > 1) {
      variations.add(parts.map(p => p.charAt(0)).join(''));
      variations.add(parts.map(p => p.charAt(0)).join('.'));
    }
    
    return Array.from(variations);
  }

  async _call(args: z.infer<typeof this._schema>): Promise<EmailSearchResult> {
    return this.execute(args);
  }

  async execute(args: z.infer<typeof this._schema>): Promise<EmailSearchResult> {
    try {
      const isReady = await this.ensureServiceReady();
      if (!isReady) {
        const state = await serviceStateManager.getState('gmail');
        return {
          success: false,
          results: [],
          resultCount: 0,
          formattedString: state.error || 'Gmail service is not ready. Please authenticate first.',
          source: 'api',
          error: state.error || 'Service not ready'
        };
      }

      // Get the normalized query
      const normalizedQuery = typeof args === 'string' ? args : args.query;
      
      if (!normalizedQuery) {
        return {
          success: false,
          results: [],
          resultCount: 0,
          formattedString: '',
          source: 'api',
          error: 'No search query provided'
        };
      }

      // Check for cross-platform analysis questions
      const isCrossPlatformQuery = /align|compare|match|fit|work with|similar to|difference|between/i.test(normalizedQuery);
      if (isCrossPlatformQuery && this.activeEmailContext) {
        return {
          success: true,
          results: this.activeEmailContext.emails,
          resultCount: this.activeEmailContext.emails.length,
          formattedString: this.formatCrossPlatformResponse(this.activeEmailContext.emails, normalizedQuery),
          source: 'context'
        };
      }

      // Check for temporal queries
      const isTemporalQuery = normalizedQuery.includes('/') || /yesterday|today|tomorrow|\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2}/i.test(normalizedQuery);
      if (isTemporalQuery) {
        const dateMatch = normalizedQuery.match(/(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{2}-\d{2})/);
        if (dateMatch) {
          args = {
            ...args,
            date: dateMatch[1]
          };
        }
      }

      // Check if this is a follow-up question about the active email context
      if (this.activeEmailContext && 
          Date.now() - this.activeEmailContext.timestamp < 30 * 60 * 1000) { // 30 minute TTL
        
        // Look for question patterns about the active emails
        const isFollowUp = /when|who|what|date|subject|content|about|advice|suggest|help|think|analyze/i.test(normalizedQuery);
        
        if (isFollowUp) {
          return {
            success: true,
            results: this.activeEmailContext.emails,
            resultCount: this.activeEmailContext.emails.length,
            formattedString: this.formatPersonSearchResults(this.activeEmailContext.emails, normalizedQuery, true),
            source: 'context'
          };
        }
      }

      // Check cache first unless skipCache is true
      if (!args.skipCache) {
        const cachedResults = searchResultCache.get(normalizedQuery, {
          sender: args.sender,
          date: args.date,
          maxResults: args.maxResults
        });

        if (cachedResults) {
          return {
            success: true,
            results: cachedResults,
            resultCount: cachedResults.length,
            formattedString: this.formatPersonSearchResults(cachedResults, normalizedQuery, !!args.sender),
            source: 'cache'
          };
        }

        // Check for similar results
        const similarResults = searchResultCache.getSimilarResults(normalizedQuery);
        if (similarResults) {
          return {
            success: true,
            results: similarResults,
            resultCount: similarResults.length,
            formattedString: this.formatPersonSearchResults(similarResults, normalizedQuery, !!args.sender),
            source: 'cache_similar'
          };
        }
      }

      // Extract name for person-specific searches
      const nameMatch = normalizedQuery.match(/(?:emails? (?:with|from|to)\s+)(\w+(?:\s+\w+)*)/i);
      const personName = nameMatch ? nameMatch[1].trim() : null;
      
      // Build search query string - Simplified and more precise
      let finalSearchQuery = '';
      
      if (personName) {
        // For person searches, focus on exact matches in from/to fields
        const exactName = personName.toLowerCase();
        finalSearchQuery = `(from:${exactName} OR to:${exactName})`;
        
        // If we have a full name, also try email pattern matching
        if (exactName.includes(' ')) {
          const [firstName, lastName] = exactName.split(' ');
          finalSearchQuery += ` OR from:${firstName}.${lastName}* OR from:${firstName}${lastName}*`;
        }

        // Check previous searches for exact email matches
        const previousSearches = await this.emailContextManager.getPreviousSearches();
        const relevantPreviousSearch = previousSearches.find(search => {
          const currentName = normalizedQuery.match(/(?:emails? (?:with|from|to)\s+)(\w+)/i)?.[1]?.toLowerCase();
          const previousName = search.query.match(/(?:emails? (?:with|from|to)\s+)(\w+)/i)?.[1]?.toLowerCase();
          return currentName && previousName && currentName === previousName && search.results.length > 0;
        });

        if (relevantPreviousSearch) {
          const emailAddress = relevantPreviousSearch.results[0].from.match(/<(.+?)>/)?.[1] || 
                             relevantPreviousSearch.results[0].from;
          finalSearchQuery += ` OR from:${emailAddress}`;
        }
      }
      
      if (args.date) {
        finalSearchQuery += ` after:${args.date}`;
      }
      
      if (args.labelIds?.length) {
        const labelQuery = args.labelIds.map(id => `label:${id}`).join(' ');
        finalSearchQuery += ` ${labelQuery}`;
      }

      // Add any remaining search terms
      const remainingTerms = normalizedQuery.replace(/emails? (?:with|from|to)\s+\w+/i, '').trim();
      if (remainingTerms) {
        finalSearchQuery += ` ${remainingTerms}`;
      }

      // Use the executeSearchStrategy method with the simplified query
      const result = await this.executeSearchStrategy(
        personName ? 'person_search' : 'general_search',
        finalSearchQuery || normalizedQuery,
        args
      );

      // Update active context with new results
      if (result.success && result.results.length > 0) {
        this.activeEmailContext = {
          emails: result.results,
          lastQuery: normalizedQuery,
          timestamp: Date.now()
        };

        // Cache the results
        searchResultCache.set(normalizedQuery, result.results, {
          sender: args.sender,
          date: args.date,
          maxResults: args.maxResults
        });
      }

      return result;
    } catch (error) {
      const classifiedError = this.classifyError(error);
      console.error('Email search failed:', classifiedError);
      
      return {
        success: false,
        results: [],
        resultCount: 0,
        formattedString: `Search failed: ${classifiedError.message}`,
        source: 'api',
        error: classifiedError.message
      };
    }
  }

  private formatPersonSearchResults(
    results: (EmailMessage | PartnershipEmail)[],
    query: string,
    isPersonSearch: boolean
  ): string {
    if (results.length === 0) {
      return 'No emails found matching your search criteria.';
    }

    // Check for specific question types
    const isWhenQuestion = /when|date|time/i.test(query);
    const isWhoQuestion = /who|sender|from|sent/i.test(query);
    const isWhatQuestion = /what|about|content|subject/i.test(query);
    const isAdviceQuestion = /advice|suggest|help|think|analyze/i.test(query);

    if (isWhenQuestion) {
      return this.formatDateResponse(results);
    } else if (isWhoQuestion) {
      return this.formatSenderResponse(results);
    } else if (isWhatQuestion) {
      return this.formatContentResponse(results);
    } else if (isAdviceQuestion) {
      return this.formatAdviceResponse(results, query);
    }

    // For person searches, provide a focused summary
    if (isPersonSearch) {
      const summary = `Found ${results.length} relevant email${results.length === 1 ? '' : 's'}:`;
      
      const formattedEmails = results
        .sort((a, b) => b.date.getTime() - a.date.getTime()) // Most recent first
        .map((email, index) => {
          const date = email.date instanceof Date 
            ? email.date.toLocaleDateString()
            : new Date(email.date).toLocaleDateString();

          return `${index + 1}. [${date}] ${email.subject}
   From: ${email.from.split('<')[0].trim()}`;
        })
        .join('\n\n');

      return `${summary}\n\n${formattedEmails}`;
    }

    // For general searches, keep the existing format
    const summary = `Here are the ${results.length} most relevant email${results.length === 1 ? '' : 's'}:`;

    const formattedEmails = results.map((email, index) => {
      const date = email.date instanceof Date 
        ? email.date.toLocaleDateString()
        : new Date(email.date).toLocaleDateString();

      return `${index + 1}. **Subject:** ${email.subject}
   - **Date:** ${date}
   - **From:** ${email.from}
   - **Summary:** ${(email as any).analysis?.summary || email.body?.substring(0, 200) || 'No summary available'}`;
    }).join('\n\n');

    return `${summary}\n\n${formattedEmails}`;
  }

  private formatDateResponse(results: (EmailMessage | PartnershipEmail)[]): string {
    return results.map((email, index) => {
      const date = email.date instanceof Date 
        ? email.date.toLocaleString()
        : new Date(email.date).toLocaleString();
      return `Email ${index + 1} was sent on ${date}`;
    }).join('\n');
  }

  private formatSenderResponse(results: (EmailMessage | PartnershipEmail)[]): string {
    return results.map((email, index) => {
      return `Email ${index + 1} was sent by ${email.from}`;
    }).join('\n');
  }

  private formatContentResponse(results: (EmailMessage | PartnershipEmail)[]): string {
    return results.map((email, index) => {
      return `${index + 1}. **Subject:** ${email.subject}
   - **From:** ${email.from}
   - **Summary:** ${(email as any).analysis?.summary || email.body?.substring(0, 200) || 'No summary available'}
   - **Key Points:** ${(email as any).analysis?.key_points?.join(', ') || 'No key points available'}`;
    }).join('\n\n');
  }

  private formatAdviceResponse(results: (EmailMessage | PartnershipEmail)[], query: string): string {
    // Combine email content for context
    const context = results.map(email => `
Subject: ${email.subject}
From: ${email.from}
Content: ${email.snippet || (email as any).body?.substring(0, 200)}
`).join('\n---\n');

    return `Based on the email${results.length > 1 ? 's' : ''}:
${context}

Let me analyze this for you...
[Note: This is where we would integrate with an AI analysis component to provide specific advice based on the query]`;
  }

  private formatDetailedResults(results: (EmailMessage | PartnershipEmail)[], query: string = '', isNameSearch: boolean = false): string {
    if (!results.length) return 'No emails found matching your search criteria.';

    // Always use overview format for name searches or general queries
    const isGeneralQuery = /what|tell me about|how many|overview|summary|analyze|emails? with|emails? from|about|look at/i.test(query.toLowerCase());
    
    // Force overview format for name searches
    if (isNameSearch || isGeneralQuery || !query.includes('@')) {
      return this.generateOverview(results);
    } else {
      return this.generateDetailedView(results);
    }
  }

  private generateOverview(emails: (EmailMessage | PartnershipEmail)[]): string {
    // Group emails by both thread and person
    const threadMap = new Map<string, (EmailMessage | PartnershipEmail)[]>();
    const emailsByPerson = new Map<string, {
      sent: (EmailMessage | PartnershipEmail)[],
      received: (EmailMessage | PartnershipEmail)[],
      commonParticipants: Set<string>,
      threads: Set<string>
    }>();
    
    // Process all emails for both groupings
    emails.forEach(email => {
      // Thread grouping
      const threadId = email.threadId || 'unthreaded';
      if (!threadMap.has(threadId)) {
        threadMap.set(threadId, []);
      }
      threadMap.get(threadId)!.push(email);

      // Person grouping
      const processParticipant = (participant: string, isSender: boolean) => {
        const normalizedEmail = participant.toLowerCase().match(/<(.+?)>/) ?? [null, participant.toLowerCase()];
        const emailAddress = normalizedEmail[1];
        const displayName = participant.split('<')[0].trim() || emailAddress;
        
        if (!emailsByPerson.has(emailAddress)) {
          emailsByPerson.set(emailAddress, {
            sent: [],
            received: [],
            commonParticipants: new Set(),
            threads: new Set()
          });
        }
        
        const personData = emailsByPerson.get(emailAddress)!;
        
        if (isSender) {
          personData.sent.push(email);
        } else {
          personData.received.push(email);
        }

        if (email.threadId) {
          personData.threads.add(email.threadId);
        }

        [...email.to, email.from].forEach(p => {
          const normalized = p.toLowerCase().match(/<(.+?)>/) ?? [null, p.toLowerCase()];
          personData.commonParticipants.add(normalized[1]);
        });
      };

      processParticipant(email.from, true);
      email.to.forEach(recipient => processParticipant(recipient, false));
    });

    // Build the summary sections
    const summary: string[] = [];

    // 1. Person-based Overview
    summary.push('COMMUNICATION OVERVIEW BY PERSON');
    emailsByPerson.forEach((data, person) => {
      const displayName = person.split('@')[0];
      summary.push(
        `${displayName}:`,
        `- Sent: ${data.sent.length} emails`,
        `- Received: ${data.received.length} emails`,
        `- Active in ${data.threads.size} threads`,
        `- Common participants: ${Array.from(data.commonParticipants).map(p => p.split('@')[0]).join(', ')}`,
        ''
      );
    });

    // 2. Thread-based Analysis
    const mainThread = Array.from(threadMap.entries())
      .sort((a, b) => b[1].length - a[1].length)[0];

    const allDates = emails.map(e => e.date.getTime());
    const dateRange = {
      earliest: new Date(Math.min(...allDates)),
      latest: new Date(Math.max(...allDates))
    };

    summary.push(
      'THREAD ANALYSIS',
      `Time Range: ${dateRange.earliest.toLocaleDateString()} - ${dateRange.latest.toLocaleDateString()}`,
      `Total Threads: ${threadMap.size}`,
      `Most Active Thread: ${mainThread ? this.extractEmailTopic(mainThread[1][0].subject) : 'N/A'} (${mainThread ? mainThread[1].length : 0} messages)`,
      ''
    );

    // 3. Recent Updates
    summary.push('RECENT UPDATES');
    const recentEmails = emails
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 5);

    recentEmails.forEach(email => {
      const date = email.date.toLocaleDateString();
      const shortDate = date.split('/').slice(0, 2).join('/');
      const emailSummary = this.createBriefSummary(email.snippet || email.body);
      const status = this.determineEmailStatus(email.snippet || email.body);
      
      summary.push(
        `[${shortDate}] ${this.extractEmailTopic(email.subject)}`,
        `- From: ${email.from.split('<')[0].trim()}`,
        `- ${emailSummary}`,
        `- Status: ${status}`,
        ''
      );
    });

    // 4. Pending Actions
    const pendingActions = this.extractPendingActions(emails);
    if (pendingActions.length > 0) {
      summary.push(
        'PENDING ACTIONS',
        ...pendingActions.map((action, index) => `${index + 1}. ${action}`),
        ''
      );
    }

    return summary.join('\n');
  }

  private getEmailStats(emailsByPerson: Map<string, {
    sent: (EmailMessage | PartnershipEmail)[],
    received: (EmailMessage | PartnershipEmail)[],
    commonParticipants: Set<string>,
    commonTopics: string[],
    threads: Set<string>
  }>): {
    totalThreads: number,
    sent: number,
    received: number,
    activeParticipants: number,
    commonTopics: string[]
  } {
    let totalThreads = new Set<string>();
    let totalSent = 0;
    let totalReceived = 0;
    let allParticipants = new Set<string>();
    let topicFrequency = new Map<string, number>();

    emailsByPerson.forEach((data, person) => {
      totalSent += data.sent.length;
      totalReceived += data.received.length;
      data.threads.forEach(thread => totalThreads.add(thread));
      data.commonParticipants.forEach(p => allParticipants.add(p));
      
      // Process topics
      const allEmails = [...data.sent, ...data.received];
      const topics = this.extractTopics(allEmails);
      topics.forEach(topic => {
        topicFrequency.set(topic, (topicFrequency.get(topic) || 0) + 1);
      });
    });

    // Get top 5 most common topics
    const commonTopics = Array.from(topicFrequency.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([topic]) => topic);

    return {
      totalThreads: totalThreads.size,
      sent: totalSent,
      received: totalReceived,
      activeParticipants: allParticipants.size,
      commonTopics
    };
  }

  private extractCampaignDetails(emails: (EmailMessage | PartnershipEmail)[]): {
    name: string;
    type: string;
    status: string;
    participants: string[];
  } {
    // Extract campaign name from subject
    const subject = emails[0].subject;
    const name = subject.replace(/^Re:\s*/, '').split('-')[0].trim();

    // Determine campaign type
    const type = subject.toLowerCase().includes('giveaway') ? 'Giveaway Campaign' : 'Marketing Campaign';

    // Get unique participants
    const participants = new Set<string>();
    emails.forEach(email => {
      const senderName = email.from.split('<')[0].trim();
      participants.add(senderName);
      email.to.forEach(to => {
        const recipientName = to.split('<')[0].trim();
        participants.add(recipientName);
      });
    });

    // Determine current status
    const latestEmail = emails.sort((a, b) => b.date.getTime() - a.date.getTime())[0];
    const status = this.determineEmailStatus(latestEmail.snippet || latestEmail.body);

    return {
      name,
      type,
      status,
      participants: Array.from(participants)
    };
  }

  private extractEmailTopic(subject: string): string {
    if (!subject) return 'No Subject';
    return subject
      .replace(/^Re:\s*/, '')  // Remove 'Re:' prefix
      .replace(/^Fwd:\s*/, '') // Remove 'Fwd:' prefix
      .replace(/\[.*?\]/g, '') // Remove square bracket content
      .split('-')              // Split by dash
      .pop()!                  // Get last part (most specific)
      .trim();                 // Clean up whitespace
  }

  private determineEmailStatus(text: string): string {
    if (text.match(/completed|finished|done/i)) return 'Completed';
    if (text.match(/in progress|working|ongoing/i)) return 'In Progress';
    if (text.match(/pending|awaiting|waiting/i)) return 'Pending';
    if (text.match(/approved|accepted|confirmed/i)) return 'Approved';
    if (text.match(/rejected|declined|denied/i)) return 'Rejected';
    if (text.match(/delayed|postponed|rescheduled/i)) return 'Delayed';
    return 'Active';
  }

  private extractPendingActions(emails: (EmailMessage | PartnershipEmail)[]): string[] {
    const actions = new Set<string>();
    
    // Look at recent emails for pending items
    emails
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(0, 10)
      .forEach(email => {
        const text = email.snippet || email.body;
        
        // Look for action items with improved patterns
        const actionPatterns = [
          /(?:need|should|must) to ([^.!?]+)/i,
          /please ([^.!?]+)/i,
          /pending:? ([^.!?]+)/i,
          /todo:? ([^.!?]+)/i,
          /(?:will|going to) ([^.!?]+)/i,
          /action required:? ([^.!?]+)/i,
          /follow[- ]?up:? ([^.!?]+)/i
        ];

        actionPatterns.forEach(pattern => {
          const match = text.match(pattern);
          if (match && match[1]) {
            actions.add(match[1].trim());
          }
        });
      });

    return Array.from(actions);
  }

  private extractActionItems(text: string): string[] {
    const items: string[] = [];
    
    const patterns = [
      /(?:need|should|must) to ([^.,]+)/i,
      /please ([^.,]+)/i,
      /(?:will|going to) ([^.,]+)/i,
      /action required:? ([^.,]+)/i
    ];

    patterns.forEach(pattern => {
      const match = text.match(pattern);
      if (match && match[1]) {
        items.push(match[1].trim());
      }
    });

    return items;
  }

  private createBriefSummary(text: string): string {
    if (!text) return 'No content available';
    
    // Remove any HTML tags and normalize whitespace
    const cleanText = text.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
    
    // Extract key information
    const keyInfo = {
      sentiment: this.extractSentiment(cleanText),
      actions: this.extractActions(cleanText),
      topics: this.extractKeyTopics(cleanText),
      status: this.extractStatus(cleanText)
    };

    // Build a more meaningful summary
    const summaryParts: string[] = [];

    // Add action-based summary if available
    if (keyInfo.actions.length > 0) {
      summaryParts.push(keyInfo.actions[0]); // Primary action
    }

    // Add status if available
    if (keyInfo.status) {
      summaryParts.push(keyInfo.status);
    }

    // Add topic-based context if available
    if (keyInfo.topics.length > 0) {
      summaryParts.push(`regarding ${keyInfo.topics.join(' and ')}`);
    }

    // If no structured info found, fall back to the original basic extraction
    if (summaryParts.length === 0) {
      const actionVerb = this.determineActionVerb(cleanText);
      const relevantText = this.extractRelevantText(cleanText);
      return `${actionVerb} ${relevantText}`;
    }

    return summaryParts.join(', ');
  }

  private determineActionVerb(text: string): string {
    if (text.match(/thank|appreciate|grateful/i)) return 'Thanked';
    if (text.match(/understand|comprehend/i)) return 'Acknowledged';
    if (text.match(/agree|concur/i)) return 'Agreed with';
    if (text.match(/suggest|propose|recommend/i)) return 'Suggested';
    if (text.match(/request|ask|need/i)) return 'Requested';
    if (text.match(/confirm|verify|validate/i)) return 'Confirmed';
    if (text.match(/update|inform|notify/i)) return 'Updated about';
    if (text.match(/share|send|provide/i)) return 'Shared';
    if (text.match(/review|check|look/i)) return 'Reviewed';
    return 'Discussed';
  }

  private extractRelevantText(text: string): string {
    return text
      .replace(/^(hi|hello|dear|hey)\s+\w+,?\s*/i, '')
      .replace(/^thank you (for|to).*?,\s*/i, '')
      .replace(/^i (just|wanted to|would like to|am|have)\s*/i, '')
      .replace(/^(please|kindly)\s*/i, '')
      .replace(/^hope (this|you|everything).*?,\s*/i, '')
      .replace(/best regards.*$/i, '')
      .substring(0, 200)  // Limit length
      .trim();
  }

  private extractSentiment(text: string): string {
    if (text.match(/thank|appreciate|grateful|excellent|amazing|wonderful|great/i)) return 'positive';
    if (text.match(/sorry|apologi|unfortunate|regret/i)) return 'negative';
    if (text.match(/understand|acknowledge|note/i)) return 'neutral';
    return '';
  }

  private extractActions(text: string): string[] {
    const actions: string[] = [];
    const patterns = [
      { regex: /(?:need|should|must) to ([^.!?]+)/i, prefix: 'Needs to' },
      { regex: /please ([^.!?]+)/i, prefix: 'Requested to' },
      { regex: /(?:will|going to) ([^.!?]+)/i, prefix: 'Will' },
      { regex: /(?:can you|could you) ([^.!?]+)/i, prefix: 'Requested to' },
      { regex: /(?:have|has) (?:sent|shared|provided) ([^.!?]+)/i, prefix: 'Shared' },
      { regex: /(?:reviewing|looking at|checking) ([^.!?]+)/i, prefix: 'Reviewing' }
    ];

    patterns.forEach(({ regex, prefix }) => {
      const match = text.match(regex);
      if (match && match[1]) {
        actions.push(`${prefix} ${match[1].trim()}`);
      }
    });

    return actions;
  }

  private extractKeyTopics(text: string): string[] {
    const topics: string[] = [];
    const patterns = [
      /(?:contract|agreement) (?:terms|details|points)/i,
      /(?:campaign|promotion) (?:details|plan|strategy)/i,
      /(?:budget|payment|compensation)/i,
      /(?:timeline|schedule|deadline)/i,
      /(?:requirements|specifications|guidelines)/i,
      /(?:feedback|review|comments)/i
    ];

    patterns.forEach(pattern => {
      if (pattern.test(text)) {
        topics.push(text.match(pattern)![0].toLowerCase());
      }
    });

    return topics;
  }

  private extractStatus(text: string): string {
    const statusPatterns = [
      { regex: /completed|finished|done/i, status: 'Completed' },
      { regex: /in progress|working|ongoing/i, status: 'In Progress' },
      { regex: /pending|awaiting|waiting/i, status: 'Pending' },
      { regex: /approved|accepted|confirmed/i, status: 'Approved' },
      { regex: /rejected|declined|denied/i, status: 'Rejected' },
      { regex: /delayed|postponed|rescheduled/i, status: 'Delayed' },
      { regex: /cancelled|canceled|abandoned/i, status: 'Cancelled' },
      { regex: /blocked|stuck|impeded/i, status: 'Blocked' },
      { regex: /reviewing|under review|in review/i, status: 'Under Review' }
    ];

    for (const pattern of statusPatterns) {
      if (pattern.regex.test(text)) {
        return pattern.status;
      }
    }

    return 'Active';
  }

  private generateDetailedView(emails: (EmailMessage | PartnershipEmail)[]): string {
    // Group by thread first
    const threadMap = new Map<string, (EmailMessage | PartnershipEmail)[]>();
    
    emails.forEach(email => {
      const threadId = email.threadId || 'unthreaded';
      if (!threadMap.has(threadId)) {
        threadMap.set(threadId, []);
      }
      threadMap.get(threadId)!.push(email);
    });

    // Sort threads by latest email in each thread
    const sortedThreads = Array.from(threadMap.entries())
      .sort((a, b) => {
        const aLatest = Math.max(...a[1].map(e => e.date.getTime()));
        const bLatest = Math.max(...b[1].map(e => e.date.getTime()));
        return bLatest - aLatest;
      });

    return sortedThreads.map(([threadId, threadEmails]) => {
      // Sort emails within thread by date
      const sortedEmails = threadEmails.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      const threadHeader = threadId !== 'unthreaded' 
        ? `=== Thread ID: ${threadId} (${threadEmails.length} messages) ===\n` 
        : '';

      return `${threadHeader}${sortedEmails.map(email => 
        `From: ${email.from}
To: ${email.to.join(', ')}
Date: ${email.date.toLocaleDateString()}
Subject: ${email.subject}
Snippet: ${email.snippet}
---`
      ).join('\n\n')}`;
    }).join('\n\n');
  }

  private extractTopics(emails: (EmailMessage | PartnershipEmail)[]): string[] {
    // Combine subjects and snippets
    const text = emails
      .map(e => `${e.subject} ${e.snippet}`)
      .join(' ')
      .toLowerCase();
    
    // Remove common words and keep meaningful phrases
    const words = text
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => 
        word.length > 3 && 
        !['what', 'when', 'where', 'which', 'about', 'have', 'that', 'this', 'from', 'your', 'with', 'and', 'the', 'for', 'you'].includes(word)
      );
    
    // Count word frequency
    const wordFreq = new Map<string, number>();
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });
    
    // Return top 5 most frequent meaningful words as topics
    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  private extractTopicsFromContext(query: string): string[] {
    // Extract key topics from the query
    const topics = query
      .toLowerCase()
      .replace(/we discussed|talked about|mentioned|previous|earlier|last time/gi, '')
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => 
        word.length > 3 && 
        !['what', 'when', 'where', 'which', 'about', 'have', 'that', 'this', 'from', 'your', 'with', 'and', 'the', 'for', 'you'].includes(word)
      );
    
    return Array.from(new Set(topics));
  }

  private async searchWithContext(query: string, topics: string[]): Promise<(EmailMessage | PartnershipEmail)[]> {
    // First try exact topic matches
    const results = await this.emailContextManager.getRelevantEmails(topics.join(' '));
    
    // If no results, try individual topics
    if (results.length === 0) {
      for (const topic of topics) {
        const topicResults = await this.emailContextManager.getRelevantEmails(topic);
        results.push(...topicResults);
      }
    }
    
    // Remove duplicates
    const uniqueResults = Array.from(new Set(results.map(r => r.id)))
      .map(id => results.find(r => r.id === id)!)
      .map(email => ({
        ...email,
        analysis: undefined
      })) as (EmailMessage | PartnershipEmail)[];
    
    return uniqueResults;
  }

  private classifyError(error: any): SearchError {
    if (error?.message?.includes('invalid_grant') || error?.message?.includes('unauthorized')) {
      return {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
        type: 'auth',
        retryable: false
      };
    }

    if (error?.message?.includes('quota') || error?.message?.includes('rate limit')) {
      return {
        code: 'RATE_LIMIT',
        message: 'Rate limit exceeded',
        type: 'rate_limit',
        retryable: true
      };
    }

    if (error?.message?.includes('network') || error?.message?.includes('ECONNREFUSED')) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Network connection failed',
        type: 'network',
        retryable: true
      };
    }

    if (error?.message?.includes('syntax') || error?.message?.includes('invalid query')) {
      return {
        code: 'QUERY_ERROR',
        message: 'Invalid search query',
        type: 'query',
        retryable: false,
        context: { query: error.query }
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: error?.message || 'Unknown error occurred',
      type: 'unknown',
      retryable: true
    };
  }

  private async retryWithBackoff(
    operation: () => Promise<any>,
    attempt: number = 1
  ): Promise<any> {
    try {
      return await operation();
    } catch (error) {
      const classifiedError = this.classifyError(error);
      
      if (!classifiedError.retryable || attempt >= this.MAX_RETRIES) {
        throw classifiedError;
      }

      // Exponential backoff
      const delay = this.RETRY_DELAY * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      return this.retryWithBackoff(operation, attempt + 1);
    }
  }

  private recordSearchAttempt(
    strategy: string,
    query: string,
    success: boolean,
    error?: SearchError,
    resultCount: number = 0
  ): void {
    this.searchAttempts.push({
      strategy,
      query,
      timestamp: Date.now(),
      success,
      error,
      resultCount
    });

    // Keep only last 100 attempts
    if (this.searchAttempts.length > 100) {
      this.searchAttempts = this.searchAttempts.slice(-100);
    }
  }

  private async executeSearchStrategy(
    strategy: string,
    query: string,
    args: z.infer<typeof this._schema>
  ): Promise<EmailSearchResult> {
    try {
      const result = await this.retryWithBackoff(async () => {
        const apiResults = await this.gmailService.searchEmails(
          query.trim(),
          args.maxResults
        );

        return {
          success: true,
          results: apiResults,
          resultCount: apiResults.length,
          formattedString: this.formatPersonSearchResults(apiResults, args.query, !!args.sender),
          source: 'api'
        };
      });

      this.recordSearchAttempt(strategy, query, true, undefined, result.resultCount);
      return result;
    } catch (error) {
      const classifiedError = this.classifyError(error);
      this.recordSearchAttempt(strategy, query, false, classifiedError);
      
      // Log the error for monitoring
      console.error(`Search strategy ${strategy} failed:`, {
        error: classifiedError,
        query,
        attempt: this.searchAttempts.length
      });

      throw classifiedError;
    }
  }

  private calculateAverageMetrics(emails: any[]): Record<string, number> {
    const metrics = {} as Record<string, number[]>;
    
    emails.forEach(email => {
      Object.entries(email.metrics).forEach(([key, value]) => {
        if (!metrics[key]) metrics[key] = [];
        metrics[key].push(parseFloat(value as string) || 0);
      });
    });

    return Object.entries(metrics).reduce((acc, [key, values]) => {
      acc[key] = values.reduce((sum, val) => sum + val, 0) / values.length;
      return acc;
    }, {} as Record<string, number>);
  }

  private findCommonElements<T>(arrays: T[][]): T[] {
    if (arrays.length === 0) return [];
    const counts = new Map<T, number>();
    
    arrays.forEach(arr => {
      new Set(arr).forEach(item => {
        counts.set(item, (counts.get(item) || 0) + 1);
      });
    });

    return Array.from(counts.entries())
      .filter(([_, count]) => count > arrays.length / 2)
      .map(([item]) => item)
      .sort((a, b) => counts.get(b)! - counts.get(a)!);
  }

  private calculateSentimentBreakdown(emails: any[]): Record<string, number> {
    const total = emails.length;
    const counts = emails.reduce((acc, email) => {
      const sentiment = email.sentiment || 'neutral';
      acc[sentiment] = (acc[sentiment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(counts).reduce((acc, [sentiment, count]) => {
      acc[sentiment] = Math.round((count as number / total) * 100);
      return acc;
    }, {} as Record<string, number>);
  }

  private determineOverallSentiment(breakdown: Record<string, number>): string {
    const entries = Object.entries(breakdown);
    const max = entries.reduce((acc, [sentiment, percentage]) => 
      percentage > acc.percentage ? { sentiment, percentage } : acc,
      { sentiment: 'neutral', percentage: 0 }
    );
    return max.sentiment;
  }
} 
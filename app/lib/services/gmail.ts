import { google } from 'googleapis';
import { validateToken } from '../../lib/auth-helpers';
import { EmailMessage, PartnershipEmail } from '../../types/social-platforms';
import prisma from '../prisma';
import { getCompletion } from '../openai';
import { gmail_v1 } from 'googleapis';
import { RAGSystem } from '../../lib/rag';
import { serviceStateManager } from './service-state-manager';
import { searchResultCache } from './search-result-cache';

// Export PartnershipEmail as GmailMessage for content-analysis.ts
export type GmailMessage = PartnershipEmail;

interface PartnershipAnalysis {
  isPartnership: boolean;
  dealValue?: number;
  dealType?: string;
  requirements?: string[];
  deadline?: string;
  priority: 'high' | 'medium' | 'low';
  topics: string[];
  stage?: 'initial' | 'negotiation' | 'agreement' | 'active';
  timeline?: string[];
  valueHistory?: Array<{
    date: string;
    value: number;
  }>;
  context?: {
    previousDeals?: Array<{value: number, date: string}>;
    relatedContent?: Array<{videoId: string, title: string, views: number}>;
    audienceMatch?: number;
  };
  metrics?: {
    responseTime?: {exact: string, trend: string};
    lastContact?: {date: string, type: string};
    dealStages?: {current: string, history: string[]};
  };
}

interface GmailHeader {
  name: string;
  value: string;
}

interface GmailThreadMessage {
  id?: string | null;
  payload?: {
    headers?: GmailHeader[];
    body?: {
      data?: string;
    };
  };
}

type Schema$Message = gmail_v1.Schema$Message;
type Schema$MessagePartHeader = gmail_v1.Schema$MessagePartHeader;

interface ThreadMessage {
  id: string;
  from?: string;
  date?: string;
  body?: string;
}

interface EmailThread {
  messages: ThreadMessage[];
}

export class GmailService {
  private gmail: gmail_v1.Gmail;
  private accountId: string;
  private rag: RAGSystem;

  constructor(userId: string) {
    this.accountId = userId;
    this.gmail = google.gmail('v1');
    this.rag = new RAGSystem();
    this.initializeState();
  }

  private async initializeState() {
    try {
      const auth = await this.getAuthorizedClient();
      if (auth) {
        await serviceStateManager.updateState('gmail', {
          isAuthenticated: true,
          isConnected: true,
          lastSync: new Date()
        });
      }
    } catch (error) {
      await serviceStateManager.updateState('gmail', {
        isAuthenticated: false,
        isConnected: false,
        error: error instanceof Error ? error.message : 'Failed to initialize Gmail service'
      });
    }
  }

  private async ensureAuthenticated(): Promise<boolean> {
    const state = await serviceStateManager.getState('gmail');
    
    if (!state.isAuthenticated) {
      try {
        const auth = await this.getAuthorizedClient();
        if (auth) {
          await serviceStateManager.setAuthenticated('gmail', true);
          return true;
        }
        // If we need authentication, add a pending request
        await serviceStateManager.requestAuthentication('gmail');
        return false;
      } catch (error) {
        await serviceStateManager.setError('gmail', error instanceof Error ? error.message : 'Authentication failed');
        return false;
      }
    }
    
    return true;
  }

  private async withErrorHandling<T>(operation: () => Promise<T>): Promise<T> {
    try {
      const isAuthenticated = await this.ensureAuthenticated();
      if (!isAuthenticated) {
        throw new Error('Gmail service requires authentication');
      }
      
      const result = await operation();
      
      // Clear any existing errors on success
      await serviceStateManager.clearError('gmail');
      
      return result;
    } catch (error) {
      await serviceStateManager.setError('gmail', error instanceof Error ? error.message : 'Operation failed');
      throw error;
    }
  }

  private async getGoogleAccountId(): Promise<string> {
    const account = await prisma.account.findFirst({
      where: {
        userId: this.accountId,
        provider: 'google'
      }
    });

    if (!account) {
      throw new Error('No Google account found');
    }

    return account.id;
  }

  private async getAuthorizedClient() {
    try {
      const accessToken = await validateToken(this.accountId, 'gmail');
      
      if (!accessToken) {
        throw new Error('Failed to get valid Gmail access token');
      }
      
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        process.env.GMAIL_REDIRECT_URI
      );
      
      oauth2Client.setCredentials({ 
        access_token: accessToken
      });
      
      return oauth2Client;
    } catch (error: any) {
      console.error('Gmail authorization error:', error);
      throw new Error(`Gmail authorization failed: ${error.message}`);
    }
  }

  async getEmailMetrics() {
    try {
      const auth = await this.getAuthorizedClient();
      const profile = await this.gmail.users.getProfile({
        auth,
        userId: 'me'
      });

      return {
        totalEmails: profile.data.messagesTotal || 0,
        threadsTotal: profile.data.threadsTotal || 0,
        historyId: profile.data.historyId
      };
    } catch (error) {
      console.error('Error fetching Gmail metrics:', error);
      throw error;
    }
  }

  async getPartnershipEmails(options: {
    maxResults?: number;
    labelIds?: string[];
    q?: string;
    includeThreads?: boolean;
  } = {}): Promise<PartnershipEmail[]> {
    try {
      const auth = await this.getAuthorizedClient();
      const { maxResults = 50, labelIds = [], q = '', includeThreads = true } = options;

      // Get messages list with partnership-related queries
      const messageList = await this.gmail.users.messages.list({
        auth,
        userId: 'me',
        maxResults,
        labelIds,
        q: q || 'subject:(partnership OR collaboration OR sponsor OR brand OR deal OR paid OR promotion)'
      });

      if (!messageList.data.messages) {
        return [];
      }

      // Get full message details and analyze them
      const messages = await Promise.all(
        messageList.data.messages.map(async (message) => {
          const fullMessage = await this.gmail.users.messages.get({
            auth,
            userId: 'me',
            id: message.id!,
            format: 'full'
          });

          let threadMessages: Schema$Message[] = [];
          if (includeThreads && fullMessage.data.threadId) {
            const thread = await this.gmail.users.threads.get({
              auth,
              userId: 'me',
              id: fullMessage.data.threadId
            });
            threadMessages = thread.data.messages || [];
          }

          const headers = fullMessage.data.payload?.headers;
          const subject = headers?.find(h => h.name === 'Subject')?.value || '';
          const from = headers?.find(h => h.name === 'From')?.value || '';
          const to = headers?.find(h => h.name === 'To')?.value?.split(',') || [];
          const date = headers?.find(h => h.name === 'Date')?.value || '';
          const body = this.getMessageBody(fullMessage.data);

          // Analyze partnership details using AI with thread context
          const analysis = await this.analyzePartnership(subject, body, threadMessages);

          const email: PartnershipEmail = {
            id: message.id!,
            threadId: fullMessage.data.threadId || '',
            subject,
            from,
            to,
            date: new Date(date),
            body,
            labels: fullMessage.data.labelIds || [],
            isRead: !fullMessage.data.labelIds?.includes('UNREAD'),
            isStarred: fullMessage.data.labelIds?.includes('STARRED'),
            analysis,
            thread: threadMessages.length > 0 ? {
              id: fullMessage.data.threadId || '',
              messages: threadMessages.map(m => {
                const mHeaders = m.payload?.headers || [];
                const mFrom = mHeaders.find(h => h.name === 'From')?.value || '';
                const mTo = mHeaders.find(h => h.name === 'To')?.value?.split(',').map(addr => addr.trim()) || [];
                const mSubject = mHeaders.find(h => h.name === 'Subject')?.value || subject;
                const mDate = mHeaders.find(h => h.name === 'Date')?.value || date;
                const threadMessage: EmailMessage = {
                  id: m.id || '',
                  threadId: fullMessage.data.threadId || '',
                  subject: mSubject,
                  from: mFrom,
                  to: mTo,
                  body: this.getMessageBody(m),
                  date: new Date(mDate),
                  labels: m.labelIds || [],
                  isRead: !m.labelIds?.includes('UNREAD'),
                  isStarred: m.labelIds?.includes('STARRED')
                };
                return threadMessage;
              }),
              participants: Array.from(new Set([
                ...threadMessages.map(m => m.payload?.headers?.find(h => h.name === 'From')?.value || ''),
                ...threadMessages.map(m => m.payload?.headers?.find(h => h.name === 'To')?.value || '').flatMap(to => to.split(',').map(addr => addr.trim()))
              ])).filter(Boolean),
              subject: subject,
              lastMessageDate: new Date(threadMessages[threadMessages.length - 1]?.payload?.headers?.find(h => h.name === 'Date')?.value || date),
              messageCount: threadMessages.length,
              labels: fullMessage.data.labelIds || []
            } : undefined
          };

          return email;
        })
      );

      // Sort by priority and deal value
      return messages.sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.analysis.priority];
        const bPriority = priorityOrder[b.analysis.priority];
        
        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }
        
        const aDealValue = a.analysis.dealValue || 0;
        const bDealValue = b.analysis.dealValue || 0;
        return bDealValue - aDealValue;
      });

    } catch (error) {
      console.error('Error fetching partnership emails:', error);
      throw error;
    }
  }

  private async analyzePartnership(subject: string, body: string, threadMessages: Schema$Message[] = []): Promise<PartnershipAnalysis> {
    try {
      const prompt = `Analyze this email and its thread for partnership details. Extract ONLY factual information that is explicitly stated. Do not make assumptions about values. If a specific value is not mentioned, leave it undefined.

Provide the analysis in this JSON format:
{
  "isPartnership": boolean,
  "dealValue": number | null,
  "dealType": string | null,
  "requirements": string[] | null,
  "deadline": string | null,
  "priority": "high" | "medium" | "low",
  "topics": string[],
  "stage": "initial" | "negotiation" | "agreement" | "active" | null,
  "timeline": string[] | null,
  "valueHistory": Array<{date: string, value: number}> | null,
  "context": {
    "previousDeals": Array<{value: number, date: string}> | null,
    "relatedContent": Array<{videoId: string, title: string, views: number}> | null,
    "audienceMatch": number | null
  },
  "metrics": {
    "responseTime": {exact: string, trend: string} | null,
    "lastContact": {date: string, type: string} | null,
    "dealStages": {current: string, history: string[]} | null
  }
}

Guidelines:
- dealValue: Only include if an exact amount is mentioned
- dealType: Only include if specifically stated
- stage: Determine from conversation context
- timeline: Extract key dates and events
- valueHistory: Track any mentioned price changes
- metrics: Calculate from thread if available

Email:
Subject: ${subject}
Body: ${body}

${threadMessages.length > 0 ? `Thread History:
${threadMessages.map(m => `
From: ${m.payload?.headers?.find(h => h.name === 'From')?.value}
Date: ${m.payload?.headers?.find(h => h.name === 'Date')?.value}
Body: ${this.getMessageBody(m)}
`).join('\n')}` : ''}`;

      const analysis = await getCompletion([
        { 
          role: 'system', 
          content: 'You are an AI that analyzes partnership emails and their threads to extract key information and metrics. Be precise and only extract information that is explicitly stated.' 
        },
        { role: 'user', content: prompt }
      ], {
        model: 'gpt-4-1106-preview',
        temperature: 0.1,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      });

      try {
        const result = JSON.parse(analysis);
        return {
          isPartnership: result.isPartnership || false,
          dealValue: result.dealValue || undefined,
          dealType: result.dealType || undefined,
          requirements: result.requirements || undefined,
          deadline: result.deadline || undefined,
          priority: result.priority || 'low',
          topics: result.topics || [],
          stage: result.stage || undefined,
          timeline: result.timeline || undefined,
          valueHistory: result.valueHistory || undefined,
          context: result.context || undefined,
          metrics: result.metrics || undefined
        };
      } catch (parseError) {
        console.error('Error parsing partnership analysis:', parseError);
        return {
          isPartnership: false,
          priority: 'low',
          topics: []
        };
      }
    } catch (error) {
      console.error('Error analyzing partnership:', error);
      return {
        isPartnership: false,
        priority: 'low',
        topics: []
      };
    }
  }

  private getMessageBody(message: any): string {
    let plainText = '';
    let htmlContent = '';
    
    const getBodyFromPart = (part: any) => {
      if (part.mimeType === 'text/plain' && part.body?.data) {
        plainText += Buffer.from(part.body.data, 'base64').toString();
      }
      if (part.mimeType === 'text/html' && part.body?.data) {
        const decoded = Buffer.from(part.body.data, 'base64').toString();
        // Basic HTML to text conversion
        htmlContent += decoded.replace(/<[^>]*>/g, ' ')
                             .replace(/\s+/g, ' ')
                             .trim();
      }
      if (part.parts) {
        part.parts.forEach(getBodyFromPart);
      }
    };

    // Handle both direct body and multipart messages
    if (message.payload) {
      if (message.payload.body?.data) {
        // Direct body content
        const decoded = Buffer.from(message.payload.body.data, 'base64').toString();
        if (message.payload.mimeType === 'text/plain') {
          plainText = decoded;
        } else if (message.payload.mimeType === 'text/html') {
          htmlContent = decoded.replace(/<[^>]*>/g, ' ')
                             .replace(/\s+/g, ' ')
                             .trim();
        }
      }
      // Handle multipart
      if (message.payload.parts) {
        getBodyFromPart(message.payload);
      }
    }

    return plainText || htmlContent || message.snippet || '';
  }

  private getAttachments(message: any) {
    const attachments: EmailMessage['attachments'] = [];
    
    const processPayload = (payload: any) => {
      if (payload.mimeType !== 'text/plain' && payload.body?.attachmentId) {
        attachments.push({
          id: payload.body.attachmentId,
          name: payload.filename || 'unnamed',
          contentType: payload.mimeType,
          size: payload.body.size || 0
        });
      }
      
      if (payload.parts) {
        payload.parts.forEach(processPayload);
      }
    };

    if (message.payload) {
      processPayload(message.payload);
    }

    return attachments;
  }

  private detectPartnership(subject: string, body: string): boolean {
    const partnershipKeywords = [
      'partnership',
      'collaboration',
      'sponsor',
      'brand deal',
      'promotion',
      'advertising',
      'affiliate',
      'ambassador',
      'influencer'
    ];

    const text = `${subject} ${body}`.toLowerCase();
    return partnershipKeywords.some(keyword => text.includes(keyword));
  }

  async getLabels() {
    try {
      const auth = await this.getAuthorizedClient();
      const response = await this.gmail.users.labels.list({
        auth,
        userId: 'me'
      });

      return response.data.labels || [];
    } catch (error) {
      console.error('Error fetching Gmail labels:', error);
      throw error;
    }
  }

  async createLabel(name: string, options: {
    textColor?: string;
    backgroundColor?: string;
  } = {}) {
    try {
      const auth = await this.getAuthorizedClient();
      const response = await this.gmail.users.labels.create({
        auth,
        userId: 'me',
        requestBody: {
          name,
          labelListVisibility: 'labelShow',
          messageListVisibility: 'show',
          color: {
            textColor: options.textColor || '#666666',
            backgroundColor: options.backgroundColor || '#eeeeee'
          }
        }
      });

      return response.data;
    } catch (error) {
      console.error('Error creating Gmail label:', error);
      throw error;
    }
  }

  async addLabel(messageId: string, labelId: string) {
    try {
      const auth = await this.getAuthorizedClient();
      await this.gmail.users.messages.modify({
        auth,
        userId: 'me',
        id: messageId,
        requestBody: {
          addLabelIds: [labelId]
        }
      });
    } catch (error) {
      console.error('Error adding label to message:', error);
      throw error;
    }
  }

  async removeLabel(messageId: string, labelId: string) {
    try {
      const auth = await this.getAuthorizedClient();
      await this.gmail.users.messages.modify({
        auth,
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: [labelId]
        }
      });
    } catch (error) {
      console.error('Error removing label from message:', error);
      throw error;
    }
  }

  async searchEmails(query: string, maxResults: number = 20, summarizeResults: boolean = true): Promise<EmailMessage[]> {
    return this.withErrorHandling(async () => {
      const auth = await this.getAuthorizedClient();
      
      // Format and enhance the search query
      let enhancedQuery = query.trim();
      
      // Check cache first
      const cachedResults = searchResultCache.get(enhancedQuery, { maxResults, summarizeResults });
      if (cachedResults) {
        console.log('Returning cached results for query:', enhancedQuery);
        return cachedResults as EmailMessage[];
      }

      // Check for similar cached results
      const similarResults = searchResultCache.getSimilarResults(enhancedQuery);
      if (similarResults) {
        console.log('Found similar cached results for query:', enhancedQuery);
        return similarResults as EmailMessage[];
      }
      
      // If the query looks like a name (no special characters or email format)
      if (!enhancedQuery.includes('@') && 
          !enhancedQuery.includes('from:') && 
          !enhancedQuery.includes('to:') && 
          !enhancedQuery.includes('subject:') && 
          !enhancedQuery.includes('in:')) {
        
        // Split query into terms and search each term across all fields
        const terms = enhancedQuery.split(/\s+/).filter(Boolean);
        if (terms.length > 0) {
          // Make search case-insensitive by adding variations
          enhancedQuery = terms.map(term => {
            const variations = [
              term.toLowerCase(),
              term.toUpperCase(),
              term.charAt(0).toUpperCase() + term.slice(1).toLowerCase()
            ];
            // Search in from, to, subject, and full text, including partial matches
            return `(${variations.map(v => 
              `from:*${v}* OR to:*${v}* OR subject:*${v}* OR ${v}`
            ).join(' OR ')})`;
          }).join(' ');
        }
      }

      // Only add time restriction if specifically requested or for 'recent' searches
      if (enhancedQuery.includes('before:') || 
          enhancedQuery.includes('after:') || 
          enhancedQuery.includes('older:') || 
          enhancedQuery.includes('newer:')) {
        // Keep existing time restriction
      } else if (query.toLowerCase().includes('recent')) {
        enhancedQuery = `${enhancedQuery} newer_than:14d`;
      }

      // If query is still empty after trimming, return empty results
      if (!enhancedQuery) {
        return [];
      }

      console.log('Enhanced Gmail search query:', enhancedQuery);
      
      const response = await this.gmail.users.messages.list({
        auth,
        userId: 'me',
        q: enhancedQuery,
        maxResults: Math.min(maxResults, 50) // Cap at 50 to prevent too many results
      });

      const messages = response.data.messages || [];
      const emails = await Promise.all(
        messages.map(async (message) => {
          // Always fetch full message data for storage
          const email = await this.gmail.users.messages.get({
            auth,
            userId: 'me',
            id: message.id!,
            format: summarizeResults ? 'metadata' : 'full',
            metadataHeaders: ['Subject', 'From', 'To', 'Date']
          });

          const headers = email.data.payload?.headers || [];
          const subject = headers.find(h => h.name === 'Subject')?.value || '';
          const from = headers.find(h => h.name === 'From')?.value || '';
          const toStr = headers.find(h => h.name === 'To')?.value || '';
          const to = toStr.split(',').map(addr => addr.trim());
          const date = headers.find(h => h.name === 'Date')?.value || '';

          // Store the full message in RAG for future reference
          if (!summarizeResults) {
            const fullBody = this.getMessageBody(email.data);
            await this.storeEmailInRAG({
              id: email.data.id!,
              threadId: email.data.threadId || '',
              subject,
              from,
              to,
              date: new Date(date),
              body: fullBody,
              snippet: email.data.snippet || '',
              labels: email.data.labelIds || [],
              isRead: !email.data.labelIds?.includes('UNREAD'),
              isStarred: email.data.labelIds?.includes('STARRED')
            }, this.accountId);
          }

          const result = {
            id: email.data.id!,
            threadId: email.data.threadId || '',
            subject,
            from,
            to,
            date: new Date(date),
            body: summarizeResults ? email.data.snippet || '' : this.getMessageBody(email.data),
            snippet: email.data.snippet || '',
            labels: email.data.labelIds || [],
            isRead: !email.data.labelIds?.includes('UNREAD'),
            isStarred: email.data.labelIds?.includes('STARRED')
          };

          return result;
        })
      );

      // Cache the results
      searchResultCache.set(enhancedQuery, emails, { maxResults, summarizeResults });

      return emails;
    });
  }

  async storeEmailInRAG(email: EmailMessage, userId: string): Promise<void> {
    try {
      const emailContent = {
        id: email.id,
        threadId: email.threadId,
        subject: email.subject,
        from: email.from,
        to: email.to,
        date: email.date,
        body: email.body,
        labels: email.labels,
        isRead: email.isRead
      };

      await this.rag.addDocument(
        JSON.stringify(emailContent),
        {
          type: 'email',
          category: 'message',
          user_id: userId,
          timestamp: new Date(email.date).toISOString(),
          metadata: {
            sender: email.from,
            subject: email.subject,
            threadId: email.threadId
          }
        }
      );
    } catch (error) {
      console.error('Error storing email in RAG:', error);
      throw error;
    }
  }
} 
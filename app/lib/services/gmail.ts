import { google } from 'googleapis';
import { validateToken } from '@/lib/auth-helpers';
import { EmailMessage, PartnershipEmail } from '../../types/social-platforms';
import { prisma } from '../prisma';
import { getCompletion } from '../openai';
import { gmail_v1 } from 'googleapis';
import { RAGSystem } from '@/lib/rag';

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

          return {
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
              messages: threadMessages.map(m => ({
                id: m.id || '',
                from: m.payload?.headers?.find(h => h.name === 'From')?.value,
                date: m.payload?.headers?.find(h => h.name === 'Date')?.value,
                body: this.getMessageBody(m)
              }))
            } : undefined
          };
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
          filename: payload.filename,
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

  async searchEmails(query: string, maxResults: number = 20): Promise<EmailMessage[]> {
    try {
      const auth = await this.getAuthorizedClient();
      const response = await this.gmail.users.messages.list({
        auth,
        userId: 'me',
        q: query,
        maxResults
      });

      const messages = response.data.messages || [];
      const emails = await Promise.all(
        messages.map(async (message) => {
          const email = await this.gmail.users.messages.get({
            auth,
            userId: 'me',
            id: message.id!,
            format: 'full'
          });

          const headers = email.data.payload?.headers || [];
          const subject = headers.find(h => h.name === 'Subject')?.value || '';
          const from = headers.find(h => h.name === 'From')?.value || '';
          const toStr = headers.find(h => h.name === 'To')?.value || '';
          const to = toStr.split(',').map(addr => addr.trim());
          const date = headers.find(h => h.name === 'Date')?.value || '';
          const body = this.getMessageBody(email.data);

          return {
            id: email.data.id!,
            threadId: email.data.threadId || '',
            subject,
            from,
            to,
            date: new Date(date),
            body,
            snippet: email.data.snippet || '',
            labels: email.data.labelIds || [],
            isRead: !email.data.labelIds?.includes('UNREAD')
          };
        })
      );

      return emails;
    } catch (error) {
      console.error('Error searching emails:', error);
      throw error;
    }
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
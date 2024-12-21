import { google } from 'googleapis';
import { validateToken } from '@/lib/auth-helpers';
import { EmailMessage, PartnershipEmail } from '../../types/social-platforms';
import { prisma } from '../prisma';
import { getCompletion } from '../openai';

interface PartnershipAnalysis {
  isPartnership: boolean;
  dealValue?: number;
  dealType?: string;
  requirements?: string[];
  deadline?: string;
  priority: 'high' | 'medium' | 'low';
  topics: string[];
}

export class GmailService {
  private gmail;
  private accountId: string;

  constructor(accountId: string) {
    this.accountId = accountId;
    this.gmail = google.gmail('v1');
  }

  private async getAuthorizedClient() {
    const accessToken = await validateToken(this.accountId);
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    return oauth2Client;
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
  } = {}): Promise<PartnershipEmail[]> {
    try {
      const auth = await this.getAuthorizedClient();
      const { maxResults = 50, labelIds = [], q = '' } = options;

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

          const headers = fullMessage.data.payload?.headers;
          const subject = headers?.find(h => h.name === 'Subject')?.value || '';
          const from = headers?.find(h => h.name === 'From')?.value || '';
          const to = headers?.find(h => h.name === 'To')?.value?.split(',') || [];
          const date = headers?.find(h => h.name === 'Date')?.value || '';
          const body = this.getMessageBody(fullMessage.data);

          // Analyze partnership details using AI
          const analysis = await this.analyzePartnership(subject, body);

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
            analysis
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

  private async analyzePartnership(subject: string, body: string): Promise<PartnershipAnalysis> {
    try {
      const prompt = `Analyze this email for partnership details. Extract the following information:
1. Is this a partnership/sponsorship email? (true/false)
2. Estimated deal value in USD (number only, 0 if not found)
3. Deal type (e.g., sponsorship, affiliate, product placement)
4. Requirements (list)
5. Deadline if any (date)
6. Priority (high/medium/low)
7. Main topics/keywords (list)

Email:
Subject: ${subject}
Body: ${body}`;

      const analysis = await getCompletion([
        { role: 'system', content: 'You are an AI that analyzes partnership emails and extracts key information.' },
        { role: 'user', content: prompt }
      ]);

      // Parse the AI response
      const lines = analysis.split('\n');
      return {
        isPartnership: lines[0].includes('true'),
        dealValue: parseFloat(lines[1]) || undefined,
        dealType: lines[2] || undefined,
        requirements: lines[3] ? JSON.parse(lines[3]) : undefined,
        deadline: lines[4] || undefined,
        priority: (lines[5] || 'low') as 'high' | 'medium' | 'low',
        topics: lines[6] ? JSON.parse(lines[6]) : []
      };
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
    let body = '';
    
    if (message.payload?.body?.data) {
      body = Buffer.from(message.payload.body.data, 'base64').toString();
    } else if (message.payload?.parts) {
      message.payload.parts.forEach((part: any) => {
        if (part.mimeType === 'text/plain' && part.body?.data) {
          body += Buffer.from(part.body.data, 'base64').toString();
        }
      });
    }

    return body;
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
} 
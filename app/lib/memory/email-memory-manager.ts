import { 
  EmailMemoryManager, 
  EmailMemoryNode, 
  EmailMemorySearchResult,
  UserInsight,
  MemoryNode
} from './types';
import { EmailMessage } from '../../types/social-platforms';
import { AdvancedMemorySystem } from './advanced-memory-system';
import { nanoid } from 'nanoid';
import { PrismaClient, Prisma } from '@prisma/client';
import prisma from '../prisma';

// Extend EmailMessage type to ensure TypeScript recognizes all properties
type ExtendedEmailMessage = EmailMessage & {
  snippet?: string;
  userId: string;
  hasAttachments?: boolean;
};

interface ThreadAnalysis {
  key_points: string[];
  topics: string[];
  participants: string[];
  timeline: { date: string; event: string }[];
  sentiment: string;
  action_items: string[];
  summary: string;
}

interface EmailContext {
  threadId: string;
  messageId: string;
  analysis: ThreadAnalysis;
  lastAccessed: number;
  accessCount: number;
}

interface EmailAnalysisResult {
  keyPoints: string[];
  topics: string[];
  participants: string[];
  timeline: { date: string; event: string }[];
  sentiment: string;
  actionItems: string[];
  summary: string;
  importance: number;
  threadContext?: string;
}

export class EmailMemoryManagerImpl implements EmailMemoryManager {
  private memorySystem: AdvancedMemorySystem;
  private threadContextCache: Map<string, EmailContext>;
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  constructor(memorySystem: AdvancedMemorySystem) {
    this.memorySystem = memorySystem;
    this.threadContextCache = new Map();
  }

  getMemorySystem(): AdvancedMemorySystem {
    return this.memorySystem;
  }

  async storeEmail(email: EmailMessage, context: string): Promise<void> {
    try {
      // Cast email to ExtendedEmailMessage to ensure type safety
      const extendedEmail = email as ExtendedEmailMessage;
      
      // Store email content
      const emailContent = await prisma.emailContent.upsert({
        where: { messageId: extendedEmail.id },
        update: {
          subject: extendedEmail.subject,
          from: extendedEmail.from,
          to: extendedEmail.to,
          cc: extendedEmail.cc || [],
          bcc: extendedEmail.bcc || [],
          body: extendedEmail.body,
          snippet: extendedEmail.snippet || '',
          date: extendedEmail.date,
          labels: extendedEmail.labels || [],
          isRead: extendedEmail.isRead,
          isStarred: extendedEmail.isStarred || false,
          hasAttachments: Boolean(extendedEmail.attachments?.length),
          attachments: extendedEmail.attachments || Prisma.JsonNull,
          updatedAt: new Date(),
        },
        create: {
          messageId: extendedEmail.id,
          threadId: extendedEmail.threadId,
          userId: extendedEmail.userId,
          subject: extendedEmail.subject,
          from: extendedEmail.from,
          to: extendedEmail.to,
          cc: extendedEmail.cc || [],
          bcc: extendedEmail.bcc || [],
          body: extendedEmail.body,
          snippet: extendedEmail.snippet || '',
          date: extendedEmail.date,
          labels: extendedEmail.labels || [],
          isRead: extendedEmail.isRead || false,
          isStarred: extendedEmail.isStarred || false,
          hasAttachments: Boolean(extendedEmail.attachments?.length),
          attachments: extendedEmail.attachments || Prisma.JsonNull,
        },
      });

      // Analyze and store email analysis
      const analysis = await this.analyzeEmail(extendedEmail);
      await prisma.emailAnalysis.upsert({
        where: { emailId: emailContent.id },
        update: {
          keyPoints: analysis.keyPoints,
          topics: analysis.topics,
          participants: analysis.participants,
          timeline: analysis.timeline,
          sentiment: analysis.sentiment,
          actionItems: analysis.actionItems,
          summary: analysis.summary,
          importance: analysis.importance,
          useCount: { increment: 1 },
          lastAccessed: new Date(),
          threadContext: analysis.threadContext,
        },
        create: {
          emailId: emailContent.id,
          keyPoints: analysis.keyPoints,
          topics: analysis.topics,
          participants: analysis.participants,
          timeline: analysis.timeline,
          sentiment: analysis.sentiment,
          actionItems: analysis.actionItems,
          summary: analysis.summary,
          importance: analysis.importance,
          threadContext: analysis.threadContext,
        },
      });
    } catch (error) {
      console.error('Error storing email:', error);
      throw new Error('Failed to store email content and analysis');
    }
  }

  private async createEnhancedEmailNode(email: EmailMessage, context: string): Promise<EmailMemoryNode> {
    const threadAnalysis = await this.analyzeEmailContent(email);
    
    // Create snippet using type assertion for optional property
    const emailSnippet = (email as EmailMessage & { snippet?: string }).snippet || email.body.substring(0, 200).trim();
    
    return {
      id: nanoid(),
      type: 'email_context',
      content: {
        messageId: email.id,
        threadId: email.threadId,
        subject: email.subject,
        participants: [email.from, ...email.to],
        cc: email.cc || [],
        bcc: [], // Since bcc is not in EmailMessage interface, initialize as empty
        key_points: threadAnalysis.key_points,
        topics: threadAnalysis.topics,
        summary: threadAnalysis.summary,
        sentiment: threadAnalysis.sentiment as 'positive' | 'negative' | 'neutral',
        importance: this.calculateImportance(email, threadAnalysis),
        thread_context: context,
        timestamp: email.date.getTime(),
        snippet: emailSnippet,
        isRead: email.isRead || false,
        isStarred: email.isStarred || false,
        labels: email.labels || [],
        hasAttachments: Boolean(email.attachments?.length),
        lastReferencedAt: Date.now(),
        useCount: 1,
        fullContent: email.body,
        analysis: threadAnalysis
      },
      confidence: 1,
      timestamp: email.date.getTime(),
      relationships: new Map(),
      context: {
        situation: 'custom_email_received',
        emotional_state: {
          primary: threadAnalysis.sentiment as 'neutral' | 'positive' | 'negative' | 'excited' | 'frustrated' | 'curious' | 'confused' | 'satisfied' | 'uncertain' | 'engaged' | 'disengaged',
          intensity: 0.7,
          confidence: 0.8
        },
        external_factors: []
      },
      evolution: {
        history: [{
          state: {
            content: 'Email node created',
            timestamp: Date.now()
          },
          timestamp: Date.now(),
          trigger: 'email_received'
        }],
        trend: 'stable',
        stability: 1
      }
    };
  }

  private calculateImportance(email: EmailMessage, analysis: ThreadAnalysis): number {
    let importance = 0;
    
    // Increase importance based on action items
    importance += analysis.action_items.length * 0.2;
    
    // Increase importance based on participants count
    importance += (email.to.length + (email.cc?.length || 0)) * 0.1;
    
    // Increase importance if email is starred
    if (email.isStarred) importance += 0.3;
    
    // Increase importance based on certain labels
    const importantLabels = ['important', 'urgent', 'priority'];
    if (email.labels) {
      importance += email.labels.filter(label => 
        importantLabels.includes(label.toLowerCase())
      ).length * 0.2;
    }
    
    return Math.min(importance, 1);
  }

  private async analyzeEmailContent(email: EmailMessage): Promise<ThreadAnalysis> {
    // Implement content analysis
    const key_points = this.extractKeyPoints(email.body);
    const topics = this.extractTopics(email.subject, email.body);
    const sentiment = this.analyzeSentiment(email.body);
    const action_items = this.extractActionItems(email.body);
    
    return {
      key_points,
      topics,
      participants: [email.from, ...email.to],
      timeline: [{
        date: email.date.toISOString(),
        event: `Email from ${email.from}`
      }],
      sentiment,
      action_items,
      summary: this.generateSummary(email)
    };
  }

  private extractKeyPoints(content: string): string[] {
    const lines = content.split('\n');
    const keyPoints: string[] = [];
    
    for (const line of lines) {
      // Look for bullet points, numbered lists, or important markers
      if (line.match(/^[-•*]|\d+\.|!important|key:/i)) {
        keyPoints.push(line.trim());
      }
    }
    
    return keyPoints;
  }

  private extractTopics(subject: string, body: string): string[] {
    const content = `${subject} ${body}`.toLowerCase();
    const topics = new Set<string>();
    
    // Common business topics
    const topicPatterns = [
      /partnership/g, /collaboration/g, /proposal/g,
      /agreement/g, /contract/g, /deal/g,
      /project/g, /timeline/g, /deadline/g,
      /budget/g, /payment/g, /terms/g
    ];
    
    for (const pattern of topicPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        topics.add(pattern.source);
      }
    }
    
    return Array.from(topics);
  }

  private analyzeSentiment(content: string): string {
    // Simple sentiment analysis
    const positiveWords = ['thank', 'great', 'good', 'excellent', 'appreciate'];
    const negativeWords = ['sorry', 'issue', 'problem', 'concern', 'delay'];
    
    let score = 0;
    const lowercaseContent = content.toLowerCase();
    
    positiveWords.forEach(word => {
      if (lowercaseContent.includes(word)) score++;
    });
    
    negativeWords.forEach(word => {
      if (lowercaseContent.includes(word)) score--;
    });
    
    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
  }

  private extractActionItems(content: string): string[] {
    const lines = content.split('\n');
    const actionItems: string[] = [];
    
    const actionPatterns = [
      /please|kindly/i,
      /need to|should|must/i,
      /action required|action needed/i,
      /follow up|follow-up/i,
      /todo|to-do/i
    ];
    
    for (const line of lines) {
      if (actionPatterns.some(pattern => pattern.test(line))) {
        actionItems.push(line.trim());
      }
    }
    
    return actionItems;
  }

  private generateSummary(email: EmailMessage): string {
    return `Email from ${email.from} about "${email.subject}" on ${email.date.toLocaleDateString()}. ` +
           `Key points: ${this.extractKeyPoints(email.body).slice(0, 3).join('; ')}`;
  }

  private async updateThreadContext(email: EmailMessage): Promise<void> {
    const existingContext = this.threadContextCache.get(email.threadId);
    
    if (existingContext) {
      // Update existing thread context
      existingContext.analysis.timeline.push({
        date: email.date.toISOString(),
        event: `Email from ${email.from}`
      });
      existingContext.lastAccessed = Date.now();
      existingContext.accessCount++;
      
      this.threadContextCache.set(email.threadId, existingContext);
    } else {
      // Create new thread context
      const threadAnalysis = await this.analyzeEmailContent(email);
      
      this.threadContextCache.set(email.threadId, {
        threadId: email.threadId,
        messageId: email.id,
        analysis: threadAnalysis,
        lastAccessed: Date.now(),
        accessCount: 1
      });
    }
  }

  private async createEnhancedRelationships(emailNode: EmailMemoryNode): Promise<void> {
    // Find related emails in the same thread
    const threadNodes = await this.findNodesInThread(emailNode.content.threadId);
    
    for (const node of threadNodes) {
      if (node.id !== emailNode.id) {
        // Create bidirectional relationships
        emailNode.relationships.set(node.id, {
          type: 'follows_up',
          strength: this.calculateRelationshipStrength(emailNode, node),
          evidence: this.gatherRelationshipEvidence(emailNode, node)
        });
      }
    }
    
    // Create topic-based relationships
    await this.createTopicRelationships(emailNode);
  }

  private calculateRelationshipStrength(node1: EmailMemoryNode, node2: EmailMemoryNode): number {
    let strength = 0;
    
    // Same thread bonus
    if (node1.content.threadId === node2.content.threadId) {
      strength += 0.5;
    }
    
    // Topic overlap bonus
    const commonTopics = node1.content.topics.filter(topic => 
      node2.content.topics.includes(topic)
    );
    strength += commonTopics.length * 0.1;
    
    // Participant overlap bonus
    const commonParticipants = node1.content.participants.filter(p => 
      node2.content.participants.includes(p)
    );
    strength += commonParticipants.length * 0.1;
    
    return Math.min(strength, 1);
  }

  private gatherRelationshipEvidence(node1: EmailMemoryNode, node2: EmailMemoryNode): string[] {
    const evidence: string[] = [];
    
    if (node1.content.threadId === node2.content.threadId) {
      evidence.push('same_thread');
    }
    
    const commonTopics = node1.content.topics.filter(topic => 
      node2.content.topics.includes(topic)
    );
    if (commonTopics.length > 0) {
      evidence.push(`shared_topics:${commonTopics.join(',')}`);
    }
    
    const commonParticipants = node1.content.participants.filter(p => 
      node2.content.participants.includes(p)
    );
    if (commonParticipants.length > 0) {
      evidence.push(`shared_participants:${commonParticipants.join(',')}`);
    }
    
    return evidence;
  }

  private async createTopicRelationships(emailNode: EmailMemoryNode): Promise<void> {
    for (const topic of emailNode.content.topics) {
      const relatedNodes = await this.memorySystem.searchNodes({
        type: 'email_context',
        query: topic
      });
      
      for (const node of relatedNodes) {
        if (node.id !== emailNode.id) {
          emailNode.relationships.set(node.id, {
            type: 'related_topic',
            strength: this.calculateRelationshipStrength(emailNode, node as EmailMemoryNode),
            evidence: [`shared_topic:${topic}`]
          });
        }
      }
    }
  }

  async findRelevantEmails(query: string, context?: string): Promise<EmailMemorySearchResult> {
    const now = Date.now();
    
    // Create a more specific search criteria
    const searchCriteria = {
      type: 'email_context',
      query: query.trim(),
      context,
      filters: {
        // Only search emails from the last 30 days by default
        timestamp: {
          $gte: now - 30 * 24 * 60 * 60 * 1000
        }
      },
      limit: 20 // Limit results to prevent processing too many emails
    };

    // Search in memory system with specific criteria
    const relevantNodes = await this.memorySystem.searchNodes(searchCriteria);

    const emailNodes = relevantNodes
      .filter((node: MemoryNode): node is EmailMemoryNode => 
        node.type === 'email_context')
      .sort((a: EmailMemoryNode, b: EmailMemoryNode) => {
        // Sort by relevance score first, then by recency
        if (a.confidence !== b.confidence) {
          return b.confidence - a.confidence;
        }
        return b.content.timestamp - a.content.timestamp;
      });

    // Update access counts and last referenced timestamps
    for (const node of emailNodes) {
      node.content.lastReferencedAt = now;
      node.content.useCount++;
      await this.memorySystem.updateNode(node);
    }

    // Calculate confidence based on recency and relevance
    const confidence = this.calculateConfidence(emailNodes, query);
    
    // Check if we need a refresh based on time elapsed and result count
    const needsRefresh = this.needsRefresh(emailNodes) || emailNodes.length === 0;

    return {
      nodes: emailNodes,
      confidence,
      needsRefresh,
      lastUpdated: emailNodes.length > 0 
        ? Math.max(...emailNodes.map(n => n.content.lastReferencedAt))
        : now
    };
  }

  async getEmailInsights(messageId: string): Promise<UserInsight[]> {
    const nodes = await this.memorySystem.searchNodes({
      type: 'email_context',
      query: messageId
    });

    const emailNode = nodes.find((node): node is EmailMemoryNode => 
      node.type === 'email_context' && 
      typeof node.content === 'object' && 
      node.content !== null &&
      'messageId' in node.content &&
      node.content.messageId === messageId
    );

    if (!emailNode) return [];

    const insights: UserInsight[] = [];
    
    // Frequency insight
    if (emailNode.content.useCount > 5) {
      insights.push({
        type: 'interest',
        subject: `Email thread: ${emailNode.content.subject}`,
        sentiment: {
          primary: 'positive',
          intensity: 0.8,
          confidence: 0.9
        },
        confidence: Math.min(emailNode.content.useCount / 10, 1),
        context: 'custom_frequently_referenced_email',
        timestamp: Date.now(),
        mentions: emailNode.content.useCount,
        lastMentioned: emailNode.content.lastReferencedAt
      });
    }

    // Topic insights
    emailNode.content.topics.forEach(topic => {
      insights.push({
        type: 'topic',
        subject: topic,
        sentiment: {
          primary: emailNode.context.emotional_state.primary as 'positive' | 'negative' | 'neutral',
          intensity: 0.7,
          confidence: 0.8
        },
        confidence: 0.8,
        context: `custom_topic_from_email_${emailNode.content.subject.replace(/\s+/g, '_')}`,
        timestamp: emailNode.timestamp,
        mentions: 1,
        lastMentioned: emailNode.content.lastReferencedAt
      });
    });

    // Action item insights
    emailNode.content.analysis.action_items.forEach(action => {
      insights.push({
        type: 'action',
        subject: action,
        sentiment: {
          primary: 'neutral',
          intensity: 0.5,
          confidence: 0.9
        },
        confidence: 0.9,
        context: `custom_action_from_email_${emailNode.content.subject.replace(/\s+/g, '_')}`,
        timestamp: emailNode.timestamp,
        mentions: 1,
        lastMentioned: emailNode.content.lastReferencedAt
      });
    });

    return insights;
  }

  private async findNodesInThread(threadId: string): Promise<EmailMemoryNode[]> {
    const nodes = await this.memorySystem.searchNodes({
      type: 'email_context',
      query: threadId
    });

    return nodes.filter((node): node is EmailMemoryNode => 
      node.type === 'email_context' && 
      typeof node.content === 'object' && 
      node.content !== null &&
      'threadId' in node.content &&
      node.content.threadId === threadId
    );
  }

  private calculateConfidence(nodes: EmailMemoryNode[], query: string): number {
    if (nodes.length === 0) return 0;
    
    let confidence = 0;
    
    // Recency factor
    const mostRecent = Math.max(...nodes.map(n => n.content.lastReferencedAt));
    const recencyScore = Math.min(
      (Date.now() - mostRecent) / (24 * 60 * 60 * 1000), // Normalize to days
      1
    );
    
    // Relevance factor
    const relevanceScore = nodes.reduce((acc, node) => {
      const topicMatch = node.content.topics.some(topic => 
        query.toLowerCase().includes(topic.toLowerCase())
      );
      return acc + (topicMatch ? 1 : 0);
    }, 0) / nodes.length;
    
    // Usage factor
    const usageScore = nodes.reduce((acc, node) => 
      acc + Math.min(node.content.useCount / 10, 1), 0
    ) / nodes.length;
    
    confidence = (recencyScore + relevanceScore + usageScore) / 3;
    return Math.min(confidence, 1);
  }

  private needsRefresh(nodes: EmailMemoryNode[]): boolean {
    if (nodes.length === 0) return true;
    
    const mostRecent = Math.max(...nodes.map(n => n.content.lastReferencedAt));
    const hoursSinceUpdate = (Date.now() - mostRecent) / (60 * 60 * 1000);
    
    return hoursSinceUpdate > 24; // Refresh if data is older than 24 hours
  }

  async updateEmailReference(messageId: string): Promise<void> {
    const nodes = await this.memorySystem.searchNodes({
      type: 'email_context',
      query: messageId
    });

    const emailNode = nodes.find((node): node is EmailMemoryNode => 
      node.type === 'email_context' && 
      typeof node.content === 'object' && 
      node.content !== null &&
      'messageId' in node.content &&
      node.content.messageId === messageId
    );

    if (emailNode) {
      emailNode.content.lastReferencedAt = Date.now();
      emailNode.content.useCount++;
      await this.memorySystem.updateNode(emailNode);

      // Update thread context if available
      const threadContext = this.threadContextCache.get(emailNode.content.threadId);
      if (threadContext) {
        threadContext.lastAccessed = Date.now();
        threadContext.accessCount++;
        this.threadContextCache.set(emailNode.content.threadId, threadContext);
      }
    }
  }

  async getEmailById(messageId: string): Promise<EmailMemoryNode | null> {
    try {
      const emailContent = await prisma.emailContent.findUnique({
        where: { messageId },
        include: { analysis: true },
      });

      if (!emailContent) return null;

      // Update access metrics
      if (emailContent.analysis) {
        await prisma.emailAnalysis.update({
          where: { emailId: emailContent.id },
          data: {
            useCount: { increment: 1 },
            lastAccessed: new Date(),
          },
        });
      }

      return this.mapToEmailNode(emailContent);
    } catch (error) {
      console.error('Error retrieving email:', error);
      return null;
    }
  }

  private async analyzeEmail(email: ExtendedEmailMessage): Promise<EmailAnalysisResult> {
    const threadAnalysis = await this.analyzeEmailContent(email);
    const importance = this.calculateImportance(email, threadAnalysis);
    
    return {
      keyPoints: threadAnalysis.key_points,
      topics: threadAnalysis.topics,
      participants: [email.from, ...email.to],
      timeline: threadAnalysis.timeline,
      sentiment: threadAnalysis.sentiment,
      actionItems: threadAnalysis.action_items,
      summary: threadAnalysis.summary,
      importance,
      threadContext: email.threadId
    };
  }

  private mapToEmailNode(emailContent: any): EmailMemoryNode {
    const analysis = emailContent.analysis ? {
      key_points: emailContent.analysis.keyPoints || [],
      topics: emailContent.analysis.topics || [],
      participants: emailContent.analysis.participants || [],
      timeline: emailContent.analysis.timeline || [],
      sentiment: emailContent.analysis.sentiment || 'neutral',
      action_items: emailContent.analysis.actionItems || [],
      summary: emailContent.analysis.summary || ''
    } : {
      key_points: [],
      topics: [],
      participants: [],
      timeline: [],
      sentiment: 'neutral',
      action_items: [],
      summary: ''
    };

    return {
      id: emailContent.id,
      type: 'email_context',
      content: {
        messageId: emailContent.messageId,
        threadId: emailContent.threadId,
        subject: emailContent.subject,
        participants: emailContent.to,
        cc: emailContent.cc,
        bcc: emailContent.bcc,
        key_points: emailContent.analysis?.keyPoints || [],
        topics: emailContent.analysis?.topics || [],
        summary: emailContent.analysis?.summary || '',
        sentiment: emailContent.analysis?.sentiment || 'neutral',
        importance: emailContent.analysis?.importance || 0,
        thread_context: emailContent.analysis?.threadContext || '',
        timestamp: emailContent.date.getTime(),
        snippet: emailContent.snippet,
        isRead: emailContent.isRead || false,
        isStarred: emailContent.isStarred || false,
        labels: emailContent.labels,
        hasAttachments: emailContent.hasAttachments,
        lastReferencedAt: emailContent.analysis?.lastAccessed || Date.now(),
        useCount: emailContent.analysis?.useCount || 0,
        fullContent: emailContent.body,
        analysis
      },
      confidence: 1,
      timestamp: emailContent.date.getTime(),
      relationships: new Map(),
      context: {
        situation: 'custom_email_received',
        emotional_state: {
          primary: emailContent.analysis?.sentiment as 'neutral' | 'positive' | 'negative' | 'excited' | 'frustrated' | 'curious' | 'confused' | 'satisfied' | 'uncertain' | 'engaged' | 'disengaged',
          intensity: 0.7,
          confidence: 0.8
        },
        external_factors: []
      },
      evolution: {
        history: [{
          state: {
            content: 'Email node created',
            timestamp: Date.now()
          },
          timestamp: Date.now(),
          trigger: 'email_received'
        }],
        trend: 'stable',
        stability: 1
      }
    };
  }
} 
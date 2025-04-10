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

// Add Prisma types
type EmailContentWithAnalysis = Prisma.EmailContentGetPayload<{
  include: { analysis: true }
}>;

interface ThreadAnalysis {
  key_points: string[];
  topics: string[];
  participants: string[];
  timeline: { date: string; event: string }[];
  sentiment: string;
  action_items: string[];
  summary: string;
  entities: {
    people: string[];
    organizations: string[];
    locations: string[];
    dates: string[];
    urls: string[];
  };
  intent: {
    primary: 'request' | 'inform' | 'question' | 'response' | 'followup' | 'other';
    confidence: number;
    details: string;
  };
  context: {
    previousReferences: string[];
    relatedTopics: string[];
    externalContext: string[];
  };
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
  private prisma: any; // Type as any to allow operations

  constructor(memorySystem: AdvancedMemorySystem) {
    this.memorySystem = memorySystem;
    this.threadContextCache = new Map();
    this.prisma = prisma;
  }

  getMemorySystem(): AdvancedMemorySystem {
    return this.memorySystem;
  }

  async storeEmail(email: EmailMessage, context: string): Promise<void> {
    try {
      const extendedEmail = email as ExtendedEmailMessage;
      
      // Store thread
      await this.prisma.emailThread.upsert({
        where: { threadId: extendedEmail.threadId },
        create: {
          threadId: extendedEmail.threadId,
          userId: extendedEmail.userId,
          subject: extendedEmail.subject,
          participants: [extendedEmail.from, ...extendedEmail.to],
          lastMessageDate: extendedEmail.date,
          labels: extendedEmail.labels || [],
          status: 'active'
        },
        update: {
          lastMessageDate: extendedEmail.date,
          messageCount: { increment: 1 }
        }
      });

      // Store email content
      const emailContent = await this.prisma.emailContent.upsert({
        where: { messageId: extendedEmail.id },
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
          thread: {
            connect: { threadId: extendedEmail.threadId }
          }
        },
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
          thread: {
            connect: { threadId: extendedEmail.threadId }
          }
        }
      });

      // Store analysis
      const analysis = await this.analyzeEmail(extendedEmail);
      await this.prisma.emailAnalysis.upsert({
        where: { emailId: emailContent.id },
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
        }
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
        analysis: threadAnalysis,
        metadata: {
          category: 'primary',
          priority: 'medium',
          status: 'unread',
          flags: new Set(),
          customLabels: new Set()
        },
        threadContext: {
          depth: 0,
          totalMessages: 1,
          lastMessageTimestamp: email.date.getTime(),
          participants: new Set([email.from, ...email.to]),
          summary: threadAnalysis.summary,
          topic: threadAnalysis.topics[0] || 'general',
          status: 'active'
        },
        metrics: {
          relevanceScore: 0,
          importanceScore: this.calculateImportance(email, threadAnalysis),
          urgencyScore: 0,
          engagementScore: 0,
          completenessScore: 1
        },
        relationships: {
          inReplyTo: undefined,
          references: [],
          forwards: [],
          mentions: {
            people: [],
            emails: [],
            threads: []
          }
        }
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
      summary: this.generateSummary(email),
      entities: {
        people: [],
        organizations: [],
        locations: [],
        dates: [],
        urls: []
      },
      intent: {
        primary: 'other',
        confidence: 0.5,
        details: ''
      },
      context: {
        previousReferences: [],
        relatedTopics: [],
        externalContext: []
      }
    };
  }

  private extractKeyPoints(content: string): string[] {
    const lines = content.split('\n');
    const keyPoints: string[] = [];
    
    // Clean up the content
    const cleanContent = content.replace(/<[^>]*>/g, '') // Remove HTML tags
                               .replace(/\s+/g, ' ')      // Normalize whitespace
                               .trim();
    
    // Look for structured points
    for (const line of lines) {
      const cleanLine = line.trim();
      // Look for bullet points, numbered lists, or important markers
      if (cleanLine.match(/^[-•*]|\d+\.|!important|key:|main point:/i)) {
        keyPoints.push(cleanLine.replace(/^[-•*]\s*|\d+\.\s*|!important|key:|main point:/i, '').trim());
      }
    }

    // If no structured points found, try to extract sentences that look like key points
    if (keyPoints.length === 0) {
      const sentences = cleanContent.match(/[^.!?]+[.!?]+/g) || [];
      for (const sentence of sentences) {
        if (sentence.match(/\b(importantly|key|main|critical|essential|primary|must|should|need)\b/i)) {
          keyPoints.push(sentence.trim());
        }
      }
    }
    
    return keyPoints;
  }

  private extractTopics(subject: string, body: string): string[] {
    const content = `${subject} ${body}`.toLowerCase();
    const topics = new Set<string>();
    
    // Common business topics and their related terms
    const topicPatterns = {
      'partnership': /partnership|collaboration|alliance|joint venture/g,
      'contract': /contract|agreement|terms|legal|document/g,
      'project': /project|initiative|program|development/g,
      'timeline': /timeline|schedule|deadline|due date|timeframe/g,
      'budget': /budget|payment|cost|pricing|financial/g,
      'marketing': /marketing|promotion|campaign|advertising|brand/g,
      'technical': /technical|software|system|platform|integration/g,
      'feedback': /feedback|review|suggestion|input|opinion/g,
      'meeting': /meeting|call|discussion|conference|sync/g,
      'update': /update|status|progress|development|change/g
    };
    
    // Check for each topic pattern
    for (const [topic, pattern] of Object.entries(topicPatterns)) {
      if (pattern.test(content)) {
        topics.add(topic);
      }
    }
    
    return Array.from(topics);
  }

  private analyzeSentiment(content: string): string {
    const cleanContent = content.toLowerCase();
    
    // More comprehensive word lists
    const sentimentPatterns = {
      positive: {
        words: ['thank', 'great', 'good', 'excellent', 'appreciate', 'pleased', 'happy', 
                'wonderful', 'fantastic', 'excited', 'looking forward', 'successful', 'agree',
                'opportunity', 'beneficial', 'impressive', 'perfect', 'outstanding'],
        weight: 1
      },
      negative: {
        words: ['sorry', 'issue', 'problem', 'concern', 'delay', 'unfortunately', 'regret',
                'disappoint', 'difficult', 'fail', 'mistake', 'error', 'wrong', 'bad',
                'urgent', 'serious', 'trouble', 'worried'],
        weight: -1
      },
      intensifiers: {
        words: ['very', 'really', 'extremely', 'absolutely', 'definitely', 'highly'],
        weight: 0.5
      }
    };
    
    let score = 0;
    let hasIntensifier = false;
    
    // Check for sentiment words
    for (const [sentiment, { words, weight }] of Object.entries(sentimentPatterns)) {
      for (const word of words) {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = cleanContent.match(regex);
        if (matches) {
          if (sentiment === 'intensifiers') {
            hasIntensifier = true;
          } else {
            score += matches.length * weight * (hasIntensifier ? 1.5 : 1);
          }
        }
      }
    }
    
    // Consider exclamation marks
    const exclamationCount = (content.match(/!/g) || []).length;
    score += exclamationCount * 0.5;
    
    // Determine final sentiment
    if (score >= 2) return 'positive';
    if (score <= -2) return 'negative';
    if (score > 0) return 'slightly positive';
    if (score < 0) return 'slightly negative';
    return 'neutral';
  }

  private extractActionItems(content: string): string[] {
    const lines = content.split('\n');
    const actionItems: string[] = [];
    
    // More comprehensive patterns for action items
    const actionPatterns = [
      {
        pattern: /(?:please|kindly)\s+([^.!?]+[.!?])/i,
        type: 'request'
      },
      {
        pattern: /(?:need|should|must|have to)\s+([^.!?]+[.!?])/i,
        type: 'requirement'
      },
      {
        pattern: /(?:action (?:required|needed|item)):\s*([^.!?]+[.!?])/i,
        type: 'explicit'
      },
      {
        pattern: /(?:follow[- ]?up|todo|to-do):\s*([^.!?]+[.!?])/i,
        type: 'followup'
      },
      {
        pattern: /(?:can you|could you)\s+([^.!?]+[.!?])/i,
        type: 'request'
      },
      {
        pattern: /(?:will|going to|shall)\s+([^.!?]+[.!?])/i,
        type: 'commitment'
      }
    ];
    
    // Process each line
    for (const line of lines) {
      const cleanLine = line.trim();
      
      // Check for structured action items
      for (const { pattern, type } of actionPatterns) {
        const match = cleanLine.match(pattern);
        if (match && match[1]) {
          const actionText = match[1].trim();
          // Avoid duplicates and ensure it's an actual action
          if (!actionItems.includes(actionText) && actionText.length > 10) {
            actionItems.push(actionText);
          }
        }
      }
      
      // Check for bullet points that look like actions
      if (cleanLine.match(/^[-•*]\s*\w+.*(?:please|need|should|must|will|going to)/i)) {
        const actionText = cleanLine.replace(/^[-•*]\s*/, '').trim();
        if (!actionItems.includes(actionText) && actionText.length > 10) {
          actionItems.push(actionText);
        }
      }
    }
    
    return actionItems;
  }

  private generateSummary(email: EmailMessage): string {
    // Extract key information
    const keyPoints = this.extractKeyPoints(email.body);
    const topics = this.extractTopics(email.subject, email.body);
    const actionItems = this.extractActionItems(email.body);
    const sentiment = this.analyzeSentiment(email.body);

    // Build a comprehensive summary
    const parts: string[] = [];

    // Add main context
    parts.push(`${sentiment === 'positive' ? 'Positive' : sentiment === 'negative' ? 'Negative' : 'Neutral'} communication regarding "${email.subject}"`);

    // Add key points if available
    if (keyPoints.length > 0) {
      parts.push(`Main points: ${keyPoints.slice(0, 2).join('; ')}`);
    }

    // Add action items if available
    if (actionItems.length > 0) {
      parts.push(`Action items: ${actionItems.slice(0, 2).join('; ')}`);
    }

    // Add topics if available and different from subject
    if (topics.length > 0 && !topics.every(topic => email.subject.toLowerCase().includes(topic.toLowerCase()))) {
      parts.push(`Related topics: ${topics.slice(0, 2).join(', ')}`);
    }

    return parts.join('. ');
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

  private async performDeepContentSearch(query: string, nodes: EmailMemoryNode[]): Promise<EmailMemoryNode[]> {
    const searchTerms = query.toLowerCase().split(/\s+/);
    
    // Score each node based on deep content matching
    const scoredNodes = await Promise.all(nodes.map(async node => {
      let score = 0;
      
      // Search in full content with context
      const contentFields = [
        { text: node.content.fullContent, weight: 0.4 },
        { text: node.content.subject, weight: 0.2 },
        { text: node.content.summary, weight: 0.15 },
        { text: node.content.key_points.join(' '), weight: 0.15 },
        { text: node.content.analysis.action_items.join(' '), weight: 0.1 }
      ];

      // Calculate weighted score for each content field
      for (const field of contentFields) {
        const fieldContent = field.text.toLowerCase();
        const fieldScore = searchTerms.reduce((termScore, term) => {
          // Exact match
          if (fieldContent.includes(term)) {
            return termScore + 1.0;
          }
          // Partial word match
          const words = fieldContent.split(/\s+/);
          const partialMatches = words.filter(word => 
            word.includes(term) || term.includes(word)
          ).length;
          return termScore + (partialMatches / words.length) * 0.5;
        }, 0) / searchTerms.length;
        
        score += fieldScore * field.weight;
      }

      // Consider entity matches
      const entityScore = this.calculateEntityMatchScore(searchTerms, node.content.analysis.entities);
      score += entityScore * 0.2;  // 20% weight for entity matches

      // Consider intent and context
      if (node.content.analysis.intent.details.toLowerCase().includes(query.toLowerCase())) {
        score += 0.1;  // Bonus for intent match
      }

      // Consider thread context
      if (node.content.threadContext) {
        const threadContextScore = searchTerms.reduce((s, term) => 
          node.content.threadContext.topic.toLowerCase().includes(term) ? s + 0.1 : s, 0
        );
        score += threadContextScore;
      }

      return {
        node,
        score: Math.min(score, 1)  // Normalize to 0-1
      };
    }));

    // Sort by score and return nodes
    return scoredNodes
      .sort((a, b) => b.score - a.score)
      .map(scored => scored.node);
  }

  private calculateEntityMatchScore(searchTerms: string[], entities: {
    people: string[];
    organizations: string[];
    locations: string[];
    dates: string[];
    urls: string[];
  }): number {
    let score = 0;
    const allEntities = [
      ...entities.people,
      ...entities.organizations,
      ...entities.locations,
      ...entities.dates,
      ...entities.urls
    ].map(e => e.toLowerCase());

    for (const term of searchTerms) {
      const exactMatches = allEntities.filter(e => e.includes(term)).length;
      score += (exactMatches / allEntities.length) * 0.5;  // 50% weight for exact matches
      
      const partialMatches = allEntities.filter(e => 
        e.split(/\s+/).some(word => word.includes(term) || term.includes(word))
      ).length;
      score += (partialMatches / allEntities.length) * 0.3;  // 30% weight for partial matches
    }

    return Math.min(score, 1);
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

    // Filter and type-check nodes
    let emailNodes = relevantNodes
      .filter((node: MemoryNode): node is EmailMemoryNode => 
        node.type === 'email_context');

    // Perform deep content search
    emailNodes = await this.performDeepContentSearch(query, emailNodes);

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

  // Add fuzzy matching helper
  private calculateFuzzyScore(str1: string, str2: string): number {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    // If either string contains the other, high similarity
    if (s1.includes(s2) || s2.includes(s1)) {
      return 0.9;
    }
    
    // Calculate word-level similarity
    const words1 = new Set(s1.split(/\s+/));
    const words2 = new Set(s2.split(/\s+/));
    
    const commonWords = new Set([...words1].filter(x => words2.has(x)));
    const similarity = commonWords.size / Math.max(words1.size, words2.size);
    
    return similarity;
  }

  private calculateConfidence(nodes: EmailMemoryNode[], query: string): number {
    if (nodes.length === 0) return 0;
    
    // Calculate individual scores for each node and take the max
    const nodeScores = nodes.map(node => {
      // Recency score (0-1): More recent = higher score
      const recencyScore = Math.max(0, 1 - (Date.now() - node.content.lastReferencedAt) / (7 * 24 * 60 * 60 * 1000)); // 7 days max

      // Usage score (0-1): More usage = higher score, capped at 10 uses
      const usageScore = Math.min(node.content.useCount / 10, 1);

      // Topic relevance (0-1): Percentage of topics that match query terms with fuzzy matching
      const queryTerms = query.toLowerCase().split(/\s+/);
      const topicRelevance = node.content.topics.reduce((score, topic) => {
        const topicScore = queryTerms.reduce((termScore, term) => 
          Math.max(termScore, this.calculateFuzzyScore(term, topic)), 0
        );
        return score + topicScore;
      }, 0) / Math.max(1, node.content.topics.length);

      // Content relevance (0-1): Check query terms against subject, key points, and summary with fuzzy matching
      const contentParts = [
        { text: node.content.subject, weight: 0.4 },
        { text: node.content.key_points.join(' '), weight: 0.3 },
        { text: node.content.summary, weight: 0.3 }
      ];
      
      const contentRelevance = contentParts.reduce((score, part) => {
        const partScore = queryTerms.reduce((termScore, term) => 
          Math.max(termScore, this.calculateFuzzyScore(term, part.text)), 0
        );
        return score + (partScore * part.weight);
      }, 0);

      // Thread context relevance (0-1): Check if query matches thread context with fuzzy matching
      const threadRelevance = node.content.thread_context ?
        queryTerms.reduce((score, term) => 
          Math.max(score, this.calculateFuzzyScore(term, node.content.thread_context)), 0
        ) : 0;

      // Importance score (0-1): Use the node's calculated importance
      const importanceScore = node.content.importance;

      // Weighted average of all factors
      return {
        total: (
          recencyScore * 0.15 +      // 15% weight for recency
          usageScore * 0.10 +        // 10% weight for usage
          topicRelevance * 0.25 +    // 25% weight for topic relevance
          contentRelevance * 0.25 +  // 25% weight for content relevance
          threadRelevance * 0.15 +   // 15% weight for thread context
          importanceScore * 0.10     // 10% weight for importance
        ),
        factors: {
          recency: recencyScore,
          usage: usageScore,
          topicRelevance,
          contentRelevance,
          threadRelevance,
          importance: importanceScore
        }
      };
    });

    // Get the highest scoring node's total
    const maxScore = Math.max(...nodeScores.map(score => score.total));
    
    // Log detailed scoring for debugging if needed
    if (process.env.NODE_ENV === 'development') {
      console.debug('Email confidence scores:', {
        query,
        scores: nodeScores.map((score, i) => ({
          nodeId: nodes[i].id,
          total: score.total,
          factors: score.factors
        }))
      });
    }

    return Math.min(maxScore, 1);
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
      const emailContent = await this.prisma.emailContent.findUnique({
        where: { messageId },
        include: { analysis: true },
      });

      if (!emailContent) return null;

      // Update access metrics
      if (emailContent.analysis) {
        await this.prisma.emailAnalysis.update({
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
      summary: emailContent.analysis.summary || '',
      entities: emailContent.analysis.entities || {
        people: [],
        organizations: [],
        locations: [],
        dates: [],
        urls: []
      },
      intent: emailContent.analysis.intent || {
        primary: 'other',
        confidence: 0.5,
        details: ''
      },
      context: emailContent.analysis.context || {
        previousReferences: [],
        relatedTopics: [],
        externalContext: []
      }
    } : {
      key_points: [],
      topics: [],
      participants: [],
      timeline: [],
      sentiment: 'neutral',
      action_items: [],
      summary: '',
      entities: {
        people: [],
        organizations: [],
        locations: [],
        dates: [],
        urls: []
      },
      intent: {
        primary: 'other',
        confidence: 0.5,
        details: ''
      },
      context: {
        previousReferences: [],
        relatedTopics: [],
        externalContext: []
      }
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
        analysis,
        metadata: {
          category: 'primary',
          priority: 'medium',
          status: emailContent.isRead ? 'read' : 'unread',
          flags: new Set(emailContent.isStarred ? ['starred'] : []),
          customLabels: new Set(emailContent.labels || [])
        },
        threadContext: {
          depth: 0,
          totalMessages: 1,
          lastMessageTimestamp: emailContent.date.getTime(),
          participants: new Set(emailContent.to || []),
          summary: emailContent.analysis?.summary || '',
          topic: emailContent.analysis?.topics?.[0] || 'general',
          status: 'active'
        },
        metrics: {
          relevanceScore: 0,
          importanceScore: emailContent.analysis?.importance || 0,
          urgencyScore: 0,
          engagementScore: 0,
          completenessScore: 1
        },
        relationships: {
          inReplyTo: undefined,
          references: [],
          forwards: [],
          mentions: {
            people: [],
            emails: [],
            threads: []
          }
        }
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
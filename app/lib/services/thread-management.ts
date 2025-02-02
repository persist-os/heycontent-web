import { PrismaClient, Prisma } from '@prisma/client';
import prisma from '../prisma';
import { createEmbedding } from '../utils/embeddings';
import { detectLanguage } from '../utils/language';

// Error handling types
interface ThreadError extends Error {
  code: string;
  operation: string;
  threadId?: string;
  details?: any;
}

class ThreadOperationError extends Error implements ThreadError {
  code: string;
  operation: string;
  threadId?: string;
  details?: any;

  constructor(code: string, operation: string, message: string, threadId?: string, details?: any) {
    super(message);
    this.name = 'ThreadOperationError';
    this.code = code;
    this.operation = operation;
    this.threadId = threadId;
    this.details = details;
  }
}

// Logging interface
interface ThreadLogEntry {
  timestamp: Date;
  level: 'info' | 'warn' | 'error';
  operation: string;
  threadId?: string;
  message: string;
  metadata?: any;
}

class ThreadLogger {
  private logs: ThreadLogEntry[] = [];

  log(entry: Omit<ThreadLogEntry, 'timestamp'>) {
    const logEntry: ThreadLogEntry = {
      timestamp: new Date(),
      ...entry
    };
    this.logs.push(logEntry);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      const { level, operation, threadId, message, metadata } = logEntry;
      console[level](`[${operation}]${threadId ? ` [Thread: ${threadId}]` : ''}: ${message}`, metadata || '');
    }
  }

  getLogs(threadId?: string): ThreadLogEntry[] {
    return threadId 
      ? this.logs.filter(log => log.threadId === threadId)
      : this.logs;
  }

  clearLogs(threadId?: string) {
    if (threadId) {
      this.logs = this.logs.filter(log => log.threadId !== threadId);
    } else {
      this.logs = [];
    }
  }
}

// Define interfaces that match our schema
interface ThreadParticipant {
  email: string;
  role: 'sender' | 'primary_recipient' | 'cc' | 'bcc';
  messageCount: number;
  lastActive: Date;
  responseRate: number;
}

interface EmailInput {
  threadId: string;
  userId: string;
  subject: string;
  from: string;
  to: string[];
  cc?: string[];
  body: string;
  date: Date;
  messageId: string;
}

// Use Prisma's types
type EmailThreadWithRelations = Prisma.EmailThreadGetPayload<{
  include: {
    analysis: true;
    context: true;
    state: true;
    emails: true;
  }
}>;

type ThreadStateInput = Omit<Prisma.ThreadStateCreateInput, 'id' | 'thread'>;

interface ThreadSearchOptions {
  userId: string;
  query: string;
  filters?: {
    status?: string;
    priority?: string;
    dateRange?: {
      start: Date;
      end: Date;
    };
  };
}

interface ThreadSearchResult {
  threadId: string;
  score: number;
  summary: string;
  matchType: 'content' | 'topic' | 'participant';
}

interface ThreadMetrics {
  responseTime: {
    average: number;
    latest: number;
  };
  participants: {
    total: number;
    active: number;
    lastActive: Record<string, Date>;
  };
  activity: {
    messageCount: number;
    lastMessageDate: Date;
    isActive: boolean;
  };
}

interface TopicChange {
  topic: string;
  firstMention: Date;
  lastMention: Date;
  messageCount: number;
}

interface ThreadContextMetadata {
  languageCode: string;
  contextType: 'summary' | 'detailed' | 'technical';
  confidenceScore: number;
  lastAnalyzed: Date;
  keyTerms: string[];
  references: {
    emailIds: string[];
    externalUrls?: string[];
  };
}

interface ThreadContextUpdate {
  context: string;
  metadata: ThreadContextMetadata;
  version: number;
}

export class ThreadManagementService {
  private logger: ThreadLogger;

  constructor() {
    this.logger = new ThreadLogger();
  }

  async createOrUpdateThread(email: EmailInput): Promise<void> {
    try {
      this.logger.log({
        level: 'info',
        operation: 'createOrUpdateThread',
        threadId: email.threadId,
        message: 'Starting thread creation/update',
        metadata: { subject: email.subject }
      });

      // Get or create thread
      const thread = await prisma.emailThread.upsert({
        where: { threadId: email.threadId },
        update: {
          lastMessageDate: email.date,
          messageCount: { increment: 1 },
          participants: {
            push: [email.from, ...email.to, ...(email.cc || [])]
          }
        },
        create: {
          threadId: email.threadId,
          userId: email.userId,
          subject: email.subject,
          participants: [email.from, ...email.to, ...(email.cc || [])],
          lastMessageDate: email.date,
          messageCount: 1,
          labels: [],
        },
      }).catch(error => {
        throw new ThreadOperationError(
          'THREAD_UPSERT_FAILED',
          'createOrUpdateThread',
          'Failed to create or update thread',
          email.threadId,
          { error }
        );
      });

      this.logger.log({
        level: 'info',
        operation: 'createOrUpdateThread',
        threadId: thread.id,
        message: 'Thread created/updated successfully',
        metadata: { threadId: thread.id }
      });

      // Run all updates in parallel for better performance
      await Promise.all([
        this.updateThreadAnalysis(thread.id, email).catch(error => {
          this.logger.log({
            level: 'error',
            operation: 'updateThreadAnalysis',
            threadId: thread.id,
            message: 'Failed to update thread analysis',
            metadata: { error }
          });
          throw new ThreadOperationError(
            'ANALYSIS_UPDATE_FAILED',
            'updateThreadAnalysis',
            'Failed to update thread analysis',
            thread.id,
            { error }
          );
        }),
        this.findAndCreateRelationships(thread.id, email).catch(error => {
          this.logger.log({
            level: 'error',
            operation: 'findAndCreateRelationships',
            threadId: thread.id,
            message: 'Failed to update thread relationships',
            metadata: { error }
          });
          throw new ThreadOperationError(
            'RELATIONSHIP_UPDATE_FAILED',
            'findAndCreateRelationships',
            'Failed to update thread relationships',
            thread.id,
            { error }
          );
        }),
        this.persistThreadContext(thread.id, email).catch(error => {
          this.logger.log({
            level: 'error',
            operation: 'persistThreadContext',
            threadId: thread.id,
            message: 'Failed to persist thread context',
            metadata: { error }
          });
          throw new ThreadOperationError(
            'CONTEXT_UPDATE_FAILED',
            'persistThreadContext',
            'Failed to persist thread context',
            thread.id,
            { error }
          );
        }),
        this.updateThreadState(thread.id, email).catch(error => {
          this.logger.log({
            level: 'error',
            operation: 'updateThreadState',
            threadId: thread.id,
            message: 'Failed to update thread state',
            metadata: { error }
          });
          throw new ThreadOperationError(
            'STATE_UPDATE_FAILED',
            'updateThreadState',
            'Failed to update thread state',
            thread.id,
            { error }
          );
        })
      ]);

      this.logger.log({
        level: 'info',
        operation: 'createOrUpdateThread',
        threadId: thread.id,
        message: 'All thread updates completed successfully'
      });
    } catch (error) {
      this.logger.log({
        level: 'error',
        operation: 'createOrUpdateThread',
        threadId: email.threadId,
        message: 'Failed to process thread',
        metadata: { error }
      });

      if (error instanceof ThreadOperationError) {
        throw error;
      }

      throw new ThreadOperationError(
        'THREAD_PROCESSING_FAILED',
        'createOrUpdateThread',
        'Failed to process thread',
        email.threadId,
        { error }
      );
    }
  }

  // Helper method to get logs for a thread
  async getThreadLogs(threadId: string): Promise<ThreadLogEntry[]> {
    return this.logger.getLogs(threadId);
  }

  // Helper method to clear logs for a thread
  async clearThreadLogs(threadId?: string): Promise<void> {
    this.logger.clearLogs(threadId);
  }

  private serializeParticipants(participants: Record<string, ThreadParticipant>): Prisma.InputJsonValue {
    type JsonParticipant = {
      email: string;
      role: string;
      messageCount: number;
      lastActive: string;
      responseRate: number;
    };

    const serialized: Record<string, JsonParticipant> = {};
    
    for (const [email, participant] of Object.entries(participants)) {
      serialized[email] = {
        email: participant.email,
        role: participant.role,
        messageCount: participant.messageCount,
        lastActive: participant.lastActive.toISOString(),
        responseRate: participant.responseRate
      };
    }
    
    return serialized as Prisma.InputJsonValue;
  }

  private async updateThreadAnalysis(threadId: string, email: EmailInput): Promise<void> {
    try {
      this.logger.log({
        level: 'info',
        operation: 'updateThreadAnalysis',
        threadId,
        message: 'Starting thread analysis update'
      });

      const existingAnalysis = await prisma.threadAnalysis.findUnique({
        where: { threadId }
      }).catch(error => {
        throw new ThreadOperationError(
          'ANALYSIS_FETCH_FAILED',
          'updateThreadAnalysis',
          'Failed to fetch existing thread analysis',
          threadId,
          { error }
        );
      });

      const newAnalysis = await this.analyzeEmail(email).catch(error => {
        throw new ThreadOperationError(
          'EMAIL_ANALYSIS_FAILED',
          'updateThreadAnalysis',
          'Failed to analyze email content',
          threadId,
          { error, emailId: email.messageId }
        );
      });

      if (existingAnalysis) {
        this.logger.log({
          level: 'info',
          operation: 'updateThreadAnalysis',
          threadId,
          message: 'Updating existing analysis'
        });

        const updatedParticipants = this.updateParticipantMetrics(
          existingAnalysis.participants as any,
          email
        );

        await prisma.threadAnalysis.update({
          where: { threadId },
          data: {
            summary: this.mergeThreadSummaries(existingAnalysis.summary, newAnalysis.summary),
            topics: [...new Set([...existingAnalysis.topics, ...newAnalysis.topics])],
            keyPoints: [...existingAnalysis.keyPoints, ...newAnalysis.keyPoints],
            sentiment: this.calculateOverallSentiment(existingAnalysis.sentiment, newAnalysis.sentiment),
            participants: this.serializeParticipants(updatedParticipants),
            timeline: {
              push: [{
                timestamp: email.date,
                event: 'message_received',
                messageId: email.messageId,
                participants: [email.from, ...email.to],
                summary: newAnalysis.summary
              }]
            },
            actionItems: [...new Set([...existingAnalysis.actionItems, ...newAnalysis.actionItems])],
            importance: this.calculateImportance(email),
            updatedAt: new Date(),
          },
        }).catch(error => {
          throw new ThreadOperationError(
            'ANALYSIS_UPDATE_FAILED',
            'updateThreadAnalysis',
            'Failed to update thread analysis',
            threadId,
            { error }
          );
        });
      } else {
        this.logger.log({
          level: 'info',
          operation: 'updateThreadAnalysis',
          threadId,
          message: 'Creating new analysis'
        });

        await prisma.threadAnalysis.create({
          data: {
            threadId,
            summary: newAnalysis.summary,
            topics: newAnalysis.topics,
            keyPoints: newAnalysis.keyPoints,
            sentiment: newAnalysis.sentiment,
            participants: {
              [email.from]: {
                role: 'sender',
                messageCount: 1,
                lastActive: email.date,
                responseRate: 1.0
              },
              ...Object.fromEntries(
                email.to.map(recipient => [recipient, {
                  role: 'primary_recipient',
                  messageCount: 0,
                  lastActive: email.date,
                  responseRate: 0
                }])
              )
            },
            timeline: [{
              timestamp: email.date,
              event: 'thread_created',
              messageId: email.messageId,
              participants: [email.from, ...email.to],
              summary: newAnalysis.summary
            }],
            actionItems: newAnalysis.actionItems,
            importance: newAnalysis.importance,
          },
        }).catch(error => {
          throw new ThreadOperationError(
            'ANALYSIS_CREATE_FAILED',
            'updateThreadAnalysis',
            'Failed to create thread analysis',
            threadId,
            { error }
          );
        });
      }

      this.logger.log({
        level: 'info',
        operation: 'updateThreadAnalysis',
        threadId,
        message: 'Thread analysis updated successfully'
      });
    } catch (error) {
      this.logger.log({
        level: 'error',
        operation: 'updateThreadAnalysis',
        threadId,
        message: 'Failed to update thread analysis',
        metadata: { error }
      });

      if (error instanceof ThreadOperationError) {
        throw error;
      }

      throw new ThreadOperationError(
        'ANALYSIS_OPERATION_FAILED',
        'updateThreadAnalysis',
        'Thread analysis operation failed',
        threadId,
        { error }
      );
    }
  }

  private async findAndCreateRelationships(threadId: string, email: EmailInput): Promise<void> {
    const relatedThreads = await this.findRelatedThreads(threadId, email);

    for (const related of relatedThreads) {
      const relationship = await this.analyzeThreadRelationship(threadId, related.id, email);

      if (relationship.strength > 0.3) {
        await prisma.threadRelationship.upsert({
          where: {
            threadId_relatedThreadId: {
              threadId,
              relatedThreadId: related.id
            }
          },
          update: {
            strength: relationship.strength,
            evidence: relationship.evidence,
            metadata: relationship.metadata
          },
          create: {
            threadId,
            relatedThreadId: related.id,
            relationshipType: relationship.type,
            strength: relationship.strength,
            evidence: relationship.evidence,
            metadata: relationship.metadata
          }
        });
      }
    }
  }

  private async findRelatedThreads(threadId: string, email: EmailInput) {
    const similarThreads = await prisma.emailThread.findMany({
      where: {
        id: { not: threadId },
        userId: email.userId,
        OR: [
          { participants: { hasSome: [email.from, ...email.to] } },
          { subject: { contains: email.subject.replace(/^(Re:|Fwd:)\s*/i, '') } }
        ]
      },
      include: {
        analysis: true
      },
      take: 10
    });

    const emailEmbedding = await createEmbedding(email.body);
    const vectorSimilarThreads = await prisma.$queryRaw<Array<any>>`
      SELECT t.*, 
        (SELECT AVG(similarity) 
         FROM "EmailContent" e 
         WHERE e."threadId" = t."threadId"
         AND (e."searchVector" <=> ${emailEmbedding}::vector)) as avg_similarity
      FROM "EmailThread" t
      WHERE t."id" != ${threadId}
      AND t."userId" = ${email.userId}
      HAVING avg_similarity > 0.7
      ORDER BY avg_similarity DESC
      LIMIT 5
    `;

    return [...similarThreads, ...vectorSimilarThreads];
  }

  private async analyzeThreadRelationship(threadId: string, relatedThreadId: string, email: EmailInput) {
    const [thread, relatedThread] = await Promise.all([
      prisma.emailThread.findUnique({
        where: { id: threadId },
        include: { analysis: true }
      }),
      prisma.emailThread.findUnique({
        where: { id: relatedThreadId },
        include: { analysis: true }
      })
    ]);

    if (!thread || !relatedThread) {
      throw new Error('Thread not found');
    }

    const participantOverlap = this.calculateParticipantOverlap(
      thread.participants,
      relatedThread.participants
    );

    const topicOverlap = this.calculateTopicOverlap(
      thread.analysis?.topics || [],
      relatedThread.analysis?.topics || []
    );

    const timeProximity = this.calculateTimeProximity(
      thread.lastMessageDate,
      relatedThread.lastMessageDate
    );

    const type = this.determineRelationshipType(thread, relatedThread, email);
    const strength = (participantOverlap + topicOverlap + timeProximity) / 3;

    return {
      type,
      strength,
      evidence: {
        participantOverlap,
        topicOverlap,
        timeProximity,
        commonParticipants: thread.participants.filter(p => 
          relatedThread.participants.includes(p)
        )
      },
      metadata: {
        lastInteraction: new Date(),
        interactionCount: 1
      }
    };
  }

  private async analyzeEmail(email: EmailInput) {
    const topics = await this.extractTopics(email.subject, email.body);
    const keyPoints = await this.extractKeyPoints(email.body);
    const sentiment = await this.analyzeSentiment(email.body);
    const actionItems = await this.extractActionItems(email.body);
    const summary = await this.generateSummary(email);
    const importance = this.calculateImportance(email);

    return {
      topics,
      keyPoints,
      sentiment,
      actionItems,
      summary,
      importance
    };
  }

  private calculateParticipantOverlap(participants1: string[], participants2: string[]): number {
    const set1 = new Set(participants1);
    const set2 = new Set(participants2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  }

  private calculateTopicOverlap(topics1: string[], topics2: string[]): number {
    const set1 = new Set(topics1);
    const set2 = new Set(topics2);
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    return intersection.size / union.size;
  }

  private calculateTimeProximity(date1: Date, date2: Date): number {
    const timeDiff = Math.abs(date1.getTime() - date2.getTime());
    const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
    return Math.max(0, 1 - daysDiff / 30);
  }

  private determineRelationshipType(thread: any, relatedThread: any, email: EmailInput): string {
    if (email.subject.toLowerCase().startsWith('re:')) return 'reply';
    if (email.subject.toLowerCase().startsWith('fwd:')) return 'forward';
    if (this.hasReferences(email, relatedThread.threadId)) return 'reference';
    if (this.isSplitThread(thread, relatedThread)) return 'split';
    if (this.isMergedThread(thread, relatedThread)) return 'merge';
    return 'related';
  }

  private hasReferences(email: EmailInput, threadId: string): boolean {
    return email.body.includes(threadId);
  }

  private isSplitThread(thread: any, relatedThread: any): boolean {
    return thread.subject.includes(relatedThread.subject);
  }

  private isMergedThread(thread: any, relatedThread: any): boolean {
    return thread.participants.every((p: string) => relatedThread.participants.includes(p));
  }

  private async extractTopics(subject: string, body: string): Promise<string[]> {
    const topics = new Set<string>();
    const text = `${subject} ${body}`.toLowerCase();
    
    const commonTopics = [
      'meeting', 'project', 'update', 'report', 'request',
      'proposal', 'review', 'feedback', 'question', 'issue'
    ];

    commonTopics.forEach(topic => {
      if (text.includes(topic)) {
        topics.add(topic);
      }
    });

    return Array.from(topics);
  }

  private async extractKeyPoints(text: string): Promise<string[]> {
    return text
      .split(/[.!?]/)
      .filter(sentence => 
        sentence.toLowerCase().includes('important') ||
        sentence.toLowerCase().includes('key') ||
        sentence.toLowerCase().includes('must') ||
        sentence.toLowerCase().includes('should')
      )
      .map(point => point.trim());
  }

  private async analyzeSentiment(text: string): Promise<string> {
    const positiveWords = ['good', 'great', 'excellent', 'thank', 'appreciate'];
    const negativeWords = ['bad', 'issue', 'problem', 'concern', 'sorry'];

    let score = 0;
    text = text.toLowerCase();

    positiveWords.forEach(word => {
      if (text.includes(word)) score++;
    });

    negativeWords.forEach(word => {
      if (text.includes(word)) score--;
    });

    if (score > 0) return 'positive';
    if (score < 0) return 'negative';
    return 'neutral';
  }

  private async extractActionItems(text: string): Promise<string[]> {
    return text
      .split('\n')
      .filter(line => 
        line.toLowerCase().includes('todo') ||
        line.toLowerCase().includes('action item') ||
        line.toLowerCase().includes('please') ||
        line.toLowerCase().includes('need to')
      )
      .map(item => item.trim());
  }

  private async generateSummary(email: EmailInput): Promise<string> {
    return `Email from ${email.from} about "${email.subject}" with ${email.to.length} recipients`;
  }

  private calculateImportance(email: EmailInput): number {
    let importance = 0;
    importance += Math.min((email.to.length + (email.cc?.length || 0)) * 0.1, 0.3);
    
    const importantSubjectTerms = ['urgent', 'important', 'priority', 'asap'];
    if (importantSubjectTerms.some(term => email.subject.toLowerCase().includes(term))) {
      importance += 0.3;
    }

    const hour = email.date.getHours();
    if (hour >= 9 && hour <= 17) {
      importance += 0.2;
    }

    return Math.min(importance, 1);
  }

  private mergeThreadSummaries(existing: string, newSummary: string): string {
    return `${existing}\n${newSummary}`.slice(0, 1000);
  }

  private calculateOverallSentiment(existing: string, newSentiment: string): string {
    const sentimentScore = {
      positive: 1,
      neutral: 0,
      negative: -1
    };

    const avgScore = (sentimentScore[existing as keyof typeof sentimentScore] + 
                     sentimentScore[newSentiment as keyof typeof sentimentScore]) / 2;

    if (avgScore > 0.3) return 'positive';
    if (avgScore < -0.3) return 'negative';
    return 'neutral';
  }

  private updateParticipantMetrics(existing: Record<string, ThreadParticipant>, email: EmailInput): Record<string, ThreadParticipant> {
    const updated = { ...existing };

    if (updated[email.from]) {
      updated[email.from].messageCount++;
      updated[email.from].lastActive = email.date;
      updated[email.from].responseRate = this.calculateResponseRate(updated[email.from]);
    } else {
      updated[email.from] = {
        email: email.from,
        role: 'sender',
        messageCount: 1,
        lastActive: email.date,
        responseRate: 1.0
      };
    }

    email.to.forEach((recipient: string) => {
      if (updated[recipient]) {
        updated[recipient].lastActive = email.date;
      } else {
        updated[recipient] = {
          email: recipient,
          role: 'primary_recipient',
          messageCount: 0,
          lastActive: email.date,
          responseRate: 0
        };
      }
    });

    return updated;
  }

  private calculateResponseRate(participant: ThreadParticipant): number {
    return participant.messageCount / 
           (Date.now() - participant.lastActive.getTime()) * 
           (1000 * 60 * 60 * 24);
  }

  private async persistThreadContext(threadId: string, email: EmailInput): Promise<void> {
    const existingContext = await prisma.$queryRaw<Array<{ context: string | null }>>`
      SELECT context FROM "ThreadContext" WHERE "threadId" = ${threadId}
    `;

    const contextUpdate = await this.generateThreadContext(email, existingContext[0]?.context ?? undefined);
    
    await prisma.$executeRaw`
      INSERT INTO "ThreadContext" ("threadId", "context", "lastUpdated", "version", "metadata")
      VALUES (
        ${threadId},
        ${contextUpdate.context},
        ${contextUpdate.metadata.lastAnalyzed},
        ${contextUpdate.version},
        ${JSON.stringify(contextUpdate.metadata)}
      )
      ON CONFLICT ("threadId") 
      DO UPDATE SET
        "context" = ${contextUpdate.context},
        "lastUpdated" = ${contextUpdate.metadata.lastAnalyzed},
        "version" = "ThreadContext"."version" + 1,
        "metadata" = ${JSON.stringify(contextUpdate.metadata)}
    `;
  }

  private async generateThreadContext(email: EmailInput, existingContext?: string): Promise<ThreadContextUpdate> {
    const language = await detectLanguage(email.body);
    const newContext = await this.summarizeEmail(email);
    const keyTerms = await this.extractKeyTerms(email.body);
    
    if (!existingContext) {
      return {
        context: newContext,
        metadata: {
          languageCode: language,
          contextType: 'detailed',
          confidenceScore: 0.85,
          lastAnalyzed: new Date(),
          keyTerms,
          references: {
            emailIds: [email.messageId]
          }
        },
        version: 1
      };
    }

    const combinedContext = `${existingContext}\n\nLatest Update (${email.date}):\n${newContext}`;
    const updatedContext = combinedContext.length > 1500 ? 
      await this.summarizeContext(combinedContext) : 
      combinedContext;

    return {
      context: updatedContext,
      metadata: {
        languageCode: language,
        contextType: 'detailed',
        confidenceScore: 0.85,
        lastAnalyzed: new Date(),
        keyTerms: [...new Set([...keyTerms])],
        references: {
          emailIds: [email.messageId]
        }
      },
      version: 1
    };
  }

  private async extractKeyTerms(text: string): Promise<string[]> {
    const terms = new Set<string>();
    
    // Extract technical terms
    const technicalPattern = /\b(?:[A-Z][a-z]+){2,}|[A-Z]{2,}(?:\d*[a-z]+)*|\b[a-z]+(?:API|SDK|UI|URL|URI|ID)\b/g;
    const technicalMatches = text.match(technicalPattern) || [];
    technicalMatches.forEach(term => terms.add(term));

    // Extract quoted terms
    const quotedPattern = /"([^"]+)"|'([^']+)'/g;
    let match;
    while ((match = quotedPattern.exec(text)) !== null) {
      terms.add(match[1] || match[2]);
    }

    // Extract capitalized phrases
    const capitalizedPattern = /\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g;
    const capitalizedMatches = text.match(capitalizedPattern) || [];
    capitalizedMatches.forEach(term => terms.add(term));

    return Array.from(terms);
  }

  private async summarizeEmail(email: EmailInput): Promise<string> {
    const subject = email.subject.replace(/^(Re:|Fwd:)\s*/i, '').trim();
    const participants = [email.from, ...email.to].join(', ');
    
    const mainPoints = await this.extractKeyPoints(email.body);
    const mainPointsSummary = mainPoints.length > 0 
      ? `\nKey points:\n${mainPoints.slice(0, 3).join('\n')}`
      : '';

    const actionItems = await this.extractActionItems(email.body);
    const actionSummary = actionItems.length > 0
      ? `\nAction items:\n${actionItems.slice(0, 2).join('\n')}`
      : '';

    return `Subject: ${subject}
Participants: ${participants}${mainPointsSummary}${actionSummary}`;
  }

  private async summarizeContext(context: string): Promise<string> {
    const sections = context.split('\n\n');
    const recentUpdates = sections.slice(-3);
    const olderSections = sections.slice(0, -3);
    const keyInfo = olderSections
      .filter(section => 
        section.includes('Key points:') || 
        section.includes('Action items:') ||
        section.includes('Important:')
      )
      .slice(-2);
    
    return [...keyInfo, ...recentUpdates].join('\n\n');
  }

  async searchThreads(options: ThreadSearchOptions): Promise<ThreadSearchResult[]> {
    const queryEmbedding = await createEmbedding(options.query);
    
    const baseQuery = `
      SELECT 
        t.id,
        t."threadId",
        t.subject,
        ta.summary,
        (
          SELECT similarity
          FROM "EmailContent" e
          WHERE e."threadId" = t."threadId"
          AND (e."searchVector" <=> ${queryEmbedding}::vector)
          ORDER BY similarity DESC
          LIMIT 1
        ) as score
      FROM "EmailThread" t
      LEFT JOIN "ThreadAnalysis" ta ON ta."threadId" = t.id
      LEFT JOIN "ThreadState" ts ON ts."threadId" = t.id
      WHERE t."userId" = ${options.userId}
      ${options.filters?.status ? `AND ts.status = ${options.filters.status}` : ''}
      ${options.filters?.priority ? `AND ts.priority = ${options.filters.priority}` : ''}
      ${options.filters?.dateRange ? `
        AND t."lastMessageDate" BETWEEN 
        ${options.filters.dateRange.start.toISOString()} AND 
        ${options.filters.dateRange.end.toISOString()}
      ` : ''}
      HAVING score > 0.3
      ORDER BY score DESC
      LIMIT 10
    `;

    const results = await prisma.$queryRaw<Array<any>>`${Prisma.raw(baseQuery)}`;

    return results.map(result => ({
      threadId: result.threadId,
      score: result.score,
      summary: result.summary || result.subject,
      matchType: result.score > 0.7 ? 'content' : 'topic'
    }));
  }

  async getThreadMetrics(threadId: string): Promise<ThreadMetrics> {
    const thread = await prisma.emailThread.findUnique({
      where: { threadId },
      include: {
        emails: {
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!thread) {
      throw new Error('Thread not found');
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate response times
    let totalResponseTime = 0;
    let responseCount = 0;
    let latestResponseTime = 0;

    thread.emails.forEach((email, index) => {
      if (index > 0) {
        const responseTime = email.date.getTime() - thread.emails[index - 1].date.getTime();
        totalResponseTime += responseTime;
        responseCount++;
        if (index === thread.emails.length - 1) {
          latestResponseTime = responseTime;
        }
      }
    });

    // Track participant activity
    const participantActivity = new Map<string, Date>();
    thread.emails.forEach(email => {
      participantActivity.set(email.from, email.date);
    });

    return {
      responseTime: {
        average: responseCount > 0 ? totalResponseTime / responseCount : 0,
        latest: latestResponseTime
      },
      participants: {
        total: participantActivity.size,
        active: Array.from(participantActivity.values()).filter(date => date > thirtyDaysAgo).length,
        lastActive: Object.fromEntries(participantActivity)
      },
      activity: {
        messageCount: thread.messageCount,
        lastMessageDate: thread.lastMessageDate,
        isActive: thread.lastMessageDate > thirtyDaysAgo
      }
    };
  }

  async getTopicEvolution(threadId: string): Promise<TopicChange[]> {
    const thread = await prisma.emailThread.findUnique({
      where: { threadId },
      include: {
        emails: {
          orderBy: { date: 'asc' }
        }
      }
    });

    if (!thread) {
      throw new Error('Thread not found');
    }

    const topicChanges = new Map<string, TopicChange>();

    for (const email of thread.emails) {
      const emailTopics = await this.extractTopics(email.subject, email.body);
      
      for (const topic of emailTopics) {
        const existing = topicChanges.get(topic);
        if (existing) {
          existing.lastMention = email.date;
          existing.messageCount++;
          topicChanges.set(topic, existing);
        } else {
          topicChanges.set(topic, {
            topic,
            firstMention: email.date,
            lastMention: email.date,
            messageCount: 1
          });
        }
      }
    }

    return Array.from(topicChanges.values())
      .sort((a, b) => b.messageCount - a.messageCount);
  }

  private async updateThreadState(threadId: string, email: EmailInput): Promise<void> {
    try {
      this.logger.log({
        level: 'info',
        operation: 'updateThreadState',
        threadId,
        message: 'Starting thread state update'
      });

      const existingState = await prisma.threadState.findUnique({
        where: { threadId }
      });

      const priority = this.calculateImportance(email) > 0.7 ? 'high' : 
                      this.calculateImportance(email) > 0.4 ? 'medium' : 'low';

      if (existingState) {
        await prisma.threadState.update({
          where: { threadId },
          data: {
            status: 'active',
            priority,
            lastStateChange: new Date(),
          }
        });
      } else {
        await prisma.threadState.create({
          data: {
            threadId,
            status: 'active',
            priority,
            category: [],
            lastStateChange: new Date(),
          }
        });
      }

      this.logger.log({
        level: 'info',
        operation: 'updateThreadState',
        threadId,
        message: 'Thread state updated successfully'
      });
    } catch (error) {
      this.logger.log({
        level: 'error',
        operation: 'updateThreadState',
        threadId,
        message: 'Failed to update thread state',
        metadata: { error }
      });

      if (error instanceof ThreadOperationError) {
        throw error;
      }

      throw new ThreadOperationError(
        'STATE_UPDATE_FAILED',
        'updateThreadState',
        'Failed to update thread state',
        threadId,
        { error }
      );
    }
  }

  async getThread(threadId: string): Promise<EmailThreadWithRelations> {
    try {
      this.logger.log({
        level: 'info',
        operation: 'getThread',
        threadId,
        message: 'Fetching thread',
      });

      const thread = await prisma.emailThread.findUnique({
        where: { threadId },
        include: {
          analysis: true,
          context: true,
          state: true,
          emails: true,
        },
      });

      if (!thread) {
        throw new ThreadOperationError(
          'THREAD_NOT_FOUND',
          'getThread',
          `Thread not found: ${threadId}`,
          threadId
        );
      }

      return thread;
    } catch (error) {
      this.logger.log({
        level: 'error',
        operation: 'getThread',
        threadId,
        message: 'Failed to fetch thread',
        metadata: { error }
      });
      throw error;
    }
  }
}
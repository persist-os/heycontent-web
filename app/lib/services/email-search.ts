import { PrismaClient } from '@prisma/client';
import prisma from '../prisma';
import { EmailMemoryNode } from '../memory/types';
import { createEmbedding } from '../utils/embeddings';
import { detectLanguage } from '../utils/language';
import { nanoid } from 'nanoid';

interface SearchOptions {
  userId: string;
  query: string;
  language?: string; // Optional language override
  filters?: {
    from?: string;
    to?: string[];
    subject?: string;
    startDate?: Date;
    endDate?: Date;
    labels?: string[];
    hasAttachments?: boolean;
    isStarred?: boolean;
  };
  limit?: number;
  offset?: number;
  useCache?: boolean;
}

interface SearchResult {
  email: EmailMemoryNode;
  score: number;
  highlights: {
    subject?: string[];
    body?: string[];
  };
}

interface PrismaEmailContent {
  id: string;
  messageId: string;
  threadId: string;
  subject: string;
  from: string;
  to: string[];
  cc: string[];
  bcc: string[];
  body: string;
  snippet?: string;
  date: Date;
  labels: string[];
  isRead: boolean;
  isStarred: boolean;
  hasAttachments: boolean;
  attachments?: any;
  analysis?: {
    keyPoints: string[];
    topics: string[];
    participants: string[];
    timeline: any[];
    sentiment: string;
    actionItems: string[];
    summary: string;
    importance: number;
    lastAccessed: Date;
    useCount: number;
    threadContext?: string;
  };
}

interface EmailWithSimilarity extends PrismaEmailContent {
  similarity: number;
}

export class EmailSearchService {
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  // Language configurations for full-text search
  private readonly SUPPORTED_LANGUAGES = {
    'en': 'english',
    'fr': 'french',
    'es': 'spanish',
    'de': 'german',
    'it': 'italian',
    'pt': 'portuguese',
    'nl': 'dutch',
    'ru': 'russian',
    'ja': 'japanese',
    'ko': 'korean',
    'zh': 'chinese'
  } as const;

  private readonly DEFAULT_LANGUAGE = 'english';

  async search(options: SearchOptions): Promise<SearchResult[]> {
    const {
      userId,
      query,
      language,
      filters = {},
      limit = 20,
      offset = 0,
      useCache = true
    } = options;

    // Check cache if enabled
    if (useCache) {
      const cachedResults = await this.getCachedResults(userId, query, filters, language);
      if (cachedResults) return cachedResults;
    }

    // Perform full-text search
    const textResults = await this.performFullTextSearch(userId, query, filters, language);

    // Perform semantic search if query is long enough
    let semanticResults: SearchResult[] = [];
    if (query.length > 10) {
      semanticResults = await this.performSemanticSearch(userId, query, filters, language);
    }

    // Merge and rank results
    const mergedResults = this.mergeSearchResults(textResults, semanticResults);

    // Cache results
    if (useCache) {
      await this.cacheResults(userId, query, filters, mergedResults, language);
    }

    // Return paginated results
    return mergedResults.slice(offset, offset + limit);
  }

  private async performFullTextSearch(
    userId: string,
    query: string,
    filters: SearchOptions['filters'],
    language?: string
  ): Promise<SearchResult[]> {
    const whereClause = this.buildWhereClause(userId, query, filters || {});
    
    // Detect query language if not specified
    const detectedLang = await detectLanguage(query);
    const searchLang = this.SUPPORTED_LANGUAGES[detectedLang as keyof typeof this.SUPPORTED_LANGUAGES] || this.DEFAULT_LANGUAGE;

    const rawEmails = await prisma.$queryRaw`
      WITH email_language AS (
        SELECT 
          e.*,
          COALESCE(
            (
              SELECT language 
              FROM unnest(ARRAY['english', 'french', 'spanish', 'german', 'italian']) AS lang(language)
              ORDER BY ts_rank_cd(
                to_tsvector(language, e.subject || ' ' || e.body),
                plainto_tsquery(language, ${query})
              ) DESC
              LIMIT 1
            ),
            'english'
          ) as detected_language
        FROM "EmailContent" e
        WHERE e."userId" = ${userId}
      )
      SELECT 
        e.*,
        a.*,
        ts_rank_cd(
          to_tsvector(e.detected_language, e.subject || ' ' || e.body),
          plainto_tsquery(e.detected_language, ${query})
        ) as rank,
        e.detected_language
      FROM email_language e
      LEFT JOIN "EmailAnalysis" a ON e."id" = a."emailId"
      WHERE (
        e.subject ILIKE ${`%${query}%`} OR
        e.body ILIKE ${`%${query}%`} OR
        e.from ILIKE ${`%${query}%`} OR
        to_tsvector(e.detected_language, e.subject || ' ' || e.body) @@ plainto_tsquery(e.detected_language, ${query})
      )
      ORDER BY rank DESC, e.date DESC
      LIMIT 50
    `;

    // Type assertion with runtime check
    const emails = (Array.isArray(rawEmails) ? rawEmails : []) as (PrismaEmailContent & { 
      rank: number;
      detected_language: string;
    })[];

    return emails.map(email => ({
      email: this.mapToEmailMemoryNode(email),
      score: this.calculateTextScore(email, query),
      highlights: this.generateHighlights(email, query, email.detected_language)
    }));
  }

  private async performSemanticSearch(
    userId: string,
    query: string,
    filters: SearchOptions['filters'],
    language?: string
  ): Promise<SearchResult[]> {
    // Generate query embedding
    const queryEmbedding = await createEmbedding(query);

    // Find similar emails using vector similarity
    const rawEmails = await prisma.$queryRaw`
      SELECT e.*, a.*,
        (searchVector <=> ${queryEmbedding}::vector) as similarity
      FROM "EmailContent" e
      LEFT JOIN "EmailAnalysis" a ON e."id" = a."emailId"
      WHERE e."userId" = ${userId}
      ORDER BY similarity DESC
      LIMIT 50
    `;

    // Type assertion with runtime check
    const emails = (Array.isArray(rawEmails) ? rawEmails : []) as EmailWithSimilarity[];

    return emails.map(email => ({
      email: this.mapToEmailMemoryNode(email),
      score: 1 - email.similarity, // Convert distance to similarity score
      highlights: this.generateHighlights(email, query, language)
    }));
  }

  private buildWhereClause(
    userId: string,
    query: string,
    filters: Required<SearchOptions>['filters']
  ) {
    const where: any = {
      userId,
      OR: [
        { subject: { contains: query, mode: 'insensitive' } },
        { body: { contains: query, mode: 'insensitive' } },
        { from: { contains: query, mode: 'insensitive' } }
      ]
    };

    if (filters.from) {
      where.from = { contains: filters.from, mode: 'insensitive' };
    }

    if (filters.to?.length) {
      where.to = { hassome: filters.to };
    }

    if (filters.subject) {
      where.subject = { contains: filters.subject, mode: 'insensitive' };
    }

    if (filters.startDate) {
      where.date = { ...where.date, gte: filters.startDate };
    }

    if (filters.endDate) {
      where.date = { ...where.date, lte: filters.endDate };
    }

    if (filters.labels?.length) {
      where.labels = { hassome: filters.labels };
    }

    if (filters.hasAttachments !== undefined) {
      where.hasAttachments = filters.hasAttachments;
    }

    if (filters.isStarred !== undefined) {
      where.isStarred = filters.isStarred;
    }

    return where;
  }

  private calculateTextScore(email: any, query: string): number {
    let score = 0;
    const queryLower = query.toLowerCase();

    // Check if this is a person search
    const isPersonSearch = /(?:emails? (?:with|from|to)\s+)(\w+(?:\s+\w+)*)/i.test(query);
    const nameMatch = query.match(/(?:emails? (?:with|from|to)\s+)(\w+(?:\s+\w+)*)/i);
    
    if (isPersonSearch && nameMatch) {
      const personName = nameMatch[1].trim();
      const nameParts = personName.toLowerCase().split(/\s+/);
      
      // Higher weight for exact matches in from/to fields
      const fromMatch = this.calculateNameMatchScore(email.from.toLowerCase(), nameParts);
      const toMatches = email.to.map((to: string) => 
        this.calculateNameMatchScore(to.toLowerCase(), nameParts)
      );
      const bestToMatch = Math.max(0, ...toMatches);
      
      score += fromMatch * 5; // From matches are most important
      score += bestToMatch * 3; // To matches are also important
      
      // Small bonus for name appearing in subject/body
      if (email.subject.toLowerCase().includes(queryLower)) {
        score += 0.5;
      }
      if (email.body.toLowerCase().includes(queryLower)) {
        score += 0.2;
      }
    } else {
      // Regular non-person search scoring
      if (email.subject.toLowerCase().includes(queryLower)) {
        score += 5;
      }
      if (email.from.toLowerCase().includes(queryLower)) {
        score += 3;
      }
      if (email.to.some((to: string) => to.toLowerCase().includes(queryLower))) {
        score += 2;
      }
      if (email.body.toLowerCase().includes(queryLower)) {
        score += 1;
      }
    }

    // Recency bonus (reduced weight for person searches)
    const ageInDays = (Date.now() - email.date.getTime()) / (1000 * 60 * 60 * 24);
    const recencyBonus = Math.max(0, 1 - ageInDays / 30);
    score += isPersonSearch ? recencyBonus * 0.5 : recencyBonus;

    // Importance bonus (reduced for person searches)
    if (email.analysis?.importance) {
      score += isPersonSearch ? email.analysis.importance * 0.3 : email.analysis.importance;
    }

    return score;
  }

  private calculateNameMatchScore(text: string, nameParts: string[]): number {
    let score = 0;
    
    // Remove email addresses for cleaner matching
    const cleanText = text.replace(/<[^>]+>/, '').trim().toLowerCase();
    
    // Exact full name match
    if (cleanText.includes(nameParts.join(' '))) {
      score += 1;
    }
    
    // Individual part matches
    const matchedParts = nameParts.filter(part => cleanText.includes(part));
    score += matchedParts.length / nameParts.length * 0.8;
    
    // Initial matches (for each part that starts with the query part)
    const textParts = cleanText.split(/\s+/);
    const initialMatches = nameParts.filter(part =>
      textParts.some(textPart => textPart.startsWith(part))
    );
    score += initialMatches.length / nameParts.length * 0.5;
    
    return Math.min(1, score); // Normalize to max of 1
  }

  private generateHighlights(
    email: any, 
    query: string, 
    language: string = this.DEFAULT_LANGUAGE
  ): SearchResult['highlights'] {
    const highlights: SearchResult['highlights'] = {};
    
    // Use language-specific tokenization if available
    const tokens = this.tokenizeByLanguage(query, language);
    
    // Subject highlights
    if (this.containsAnyToken(email.subject, tokens)) {
      highlights.subject = this.extractHighlightContext(email.subject, tokens);
    }

    // Body highlights
    if (this.containsAnyToken(email.body, tokens)) {
      highlights.body = this.extractHighlightContext(email.body, tokens);
    }

    return highlights;
  }

  private tokenizeByLanguage(text: string, language: string): string[] {
    // Simple tokenization for now - can be enhanced with language-specific tokenizers
    return text.toLowerCase().split(/\s+/);
  }

  private containsAnyToken(text: string, tokens: string[]): boolean {
    const normalizedText = text.toLowerCase();
    return tokens.some(token => normalizedText.includes(token));
  }

  private extractHighlightContext(text: string, tokens: string[]): string[] {
    const highlights: string[] = [];
    const textLower = text.toLowerCase();
    
    for (const token of tokens) {
      let index = textLower.indexOf(token);
      while (index !== -1 && highlights.length < 3) {
        const start = Math.max(0, index - 50);
        const end = Math.min(text.length, index + token.length + 50);
        highlights.push(text.slice(start, end));
        index = textLower.indexOf(token, index + 1);
      }
    }

    return highlights;
  }

  private async getCachedResults(
    userId: string,
    query: string,
    filters: SearchOptions['filters'],
    language?: string
  ): Promise<SearchResult[] | null> {
    const cacheKey = this.generateCacheKey(query, filters, language);
    
    const cached = await prisma.emailSearchCache.findUnique({
      where: {
        query_userId: {
          query: cacheKey,
          userId
        }
      }
    });

    if (!cached || cached.expiresAt < new Date()) {
      return null;
    }

    // Parse and validate the cached results
    try {
      const parsedResults = typeof cached.results === 'string' 
        ? JSON.parse(cached.results) 
        : cached.results;

      if (!Array.isArray(parsedResults)) {
        return null;
      }

      // Validate each result has the required properties
      const validResults = parsedResults.filter((result): result is SearchResult => {
        return (
          result &&
          typeof result === 'object' &&
          'email' in result &&
          typeof result.email === 'object' &&
          result.email !== null &&
          'score' in result &&
          typeof result.score === 'number' &&
          'highlights' in result &&
          typeof result.highlights === 'object' &&
          result.highlights !== null
        );
      });

      return validResults;
    } catch (error) {
      console.error('Error parsing cached results:', error);
      return null;
    }
  }

  private async cacheResults(
    userId: string,
    query: string,
    filters: SearchOptions['filters'],
    results: SearchResult[],
    language?: string
  ): Promise<void> {
    const cacheKey = this.generateCacheKey(query, filters, language);
    const expiresAt = new Date(Date.now() + this.CACHE_TTL);

    await prisma.emailSearchCache.upsert({
      where: {
        query_userId: {
          query: cacheKey,
          userId
        }
      },
      update: {
        results: results as any,
        expiresAt
      },
      create: {
        query: cacheKey,
        userId,
        results: results as any,
        expiresAt
      }
    });
  }

  private generateCacheKey(
    query: string,
    filters: SearchOptions['filters'] = {},
    language?: string
  ): string {
    return `${query}:${language || this.DEFAULT_LANGUAGE}:${JSON.stringify(filters)}`;
  }

  private mapToEmailMemoryNode(email: any): EmailMemoryNode {
    const analysis = {
      key_points: email.analysis?.key_points || [],
      topics: email.analysis?.topics || [],
      participants: email.analysis?.participants || [],
      timeline: email.analysis?.timeline || [],
      sentiment: email.analysis?.sentiment || 'neutral',
      action_items: email.analysis?.action_items || [],
      summary: email.analysis?.summary || '',
      entities: {
        people: email.analysis?.entities?.people || [],
        organizations: email.analysis?.entities?.organizations || [],
        locations: email.analysis?.entities?.locations || [],
        dates: email.analysis?.entities?.dates || [],
        urls: email.analysis?.entities?.urls || []
      },
      intent: {
        primary: email.analysis?.intent?.primary || 'inform',
        confidence: email.analysis?.intent?.confidence || 0.5,
        details: email.analysis?.intent?.details || ''
      },
      context: {
        previousReferences: email.analysis?.context?.previousReferences || [],
        relatedTopics: email.analysis?.context?.relatedTopics || [],
        externalContext: email.analysis?.context?.externalContext || []
      }
    };

    return {
      id: email.id || nanoid(),
      type: 'email_context',
      content: {
        messageId: email.messageId || '',
        threadId: email.threadId || '',
        subject: email.subject || '',
        participants: Array.isArray(email.participants) ? email.participants : [],
        cc: Array.isArray(email.cc) ? email.cc : [],
        bcc: Array.isArray(email.bcc) ? email.bcc : [],
        topics: email.analysis?.topics || [],
        key_points: email.analysis?.key_points || [],
        sentiment: email.analysis?.sentiment || 'neutral',
        importance: email.analysis?.importance || 0,
        thread_context: email.thread_context || '',
        timestamp: email.date?.getTime() || Date.now(),
        snippet: email.snippet || '',
        isRead: Boolean(email.isRead),
        isStarred: Boolean(email.isStarred),
        labels: Array.isArray(email.labels) ? email.labels : [],
        hasAttachments: Boolean(email.hasAttachments),
        lastReferencedAt: email.lastReferencedAt || Date.now(),
        useCount: email.analysis?.useCount || 0,
        fullContent: email.body || '',
        summary: email.analysis?.summary || '',
        metadata: {
          category: email.category || 'primary',
          priority: email.priority || 'medium',
          status: email.status || 'read',
          flags: new Set(email.flags || []),
          customLabels: new Set(email.customLabels || [])
        },
        threadContext: {
          depth: email.threadContext?.depth || 0,
          totalMessages: email.threadContext?.totalMessages || 1,
          lastMessageTimestamp: email.threadContext?.lastMessageTimestamp || Date.now(),
          participants: new Set(email.threadContext?.participants || []),
          summary: email.threadContext?.summary || '',
          topic: email.threadContext?.topic || '',
          status: email.threadContext?.status || 'active'
        },
        metrics: {
          relevanceScore: email.metrics?.relevanceScore || 0,
          importanceScore: email.metrics?.importanceScore || 0,
          urgencyScore: email.metrics?.urgencyScore || 0,
          engagementScore: email.metrics?.engagementScore || 0,
          completenessScore: email.metrics?.completenessScore || 0
        },
        analysis,
        relationships: {
          inReplyTo: email.relationships?.inReplyTo,
          references: email.relationships?.references || [],
          forwards: email.relationships?.forwards || [],
          mentions: {
            people: email.relationships?.mentions?.people || [],
            emails: email.relationships?.mentions?.emails || [],
            threads: email.relationships?.mentions?.threads || []
          }
        }
      },
      confidence: 1,
      timestamp: email.date?.getTime() || Date.now(),
      relationships: new Map(),
      context: {
        situation: 'user_interaction',
        emotional_state: {
          primary: 'neutral',
          intensity: 0.5,
          confidence: 0.8
        },
        external_factors: []
      },
      evolution: {
        history: [{
          state: {
            content: {
              status: 'created',
              emailId: email.id || nanoid()
            },
            timestamp: email.date?.getTime() || Date.now()
          },
          timestamp: email.date?.getTime() || Date.now(),
          trigger: 'email_received'
        }],
        trend: 'stable',
        stability: 1
      }
    };
  }

  private mergeSearchResults(
    textResults: SearchResult[],
    semanticResults: SearchResult[]
  ): SearchResult[] {
    const mergedMap = new Map<string, SearchResult>();

    // Add text search results
    textResults.forEach(result => {
      mergedMap.set(result.email.id, result);
    });

    // Merge semantic search results
    semanticResults.forEach(result => {
      const existing = mergedMap.get(result.email.id);
      if (existing) {
        // Combine scores with text search having higher weight
        existing.score = existing.score * 0.7 + result.score * 0.3;
      } else {
        mergedMap.set(result.email.id, result);
      }
    });

    // Convert map to array and sort by score
    return Array.from(mergedMap.values())
      .sort((a, b) => b.score - a.score);
  }
} 
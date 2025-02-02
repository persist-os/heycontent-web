import { PrismaClient, Prisma } from '@prisma/client';

interface SearchResult {
  id: string;
  subject: string;
  from: string;
  snippet: string | null;
  date: Date;
  threadId: string;
  rank: number;
}

interface SearchResultWithAnalysis extends SearchResult {
  analysis: {
    id: string;
    emailId: string;
    keyPoints: string[];
    topics: string[];
    participants: string[];
    timeline: any;
    sentiment: string;
    actionItems: string[];
    summary: string;
    importance: number;
    useCount: number;
    lastAccessed: Date;
    threadContext: string | null;
    createdAt: Date;
    updatedAt: Date;
  } | null;
}

export class EmailRepository {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Add validation function
  private isValidSearchResult(result: unknown): result is SearchResult {
    if (!result || typeof result !== 'object') return false;
    
    const r = result as any;
    return (
      typeof r.id === 'string' &&
      typeof r.subject === 'string' &&
      typeof r.from === 'string' &&
      (r.snippet === null || typeof r.snippet === 'string') &&
      r.date instanceof Date &&
      typeof r.threadId === 'string' &&
      typeof r.rank === 'number'
    );
  }

  private isValidSearchResults(results: unknown): results is SearchResult[] {
    if (!Array.isArray(results)) return false;
    return results.every(result => this.isValidSearchResult(result));
  }

  private serializeSearchResult(result: SearchResult): any {
    return {
      ...result,
      date: result.date.toISOString() // Convert Date to ISO string for JSON storage
    };
  }

  async searchEmails({
    userId,
    searchTerm,
    limit = 10,
    offset = 0,
    includeAnalysis = false,
  }: {
    userId: string;
    searchTerm: string;
    limit?: number;
    offset?: number;
    includeAnalysis?: boolean;
  }): Promise<SearchResult[] | SearchResultWithAnalysis[]> {
    // First try to get from cache
    const cached = await this.prisma.emailSearchCache.findUnique({
      where: {
        query_userId: {
          query: searchTerm,
          userId: userId,
        }
      }
    });

    if (cached && new Date() < cached.expiresAt) {
      // Parse the JSON and validate the structure
      try {
        const parsedResults = typeof cached.results === 'string' 
          ? JSON.parse(cached.results) 
          : cached.results;
        
        if (this.isValidSearchResults(parsedResults)) {
          // Convert date strings to Date objects
          return parsedResults.map(result => ({
            ...result,
            date: new Date(result.date)
          }));
        }
        // If validation fails, proceed with new search
      } catch (error) {
        console.error('Error parsing cached results:', error);
        // Proceed with new search
      }
    }

    // If not in cache, expired, or invalid, perform the search
    const searchResults = await this.prisma.$queryRaw<SearchResult[]>`
      SELECT 
        e.id,
        e.subject,
        e.from,
        e.snippet,
        e.date,
        e.thread_id as "threadId",
        ts_rank_cd(to_tsvector('english', e.subject || ' ' || COALESCE(e.snippet, '')), plainto_tsquery('english', ${searchTerm})) as rank
      FROM email_contents e
      WHERE e.user_id = ${userId}
      AND to_tsvector('english', e.subject || ' ' || COALESCE(e.snippet, '')) @@ plainto_tsquery('english', ${searchTerm})
      ORDER BY rank DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;

    // Cache the results
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // Cache for 1 hour

    await this.prisma.emailSearchCache.upsert({
      where: {
        query_userId: {
          query: searchTerm,
          userId: userId,
        }
      },
      update: {
        results: searchResults.map(this.serializeSearchResult),
        expiresAt
      },
      create: {
        query: searchTerm,
        userId: userId,
        results: searchResults.map(this.serializeSearchResult),
        expiresAt
      }
    });

    if (includeAnalysis) {
      // Fetch analysis for the found emails
      const emailIds = searchResults.map(r => r.id);
      const analysisResults = await this.prisma.$queryRaw<Array<SearchResultWithAnalysis['analysis']>>`
        SELECT *
        FROM "EmailAnalysis"
        WHERE "emailId" = ANY(${emailIds}::text[])
      `;

      // Merge analysis with search results
      return searchResults.map(result => ({
        ...result,
        analysis: analysisResults.find(a => a && a.emailId === result.id) || null
      }));
    }

    return searchResults;
  }

  async searchEmailsWithHighlight({
    userId,
    searchTerm,
    limit = 10,
    offset = 0,
  }: {
    userId: string;
    searchTerm: string;
    limit?: number;
    offset?: number;
  }) {
    return await this.prisma.$queryRaw`
      SELECT 
        e.id,
        e.subject,
        e.from,
        e.date,
        e.threadId,
        ts_rank(e."searchVector", websearch_to_tsquery('english', ${searchTerm})) as rank,
        ts_headline(
          'english',
          e.body,
          websearch_to_tsquery('english', ${searchTerm}),
          'StartSel=<mark>, StopSel=</mark>, MaxWords=50, MinWords=20'
        ) as highlighted_body
      FROM "EmailContent" e
      WHERE 
        e."userId" = ${userId}
        AND e."searchVector" @@ websearch_to_tsquery('english', ${searchTerm})
      ORDER BY rank DESC
      LIMIT ${limit}
      OFFSET ${offset}
    `;
  }

  async countSearchResults({
    userId,
    searchTerm,
  }: {
    userId: string;
    searchTerm: string;
  }) {
    const result = await this.prisma.$queryRaw`
      SELECT COUNT(*)
      FROM "EmailContent" e
      WHERE 
        e."userId" = ${userId}
        AND e."searchVector" @@ websearch_to_tsquery('english', ${searchTerm})
    `;
    return Number((result as any[])[0].count);
  }
} 
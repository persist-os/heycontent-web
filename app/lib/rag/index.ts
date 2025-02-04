import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PrismaClient, Prisma } from "@prisma/client";
import { createHash } from 'crypto';
import { YouTubeService } from '../services/youtube';
import crypto from 'crypto';
import prisma from '../prisma'; // Import the singleton Prisma instance

// Cache interface
interface EmbeddingCache {
  [key: string]: number[];
}

interface SearchResult {
  id: string;
  content: string;
  metadata: any;
  similarity: number;
  pageContent?: string;
  reference_id?: string; // Added for content references
}

interface RagDocument {
  id: string;
  content: string;
  content_hash: string;
  metadata: Record<string, unknown>;
  embedding: number[] | string; // Can be array when creating, string when reading from DB
  created_at: Date;
  updated_at: Date;
}

export type AVADocumentType = 
  | 'current_persona'
  | 'future_vision'
  | 'conversation_history'
  | 'smart_note'
  | 'insight'
  | 'partnership'
  | 'content'
  | 'email';

export interface AVAMetadata {
  type: AVADocumentType;
  user_id: string;
  timestamp: string;
  isActive?: boolean;
  tags?: string[];
  reference_id?: string;
  ttl?: number;
  // Email-specific metadata
  emailMetadata?: {
    messageId: string;
    threadId: string;
    subject: string;
    from: string;
    to: string[];
    date: string;
    labels: string[];
    isRead: boolean;
    isStarred: boolean;
  };
  [key: string]: any;
}

// Rate limiting helper
class RateLimiter {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;
  private lastRequestTime = 0;
  private readonly MIN_DELAY = 1000; // 1 second between requests

  async add<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const now = Date.now();
          const timeSinceLastRequest = now - this.lastRequestTime;
          if (timeSinceLastRequest < this.MIN_DELAY) {
            await new Promise(r => setTimeout(r, this.MIN_DELAY - timeSinceLastRequest));
          }
          this.lastRequestTime = Date.now();
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      this.process();
    });
  }

  private async process() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    while (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) await next();
    }
    this.processing = false;
  }
}

export class RAGSystem {
  private embeddings: OpenAIEmbeddings;
  private prisma: PrismaClient;
  private initialized: Promise<void>;
  private embeddingCache: EmbeddingCache = {};
  private contentCache: Map<string, { content: string, timestamp: number }> = new Map();
  private CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  private rateLimiter = new RateLimiter();

  constructor() {
    const openAIKey = process.env.OPENAI_API_KEY;

    if (!openAIKey) {
      console.error('OpenAI API key missing');
      throw new Error('Missing OpenAI API key');
    }

    console.log('Initializing OpenAI with key:', {
      length: openAIKey.length,
      prefix: openAIKey.substring(0, 7),
      isValid: openAIKey.startsWith('sk-') && openAIKey.length > 40
    });

    this.embeddings = new OpenAIEmbeddings({
      maxRetries: 3,
      maxConcurrency: 1
    });
    this.prisma = prisma; // Use the singleton instance instead of creating a new one
    this.initialized = this.init();
  }

  private generateContentHash(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  private async getCachedEmbedding(content: string): Promise<number[] | null> {
    const hash = this.generateContentHash(content);
    return this.embeddingCache[hash] || null;
  }

  private setCachedEmbedding(content: string, embedding: number[]): void {
    const hash = this.generateContentHash(content);
    this.embeddingCache[hash] = embedding;
  }

  protected async getOrCreateEmbedding(content: string): Promise<number[]> {
    try {
      console.log('Generating embedding for content length:', content.length);
      const cached = await this.getCachedEmbedding(content);
      if (cached) {
        console.log('Using cached embedding');
        return cached;
      }

      return await this.rateLimiter.add(async () => {
        console.log('Generating new embedding...');
        const embedding = await this.embeddings.embedQuery(content);
        this.setCachedEmbedding(content, embedding);
        return embedding;
      });
    } catch (error) {
      console.error('Error in getOrCreateEmbedding:', error);
      throw error;
    }
  }

  private async init(): Promise<void> {
    try {
      console.log('Testing vector operations...');
      
      // Check database connection
      await this.prisma.$executeRaw`SELECT version();`;
      console.log('Database connected');
      
      // Ensure vector extension is enabled
      await this.prisma.$executeRaw`CREATE EXTENSION IF NOT EXISTS vector;`;
      
      // Check if the vector column exists and has the correct type
      const columnCheck = await this.prisma.$queryRaw<any[]>`
        SELECT column_name, data_type, udt_name 
        FROM information_schema.columns 
        WHERE table_name = 'rag_documents' 
        AND column_name = 'embedding';
      `;
      
      if (columnCheck.length === 0) {
        throw new Error('Vector column not found in rag_documents table');
      }
      
      // Test vector operations
      await this.prisma.$executeRawUnsafe(`
        SELECT '[1,2,3]'::vector(3);
      `);
      
      console.log('Table structure verified');
      console.log('RAG system initialized successfully');
    } catch (error) {
      console.error('Error initializing RAG system:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined
      });
      throw new Error('Failed to initialize RAG system');
    }
  }

  private async ensureInitialized() {
    await this.initialized;
  }

  async search(
    type: string,
    query: string,
    options?: {
      userId?: string;
      filters?: Record<string, any>;
      limit?: number;
    }
  ): Promise<any[]> {
    // Validate and convert type to AVADocumentType
    const validTypes: AVADocumentType[] = [
      'current_persona',
      'future_vision',
      'conversation_history',
      'smart_note',
      'insight',
      'partnership',
      'content',
      'email'
    ];
    
    const documentType = validTypes.find(t => t === type) as AVADocumentType;
    if (!documentType) {
      console.warn(`Invalid document type: ${type}. Defaulting to 'content'`);
    }
    
    // Build the filter object
    const filter: Partial<AVAMetadata> = {
      type: documentType || 'content',
      ...options?.filters
    };

    // Add user_id if provided
    if (options?.userId) {
      filter.user_id = options.userId;
    }
    
    // Call internal search with complete filter
    const results = await this.searchInternal(query, filter, options?.limit);
    return results;
  }

  private async searchInternal(query?: string, filter?: Partial<AVAMetadata>, limit: number = 5): Promise<SearchResult[]> {
    try {
      await this.ensureInitialized();

      if (!query) {
        console.log('No query provided, returning empty results');
        return [];
      }

      console.log('Performing RAG search with query:', query);
      
      // Split long queries into meaningful chunks
      let queryEmbedding: number[];
      if (query.length > 2000) {
        const splitter = new RecursiveCharacterTextSplitter({
          chunkSize: 2000,
          chunkOverlap: 200,
          separators: ["\n\n", "\n", " ", ""],
          keepSeparator: true
        });
        const chunks = await splitter.createDocuments([query]);
        // Use the most relevant chunk for search
        const mainChunk = chunks[0].pageContent;
        queryEmbedding = await this.getOrCreateEmbedding(mainChunk);
      } else {
        queryEmbedding = await this.getOrCreateEmbedding(query);
      }
      
      const queryVector = `[${queryEmbedding.join(',')}]`;

      // Build the filter conditions
      const conditions: string[] = [];
      const params: any[] = [queryVector];
      
      if (filter) {
        if (filter.type) {
          conditions.push(`metadata->>'type' = $${params.length + 1}`);
          params.push(filter.type);
        }
        if (filter.user_id) {
          conditions.push(`metadata->>'user_id' = $${params.length + 1}`);
          params.push(filter.user_id);
        }
        if (filter.isActive !== undefined) {
          conditions.push(`metadata->>'isActive' = $${params.length + 1}`);
          params.push(filter.isActive.toString());
        }
        if (filter.tags && filter.tags.length > 0) {
          filter.tags.forEach(tag => {
            conditions.push(`metadata->'tags' ? $${params.length + 1}`);
            params.push(tag);
          });
        }
      }

      // Add TTL condition
      conditions.push(`(metadata->>'ttl' IS NULL OR CAST(metadata->>'timestamp' AS timestamp) + (CAST(metadata->>'ttl' AS integer) * interval '1 second') > NOW())`);

      const whereClause = conditions.length > 0 
        ? `WHERE ${conditions.join(' AND ')}` 
        : '';

      params.push(limit);

      // Perform vector similarity search with metadata filtering
      const results = await this.prisma.$queryRawUnsafe<SearchResult[]>(`
        SELECT 
          id,
          content,
          metadata,
          1 - (embedding <=> $1::vector) as similarity
        FROM rag_documents
        ${whereClause}
        ORDER BY similarity DESC
        LIMIT $${params.length}
      `, ...params);

      // Add pageContent for compatibility and resolve references
      for (const item of results) {
        if (item.metadata?.reference_id) {
          const referenced = await this.prisma.rag_documents.findUnique({
            where: { id: item.metadata.reference_id }
          });
          if (referenced && referenced.content) {
            item.content = referenced.content;
          }
        }
        item.pageContent = item.content;
      }

      return results;
    } catch (error) {
      console.error('Error in searchInternal:', error);
      throw error;
    }
  }

  private extractEssentialContent(content: any): string {
    // Helper to truncate long strings
    const truncate = (str: string, maxLength: number = 1000) => {
      if (!str || typeof str !== 'string') return '';
      return str.length <= maxLength ? str : str.slice(0, maxLength) + '...';
    };

    try {
      // If content is a string, try to parse it as JSON first
      if (typeof content === 'string') {
        try {
          const parsed = JSON.parse(content);
          // If it's our stored video format
          if (parsed.title && (parsed.date || parsed.publishedAt)) {
            return JSON.stringify({
              type: 'video',
              title: parsed.title,
              date: parsed.date || parsed.publishedAt,
              metrics: parsed.metrics || {},
              description: parsed.description || '',
              timestamp: parsed.timestamp || new Date().toISOString()
            });
          }
          // Return the parsed content as is
          return content;
        } catch {
          // If not valid JSON, return as plain string
          return truncate(content);
        }
      }

      // If it's a video metadata object
      if (content?.title && (content?.publishedAt || content?.date)) {
        return JSON.stringify({
          type: 'video',
          title: truncate(content.title, 200),
          date: content.publishedAt || content.date,
          metrics: content.metrics || {},
          description: truncate(content.description || '', 500),
          timestamp: new Date().toISOString()
        });
      }
    
      // If it's an AI response object
      if (content.query && content.result) {
        return JSON.stringify({
          type: 'ai_response',
          query: truncate(content.query, 200),
          response: truncate(content.result.output || content.result, 800),
          timestamp: new Date().toISOString()
        });
      }
    
      // If it's a raw response object
      if (content.output) {
        return JSON.stringify({
          type: 'raw_response',
          response: truncate(content.output, 1000),
          timestamp: new Date().toISOString()
        });
      }
    
      // For other objects, stringify and truncate
      return truncate(JSON.stringify(content));
    } catch (error) {
      console.error('Error in extractEssentialContent:', error);
      return truncate(String(content));
    }
  }

  async addDocument(content: string | Record<string, any>, metadata: AVAMetadata): Promise<void> {
    try {
      await this.ensureInitialized();
      
      // Extract essential content before processing
      let processedContent = this.extractEssentialContent(content);
      
      // Generate content hash
      const contentHash = this.generateContentHash(processedContent);
      
      // Check for duplicates with user context
      const existing = await this.prisma.rag_documents.findFirst({
        where: {
          content_hash: contentHash,
          metadata: {
            path: ['user_id'],
            equals: metadata.user_id
          }
        }
      });
      
      if (existing) {
        // Update existing document
        await this.prisma.rag_documents.update({
          where: { id: existing.id },
          data: { metadata }
        });
        return;
      }

      // Generate embedding
      const embedding = await this.getOrCreateEmbedding(processedContent);
      
      // Use parameterized query for safe vector operations
      await this.prisma.$executeRaw`
        INSERT INTO rag_documents (
          id,
          content,
          content_hash,
          metadata,
          embedding,
          created_at,
          updated_at
        )
        VALUES (
          ${crypto.randomUUID()},
          ${processedContent},
          ${contentHash},
          ${metadata as any}::jsonb,
          ${`[${embedding.join(',')}]`}::vector,
          NOW(),
          NOW()
        )
      `;

      console.log('Document added successfully');
    } catch (error) {
      console.error('RAGSystem: Error in addDocument:', error);
      throw error;
    }
  }

  async addDocuments(docs: Document[]): Promise<void> {
    try {
      console.log('RAGSystem: Generating embeddings and adding documents...');
      for (const doc of docs) {
        const contentHash = this.generateContentHash(doc.pageContent);
        const embedding = await this.getOrCreateEmbedding(doc.pageContent);
        
        // Convert embedding array to PostgreSQL vector format
        const vectorStr = `[${embedding.join(',')}]`;
        
        // First try to insert using native Prisma (more efficient)
        try {
          await this.prisma.$executeRaw`
            INSERT INTO rag_documents (id, content, content_hash, metadata, embedding, created_at, updated_at)
            VALUES (
              gen_random_uuid(),
              ${doc.pageContent},
              ${contentHash},
              ${doc.metadata as Prisma.InputJsonValue}::jsonb,
              ${vectorStr}::vector(1536),
              CURRENT_TIMESTAMP,
              CURRENT_TIMESTAMP
            )
            ON CONFLICT (content_hash)
            DO UPDATE SET
              metadata = EXCLUDED.metadata,
              updated_at = CURRENT_TIMESTAMP
          `;
        } catch (e) {
          console.error('Error in upsert attempt:', e);
          // Fallback already uses raw SQL, no changes needed
        }
      }
      console.log('RAGSystem: Documents added successfully');
    } catch (error) {
      console.error('Error in RAGSystem.addDocuments:', error);
      throw error;
    }
  }

  async updateUserPersona(
    userId: string,
    currentPersona: string,
    futureVision?: string
  ) {
    try {
      // Deactivate old personas
      const oldPersonas = await this.searchInternal('', {
        user_id: userId,
        type: 'current_persona',
        isActive: true
      });
      
      for (const doc of oldPersonas) {
        await this.addDocument(doc.content, {
          ...doc.metadata,
          type: 'current_persona',
          user_id: userId,
          isActive: false,
          timestamp: new Date().toISOString()
        });
      }

      // Add new current persona
      await this.addDocument(currentPersona, {
        type: 'current_persona',
        user_id: userId,
        isActive: true,
        timestamp: new Date().toISOString()
      });

      // Handle future vision if provided
      if (futureVision) {
        const oldVisions = await this.searchInternal('', {
          user_id: userId,
          type: 'future_vision',
          isActive: true
        });
        
        for (const doc of oldVisions) {
          await this.addDocument(doc.content, {
            ...doc.metadata,
            type: 'future_vision',
            user_id: userId,
            isActive: false,
            timestamp: new Date().toISOString()
          });
        }

        await this.addDocument(futureVision, {
          type: 'future_vision',
          user_id: userId,
          isActive: true,
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('RAGSystem: Error updating user persona:', error);
      throw error;
    }
  }

  async getUserPersona(userId: string) {
    try {
      const currentPersona = await this.searchInternal('', {
        user_id: userId,
        type: 'current_persona',
        isActive: true
      }, 1);

      const futureVision = await this.searchInternal('', {
        user_id: userId,
        type: 'future_vision',
        isActive: true
      }, 1);

      return {
        currentPersona: currentPersona[0]?.content || '',
        futureVision: futureVision[0]?.content || '',
        timestamp: currentPersona[0]?.metadata?.timestamp || null
      };
    } catch (error) {
      console.error('RAGSystem: Error getting user persona:', error);
      throw error;
    }
  }

  async searchWithPersonaContext(
    query: string,
    userId: string,
    filter?: Partial<AVAMetadata>
  ) {
    try {
      const persona = await this.getUserPersona(userId);
      
      // Simple context enhancement
      const enhancedQuery = `${persona.currentPersona || ''}\n${persona.futureVision || ''}\n${query}`;
      return this.searchInternal(enhancedQuery, {
        user_id: userId,
        type: 'conversation_history'
      });
    } catch (error) {
      console.error('RAGSystem: Error in persona-aware search:', error);
      throw error;
    }
  }

  async addYouTubeVideo(videoUrl: string, userId: string) {
    try {
      // Extract video ID from URL
      const videoId = videoUrl.split('v=')[1]?.split('&')[0];
      if (!videoId) throw new Error('Invalid YouTube URL');

      const youtubeService = new YouTubeService(userId);
      
      // Get video details and analysis
      const videoDetails = await youtubeService.getVideoMetrics(videoId);
      const videoAnalysis = await youtubeService.analyzeVideo(videoId);

      // Format video data
      const videoData = {
        type: 'video',
        title: videoDetails.title,
        date: videoDetails.publishedAt,
        metrics: {
          views: videoDetails.views,
          likes: videoDetails.likes,
          comments: videoDetails.comments
        },
        analysis: videoAnalysis,
        url: videoUrl
      };

      // Add to RAG system
      await this.addDocument(videoData, {
        type: 'content',
        user_id: userId,
        timestamp: new Date().toISOString(),
        contentType: 'youtube_video'
      });

      return videoData;
    } catch (error) {
      console.error('Error adding YouTube video:', error);
      throw error;
    }
  }

  async searchWithYouTube(query: string, userId: string, filter?: Partial<AVAMetadata>): Promise<SearchResult[]> {
    try {
      // First get RAG results
      const ragResults = await this.searchInternal(query, {
        user_id: userId,
        type: 'conversation_history'
      });
      
      // Then search YouTube directly
      const youtubeService = new YouTubeService(userId);
      const youtubeResults = await youtubeService.searchVideosByTitle(query, {
        includeMetrics: true,
        includeAnalysis: true,
        maxResults: 5
      });

      // Convert YouTube results to SearchResult format
      const formattedYoutubeResults: SearchResult[] = youtubeResults.map(video => ({
        id: video.id,
        content: JSON.stringify({
          type: 'video',
          title: video.title,
          publishedAt: video.publishedAt,
          metrics: video.metrics,
          analysis: video.analysis
        }),
        metadata: {
          type: 'content',
          contentType: 'youtube_video',
          source: 'youtube_api',
          user_id: userId,
          timestamp: new Date().toISOString()
        },
        similarity: 1, // Direct API results are considered highly relevant
        pageContent: video.title
      }));

      // Combine and deduplicate results
      const allResults = [...ragResults];
      for (const ytResult of formattedYoutubeResults) {
        if (!allResults.some(r => r.id === ytResult.id)) {
          allResults.push(ytResult);
        }
      }

      return allResults;
    } catch (error) {
      console.error('Error in searchWithYouTube:', error);
      throw error;
    }
  }

  async store(type: string, content: any): Promise<void> {
    // Basic implementation - to be expanded
    console.log(`Storing ${type} content:`, content);
  }
} 
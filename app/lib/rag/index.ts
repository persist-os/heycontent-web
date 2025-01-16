import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { PrismaClient, Prisma } from "@prisma/client";
import { createHash } from 'crypto';

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
  embedding: number[];
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
    this.prisma = new PrismaClient();
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
      try {
        // Check database connection
        await this.prisma.$executeRaw`SELECT version();`;
        console.log('Database connected');
        
        // Check table structure
        await this.prisma.$executeRaw`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'rag_documents' 
          AND column_name = 'embedding';
        `;
        console.log('Table structure verified');
      } catch (e) {
        console.error('Detailed initialization error:', {
          error: e,
          message: e instanceof Error ? e.message : 'Unknown error',
          name: e instanceof Error ? e.name : 'Unknown',
          stack: e instanceof Error ? e.stack : undefined
        });
        throw e;
      }
      console.log('RAG system initialized successfully');
    } catch (error) {
      console.error('Error initializing RAG system:', error);
      throw new Error('Failed to initialize RAG system');
    }
  }

  private async ensureInitialized() {
    await this.initialized;
  }

  async search(query: string = '', filter?: Partial<AVAMetadata>, limit: number = 5): Promise<SearchResult[]> {
    try {
      await this.ensureInitialized();
      console.log('Performing RAG search with query:', query);
      
      // Check cache first
      const queryEmbedding = await this.getOrCreateEmbedding(query);

      // Build the filter conditions
      const conditions: string[] = [];
      const params: any[] = [JSON.stringify(queryEmbedding)];
      
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

      const searchQuery = `
        SELECT
          id,
          content,
          metadata,
          1 - (
            (
              SELECT SUM((a.value::float - b.value::float) * (a.value::float - b.value::float))
              FROM jsonb_array_elements_text(embedding::jsonb) WITH ORDINALITY a(value, idx)
              CROSS JOIN jsonb_array_elements_text($1::jsonb) WITH ORDINALITY b(value, idx)
              WHERE a.idx = b.idx
            ) / (
              SELECT COUNT(*)
              FROM jsonb_array_elements(embedding::jsonb)
            )
          ) as similarity
        FROM rag_documents
        ${whereClause}
        ORDER BY similarity DESC
        LIMIT $${params.length}
      `;
      
      const results = await this.prisma.$queryRawUnsafe<SearchResult[]>(searchQuery, ...params);
      
      // Add pageContent for compatibility and resolve references
      for (let result of results) {
        if (result.metadata?.reference_id) {
          const referenced = await this.prisma.rag_documents.findUnique({
            where: { id: result.metadata.reference_id }
          });
          if (referenced && referenced.content) {
            result.content = referenced.content;
          }
        }
        result.pageContent = result.content;
      }

      return results;
    } catch (error) {
      console.error('RAGSystem: Error searching:', error);
      throw error;
    }
  }

  async addDocument(content: string, metadata: AVAMetadata): Promise<void> {
    try {
      await this.ensureInitialized();
      console.log('RAGSystem: Starting document add with metadata:', metadata);
      
      // Check for duplicates
      const contentHash = this.generateContentHash(content);
      const existing = await this.prisma.$queryRaw<RagDocument[]>`
        SELECT * FROM rag_documents 
        WHERE content_hash = ${contentHash}
        AND metadata->>'user_id' = ${metadata.user_id}
        LIMIT 1
      `;

      if (existing && existing[0]?.metadata) {
        // Update existing document instead of creating new one
        await this.prisma.rag_documents.update({
          where: { id: existing[0].id },
          data: {
            metadata: { ...existing[0].metadata as Record<string, unknown>, ...metadata }
          }
        });
        return;
      }

      // Check for similar content
      const similarContent = await this.search(content, {
        user_id: metadata.user_id,
        type: metadata.type
      }, 1);

      if (similarContent.length > 0 && similarContent[0].similarity > 0.95) {
        // Store as reference to similar content
        await this.prisma.$executeRaw`
          INSERT INTO rag_documents (id, content, content_hash, metadata, embedding, created_at, updated_at)
          VALUES (
            gen_random_uuid(),
            '',
            ${contentHash},
            ${JSON.stringify({
              ...metadata,
              reference_id: similarContent[0].id,
              is_reference: true
            })}::jsonb,
            ${JSON.stringify(await this.getOrCreateEmbedding(content))}::jsonb,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
          )
        `;
        return;
      }

      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const docs = await splitter.createDocuments([content], [metadata]);
      await this.addDocuments(docs);
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
        
        await this.prisma.$executeRaw`
          INSERT INTO rag_documents (id, content, content_hash, metadata, embedding, created_at, updated_at)
          VALUES (gen_random_uuid(), ${doc.pageContent}, ${contentHash}, ${doc.metadata as Prisma.InputJsonValue}, ${JSON.stringify(embedding)}::jsonb, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          ON CONFLICT (content_hash) 
          DO UPDATE SET 
            metadata = EXCLUDED.metadata,
            updated_at = CURRENT_TIMESTAMP
        `;
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
      const oldPersonas = await this.search('', {
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
        const oldVisions = await this.search('', {
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
      const currentPersona = await this.search('', {
        user_id: userId,
        type: 'current_persona',
        isActive: true
      }, 1);

      const futureVision = await this.search('', {
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
      return this.search(enhancedQuery, filter);
    } catch (error) {
      console.error('RAGSystem: Error in persona-aware search:', error);
      throw error;
    }
  }
} 
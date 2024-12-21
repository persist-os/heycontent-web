import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createClient } from '@supabase/supabase-js';

export type AVADocumentType = 
  | 'current_persona'
  | 'future_vision'
  | 'conversation_history'
  | 'smart_note'
  | 'insight';

export interface AVAMetadata {
  type: AVADocumentType;
  user_id: string;
  timestamp: string;
  isActive?: boolean;
  tags?: string[];
  [key: string]: any;
}

export class RAGSystem {
  private embeddings: OpenAIEmbeddings;
  private vectorStore!: SupabaseVectorStore;
  private supabaseClient;
  private initialized: Promise<void>;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const openAIKey = process.env.OPENAI_API_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials missing:', { 
        hasUrl: !!supabaseUrl, 
        hasKey: !!supabaseServiceKey 
      });
      throw new Error('Missing Supabase credentials');
    }

    if (!openAIKey) {
      console.error('OpenAI API key missing');
      throw new Error('Missing OpenAI API key');
    }

    // Configure OpenAI
    process.env.OPENAI_API_KEY = openAIKey;
    
    this.embeddings = new OpenAIEmbeddings();
    
    try {
      console.log('Initializing Supabase client with URL:', supabaseUrl);
      this.supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });

      // Initialize vector store with error handling
      this.initialized = this.initVectorStore().catch(error => {
        console.error('Error initializing vector store:', error);
        throw new Error('Failed to initialize vector store');
      });

      console.log('Supabase client initialized successfully');
    } catch (error) {
      console.error('Error initializing Supabase client:', error);
      throw new Error('Failed to initialize Supabase client');
    }
  }

  private async initVectorStore() {
    try {
      // Create schema if it doesn't exist
      const createSchemaQuery = `
        CREATE SCHEMA IF NOT EXISTS public;
        GRANT USAGE ON SCHEMA public TO authenticated;
        GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
        GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
      `;
      
      const { error: schemaError } = await this.supabaseClient.rpc('exec_sql', { sql: createSchemaQuery });
      if (schemaError) {
        console.warn('Schema creation error (may already exist):', schemaError);
      }

      // Create vector store table if it doesn't exist
      const createTableQuery = `
        CREATE TABLE IF NOT EXISTS public.rag_documents (
          id bigserial PRIMARY KEY,
          content text,
          metadata jsonb,
          embedding vector(1536)
        );

        ALTER TABLE public.rag_documents ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "Users can view all RAG documents"
          ON public.rag_documents FOR SELECT
          TO authenticated
          USING (true);

        CREATE POLICY "Users can insert RAG documents"
          ON public.rag_documents FOR INSERT
          TO authenticated
          WITH CHECK (true);

        CREATE POLICY "Users can update RAG documents"
          ON public.rag_documents FOR UPDATE
          TO authenticated
          USING (true);

        CREATE POLICY "Users can delete RAG documents"
          ON public.rag_documents FOR DELETE
          TO authenticated
          USING (true);
      `;
      
      const { error: tableError } = await this.supabaseClient.rpc('exec_sql', { sql: createTableQuery });
      if (tableError) {
        console.warn('Table creation error (may already exist):', tableError);
      }

      // Create the matching function if it doesn't exist
      const createMatchFunctionQuery = `
        CREATE OR REPLACE FUNCTION public.match_documents(
          query_embedding vector(1536),
          match_count int DEFAULT 5,
          filter jsonb DEFAULT '{}'
        )
        RETURNS TABLE (
          id bigint,
          content text,
          metadata jsonb,
          similarity float
        )
        LANGUAGE plpgsql
        SECURITY DEFINER
        SET search_path = public
        AS $$
        BEGIN
          RETURN QUERY
          SELECT
            id,
            content,
            metadata,
            1 - (embedding <=> query_embedding) as similarity
          FROM public.rag_documents
          WHERE metadata @> filter
          ORDER BY embedding <=> query_embedding
          LIMIT match_count;
        END;
        $$;

        GRANT EXECUTE ON FUNCTION public.match_documents TO authenticated;
      `;

      const { error: functionError } = await this.supabaseClient.rpc('exec_sql', { sql: createMatchFunctionQuery });
      if (functionError) {
        console.warn('Function creation error (may already exist):', functionError);
      }

      // Initialize vector store
      this.vectorStore = new SupabaseVectorStore(this.embeddings, {
        client: this.supabaseClient,
        tableName: "rag_documents",
        queryName: "match_documents"
      });

      console.log('Vector store initialized successfully');
    } catch (error) {
      console.error('Error initializing vector store:', error);
      throw error;
    }
  }

  // Helper method to ensure initialization is complete
  private async ensureInitialized() {
    await this.initialized;
  }

  async search(
    query: string,
    filter?: Partial<AVAMetadata>,
    limit: number = 5
  ) {
    try {
      await this.ensureInitialized();
      console.log('Performing RAG search with query:', query);
      console.log('Filter:', filter);
      
      const results = await this.vectorStore.similaritySearch(
        query,
        limit,
        filter
      );
      
      console.log(`Found ${results.length} results`);
      return results;
    } catch (error) {
      console.error('RAGSystem: Error searching:', error);
      // Return empty results instead of throwing
      return [];
    }
  }

  async addDocument(content: string, metadata: AVAMetadata) {
    try {
      await this.ensureInitialized();
      const splitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const docs = await splitter.createDocuments([content], [metadata]);
      return await this.vectorStore.addDocuments(docs);
    } catch (error) {
      console.error('RAGSystem: Error adding document:', error);
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
        await this.addDocument(doc.pageContent, {
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
          await this.addDocument(doc.pageContent, {
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
        currentPersona: currentPersona[0]?.pageContent || '',
        futureVision: futureVision[0]?.pageContent || '',
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
      const enhancedQuery = `${persona.currentPersona}\n${persona.futureVision}\n${query}`;
      return this.search(enhancedQuery, filter);
    } catch (error) {
      console.error('RAGSystem: Error in persona-aware search:', error);
      throw error;
    }
  }
} 
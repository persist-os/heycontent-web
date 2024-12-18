import { Document } from "@langchain/core/documents";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { createClient } from '@supabase/supabase-js';

export type AVADocumentType = 
  | 'current_persona'
  | 'future_vision'
  | 'conversation_history'
  | 'smart_note';

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
  private vectorStore: SupabaseVectorStore;
  private supabaseClient;

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
    this.supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    this.vectorStore = new SupabaseVectorStore(this.embeddings, {
      client: this.supabaseClient,
      tableName: "rag_documents",
      queryName: "match_documents",
    });
  }

  async search(
    query: string,
    filter?: Partial<AVAMetadata>,
    limit: number = 5
  ) {
    try {
      const results = await this.vectorStore.similaritySearch(
        query,
        limit,
        filter
      );
      
      return results;
    } catch (error) {
      console.error('RAGSystem: Error searching:', error);
      throw error;
    }
  }

  async addDocument(content: string, metadata: AVAMetadata) {
    try {
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
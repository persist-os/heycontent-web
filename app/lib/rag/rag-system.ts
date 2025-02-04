import { RAGSystem as BaseRAGSystem, AVADocumentType, AVAMetadata } from './index';

export class RAGSystem extends BaseRAGSystem {
  constructor() {
    super();
  }

  async store(type: AVADocumentType, content: any, metadata?: Partial<AVAMetadata>): Promise<void> {
    try {
      const fullMetadata: AVAMetadata = {
        type,
        user_id: metadata?.user_id || 'system',
        timestamp: new Date().toISOString(),
        ...metadata
      };

      const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
      await this.addDocument(contentStr, fullMetadata);
    } catch (error) {
      console.error('Error storing content in RAG:', error);
      throw error;
    }
  }

  async search(type: AVADocumentType, query: string, options?: {
    userId?: string;
    filters?: Partial<AVAMetadata>;
    limit?: number;
  }): Promise<any[]> {
    try {
      return await super.search(type, query, options);
    } catch (error) {
      console.error('Error searching in RAG:', error);
      throw error;
    }
  }
} 
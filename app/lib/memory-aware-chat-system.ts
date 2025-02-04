import { RAGSystem } from "./rag/rag-system";

interface MemoryContext {
  relevantMemories: string[];
  memoryScore: number;
  lastAccessTime: Date;
}

export class MemoryAwareChatSystem {
  private rag: RAGSystem;
  private memoryContexts: Map<string, MemoryContext> = new Map();
  private readonly MEMORY_TTL = 30 * 60 * 1000; // 30 minutes

  constructor(rag: RAGSystem) {
    this.rag = rag;
  }

  private async getMemoryContext(query: string): Promise<MemoryContext> {
    const relevantMemories = await this.rag.search('conversation_history', query);
    return {
      relevantMemories,
      memoryScore: relevantMemories.length > 0 ? 0.8 : 0.2,
      lastAccessTime: new Date()
    };
  }

  private cleanupStaleMemories() {
    const now = Date.now();
    for (const [key, context] of this.memoryContexts.entries()) {
      if (now - context.lastAccessTime.getTime() > this.MEMORY_TTL) {
        this.memoryContexts.delete(key);
      }
    }
  }

  async enhanceWithMemory(query: string): Promise<{
    enhancedQuery: string;
    memoryContext: MemoryContext;
  }> {
    // Clean up old memories periodically
    this.cleanupStaleMemories();

    // Get or create memory context
    const memoryContext = await this.getMemoryContext(query);
    
    // Store context for future reference
    const contextKey = this.generateContextKey(query);
    this.memoryContexts.set(contextKey, memoryContext);

    // Enhance query based on memory context
    let enhancedQuery = query;
    
    if (memoryContext.relevantMemories.length > 0) {
      // Extract key information from memories
      const relevantInfo = memoryContext.relevantMemories
        .slice(0, 2)  // Take top 2 most relevant memories
        .map(memory => this.extractKeyInfo(memory))
        .filter(info => info.length > 0);

      if (relevantInfo.length > 0) {
        // Add memory context to query
        const memoryInsight = relevantInfo.join(' ');
        enhancedQuery = this.constructEnhancedQuery(query, memoryInsight);
      }
    }

    // Check for conversation continuity
    const recentContext = Array.from(this.memoryContexts.values())
      .sort((a, b) => b.lastAccessTime.getTime() - a.lastAccessTime.getTime())
      .slice(0, 1)[0];

    if (recentContext && this.isRelatedQuery(query, recentContext)) {
      enhancedQuery = this.addContinuityContext(enhancedQuery, recentContext);
    }

    return {
      enhancedQuery,
      memoryContext
    };
  }

  private extractKeyInfo(memory: string): string {
    // Extract key information while preserving original meaning
    const sentences = memory.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) return '';

    // Take the most relevant sentence (usually the first one)
    return sentences[0].trim();
  }

  private constructEnhancedQuery(originalQuery: string, memoryInsight: string): string {
    // Determine if the query is a question
    const isQuestion = originalQuery.trim().endsWith('?') || 
      /^(what|who|where|when|why|how)/i.test(originalQuery);

    if (isQuestion) {
      return `${originalQuery} (Previous context: ${memoryInsight})`;
    } else {
      return `${originalQuery} (Related memory: ${memoryInsight})`;
    }
  }

  private isRelatedQuery(query: string, context: MemoryContext): boolean {
    // Check if the current query is related to recent context
    const queryWords = new Set(query.toLowerCase().split(/\s+/));
    const contextWords = new Set(
      context.relevantMemories
        .join(' ')
        .toLowerCase()
        .split(/\s+/)
    );

    // Count common words (excluding stop words)
    const commonWords = Array.from(queryWords).filter(word => 
      contextWords.has(word) && !this.isStopWord(word)
    );

    return commonWords.length >= 2; // At least 2 significant common words
  }

  private isStopWord(word: string): boolean {
    const stopWords = new Set([
      'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have',
      'i', 'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you',
      'do', 'at', 'this', 'but', 'his', 'by', 'from', 'they',
      'we', 'say', 'her', 'she', 'or', 'an', 'will', 'my', 'one',
      'all', 'would', 'there', 'their', 'what', 'so', 'up', 'out',
      'if', 'about', 'who', 'get', 'which', 'go', 'me'
    ]);
    return stopWords.has(word.toLowerCase());
  }

  private addContinuityContext(query: string, context: MemoryContext): string {
    return `${query} (Continuing from: ${this.extractKeyInfo(context.relevantMemories[0])})`;
  }

  private generateContextKey(query: string): string {
    return `${query}_${Date.now()}`;
  }

  // Additional methods can be added here as needed, while maintaining
  // compatibility with existing functionality
} 
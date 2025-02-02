import { EmailMessage } from "../../types/social-platforms";
import { serviceStateManager } from '../services/service-state-manager';

interface EmailContext {
  recentEmails: EmailMessage[];
  searchResults: EmailMessage[];
  timestamp: number;
  searchQuery?: string;
}

interface EmailSearchContext {
  query: string;
  results: EmailMessage[];
  timestamp: number;
  referenced: boolean;
}

export class EmailContextManager {
  private userId: string;
  private searches: Map<string, EmailSearchContext> = new Map();
  private recentlyReferenced: EmailMessage[] = [];
  private readonly TTL = 30 * 60 * 1000; // 30 minutes

  constructor(userId: string) {
    this.userId = userId;
  }

  async updateContext(context: EmailContext) {
    // Check service state before updating context
    const state = await serviceStateManager.getState('gmail');
    if (!state.isAuthenticated) {
      throw new Error('Gmail service requires authentication');
    }

    // Update recent emails
    this.recentlyReferenced = context.recentEmails;

    // Update search results if present
    if (context.searchQuery) {
      this.searches.set(context.searchQuery, {
        query: context.searchQuery,
        results: context.searchResults,
        timestamp: context.timestamp,
        referenced: false
      });
    }

    // Update service state
    await serviceStateManager.updateState('gmail', {
      lastSync: new Date()
    });
  }

  async addSearchResults(query: string, results: EmailMessage[]) {
    // Check service state before adding results
    const state = await serviceStateManager.getState('gmail');
    if (!state.isAuthenticated) {
      throw new Error('Gmail service requires authentication');
    }

    this.searches.set(query, {
      query,
      results,
      timestamp: Date.now(),
      referenced: false
    });

    // Update service state
    await serviceStateManager.updateState('gmail', {
      lastSync: new Date()
    });
  }

  async markEmailReferenced(emailId: string) {
    // Check service state
    const state = await serviceStateManager.getState('gmail');
    if (!state.isAuthenticated) {
      throw new Error('Gmail service requires authentication');
    }

    this.searches.forEach(context => {
      const email = context.results.find(e => e.id === emailId);
      if (email) {
        context.referenced = true;
        this.recentlyReferenced = [email, ...this.recentlyReferenced].slice(0, 10);
      }
    });
  }

  async getPreviousSearches(): Promise<EmailSearchContext[]> {
    // Check service state
    const state = await serviceStateManager.getState('gmail');
    if (!state.isAuthenticated) {
      throw new Error('Gmail service requires authentication');
    }

    return Array.from(this.searches.values());
  }

  async getRelevantEmails(query: string): Promise<EmailMessage[]> {
    // Check service state
    const state = await serviceStateManager.getState('gmail');
    if (!state.isAuthenticated) {
      throw new Error('Gmail service requires authentication');
    }

    // Combine recently referenced and relevant cached results
    const now = Date.now();
    const relevantSearches = Array.from(this.searches.values())
      .filter(context => now - context.timestamp < this.TTL)
      .filter(context => this.isQueryRelated(query, context.query));
    
    return [...this.recentlyReferenced, 
            ...relevantSearches.flatMap(s => s.results)]
      .filter((email, index, self) => 
        index === self.findIndex(e => e.id === email.id));
  }

  private isQueryRelated(newQuery: string, oldQuery: string): boolean {
    const normalize = (q: string) => q.toLowerCase().split(/\s+/);
    const newTerms = normalize(newQuery);
    const oldTerms = normalize(oldQuery);
    return oldTerms.some(term => newTerms.includes(term));
  }
} 
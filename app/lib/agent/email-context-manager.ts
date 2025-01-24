import { EmailMessage } from "@/types/social-platforms";

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
  private readonly TTL = 5 * 60 * 1000; // 5 minutes

  constructor(userId: string) {
    this.userId = userId;
  }

  addSearchResults(query: string, results: EmailMessage[]) {
    this.searches.set(query, {
      query,
      results,
      timestamp: Date.now(),
      referenced: false
    });
  }

  markEmailReferenced(emailId: string) {
    this.searches.forEach(context => {
      const email = context.results.find(e => e.id === emailId);
      if (email) {
        context.referenced = true;
        this.recentlyReferenced = [email, ...this.recentlyReferenced].slice(0, 10);
      }
    });
  }

  getPreviousSearches(): EmailSearchContext[] {
    return Array.from(this.searches.values());
  }

  getRelevantEmails(query: string): EmailMessage[] {
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
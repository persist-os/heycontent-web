export class EmailContextManager {
  private userId: string;
  private recentlyReferenced: any[];
  private searchResults: {
    query: string;
    results: any[];
    timestamp: Date;
    referenced: boolean;
  }[];
  private serviceState: {
    lastSync?: Date;
    isAuthenticated: boolean;
  };

  constructor(userId: string) {
    this.userId = userId;
    this.recentlyReferenced = [];
    this.searchResults = [];
    this.serviceState = {
      isAuthenticated: false
    };
  }

  async updateContext(context: {
    recentEmails?: any[];
    searchQuery?: string;
    searchResults?: any[];
    isAuthenticated?: boolean;
  }): Promise<void> {
    if (context.recentEmails) {
      this.recentlyReferenced = context.recentEmails;
    }

    if (context.searchQuery && context.searchResults) {
      this.searchResults.push({
        query: context.searchQuery,
        results: context.searchResults,
        timestamp: new Date(),
        referenced: false
      });
    }

    if (typeof context.isAuthenticated === 'boolean') {
      this.serviceState.isAuthenticated = context.isAuthenticated;
      if (context.isAuthenticated) {
        this.serviceState.lastSync = new Date();
      }
    }
  }

  getRecentlyReferenced(): any[] {
    return this.recentlyReferenced;
  }

  getRelevantEmails(query?: string): any[] {
    if (!query) {
      return this.recentlyReferenced;
    }
    
    // Simple relevance filtering based on query
    return this.recentlyReferenced.filter(email => {
      const emailContent = JSON.stringify(email).toLowerCase();
      return emailContent.includes(query.toLowerCase());
    });
  }

  getPreviousSearches(): any[] {
    return this.searchResults;
  }

  markEmailReferenced(emailId: string): void {
    const searchResult = this.searchResults.find(sr => 
      sr.results.some(email => email.id === emailId)
    );
    if (searchResult) {
      searchResult.referenced = true;
    }
  }

  getSearchResults(): any[] {
    return this.searchResults.map(sr => sr.results).flat();
  }

  isAuthenticated(): boolean {
    return this.serviceState.isAuthenticated;
  }
} 

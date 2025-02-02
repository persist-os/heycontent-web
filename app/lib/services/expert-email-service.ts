import { 
  EmailMessage,
  EmailAnalysis,
  ExpertResponse,
  BusinessContext,
  CommunicationInsights,
  RelationshipDynamics,
  ActionableIntelligence,
  StrategicImplications
} from '../types/email';

import { ExpertEmailAnalysisService } from './expert-email-analysis';
import { ExpertResponseGenerator } from './expert-response-generator';
import { GmailService } from './gmail';
import { EmailMemoryManagerImpl } from '../memory/email-memory-manager';
import { ThreadManagementService } from './thread-management';

export interface EmailQueryResult {
  response: ExpertResponse;
  relatedEmails?: EmailMessage[];
  threadContext?: {
    threadId: string;
    messageCount: number;
    dateRange: {
      start: Date;
      end: Date;
    };
  };
}

export interface EmailQueryOptions {
  includeThreadHistory?: boolean;
  maxResults?: number;
  analysisDepth?: 'basic' | 'detailed' | 'comprehensive';
  timeRange?: {
    start: Date;
    end: Date;
  };
}

export class ExpertEmailService {
  private emailAnalysisService: ExpertEmailAnalysisService;
  private responseGenerator: ExpertResponseGenerator;

  constructor(
    private gmailService: GmailService,
    private emailMemoryManager: EmailMemoryManagerImpl,
    private threadManagementService: ThreadManagementService
  ) {
    this.emailAnalysisService = new ExpertEmailAnalysisService(
      emailMemoryManager,
      threadManagementService
    );
    this.responseGenerator = new ExpertResponseGenerator(
      this.emailAnalysisService
    );
  }

  async processEmailQuery(
    query: string,
    options: EmailQueryOptions = {}
  ): Promise<EmailQueryResult> {
    // Set default options
    const defaultOptions: EmailQueryOptions = {
      includeThreadHistory: true,
      maxResults: 10,
      analysisDepth: 'comprehensive',
      timeRange: undefined
    };

    const finalOptions = { ...defaultOptions, ...options };

    // Search for relevant emails
    const searchResults = await this.searchEmails(query, finalOptions);

    if (!searchResults.length) {
      return this.generateEmptyResponse(query);
    }

    // Get the most relevant email and its thread history
    const primaryEmail = searchResults[0];
    const threadHistory = finalOptions.includeThreadHistory ?
      await this.getThreadHistory(primaryEmail.threadId) :
      undefined;

    // Generate expert response
    const response = await this.responseGenerator.generateResponse(
      primaryEmail,
      threadHistory,
      this.determineQuestionType(query)
    );

    return {
      response,
      relatedEmails: searchResults,
      threadContext: threadHistory ? {
        threadId: primaryEmail.threadId,
        messageCount: threadHistory.length + 1,
        dateRange: this.getDateRange([primaryEmail, ...threadHistory])
      } : undefined
    };
  }

  private async searchEmails(
    query: string,
    options: EmailQueryOptions
  ): Promise<EmailMessage[]> {
    let searchQuery = query;

    // Add time range constraints if specified
    if (options.timeRange) {
      const after = options.timeRange.start.toISOString().split('T')[0];
      const before = options.timeRange.end.toISOString().split('T')[0];
      searchQuery += ` after:${after} before:${before}`;
    }

    // Perform the search
    return this.gmailService.searchEmails(
      searchQuery,
      options.maxResults || 10,
      options.analysisDepth === 'basic'
    );
  }

  private async getThreadHistory(
    threadId: string
  ): Promise<EmailMessage[]> {
    try {
      const thread = await this.threadManagementService.getThread(threadId);
      return thread.emails || [];
    } catch (error) {
      console.error('Error fetching thread history:', error);
      return [];
    }
  }

  private determineQuestionType(query: string): string {
    const queryLower = query.toLowerCase();
    
    // Timeline/History based
    if (queryLower.match(/when|history|previous|past|timeline/)) {
      return 'timeline';
    }
    
    // Project/Topic based
    if (queryLower.match(/project|topic|discuss|about|regarding/)) {
      return 'topic';
    }
    
    // Action item focused
    if (queryLower.match(/action|task|todo|pending|deadline/)) {
      return 'action';
    }
    
    // Document/Attachment based
    if (queryLower.match(/document|file|attachment|send|share/)) {
      return 'document';
    }
    
    // People/Team based
    if (queryLower.match(/who|team|person|people|contact/)) {
      return 'people';
    }
    
    // Decision tracking
    if (queryLower.match(/decision|approve|confirm|agree/)) {
      return 'decision';
    }
    
    // Pattern/Insight based
    if (queryLower.match(/pattern|trend|analysis|insight/)) {
      return 'insight';
    }
    
    // Meeting/Calendar related
    if (queryLower.match(/meeting|schedule|calendar|availability/)) {
      return 'meeting';
    }
    
    // Default to topic-based if no specific type is detected
    return 'topic';
  }

  private generateEmptyResponse(query: string): EmailQueryResult {
    const emptyResponse: ExpertResponse = {
      overview: {
        summary: `No emails found matching "${query}"`,
        keyPoints: ['No matching emails in the specified criteria'],
        context: 'Consider adjusting your search terms or time range'
      },
      analysis: {
        emailId: '',
        businessContext: {
          projectsInvolved: [],
          businessUnits: [],
          stakeholders: [],
          businessGoals: [],
          riskFactors: [],
          budgetImplications: []
        },
        communicationInsights: {
          communicationStyle: 'not_available',
          responsePatterns: {
            averageResponseTime: '0',
            consistencyScore: 0,
            engagementLevel: 'low'
          },
          sentimentTrends: {
            overall: 'neutral',
            recentTrend: 'stable',
            keyIndicators: []
          },
          collaborationMetrics: {
            teamEngagement: 'low',
            crossFunctionalInteractions: [],
            decisionMakingEfficiency: 'low'
          },
          engagementLevel: 'low'
        },
        relationshipDynamics: {
          relationshipStrength: 0,
          interactionHistory: {
            frequency: 'none',
            quality: 'none',
            lastInteraction: new Date(),
            keyInteractions: []
          },
          stakeholderInfluence: {
            role: 'unknown',
            impactLevel: 'low',
            decisionMakingAuthority: 'none'
          },
          collaborationPatterns: {
            preferredChannels: [],
            meetingFrequency: 'none',
            responseStyle: 'none'
          },
          collaborationHistory: {
            successfulProjects: 0,
            challengingInteractions: 0
          }
        },
        actionableIntelligence: {
          immediateActions: [],
          decisions: [],
          followUpRequired: false,
          decisionPoints: []
        },
        strategicImplications: {
          businessOpportunities: [],
          potentialChallenges: [],
          recommendedActions: [],
          alignmentWithGoals: []
        }
      },
      recommendations: {
        immediate: ['Refine search criteria'],
        strategic: ['Consider expanding search time range']
      },
      nextSteps: [{
        action: 'Modify search terms',
        priority: 'high',
        timeline: 'Immediate'
      }]
    };

    return {
      response: emptyResponse
    };
  }

  private getDateRange(emails: EmailMessage[]): {
    start: Date;
    end: Date;
  } {
    const dates = emails.map(email => email.date.getTime());
    return {
      start: new Date(Math.min(...dates)),
      end: new Date(Math.max(...dates))
    };
  }
} 
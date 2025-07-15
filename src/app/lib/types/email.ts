export interface EmailMessage {
  id: string;
  threadId: string;
  from: string;
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
  date: Date;
}

export interface EmailAnalysis {
  emailId: string;
  businessContext: BusinessContext;
  communicationInsights: CommunicationInsights;
  relationshipDynamics: RelationshipDynamics;
  actionableIntelligence: ActionableIntelligence;
  strategicImplications: StrategicImplications;
}

export interface ExpertAnalysis {
  businessContext: BusinessContext;
  communicationInsights: CommunicationInsights;
  relationshipDynamics: RelationshipDynamics;
  actionableIntelligence: ActionableIntelligence;
  strategicImplications: StrategicImplications;
}

export interface BusinessContext {
  projectsInvolved: string[];
  businessUnits: string[];
  stakeholders: string[];
  businessGoals: string[];
  riskFactors: string[];
  budgetImplications: string[];
}

export interface CommunicationInsights {
  communicationStyle: string;
  responsePatterns: {
    averageResponseTime: string;
    consistencyScore: number;
    engagementLevel: string;
  };
  sentimentTrends: {
    overall: string;
    recentTrend: string;
    keyIndicators: string[];
  };
  collaborationMetrics: {
    teamEngagement: string;
    crossFunctionalInteractions: string[];
    decisionMakingEfficiency: string;
  };
  engagementLevel: string;
}

export interface RelationshipDynamics {
  relationshipStrength: number;
  interactionHistory: {
    frequency: string;
    quality: string;
    lastInteraction: Date;
    keyInteractions: string[];
  };
  stakeholderInfluence: {
    role: string;
    impactLevel: string;
    decisionMakingAuthority: string;
  };
  collaborationPatterns: {
    preferredChannels: string[];
    meetingFrequency: string;
    responseStyle: string;
  };
  collaborationHistory: {
    successfulProjects: number;
    challengingInteractions: number;
  };
}

export interface ActionableIntelligence {
  immediateActions: Array<{
    task: string;
    priority: 'High' | 'Medium' | 'Low';
    deadline: string;
  }>;
  decisions: Array<{
    type: string;
    status: string;
    nextSteps: string[];
  }>;
  followUpRequired: boolean;
  decisionPoints: Array<{
    topic: string;
    status: string;
  }>;
}

export interface StrategicImplications {
  businessOpportunities: string[];
  potentialChallenges: string[];
  recommendedActions: Array<{
    action: string;
    timeframe: string;
    impact: string;
  }>;
  alignmentWithGoals: Array<{
    goal: string;
    alignment: 'high' | 'medium' | 'low';
    gaps: string[];
  }>;
}

export interface ExpertResponse {
  overview: {
    summary: string;
    keyPoints: string[];
    context: string;
  };
  analysis: EmailAnalysis;
  recommendations: {
    immediate: string[];
    strategic: string[];
  };
  nextSteps: Array<{
    action: string;
    priority: string;
    timeline: string;
  }>;
} 
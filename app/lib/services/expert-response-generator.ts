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

export class ExpertResponseGenerator {
  constructor(
    private emailAnalysisService: ExpertEmailAnalysisService
  ) {}

  async generateResponse(
    email: EmailMessage,
    threadHistory?: EmailMessage[],
    questionType?: string
  ): Promise<ExpertResponse> {
    // Get the full analysis
    const analysis = await this.emailAnalysisService.analyzeEmail(email, threadHistory);

    // Generate the response components
    const overview = this.generateOverview(email, analysis);
    const recommendations = this.generateRecommendations(analysis);
    const nextSteps = this.generateNextSteps(analysis);

    return {
      overview,
      analysis,
      recommendations,
      nextSteps
    };
  }

  private generateOverview(
    email: EmailMessage,
    analysis: EmailAnalysis
  ): ExpertResponse['overview'] {
    const summary = this.generateSummary(email, analysis);
    const keyPoints = this.extractKeyPoints(analysis);
    const context = this.generateContext(analysis);

    return {
      summary,
      keyPoints,
      context
    };
  }

  private generateSummary(
    email: EmailMessage,
    analysis: EmailAnalysis
  ): string {
    const {
      businessContext,
      communicationInsights,
      relationshipDynamics,
      actionableIntelligence
    } = analysis;

    const parts: string[] = [];

    // Add communication context
    if (communicationInsights) {
      parts.push(
        `This ${communicationInsights.communicationStyle} communication from ${email.from}`
      );
    }

    // Add business context
    if (businessContext?.projectsInvolved.length) {
      parts.push(
        `regarding ${businessContext.projectsInvolved.join(', ')}`
      );
    }

    // Add relationship context
    if (relationshipDynamics) {
      const strength = relationshipDynamics.relationshipStrength >= 0.7 ? 'strong' :
                      relationshipDynamics.relationshipStrength >= 0.4 ? 'moderate' :
                      'developing';
      parts.push(`indicates a ${strength} working relationship`);
    }

    // Add action context
    if (actionableIntelligence?.immediateActions.length) {
      const highPriorityCount = actionableIntelligence.immediateActions
        .filter(action => action.priority === 'High').length;
      
      if (highPriorityCount > 0) {
        parts.push(`requires ${highPriorityCount} high-priority actions`);
      }
    }

    return parts.join(' ');
  }

  private extractKeyPoints(analysis: EmailAnalysis): string[] {
    const keyPoints: string[] = [];

    const {
      businessContext,
      communicationInsights,
      relationshipDynamics,
      actionableIntelligence,
      strategicImplications
    } = analysis;

    // Business context points
    if (businessContext) {
      if (businessContext.businessGoals.length) {
        keyPoints.push(`Goals: ${businessContext.businessGoals.join(', ')}`);
      }
      if (businessContext.riskFactors?.length) {
        keyPoints.push(`Risks: ${businessContext.riskFactors.join(', ')}`);
      }
    }

    // Communication insights
    if (communicationInsights) {
      const topTopics = communicationInsights.sentimentTrends.keyIndicators
        .slice(0, 3)
        .map(trend => `${trend} (${communicationInsights.sentimentTrends.overall})`)
        .join(', ');
      
      keyPoints.push(`Key Topics: ${topTopics}`);
      keyPoints.push(`Engagement Level: ${communicationInsights.collaborationMetrics.teamEngagement}`);
    }

    // Relationship dynamics
    if (relationshipDynamics) {
      const recentInteractions = relationshipDynamics.interactionHistory.keyInteractions
        .slice(0, 2)
        .map(interaction => 
          `${interaction} (${relationshipDynamics.stakeholderInfluence.impactLevel} impact)`
        )
        .join(', ');
      
      keyPoints.push(`Recent Interactions: ${recentInteractions}`);
    }

    // Action items
    if (actionableIntelligence) {
      const highPriorityActions = actionableIntelligence.immediateActions
        .filter(action => action.priority === 'High')
        .map(action => action.task)
        .join(', ');
      
      if (highPriorityActions) {
        keyPoints.push(`Priority Actions: ${highPriorityActions}`);
      }
    }

    // Strategic implications
    if (strategicImplications) {
      if (strategicImplications.businessOpportunities.length) {
        keyPoints.push(
          `Opportunities: ${strategicImplications.businessOpportunities.join(', ')}`
        );
      }
    }

    return keyPoints;
  }

  private generateContext(analysis: EmailAnalysis): string {
    const contextParts: string[] = [];

    const {
      businessContext,
      communicationInsights,
      relationshipDynamics
    } = analysis;

    // Add business unit context
    if (businessContext?.businessUnits.length) {
      contextParts.push(
        `This communication involves the following business units: ${businessContext.businessUnits.join(', ')}.`
      );
    }

    // Add stakeholder context
    if (businessContext?.stakeholders.length) {
      contextParts.push(
        `Key stakeholders include: ${businessContext.stakeholders.join(', ')}.`
      );
    }

    // Add communication pattern context
    if (communicationInsights) {
      const responseTime = this.formatResponseTime(
        communicationInsights.responsePatterns.averageResponseTime
      );
      contextParts.push(
        `Communication pattern shows ${communicationInsights.communicationStyle} style with ${responseTime} average response time.`
      );
    }

    // Add relationship context
    if (relationshipDynamics) {
      const collaborationContext = 
        `Collaboration history shows ${relationshipDynamics.collaborationHistory.successfulProjects} successful projects and ${relationshipDynamics.collaborationHistory.challengingInteractions} challenging interactions.`;
      contextParts.push(collaborationContext);
    }

    return contextParts.join(' ');
  }

  private generateRecommendations(
    analysis: EmailAnalysis
  ): ExpertResponse['recommendations'] {
    const immediate: string[] = [];
    const strategic: string[] = [];

    const {
      actionableIntelligence,
      strategicImplications,
      communicationInsights
    } = analysis;

    // Add immediate recommendations from action items
    if (actionableIntelligence) {
      // High priority actions become immediate recommendations
      actionableIntelligence.immediateActions
        .filter(action => action.priority === 'High')
        .forEach(action => {
          immediate.push(
            `Address "${action.task}"${action.deadline ? ` by ${action.deadline}` : ''}`
          );
        });

      // Add follow-up recommendation if needed
      if (actionableIntelligence.followUpRequired) {
        immediate.push('Schedule follow-up discussion');
      }

      // Add decision-related recommendations
      actionableIntelligence.decisionPoints
        .filter(point => point.status === 'pending')
        .forEach(point => {
          immediate.push(`Resolve decision on "${point.topic}"`);
        });
    }

    // Add strategic recommendations
    if (strategicImplications) {
      // Add recommendations from strategic implications
      strategicImplications.recommendedActions
        .forEach(action => {
          if (action.timeframe === 'immediate') {
            immediate.push(`${action.action} for ${action.impact}`);
          } else {
            strategic.push(`${action.action} for ${action.impact}`);
          }
        });

      // Add relationship-building recommendations based on goal alignment
      strategicImplications.alignmentWithGoals
        .filter(goal => goal.alignment === 'low')
        .forEach(goal => {
          strategic.push(`Improve alignment with goal: ${goal.goal}`);
        });
    }

    // Add communication-based recommendations
    if (communicationInsights) {
      const keyTopics = communicationInsights.sentimentTrends.keyIndicators
        .map((trend: string) => ({
          topic: trend,
          sentiment: communicationInsights.sentimentTrends.overall
        }))
        .filter((trend: { topic: string, sentiment: string }) => 
          trend.sentiment === 'negative'
        );

      if (keyTopics.length > 0) {
        strategic.push(`Address concerns regarding: ${keyTopics.map(t => t.topic).join(', ')}`);
      }
    }

    return { immediate, strategic };
  }

  private generateNextSteps(
    analysis: EmailAnalysis
  ): ExpertResponse['nextSteps'] {
    const nextSteps: ExpertResponse['nextSteps'] = [];

    const {
      actionableIntelligence,
      strategicImplications,
      communicationInsights
    } = analysis;

    // Add immediate action items as next steps
    if (actionableIntelligence) {
      actionableIntelligence.immediateActions.forEach(action => {
        nextSteps.push({
          action: action.task,
          priority: action.priority,
          timeline: action.deadline ? 
            `Due by ${action.deadline}` : 
            this.determineTimeline(action.priority)
        });
      });
    }

    // Add strategic actions that need immediate attention
    if (strategicImplications) {
      strategicImplications.recommendedActions
        .filter(action => action.timeframe === 'immediate')
        .forEach(action => {
          nextSteps.push({
            action: action.action,
            priority: 'High',
            timeline: 'Immediate'
          });
        });
    }

    // Add communication-related next steps
    if (communicationInsights?.engagementLevel === 'low') {
      nextSteps.push({
        action: 'Schedule follow-up meeting to increase engagement',
        priority: 'Medium',
        timeline: 'Within 1 week'
      });
    }

    return nextSteps;
  }

  // Utility methods
  private formatResponseTime(responseTime: string): string {
    // Convert string time to milliseconds if needed
    const milliseconds = typeof responseTime === 'string' ? 
      parseInt(responseTime.replace(/[^0-9]/g, '')) * 1000 : 0;
    
    const hours = milliseconds / (1000 * 60 * 60);
    
    if (hours < 1) {
      return 'less than an hour';
    } else if (hours < 24) {
      return `${Math.round(hours)} hours`;
    } else {
      return `${Math.round(hours / 24)} days`;
    }
  }

  private determineTimeline(priority: 'High' | 'Medium' | 'Low'): string {
    switch (priority) {
      case 'High':
        return 'Within 24 hours';
      case 'Medium':
        return 'Within 1 week';
      case 'Low':
        return 'Within 2 weeks';
      default:
        return 'To be determined';
    }
  }
} 
import {  
  EmailAnalysis, 
  ExpertResponse,
  BusinessContext,
  CommunicationInsights,
  RelationshipDynamics,
  ActionableIntelligence,
  StrategicImplications
} from '../types/email';

import {
  convertToDetailedTrends,
  convertToDetailedInteractions,
  convertToDetailedDecisionPoints,
  formatDetailedTrend,
  formatDetailedInteraction,
  formatDetailedDecisionPoint
} from '../types/extended-email';

interface FormatOptions {
  includeEmoji?: boolean;
  bulletPoint?: string;
  dateFormat?: Intl.DateTimeFormatOptions;
  maxRelatedEmails?: number;
  truncateLength?: number;
}

export function formatEmailResponse(
  response: ExpertResponse,
  options: FormatOptions = {}
): string {
  const {
    includeEmoji = true,
    bulletPoint = '•',
    dateFormat = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    },
    truncateLength = 100
  } = options;

  const sections: string[] = [];

  // Format overview section
  const overviewSection = formatOverviewSection(response.overview, { includeEmoji, bulletPoint });
  if (overviewSection) sections.push(overviewSection);

  // Format analysis sections
  const analysisSection = formatAnalysisSection(response.analysis, { includeEmoji, bulletPoint });
  if (analysisSection) sections.push(analysisSection);

  // Format recommendations
  const recommendationsSection = formatRecommendationsSection(response.recommendations, { includeEmoji, bulletPoint });
  if (recommendationsSection) sections.push(recommendationsSection);

  // Format next steps
  const nextStepsSection = formatNextStepsSection(response.nextSteps, { includeEmoji, bulletPoint });
  if (nextStepsSection) sections.push(nextStepsSection);

  return sections.filter(Boolean).join('\n\n');
}

function formatOverviewSection(
  overview: ExpertResponse['overview'],
  options: FormatOptions
): string {
  const { includeEmoji, bulletPoint } = options;
  const parts: string[] = [];

  parts.push(includeEmoji ? 'OVERVIEW' : 'OVERVIEW');
  parts.push(`Summary: ${overview.summary}`);

  if (overview.keyPoints.length) {
    parts.push('\nKey Points:');
    overview.keyPoints.forEach(point => {
      parts.push(`${bulletPoint} ${point}`);
    });
  }

  if (overview.context) {
    parts.push(`\nContext: ${overview.context}`);
  }

  return parts.join('\n');
}

function formatAnalysisSection(
  analysis: EmailAnalysis,
  options: FormatOptions
): string {
  const { includeEmoji, bulletPoint = '•' } = options;
  const parts: string[] = [];

      parts.push(includeEmoji ? 'ANALYSIS' : 'ANALYSIS');

  // Format business context
  if (analysis.businessContext) {
    const contextSection = formatBusinessContext(analysis.businessContext, bulletPoint);
    if (contextSection) parts.push(contextSection);
  }

  // Format communication insights
  if (analysis.communicationInsights) {
    const insightsSection = formatCommunicationInsights(analysis.communicationInsights, bulletPoint);
    if (insightsSection) parts.push(insightsSection);
  }

  // Format relationship dynamics
  if (analysis.relationshipDynamics) {
    const dynamicsSection = formatRelationshipDynamics(analysis.relationshipDynamics, bulletPoint);
    if (dynamicsSection) parts.push(dynamicsSection);
  }

  // Format actionable intelligence
  if (analysis.actionableIntelligence) {
    const intelligenceSection = formatActionableIntelligence(analysis.actionableIntelligence, bulletPoint);
    if (intelligenceSection) parts.push(intelligenceSection);
  }

  // Format strategic implications
  if (analysis.strategicImplications) {
    const implicationsSection = formatStrategicImplications(analysis.strategicImplications, bulletPoint);
    if (implicationsSection) parts.push(implicationsSection);
  }

  return parts.filter(Boolean).join('\n\n');
}

function formatBusinessContext(
  context: BusinessContext,
  bulletPoint: string
): string {
  const parts: string[] = [];

  if (context.projectsInvolved.length) {
    parts.push('Projects:');
    context.projectsInvolved.forEach(project => {
      parts.push(`${bulletPoint} ${project}`);
    });
  }

  if (context.businessUnits.length) {
    parts.push('\nBusiness Units:');
    context.businessUnits.forEach(unit => {
      parts.push(`${bulletPoint} ${unit}`);
    });
  }

  if (context.stakeholders.length) {
    parts.push('\nKey Stakeholders:');
    context.stakeholders.forEach(stakeholder => {
      parts.push(`${bulletPoint} ${stakeholder}`);
    });
  }

  if (context.businessGoals.length) {
    parts.push('\nBusiness Goals:');
    context.businessGoals.forEach(goal => {
      parts.push(`${bulletPoint} ${goal}`);
    });
  }

  return parts.join('\n');
}

function formatCommunicationInsights(
  insights: CommunicationInsights,
  bulletPoint: string
): string {
  const parts: string[] = [];

  parts.push('Communication Style:');
  parts.push(`${bulletPoint} ${insights.communicationStyle}`);

  parts.push('\nResponse Patterns:');
  parts.push(`${bulletPoint} Average Response Time: ${formatDuration(parseFloat(insights.responsePatterns.averageResponseTime))}`);
  parts.push(`${bulletPoint} Consistency Score: ${formatPercentage(insights.responsePatterns.consistencyScore)}`);

  const detailedTrends = convertToDetailedTrends(
    insights.sentimentTrends.keyIndicators,
    insights.sentimentTrends.overall
  );

  if (detailedTrends.length) {
    parts.push('\nTopic Trends:');
    detailedTrends.forEach(trend => {
      parts.push(`${bulletPoint} ${formatDetailedTrend(trend)}`);
    });
  }

  parts.push(`\nEngagement Level: ${insights.engagementLevel}`);

  return parts.join('\n');
}

function formatRelationshipDynamics(
  dynamics: RelationshipDynamics,
  bulletPoint: string
): string {
  const parts: string[] = [];

  parts.push(`Relationship Strength: ${formatPercentage(dynamics.relationshipStrength)}`);

  const detailedInteractions = convertToDetailedInteractions(
    dynamics.interactionHistory.keyInteractions
  );

  if (detailedInteractions.length) {
    parts.push('\nKey Interactions:');
    detailedInteractions.forEach(interaction => {
      parts.push(`${bulletPoint} ${formatDetailedInteraction(interaction)}`);
    });
  }

  parts.push('\nCollaboration History:');
  parts.push(`${bulletPoint} Successful Projects: ${dynamics.collaborationHistory.successfulProjects}`);
  parts.push(`${bulletPoint} Challenging Interactions: ${dynamics.collaborationHistory.challengingInteractions}`);

  parts.push(`\nImpact Level: ${dynamics.stakeholderInfluence.impactLevel}`);

  return parts.join('\n');
}

function formatActionableIntelligence(
  intelligence: ActionableIntelligence,
  bulletPoint: string
): string {
  const parts: string[] = [];

  if (intelligence.immediateActions.length) {
    parts.push('Immediate Actions:');
    intelligence.immediateActions.forEach(action => {
      const deadline = action.deadline ? ` (due ${action.deadline})` : '';
      parts.push(`${bulletPoint} [${action.priority}] ${action.task}${deadline}`);
    });
  }

  if (intelligence.followUpRequired) {
    parts.push('\nFollow-up Required');
  }

  const detailedDecisionPoints = convertToDetailedDecisionPoints(
    intelligence.decisionPoints
  );

  if (detailedDecisionPoints.length) {
    parts.push('\nDecision Points:');
    detailedDecisionPoints.forEach(point => {
      parts.push(`${bulletPoint} ${formatDetailedDecisionPoint(point)}`);
    });
  }

  return parts.join('\n');
}

function formatStrategicImplications(
  implications: StrategicImplications,
  bulletPoint: string
): string {
  const parts: string[] = [];

  if (implications.businessOpportunities.length) {
    parts.push('Business Opportunities:');
    implications.businessOpportunities.forEach(opportunity => {
      parts.push(`${bulletPoint} ${opportunity}`);
    });
  }

  if (implications.potentialChallenges.length) {
    parts.push('\nPotential Challenges:');
    implications.potentialChallenges.forEach(challenge => {
      parts.push(`${bulletPoint} ${challenge}`);
    });
  }

  if (implications.recommendedActions.length) {
    parts.push('\nRecommended Actions:');
    implications.recommendedActions.forEach(action => {
      parts.push(`${bulletPoint} ${action.action} (${action.impact}, ${action.timeframe})`);
    });
  }

  if (implications.alignmentWithGoals.length) {
    parts.push('\nGoal Alignment:');
    implications.alignmentWithGoals.forEach(alignment => {
      parts.push(`${bulletPoint} ${alignment.goal}: ${alignment.alignment} alignment`);
    });
  }

  return parts.join('\n');
}

function formatRecommendationsSection(
  recommendations: ExpertResponse['recommendations'],
  options: FormatOptions
): string {
  const { includeEmoji, bulletPoint } = options;
  const parts: string[] = [];

      parts.push(includeEmoji ? 'RECOMMENDATIONS' : 'RECOMMENDATIONS');

  if (recommendations.immediate.length) {
    parts.push('\nImmediate Actions:');
    recommendations.immediate.forEach(rec => {
      parts.push(`${bulletPoint} ${rec}`);
    });
  }

  if (recommendations.strategic.length) {
    parts.push('\nStrategic Actions:');
    recommendations.strategic.forEach(rec => {
      parts.push(`${bulletPoint} ${rec}`);
    });
  }

  return parts.join('\n');
}

function formatNextStepsSection(
  nextSteps: ExpertResponse['nextSteps'],
  options: FormatOptions
): string {
  const { includeEmoji, bulletPoint } = options;
  const parts: string[] = [];

  parts.push(includeEmoji ? '📅 NEXT STEPS' : 'NEXT STEPS');

  nextSteps.forEach(step => {
    parts.push(`${bulletPoint} [${step.priority}] ${step.action} (${step.timeline})`);
  });

  return parts.join('\n');
}

// Utility functions
function formatDate(date: Date, options: Intl.DateTimeFormatOptions = {}): string {
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  });
}

function formatDuration(milliseconds: number): string {
  const hours = milliseconds / (1000 * 60 * 60);
  
  if (hours < 1) {
    return 'less than an hour';
  } else if (hours < 24) {
    return `${Math.round(hours)} hours`;
  } else {
    return `${Math.round(hours / 24)} days`;
  }
}

function formatPercentage(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
} 
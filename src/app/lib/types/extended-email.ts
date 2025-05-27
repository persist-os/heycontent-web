import {
  CommunicationInsights,
  RelationshipDynamics,
  ActionableIntelligence
} from './email';

// Extended interfaces for detailed formatting
export interface DetailedTopicTrend {
  topic: string;
  sentiment: string;
  frequency: number;
}

export interface DetailedInteraction {
  date: Date;
  type: string;
  impact: string;
  description: string;
}

export interface DetailedDecisionPoint {
  topic: string;
  status: string;
  nextSteps: string[];
  impact: string;
  stakeholders: string[];
}

// Utility type to convert string[] to DetailedTopicTrend[]
export function convertToDetailedTrends(
  keyIndicators: string[],
  overall: string
): DetailedTopicTrend[] {
  return keyIndicators.map(topic => ({
    topic,
    sentiment: overall,
    frequency: 1 // Default frequency
  }));
}

// Utility type to convert string[] to DetailedInteraction[]
export function convertToDetailedInteractions(
  interactions: string[]
): DetailedInteraction[] {
  return interactions.map(interaction => {
    const [date, type, impact] = interaction.split('|');
    return {
      date: new Date(date),
      type: type || 'General',
      impact: impact || 'Medium',
      description: interaction
    };
  });
}

// Utility type to convert decision points to detailed ones
export function convertToDetailedDecisionPoints(
  points: ActionableIntelligence['decisionPoints']
): DetailedDecisionPoint[] {
  return points.map(point => ({
    ...point,
    nextSteps: [],
    impact: 'To be determined',
    stakeholders: []
  }));
}

// Format utilities
export function formatDetailedTrend(trend: DetailedTopicTrend): string {
  return `${trend.topic} (${trend.sentiment}, mentioned ${trend.frequency} times)`;
}

export function formatDetailedInteraction(interaction: DetailedInteraction): string {
  return `${interaction.date.toLocaleDateString()}: ${interaction.type} (${interaction.impact} impact)`;
}

export function formatDetailedDecisionPoint(point: DetailedDecisionPoint): string {
  const nextStepsText = point.nextSteps.length ? ` - Next: ${point.nextSteps.join(', ')}` : '';
  return `${point.topic} (${point.status})${nextStepsText}`;
} 
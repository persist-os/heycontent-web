export * from './chat'  // Re-export chat types
export * from './content'  // Re-export content types

export interface Partnership {
  id: number
  brand: string
  type: string
  status: string
  value: string
  deadline: string
  alignmentScore: number
  requirements: string[]
  progress: number
  lastContact: string
  contacts: PartnershipContact[]
  history: PartnershipEvent[]
}

export interface Insight {
  id: number
  type: string
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  metrics: {
    [key: string]: string
  }
  actionSteps: string[]
  priority: 'high' | 'medium' | 'low'
}

export interface AudienceData {
  id: number;
  name: string;
  demographics: {
    age: number;
    location: string;
    interests: string[];
    ageGroups: Array<{
      name: string;
      value: number;
    }>;
  };
  engagement: {
    views: number;
    likes: number;
    comments: number;
    metrics: Array<{
      name: string;
      value: number;
    }>;
  };
  growth: {
    followers: number;
    rate: number;
    history: Array<{
      date: string;
      followers: number;
    }>;
  };
}

export interface NotificationPreference {
  title: string;
  desc: string;
  enabled?: boolean;
}

export interface ConnectedPlatform {
  platform: string;
  status: 'Connected' | 'Not Connected';
  lastSync: string | null;
}

export interface AIPreference {
  title: string;
  description: string;
  enabled: boolean;
}

export interface AmbientInsight {
  type: string
  title: string
  description: string
  icon: any
  action: string
}

export interface PartnershipContact {
  name: string
  role: string
  email: string
}

export interface PartnershipEvent {
  date: string
  event: string
}

export interface PartnershipMetric {
  label: string
  value: string
  trend: string
  icon: any
  color: string
}

export interface AIInsight {
  id: number
  title: string
  description: string
  action: string
  metric: string
  icon: any
  priority: 'high' | 'medium' | 'low'
}

export interface InsightCategory {
  id: number
  category: string
  insights: AIInsight[]
}

export interface NavItem {
  id: string
  icon: any
  label: string
  color: string
}

export interface PredictiveInsight {
  id: number
  type: 'content' | 'engagement' | 'growth' | 'revenue'
  prediction: {
    what: string
    when: string
    probability: number
    potentialImpact: string
    reasoning: string[]
  }
  suggestedActions: {
    action: string
    effort: 'low' | 'medium' | 'high'
    timeframe: string
    expectedOutcome: string
  }[]
  confidence: number
  dataPoints: string[]
}

export interface CrossPlatformStrategy {
  id: number
  originalContent: {
    type: string
    title: string
    duration: string
    mainPlatform: string
  }
  platforms: {
    platform: string
    format: string
    adaptation: string
    bestTime: string
    predictedEngagement: number
    requirements: string[]
    status: 'ready' | 'in-progress' | 'pending'
  }[]
  potentialReach: {
    platform: string
    estimate: string
    confidence: number
  }[]
  timeline: {
    platform: string
    recommendedTime: string
    reasoning: string
  }[]
}

export interface MarketPosition {
  id: number
  niche: {
    primary: string
    secondary: string[]
    saturation: number
    growth: number
    competition: 'low' | 'medium' | 'high'
  }
  competitors: {
    name: string
    overlap: number
    strengths: string[]
    gaps: string[]
    audienceSize: number
    engagement: number
  }[]
  opportunities: {
    type: string
    description: string
    potential: number
    effort: 'low' | 'medium' | 'high'
    timeToValue: string
    requirements: string[]
  }[]
  uniqueAdvantages: {
    factor: string
    impact: number
    leverage: string
    competitors: number
  }[]
  audienceGaps: {
    segment: string
    size: number
    interests: string[]
    currentlyCovered: number
    potential: string
  }[]
}

export interface AIActionableInsight {
  id: number
  type: 'content' | 'platform' | 'market'
  opportunity: {
    title: string
    description: string
    impact: string
    timing: string
    confidence: number
    priority?: 'High' | 'Medium' | 'Low'
  }
  action: {
    steps: string[]
    timeToImplement: string
    expectedOutcome: string
    requirements: string[]
  }
  context: {
    why: string[]
    data: string[]
  }
}

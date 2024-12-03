export interface Message {
  id: number
  type: 'user' | 'ai'
  content: string
  timestamp: string
}

export interface ChatHistory {
  id: number
  topic: string
  preview: string
  date: string
  messages: Message[]
  starred: boolean
}

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
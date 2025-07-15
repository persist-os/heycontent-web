export interface Partnership {
  id: string;
  emailThreadId: string;
  brandName: string;
  subject: string;
  status: 'opportunity' | 'inquiry' | 'negotiating' | 'active' | 'completed';
  estimatedValue: number;
  lastActivity: number;
  smartNoteIds: string[];
  personaId?: string;
  messageCount: number;
  snippet?: string;
  from?: string;
  createdAt: number;
  updatedAt: number;
  category?: 'partnership' | 'media' | 'business' | 'community' | 'none';
}

export interface AIOpportunity {
  id: string;
  threadId: string;
  title: string;
  brandName?: string;
  confidence: number;
  estimatedValue: number;
  timing: 'immediate' | 'this_week' | 'this_month' | 'ongoing';
  impact: string;
  whyNow: string[];
  actionSteps: string[];
  expectedOutcome: string;
  sourceDetails: string[];
  subject?: string;
  from?: string;
  snippet?: string;
  createdAt: number;
}

export interface PartnershipMetrics {
  aiOpportunities: number;
  activePartnerships: number;
  pendingResponses: number;
  pipelineValue: number;
} 
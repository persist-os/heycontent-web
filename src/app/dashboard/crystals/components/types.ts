export interface CrystalData {
  _id: string;
  name: string;
  description: string;
  dimension: string;
  confidence_score: string;
  core_insight?: string;
  behavioral_implications?: string[];
  supporting_quotes?: string[];
  observation_count: number;
  time_span_days: number;
  crystal_type?: string;
  shardIds?: string[];
}

export interface ShardData {
  _id: string;
  exact_quote?: string;
  what_it_reveals?: string;
  why_significant?: string;
  dimension: string;
  confidence_level: string;
  source_type?: string;
  _creationTime?: number;
  userId?: string;
  tags?: string[];
  crystal_id?: string;
}

export interface CrystalStats {
  crystalsCount: number;
  shardsCount: number;
  recentActivity: {
    crystalsThisWeek: number;
    shardsThisWeek: number;
  };
  byConfidence: Record<string, number>;
}

export interface FormationStatus {
  isRunning?: boolean;
  lastRunStatus?: string;
  timeSinceLastRun?: number;
  history?: any[];
}

export interface FormationEligibility {
  eligible: boolean;
  shardCount: number;
  hasRunningFormation: boolean;
  daysSinceLastRun: number;
}

export type ViewType = 'overview' | 'crystals' | 'shards' | 'project_seeds';

export interface InsightCard {
  platform: 'youtube' | 'instagram' | 'gmail';
  title: string;
  impact: string;
  whyNow: string[];
  actionSteps: string[];
  expectedOutcome: string;
  sourceDetails: string[];
  relatedItems: Array<{ label: string; value: string }>;
  highlightColor?: string;
  outcomeColor?: string;
}

export interface BatchAnalysisMetadata {
  platform: 'youtube' | 'instagram' | 'gmail';
  analysisType: 'batch';
  analyzedCount: number;        // actual items analyzed
  requestedCount: number;       // what user requested
  totalAvailable: number;       // total items in database
  optimizations?: {             // platform-specific optimizations
    cachedPostsUsed?: number;
    apiCallsSaved?: number;
    rateLimited?: boolean;
    fallbackToCache?: boolean;
  };
  generatedAt: string;         // ISO timestamp
}

export interface BatchAnalysisStatus {
  status: 'enqueued' | 'processing' | 'completed' | 'failed';
  taskId: string;
  progress: number;            // 0-100
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export interface BatchAnalysisData {
  // ✅ Direct access to insights array (no nesting!)
  insights: InsightCard[];
  
  // ✅ Analysis metadata
  metadata: BatchAnalysisMetadata;
  
  // ✅ Task status (for async operations)
  status: BatchAnalysisStatus;
}

// Hook return type for consistency
export interface BatchAnalysisHookReturn {
  insights: InsightCard[];
  metadata: BatchAnalysisMetadata | null;
  status: BatchAnalysisStatus | null;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  isConnected: boolean;
  refresh: (selectionMode?: 'auto' | 'manual', selectedPostIds?: string[]) => void;
  // Platform-specific controls
  postLimit?: number | 'all';
  setPostLimit?: (limit: number | 'all') => void;
  customPostLimit?: string;
  setCustomPostLimit?: (limit: string) => void;
  showCustomInput?: boolean;
  setShowCustomInput?: (show: boolean) => void;
  handleCustomSubmit?: () => void;
  // Platform-specific data
  channel?: any;
  account?: any;
} 
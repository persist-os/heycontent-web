export interface ProgressDetails {
  totalConversations?: number;
  processedConversations?: number;
  totalBatches?: number;
  processedBatches?: number;
  totalMessages?: number;
  processedMessages?: number;
  percentComplete?: number;
  currentBatch?: number;
  processingPhase?: string; // 'parsing' | 'importing' | 'shard_extraction' | 'formation' | 'complete'
  // DEPRECATED: These fields are kept for backward compatibility but no longer used
  // Frontend now queries background_jobs table directly via getImportRelatedJobs
  shardExtractionJobIds?: string[];
  formationJobId?: string;
  totalRelatedJobs?: number;
  completedRelatedJobs?: number;
}

export interface RelatedJob {
  jobId: string;
  type: string;
  status: string;
  createdAt?: number;
  startedAt?: number;
  completedAt?: number;
}

export interface ImportStatus {
  job_id: string;
  status: 'queued' | 'running' | 'processing' | 'completed' | 'failed';
  result?: {
    conversations_imported: number;
    total_conversations: number;
    total_messages: number;
    error_count: number;
  };
  error?: string;
  progress?: string;
  progressDetails?: ProgressDetails;
  relatedJobs?: RelatedJob[];
  pipelineComplete?: boolean;
  created_at?: number;
  completed_at?: number;
}

export interface UploadResponse {
  success: boolean;
  import_id?: string;
  status: string;
  message: string;
  file_size_mb?: number;
  error?: string;
}


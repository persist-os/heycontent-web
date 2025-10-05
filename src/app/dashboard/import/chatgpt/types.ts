export interface ImportStatus {
  job_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  result?: {
    conversations_imported: number;
    total_conversations: number;
    total_messages: number;
    error_count: number;
  };
  error?: string;
  progress?: string;
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


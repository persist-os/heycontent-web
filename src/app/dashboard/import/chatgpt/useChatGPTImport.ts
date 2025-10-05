import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { ChatGPTImportService } from './chatGPTImportService';
import { ImportStatus } from './chatGPTImportTypes';
import { toast } from 'sonner';

export function useChatGPTImport() {
  const [uploading, setUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Get user ID on mount
  useEffect(() => {
    getCurrentUserId().then(setUserId).catch(console.error);
  }, []);

  // **REACTIVE CONVEX QUERY - NO POLLING NEEDED!**
  // This automatically updates when the backend writes to migration_tracking
  const importData = useQuery(
    api.chatgptImport.getImportStatus,
    userId ? { userId } : 'skip'
  );

  // **DIRECT JOB QUERY - Shows jobs as they're created!**
  // Queries background_jobs table directly by type (chatgpt_import, shard_extraction, crystal_formation)
  const relatedJobs = useQuery(
    api.chatgptImport.getImportRelatedJobs,
    userId ? { userId } : 'skip'
  );

  // Check if user has already imported
  const hasImported = useQuery(
    api.chatgptImport.checkHasImported,
    userId ? { userId } : 'skip'
  );

  // Convex mutation for canceling import
  const cancelImportMutation = useMutation(api.chatgptImport.cancelImport);

  const uploadFile = useCallback(async (file: File) => {
    if (!userId) {
      toast.error('User not authenticated');
      return null;
    }

    setUploading(true);
    try {
      const response = await ChatGPTImportService.uploadFile(file);
      
      if (response.success && response.import_id) {
        toast.success('Upload complete! Processing...');
        return response.import_id;
      } else {
        toast.error(response.error || 'Upload failed');
        return null;
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  }, [userId]);

  const cancelImport = useCallback(async () => {
    if (!userId) return;
    
    try {
      const result = await cancelImportMutation({ 
        userId, 
        reason: 'Cancelled by user' 
      });
      
      if (result.success) {
        toast.success(result.message || 'Import cancelled successfully');
      } else {
        toast.error(result.error || 'Failed to cancel import');
      }
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel import');
    }
  }, [userId, cancelImportMutation]);

  // Show toast when import completes or fails (reactive!)
  useEffect(() => {
    if (importData?.status === 'completed') {
      const processed = importData.contentProcessed;
      toast.success(
        `Import complete! ${processed?.conversations || 0} conversations imported (${processed?.totalItems || 0} items)`
      );
    } else if (importData?.status === 'failed') {
      toast.error(`Import failed: ${importData.error || 'Unknown error'}`);
    }
  }, [importData?.status]); // Only run when status changes

  // Calculate pipeline completion from related jobs
  const allJobsCompleted = relatedJobs && relatedJobs.length > 0 && 
    relatedJobs.every(job => job.status === 'completed');
  
  // Only mark as failed if the MAIN chatgpt_import job failed (not child jobs)
  const mainJobFailed = relatedJobs && 
    relatedJobs.some(job => job.type === 'chatgpt_import' && job.status === 'failed');
  
  // Determine true status based on jobs
  let trueStatus = importData?.status || 'unknown';
  if (mainJobFailed) {
    trueStatus = 'failed';
  } else if (trueStatus === 'processing' && allJobsCompleted) {
    trueStatus = 'completed';
  }

  // Convert Convex data to ImportStatus format
  const importStatus: ImportStatus | null = importData ? {
    job_id: importData.jobId || '',
    status: trueStatus as any,
    progress: importData.progress || '',
    progressDetails: importData.progressDetails,
    relatedJobs: relatedJobs || [],
    pipelineComplete: allJobsCompleted || false,
    error: importData.error,
    result: importData.contentProcessed ? {
      conversations_imported: importData.contentProcessed.conversations,
      total_conversations: importData.contentProcessed.conversations,
      total_messages: importData.contentProcessed.totalItems,
      error_count: 0
    } : undefined
  } : null;

  const hasActiveImport = importStatus && (importStatus.status === 'queued' || importStatus.status === 'running' || importStatus.status === 'processing');
  const checkingExisting = importData === undefined || hasImported === undefined;
  const hasAlreadyImported = hasImported?.hasImported || false;

  return {
    uploading,
    importStatus,
    checkingExisting,
    hasActiveImport,
    hasAlreadyImported,
    uploadFile,
    cancelImport,
  };
}

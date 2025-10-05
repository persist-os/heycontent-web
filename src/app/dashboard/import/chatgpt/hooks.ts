import { useState, useCallback } from 'react';
import { ChatGPTImportService } from './service';
import { ImportStatus } from './types';
import { toast } from 'sonner';

export function useChatGPTImport() {
  const [uploading, setUploading] = useState(false);
  const [importStatus, setImportStatus] = useState<ImportStatus | null>(null);
  const [polling, setPolling] = useState(false);

  const uploadFile = useCallback(async (file: File) => {
    // Validate file
    const validation = ChatGPTImportService.validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error);
      return null;
    }

    setUploading(true);
    
    try {
      const response = await ChatGPTImportService.uploadFile(file);
      
      if (response.success && response.import_id) {
        toast.success('Upload successful! Processing in background...');
        setImportStatus({
          job_id: response.import_id,
          status: 'queued',
          progress: 'Import queued, waiting for processing...'
        });
        
        return response.import_id;
      } else {
        throw new Error('Upload response missing job ID');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error instanceof Error ? error.message : 'Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  const startPolling = useCallback((jobId: string) => {
    if (polling) return;
    
    setPolling(true);
    
    const pollInterval = setInterval(async () => {
      try {
        const status = await ChatGPTImportService.checkStatus(jobId);
        setImportStatus(status);
        
        // Stop polling if completed or failed
        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(pollInterval);
          setPolling(false);
          
          if (status.status === 'completed') {
            const result = status.result;
            toast.success(
              `Import complete! ${result?.conversations_imported || 0} conversations imported (${result?.total_messages || 0} messages)`
            );
          } else {
            toast.error(`Import failed: ${status.error || 'Unknown error'}`);
          }
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 2000); // Poll every 2 seconds

    // Cleanup after 5 minutes (safety)
    setTimeout(() => {
      clearInterval(pollInterval);
      setPolling(false);
    }, 5 * 60 * 1000);
  }, [polling]);

  return {
    uploading,
    importStatus,
    uploadFile,
    startPolling,
  };
}


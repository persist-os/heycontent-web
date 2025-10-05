import React from 'react';
import { CheckCircle, XCircle, Loader2, X } from 'lucide-react';
import { ImportStatus } from '../chatGPTImportTypes';

interface StatusDisplayProps {
  status: ImportStatus;
  onCancel?: () => void;
}

export function StatusDisplay({ status, onCancel }: StatusDisplayProps) {
  const isActive = status.status === 'queued' || status.status === 'running' || status.status === 'processing';
  const progressDetails = status.progressDetails;
  
  // Debug: Log status to help troubleshoot
  console.log('[StatusDisplay] Current status:', status.status);
  console.log('[StatusDisplay] Related jobs:', status.relatedJobs);
  console.log('[StatusDisplay] Pipeline complete:', status.pipelineComplete);
  
  return (
    <div className={`border rounded-lg p-6 space-y-4 ${
      status.status === 'completed' ? 'border-green-500 bg-green-50 dark:bg-green-950/20' :
      status.status === 'failed' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' :
      status.status === 'processing' ? 'border-purple-500 bg-purple-50 dark:bg-purple-950/20' :
      'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
    }`}>
      <div className="flex items-center gap-3">
        {status.status === 'queued' && <Loader2 className="h-6 w-6 animate-spin text-blue-600" />}
        {status.status === 'running' && <Loader2 className="h-6 w-6 animate-spin text-blue-600" />}
        {status.status === 'processing' && <Loader2 className="h-6 w-6 animate-spin text-purple-600" />}
        {status.status === 'completed' && <CheckCircle className="h-6 w-6 text-green-600" />}
        {status.status === 'failed' && <XCircle className="h-6 w-6 text-red-600" />}
        
        <div className="flex-1">
          <h3 className="font-semibold capitalize">{status.status}</h3>
          <p className="text-sm text-muted-foreground">{status.progress}</p>
        </div>

        {/* Cancel button for active imports */}
        {isActive && onCancel && (
          <button
            onClick={onCancel}
            className="px-3 py-1.5 text-sm border border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md flex items-center gap-2 transition-colors"
          >
            <X className="h-4 w-4" />
            Cancel
          </button>
        )}
      </div>


      {/* Detailed Progress Stats - Show when running or processing */}
      {(status.status === 'running' || status.status === 'processing') && progressDetails && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            {progressDetails.totalConversations !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">Conversations</p>
                <p className="text-xl font-bold">
                  {progressDetails.processedConversations || 0} / {progressDetails.totalConversations}
                </p>
              </div>
            )}
            {progressDetails.totalBatches !== undefined && progressDetails.totalBatches > 1 && (
              <div>
                <p className="text-sm text-muted-foreground">Batches</p>
                <p className="text-xl font-bold">
                  {progressDetails.processedBatches || 0} / {progressDetails.totalBatches}
                </p>
              </div>
            )}
            {progressDetails.totalMessages !== undefined && (
              <div>
                <p className="text-sm text-muted-foreground">Messages</p>
                <p className="text-xl font-bold">
                  {progressDetails.processedMessages || 0} / {progressDetails.totalMessages}
                </p>
              </div>
            )}
            {progressDetails.currentBatch !== undefined && progressDetails.totalBatches && progressDetails.totalBatches > 1 && (
              <div>
                <p className="text-sm text-muted-foreground">Current Batch</p>
                <p className="text-xl font-bold">
                  #{progressDetails.currentBatch}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Related Jobs - Show for ALL statuses (running, processing, completed, failed) */}
      {status.relatedJobs && status.relatedJobs.length > 0 && (
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium">Background Jobs ({status.relatedJobs.length} total)</p>
            {status.pipelineComplete && (
              <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full">
                All Complete
              </span>
            )}
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {status.relatedJobs.map((job) => (
              <div
                key={job.jobId}
                className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {job.status === 'completed' && (
                    <CheckCircle className="h-3 w-3 text-green-600 flex-shrink-0" />
                  )}
                  {job.status === 'running' && (
                    <Loader2 className="h-3 w-3 animate-spin text-blue-600 flex-shrink-0" />
                  )}
                  {job.status === 'queued' && (
                    <div className="h-3 w-3 border-2 border-gray-300 rounded-full flex-shrink-0" />
                  )}
                  {job.status === 'failed' && (
                    <XCircle className="h-3 w-3 text-red-600 flex-shrink-0" />
                  )}
                  {job.status === 'cancelled' && (
                    <XCircle className="h-3 w-3 text-gray-400 flex-shrink-0" />
                  )}
                  <span className="font-medium truncate">{job.type}</span>
                </div>
                <span className={`capitalize ${
                  job.status === 'completed' ? 'text-green-600' :
                  job.status === 'failed' ? 'text-red-600' :
                  job.status === 'running' ? 'text-blue-600' :
                  job.status === 'cancelled' ? 'text-gray-500' :
                  'text-gray-500'
                }`}>
                  {job.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Results */}
      {status.status === 'completed' && status.result && (
        <div className="grid grid-cols-3 gap-4 pt-4 border-t">
          <div>
            <p className="text-2xl font-bold">{status.result.conversations_imported}</p>
            <p className="text-sm text-muted-foreground">Conversations</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{status.result.total_messages}</p>
            <p className="text-sm text-muted-foreground">Messages</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{status.result.error_count}</p>
            <p className="text-sm text-muted-foreground">Errors</p>
          </div>
        </div>
      )}

      {/* Error */}
      {status.status === 'failed' && status.error && (
        <div className="pt-4 border-t">
          <p className="text-sm text-red-600 dark:text-red-400">{status.error}</p>
        </div>
      )}
    </div>
  );
}


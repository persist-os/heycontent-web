import React from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { ImportStatus } from '../types';

interface StatusDisplayProps {
  status: ImportStatus;
}

export function StatusDisplay({ status }: StatusDisplayProps) {
  return (
    <div className={`border rounded-lg p-6 space-y-4 ${
      status.status === 'completed' ? 'border-green-500 bg-green-50 dark:bg-green-950/20' :
      status.status === 'failed' ? 'border-red-500 bg-red-50 dark:bg-red-950/20' :
      'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
    }`}>
      <div className="flex items-center gap-3">
        {status.status === 'queued' && <Loader2 className="h-6 w-6 animate-spin text-blue-600" />}
        {status.status === 'running' && <Loader2 className="h-6 w-6 animate-spin text-blue-600" />}
        {status.status === 'completed' && <CheckCircle className="h-6 w-6 text-green-600" />}
        {status.status === 'failed' && <XCircle className="h-6 w-6 text-red-600" />}
        
        <div className="flex-1">
          <h3 className="font-semibold capitalize">{status.status}</h3>
          <p className="text-sm text-muted-foreground">{status.progress}</p>
        </div>
      </div>

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


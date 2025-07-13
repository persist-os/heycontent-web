import React from 'react';
import { Skeleton } from './skeleton';
import { Loader2 } from 'lucide-react';

interface LargeDatasetLoadingProps {
  dataCount: number;
  operation: string;
  showProgress?: boolean;
  progress?: number;
}

export function LargeDatasetLoading({ 
  dataCount, 
  operation, 
  showProgress = false, 
  progress = 0 
}: LargeDatasetLoadingProps) {
  return (
    <div className="bg-card rounded-lg p-6 shadow space-y-4">
      <div className="flex items-center justify-center py-8">
        <div className="flex flex-col items-center space-y-4 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin" />
          <div className="text-center space-y-2">
            <p className="text-sm font-medium">
              Processing {dataCount.toLocaleString()} data points...
            </p>
            <p className="text-xs text-muted-foreground">
              {operation}
            </p>
            {showProgress && (
              <div className="w-full bg-muted rounded-full h-2 mt-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface PerformanceSkeletonProps {
  rows?: number;
  columns?: number;
}

export function PerformanceSkeleton({ rows = 3, columns = 2 }: PerformanceSkeletonProps) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="bg-card rounded-lg p-4 shadow">
          <div className="space-y-3">
            <Skeleton className="h-4 w-1/3" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: columns }).map((_, colIndex) => (
                <div key={colIndex} className="space-y-2">
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-6 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface ProcessingIndicatorProps {
  message: string;
  subMessage?: string;
  showSpinner?: boolean;
}

export function ProcessingIndicator({ 
  message, 
  subMessage, 
  showSpinner = true 
}: ProcessingIndicatorProps) {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center space-x-3 text-muted-foreground">
        {showSpinner && <Loader2 className="w-5 h-5 animate-spin" />}
        <div className="text-center">
          <p className="text-sm font-medium">{message}</p>
          {subMessage && (
            <p className="text-xs text-muted-foreground mt-1">{subMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
} 
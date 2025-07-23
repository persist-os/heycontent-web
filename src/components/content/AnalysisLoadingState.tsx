"use client";

import React from 'react';

interface AnalysisLoadingStateProps {
  loadingMessage: string;
}

export const AnalysisLoadingState: React.FC<AnalysisLoadingStateProps> = ({
  loadingMessage
}) => {
  return (
    <>
      {/* Loading Skeleton */}
      <div className="space-y-6">
        {[1, 2, 3, 4, 5].map((index) => (
          <div key={index} className="border border-dashed border-muted rounded-lg p-4 animate-pulse">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-5 h-5 bg-muted rounded"></div>
              <div className="h-5 bg-muted rounded w-32"></div>
            </div>
            <div className="space-y-2">
              <div className="h-4 bg-muted rounded w-full"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Loading Message */}
      <div className="flex flex-col items-center justify-center py-8 mt-6">
        <div className="relative w-32 h-2 mx-auto mb-4">
          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 to-pink-400 opacity-60 animate-pulse"></div>
        </div>
        <p className="text-muted-foreground text-center text-sm max-w-md">
          {loadingMessage}
        </p>
      </div>
    </>
  );
}; 
"use client";

import React from 'react';
import { Sparkles } from 'lucide-react';

export const AnalysisEmptyState: React.FC = () => {
  return (
    <div className="text-center py-12">
      <div className="max-w-md mx-auto space-y-4">
        <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
          <Sparkles className="w-8 h-8 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-lg font-medium mb-2">No Analysis Available</h3>
          <p className="text-sm text-muted-foreground">
            Generate AI insights to understand your video's performance and audience engagement.
          </p>
        </div>
      </div>
    </div>
  );
}; 
'use client';

import React, { memo } from 'react';
import { Card } from '@/components/ui/card';

const PieChartSkeleton = memo(() => (
  <Card className="p-6 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gray-200 animate-pulse">
          <div className="w-5 h-5 bg-gray-300 rounded"></div>
        </div>
        <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
      </div>
    </div>
    <div className="flex flex-col sm:flex-row items-center justify-between">
      <div className="w-28 h-28 sm:w-32 sm:h-32 mb-4 sm:mb-0 bg-gray-200 rounded-full animate-pulse"></div>
      <div className="flex-1 sm:ml-4 space-y-3 w-full sm:w-auto">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-gray-200 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
            </div>
            <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
          </div>
        ))}
      </div>
    </div>
  </Card>
));
PieChartSkeleton.displayName = 'PieChartSkeleton';

export default PieChartSkeleton; 
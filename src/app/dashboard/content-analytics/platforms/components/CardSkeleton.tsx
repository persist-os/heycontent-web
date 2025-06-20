'use client';

import React, { memo } from 'react';
import { Card } from '@/components/ui/card';

const CardSkeleton = memo(() => (
  <Card className="p-6 bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border-0 shadow-lg rounded-2xl">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-gray-200 animate-pulse">
          <div className="w-5 h-5 bg-gray-300 rounded"></div>
        </div>
        <div className="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
      </div>
    </div>
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
      </div>
      <div className="flex justify-between items-center">
        <div className="h-4 bg-gray-200 rounded w-12 animate-pulse"></div>
        <div className="h-6 bg-gray-200 rounded w-16 animate-pulse"></div>
      </div>
      <div className="flex justify-between items-center">
        <div className="h-4 bg-gray-200 rounded w-18 animate-pulse"></div>
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
      </div>
    </div>
  </Card>
));
CardSkeleton.displayName = 'CardSkeleton';

export default CardSkeleton; 
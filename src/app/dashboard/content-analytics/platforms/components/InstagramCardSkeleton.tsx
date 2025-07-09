'use client';

import React, { memo } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const InstagramCardSkeleton = memo(() => (
  <Card className="overflow-hidden transition-all duration-300 bg-white dark:bg-gray-800 border-2 border-transparent">
    {/* Image skeleton */}
    <div className="relative aspect-video bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden">
      <Skeleton className="w-full h-full" />
      
      {/* Media type badge skeleton */}
      <div className="absolute top-3 right-3">
        <Skeleton className="w-16 h-6 rounded-full" />
      </div>
      
      {/* Date badge skeleton */}
      <div className="absolute top-3 left-3">
        <Skeleton className="w-20 h-6 rounded-full" />
      </div>
    </div>
    
    <div className="p-6">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <div className="flex-1">
          <Skeleton className="h-5 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </div>
      
      {/* Metrics grid skeleton */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-4 w-12 mb-1" />
            <Skeleton className="h-3 w-8" />
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-4 w-12 mb-1" />
            <Skeleton className="h-3 w-8" />
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-4 w-12 mb-1" />
            <Skeleton className="h-3 w-8" />
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Skeleton className="w-8 h-8 rounded-lg" />
          <div className="flex-1">
            <Skeleton className="h-4 w-12 mb-1" />
            <Skeleton className="h-3 w-8" />
          </div>
        </div>
      </div>
      
      {/* Action buttons skeleton */}
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </div>
  </Card>
));

InstagramCardSkeleton.displayName = 'InstagramCardSkeleton';

export default InstagramCardSkeleton; 
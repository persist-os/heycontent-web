import React from 'react';
import { Skeleton } from './skeleton';
import { cn } from '@/lib/utils';

interface LoadingGridProps {
  items?: number;
  columns?: 2 | 3 | 4 | 6;
  className?: string;
  itemClassName?: string;
  showHeader?: boolean;
  headerClassName?: string;
}

interface LoadingCardProps {
  className?: string;
  showIcon?: boolean;
}

/**
 * LoadingCard - Skeleton for individual insight cards
 */
const LoadingCard: React.FC<LoadingCardProps> = ({ 
  className,
  showIcon = true 
}) => (
  <div className={cn(
    "bg-card/40 border border-border/50 rounded-lg p-4 h-64 flex flex-col animate-pulse",
    className
  )}>
    {/* Title skeleton */}
    <div className="mb-3">
      <Skeleton className="h-5 w-3/4 rounded" />
    </div>
    
    {/* Description skeleton - neat lines with proper spacing */}
    <div className="flex-1 space-y-2 mb-4 flex flex-col justify-start">
      <Skeleton className="h-3 w-full rounded" />
      <Skeleton className="h-3 w-11/12 rounded" />
      <Skeleton className="h-3 w-5/6 rounded" />
      <Skeleton className="h-3 w-4/5 rounded" />
      <Skeleton className="h-3 w-3/4 rounded" />
      <Skeleton className="h-3 w-2/3 rounded" />
    </div>

    {/* Icon skeleton */}
    {showIcon && (
      <div className="flex justify-end">
        <Skeleton className="w-6 h-6 rounded-md" />
      </div>
    )}
  </div>
);

/**
 * LoadingGrid - A reusable grid component for displaying loading states
 * 
 * Features:
 * - Configurable grid columns responsive to screen size
 * - Optional header skeleton
 * - Customizable number of items
 * - Consistent with design system
 */
export const LoadingGrid: React.FC<LoadingGridProps> = ({
  items = 4,
  columns = 4,
  className,
  itemClassName,
  showHeader = true,
  headerClassName
}) => {
  const getGridCols = () => {
    switch (columns) {
      case 2: return 'grid-cols-2';
      case 3: return 'grid-cols-1 lg:grid-cols-3';
      case 4: return 'grid-cols-2 lg:grid-cols-4';
      case 6: return 'grid-cols-2 md:grid-cols-3 lg:grid-cols-6';
      default: return 'grid-cols-2 lg:grid-cols-4';
    }
  };

  return (
    <div className={cn("h-full flex flex-col", className)}>
      <div className="flex-1 flex flex-col justify-center px-6">
        <div className="w-full max-w-6xl mx-auto">
          
          {/* Header skeleton */}
          {showHeader && (
            <div className={cn("flex items-center justify-between mb-6", headerClassName)}>
              <div className="flex-1">
                <Skeleton className="h-6 sm:h-7 lg:h-8 w-72 sm:w-80 lg:w-96 rounded-md" />
              </div>
              <div className="ml-4">
                <Skeleton className="h-9 w-20 sm:w-24 rounded-md" />
              </div>
            </div>
          )}

          {/* Cards grid skeleton */}
          <div className={cn("grid gap-4", getGridCols())}>
            {Array.from({ length: items }).map((_, index) => (
              <LoadingCard 
                key={`loading-card-${index}`}
                className={itemClassName}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingGrid;

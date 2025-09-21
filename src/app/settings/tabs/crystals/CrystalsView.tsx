import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { CrystalCard } from './CrystalCard';

interface CrystalsViewProps {
  recentCrystals?: any[];
}

export const CrystalsView: React.FC<CrystalsViewProps> = ({ recentCrystals }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-medium text-foreground">Knowledge Crystals</h3>
        <p className="text-muted-foreground">Consolidated patterns and behavioral insights</p>
      </div>

      {recentCrystals ? (
        <div className="space-y-6">
          {recentCrystals.map((crystal: any) => (
            <CrystalCard key={crystal._id} crystal={crystal} />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="border border-border/50 rounded-2xl p-6 space-y-4">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-6 w-20" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { CrystalStats } from './types';

interface StatsOverviewProps {
  crystalStats?: CrystalStats;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ crystalStats }) => {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h3 className="text-lg font-medium text-foreground">Your Knowledge</h3>
        <p className="text-muted-foreground">Patterns and insights discovered from your interactions</p>
      </div>

      {crystalStats ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <div className="text-3xl font-light tracking-tight text-foreground">
              {crystalStats.crystalsCount}
            </div>
            <div className="text-sm text-muted-foreground">Knowledge Crystals</div>
            <div className="text-xs text-muted-foreground">
              Consolidated patterns and insights
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="text-3xl font-light tracking-tight text-foreground">
              {crystalStats.shardsCount}
            </div>
            <div className="text-sm text-muted-foreground">Information Shards</div>
            <div className="text-xs text-muted-foreground">
              Raw insights and observations
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-3xl font-light tracking-tight text-foreground">
              {crystalStats.recentActivity.crystalsThisWeek + crystalStats.recentActivity.shardsThisWeek}
            </div>
            <div className="text-sm text-muted-foreground">This Week</div>
            <div className="text-xs text-muted-foreground">
              New discoveries made
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-12 w-16" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-32" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

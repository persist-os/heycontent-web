import React from 'react';
import { Button } from '@/components/ui/button';
import { ConfidenceDistribution } from './ConfidenceDistribution';
import { CrystalCard } from './CrystalCard';
import { ShardCard } from './ShardCard';
import { usePaginatedCrystals, usePaginatedShards } from './hooks';
import { CrystalStats, FormationStatus as FormationStatusType, FormationEligibility as FormationEligibilityType, ViewType } from './types';

interface OverviewViewProps {
  crystalStats?: CrystalStats;
  recentCrystals?: any[];
  formationStatus?: FormationStatusType;
  formationEligibility?: FormationEligibilityType;
  userId: string;
  onViewChange: (view: ViewType) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  crystalStats,
  recentCrystals,
  formationStatus,
  formationEligibility,
  userId,
  onViewChange
}) => {
  // Use paginated hooks to get fresh data for overview
  const { crystals: paginatedCrystals } = usePaginatedCrystals(userId, 8);
  const { shards: paginatedShards } = usePaginatedShards(userId, 12);
  
  // Use paginated data if available, fallback to props
  const displayCrystals = paginatedCrystals.length > 0 ? paginatedCrystals : (recentCrystals || []);
  const displayShards = paginatedShards.slice(0, 6);
  
  return (
    <div className="space-y-8">
      {/* Confidence Distribution */}
      {crystalStats && Object.keys(crystalStats.byConfidence).length > 0 && (
        <ConfidenceDistribution crystalStats={crystalStats} />
      )}

      {/* Recent Crystals */}
      {displayCrystals.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground">Recent Crystals</h4>
              <p className="text-sm text-muted-foreground font-light">Your latest consolidated insights</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => onViewChange('crystals')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
            </Button>
          </div>
          
          <div className="space-y-3">
            {displayCrystals.slice(0, 5).map((crystal: any) => (
              <CrystalCard key={crystal._id} crystal={crystal} isCompact />
            ))}
          </div>
        </div>
      )}

      {/* Recent Shards */}
      {displayShards.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-foreground">Recent Shards</h4>
              <p className="text-sm text-muted-foreground font-light">Your latest observations</p>
            </div>
            <Button
              variant="ghost"
              onClick={() => onViewChange('shards')}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayShards.map((shard: any) => (
              <ShardCard key={shard._id} shard={shard} />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {displayCrystals.length === 0 && displayShards.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-muted-foreground/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No crystals yet</h3>
          <p className="text-muted-foreground font-light max-w-md mx-auto">
            Start conversations or create notes. The system will analyze your content and discover patterns.
          </p>
        </div>
      )}
    </div>
  );
};

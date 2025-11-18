import React from 'react';
import { Button } from '@/components/ui/button';
import { StatsOverview } from './StatsOverview';
import { ConfidenceDistribution } from './ConfidenceDistribution';
import { FormationStatus } from './FormationStatus';
import { FormationEligibility } from './FormationEligibility';
import { FormationActions } from './FormationActions';
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
  const { crystals: paginatedCrystals } = usePaginatedCrystals(userId, 10);
  const { shards: paginatedShards } = usePaginatedShards(userId, 15);
  
  // Use paginated data if available, fallback to props
  const displayCrystals = paginatedCrystals.length > 0 ? paginatedCrystals : (recentCrystals || []);
  const displayShards = paginatedShards.slice(0, 6); // Show top 6 shards in overview
  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      <StatsOverview crystalStats={crystalStats} />

      {/* Crystal Formation */}
      <div className="space-y-4">
        <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
        
        <div className="space-y-4">
          <div className="space-y-1">
            <h4 className="font-medium text-foreground">Crystal Formation</h4>
            <p className="text-sm text-muted-foreground">Trigger crystal generation and system operations</p>
          </div>

          {/* Formation Status */}
          <FormationStatus formationStatus={formationStatus} />

          {/* Eligibility Status */}
          <FormationEligibility formationEligibility={formationEligibility} />
          
          {/* Formation Actions */}
          <FormationActions 
            userId={userId}
            formationStatus={formationStatus}
            formationEligibility={formationEligibility}
          />
        </div>
      </div>

      {/* Confidence Distribution */}
      {crystalStats && Object.keys(crystalStats.byConfidence).length > 0 && (
        <>
          <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
          <ConfidenceDistribution crystalStats={crystalStats} />
        </>
      )}

      {/* Recent Activity */}
      {displayShards.length > 0 && (
        <>
          <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
          
          <div className="space-y-6">
            {/* Recent Crystals - Deprecated */}
            {/* Crystals are deprecated, showing shards only */}

            {/* Recent Shards */}
            {displayShards.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h4 className="font-medium text-foreground">Recent Shards</h4>
                    <p className="text-sm text-muted-foreground">Latest raw observations</p>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={() => onViewChange('shards')}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
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
          </div>
        </>
      )}
    </div>
  );
};

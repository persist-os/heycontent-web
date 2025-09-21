import React from 'react';
import { Button } from '@/components/ui/button';
import { StatsOverview } from './StatsOverview';
import { ConfidenceDistribution } from './ConfidenceDistribution';
import { FormationStatus } from './FormationStatus';
import { FormationEligibility } from './FormationEligibility';
import { FormationActions } from './FormationActions';
import { CrystalCard } from './CrystalCard';
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
      {recentCrystals && recentCrystals.length > 0 && (
        <>
          <div className="h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h4 className="font-medium text-foreground">Recent Crystals</h4>
                <p className="text-sm text-muted-foreground">Latest consolidated insights</p>
              </div>
              <Button
                variant="ghost"
                onClick={() => onViewChange('crystals')}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                View all
              </Button>
            </div>
            
            <div className="space-y-3">
              {recentCrystals.slice(0, 3).map((crystal: any) => (
                <CrystalCard key={crystal._id} crystal={crystal} isCompact />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

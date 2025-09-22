import React, { useState } from 'react';
import { 
  useAuth, 
  useCrystalData, 
  useFormationData,
  InsightsNavigation,
  OverviewView,
  CrystalsView,
  ShardsView,
  InsightsSkeleton,
  CrystalSystemExplanation,
  ViewType
} from './crystals';

export const InsightsTab = () => {
  const [activeView, setActiveView] = useState<ViewType>('overview');
  const userId = useAuth();
  const { crystalStats, recentCrystals, recentShards } = useCrystalData(userId);
  const { formationStatus, formationEligibility } = useFormationData(userId);

  if (!userId) {
    return <InsightsSkeleton />;
  }

  return (
    <div className="space-y-8">
      <CrystalSystemExplanation />
      
      <InsightsNavigation 
        activeView={activeView} 
        onViewChange={setActiveView} 
      />

      {activeView === 'overview' && (
        <OverviewView
          crystalStats={crystalStats}
          recentCrystals={recentCrystals}
          formationStatus={formationStatus}
          formationEligibility={formationEligibility}
          userId={userId}
          onViewChange={setActiveView}
        />
      )}

      {activeView === 'crystals' && (
        <CrystalsView recentCrystals={recentCrystals} />
      )}

      {activeView === 'shards' && (
        <ShardsView recentShards={recentShards} />
      )}
    </div>
  );
};

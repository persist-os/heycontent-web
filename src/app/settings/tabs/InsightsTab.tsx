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
import { toast } from 'sonner';
import { getApiKey } from '@/app/lib/api-helpers';

export const InsightsTab = () => {
  const [activeView, setActiveView] = useState<ViewType>('overview');
  const [isFormingCrystals, setIsFormingCrystals] = useState(false);
  const userId = useAuth();
  const { crystalStats, recentCrystals, recentShards } = useCrystalData(userId);
  const { formationStatus, formationEligibility } = useFormationData(userId);
  
  const handleManualCrystalFormation = async () => {
    if (!userId || isFormingCrystals) return;

    setIsFormingCrystals(true);
    try {
      // Get API key for authentication
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Call the crystal formation API route
      const response = await fetch('/api/crystal-formation/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          force: false // Respect normal eligibility rules
          // Note: user_id is extracted from the Authorization header by the backend
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.triggered) {
        toast.success(
          result.message || 'Crystal formation completed successfully!',
          { duration: 5000 }
        );
        // No page refresh - let Convex queries update the UI reactively
      } else if (result.success && !result.triggered) {
        toast.info(
          result.message || 'Crystal formation not triggered - check eligibility requirements',
          { duration: 4000 }
        );
      } else {
        toast.error(
          result.message || result.error || 'Crystal formation failed',
          { duration: 5000 }
        );
      }
      
    } catch (error) {
      console.error('💎 [MANUAL FORMATION] Error:', error);
      toast.error(
        `Crystal formation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { duration: 5000 }
      );
    } finally {
      setIsFormingCrystals(false);
    }
  };

  if (!userId) {
    return <InsightsSkeleton />;
  }

  return (
    <div className="space-y-8">
      <CrystalSystemExplanation />
      
      {/* Crystal Actions */}
      <div className="border rounded-lg p-4 space-y-4">
        <h3 className="font-medium text-gray-900 dark:text-gray-100">
          Crystal Formation
        </h3>
        
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Create new crystals from existing shards
          </p>
          <button
            onClick={handleManualCrystalFormation}
            disabled={isFormingCrystals}
            className={`px-3 py-2 text-sm rounded border ${
              isFormingCrystals
                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed border-gray-200 dark:border-gray-700'
                : 'bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600'
            }`}
          >
            {isFormingCrystals ? 'Forming...' : 'Form Crystals'}
          </button>
        </div>
        
        {/* Debug Info */}
        <details className="text-xs text-gray-500 dark:text-gray-500">
          <summary className="cursor-pointer">Debug Info</summary>
          <div className="mt-2 space-y-1 bg-gray-50 dark:bg-gray-800 p-2 rounded text-xs">
            <div>Shards: {formationEligibility?.shardCount || 0}</div>
            <div>Crystals: {crystalStats?.crystalsCount || 0}</div>
            <div>Eligible: {formationEligibility?.eligible ? 'Yes' : 'No'}</div>
          </div>
        </details>
      </div>
      
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

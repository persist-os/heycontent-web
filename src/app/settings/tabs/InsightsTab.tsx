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
  const [isMigrating, setIsMigrating] = useState(false);
  const [isFormingCrystals, setIsFormingCrystals] = useState(false);
  const userId = useAuth();
  const { crystalStats, recentCrystals, recentShards } = useCrystalData(userId);
  const { formationStatus, formationEligibility } = useFormationData(userId);
  
  const handleManualMigration = async () => {
    if (!userId || isMigrating) return;

    setIsMigrating(true);
    try {
      console.log('🔮 [MANUAL MIGRATION] Starting simplified migration for user:', userId);
      
      // Get API key for authentication
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      // Call the simplified backend migration endpoint
      const response = await fetch('/api/migration/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({}),
      });

      console.log('🔮 [MANUAL MIGRATION] API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log('🔮 [MANUAL MIGRATION] Migration result:', result);
      
      if (result.success) {
        toast.success(
          `Migration completed! Processed ${result.items_added} items, created ${result.shards_created} shards and ${result.crystals_created} crystals`,
          { duration: 5000 }
        );
      } else {
        toast.error(
          `Migration failed: ${result.error || result.message || 'Unknown error'}`,
          { duration: 5000 }
        );
      }
      
    } catch (error) {
      console.error('🔮 [MANUAL MIGRATION] Error:', error);
      toast.error(
        `Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { duration: 5000 }
      );
    } finally {
      setIsMigrating(false);
    }
  };

  const handleManualCrystalFormation = async () => {
    if (!userId || isFormingCrystals) return;

    setIsFormingCrystals(true);
    try {
      console.log('💎 [MANUAL FORMATION] Starting manual crystal formation for user:', userId);
      
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

      console.log('💎 [MANUAL FORMATION] API response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      console.log('💎 [MANUAL FORMATION] Formation result:', result);
      
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
          Crystal Actions
        </h3>
        
        <div className="space-y-3">
          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Process recent content into crystals and shards
            </p>
            <button
              onClick={handleManualMigration}
              disabled={isMigrating}
              className={`px-3 py-2 text-sm rounded border ${
                isMigrating
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
              }`}
            >
              {isMigrating ? 'Processing...' : 'Run Migration'}
            </button>
          </div>

          <div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Create new crystals from existing shards
            </p>
            <button
              onClick={handleManualCrystalFormation}
              disabled={isFormingCrystals}
              className={`px-3 py-2 text-sm rounded border ${
                isFormingCrystals
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white hover:bg-gray-50 text-gray-700 border-gray-300'
              }`}
            >
              {isFormingCrystals ? 'Forming...' : 'Form Crystals'}
            </button>
          </div>
        </div>
        
        {/* Debug Info */}
        <details className="text-xs text-gray-500">
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

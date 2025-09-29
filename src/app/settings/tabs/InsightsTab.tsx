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
import { useMutation } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { toast } from 'sonner';

export const InsightsTab = () => {
  const [activeView, setActiveView] = useState<ViewType>('overview');
  const [isMigrating, setIsMigrating] = useState(false);
  const userId = useAuth();
  const { crystalStats, recentCrystals, recentShards } = useCrystalData(userId);
  const { formationStatus, formationEligibility } = useFormationData(userId);
  
  // Migration trigger function
  const triggerMigration = useMutation(api.crystalMigration.triggerCrystalMigration);

  const handleManualMigration = async () => {
    if (!userId || isMigrating) return;

    setIsMigrating(true);
    try {
      console.log('🔮 [MANUAL MIGRATION] Triggering crystal migration for user:', userId);
      
      const result = await triggerMigration({ userId });
      
      console.log('🔮 [MANUAL MIGRATION] Migration result:', result);
      
      if (result.success && !result.skipped) {
        toast.success(
          `Migration completed! Created ${result.crystalSystemResults?.shardsCreated || 0} shards and ${result.crystalSystemResults?.crystalsCreated || 0} crystals`,
          { duration: 5000 }
        );
      } else if (result.skipped) {
        toast.info(
          `Migration skipped: ${result.reason}`,
          { duration: 3000 }
        );
      } else {
        toast.error(
          `Migration failed: ${result.error || 'Unknown error'}`,
          { duration: 5000 }
        );
      }
      
      // Refresh the page to show new data
      window.location.reload();
      
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

  if (!userId) {
    return <InsightsSkeleton />;
  }

  return (
    <div className="space-y-8">
      <CrystalSystemExplanation />
      
      {/* Migration Control Section */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Crystal Migration
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Generate crystals and shards from your recent content (last 14 days). This is automatically done on login, but you can trigger it manually here.
        </p>
        <button
          onClick={handleManualMigration}
          disabled={isMigrating}
          className={`
            px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200
            ${isMigrating 
              ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed' 
              : 'bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white hover:shadow-lg'
            }
          `}
        >
          {isMigrating ? (
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" strokeDasharray="32" strokeDashoffset="32">
                  <animate attributeName="stroke-dashoffset" values="32;0" dur="1s" repeatCount="indefinite"/>
                </circle>
              </svg>
              Processing Migration...
            </span>
          ) : (
            '🔮 Trigger Crystal Migration'
          )}
        </button>
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

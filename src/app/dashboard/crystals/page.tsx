'use client'

/**
 * Crystals Page
 * 
 * Main view for crystal intelligence - insights crystallized from your content.
 * Shows crystals, shards, formation status, and system tools.
 */

import React, { useState } from 'react';
import { 
  useAuth, 
  useCrystalData, 
  useFormationData,
  useMigrationStatus,
  useFormationRuns,
  InsightsNavigation,
  OverviewView,
  CrystalsView,
  ShardsView,
  StardustView,
  StarsView,
  InsightsSkeleton,
  CrystalSystemExplanation,
  SystemDebugInfo,
  DeletionTools,
  ViewType
} from './components';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';
import { getApiKey } from '@/app/lib/api-helpers';
import { ChevronDown, ChevronUp, Activity } from 'lucide-react';

export default function CrystalsPage() {
  const [activeView, setActiveView] = useState<ViewType>('overview');
  const [isMigrating, setIsMigrating] = useState(false);
  const [isFormingCrystals, setIsFormingCrystals] = useState(false);
  const [showMigrationTools, setShowMigrationTools] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  
  const userId = useAuth();
  const { crystalStats, recentCrystals, recentShards } = useCrystalData(userId);
  const { formationStatus, formationEligibility } = useFormationData(userId);
  const { needsMigration, attempts, contentProcessed, isLoading: isMigrationStatusLoading } = useMigrationStatus(userId);
  const { formationRuns } = useFormationRuns(userId, 5);
  const markMigrationComplete = useMutation(api.crystalMigration.markMigrationComplete);
  
  const handleManualMigration = async () => {
    if (!userId || isMigrating || !needsMigration) return;

    setIsMigrating(true);
    try {
      console.log('🔮 [MANUAL MIGRATION] Starting simplified migration for user:', userId);
      
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('Authentication required. Please log in again.');
      }
      
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
        try {
          await markMigrationComplete({
            userId,
            contentProcessed: {
              conversations: 0,
              notes: 0,
              totalItems: result.items_added || 0
            }
          });
          console.log('🔮 [MANUAL MIGRATION] Marked migration as complete in tracking');
        } catch (trackingError) {
          console.error('🔮 [MANUAL MIGRATION] Failed to mark as complete:', trackingError);
        }
        
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
      
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('Authentication required. Please log in again.');
      }
      
      const response = await fetch('/api/crystal-formation/manual', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          force: false
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-light tracking-tight text-foreground">Cosmic Intelligence</h1>
            <p className="text-muted-foreground font-light">Dual-species organisms: stars for what you do, crystals for who you are</p>
          </div>

          {/* Quick Stats */}
          {crystalStats && (
            <div className="hidden sm:flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-light text-foreground">{crystalStats.crystalsCount}</div>
                <div className="text-xs text-muted-foreground">Crystals</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-light text-foreground">{crystalStats.shardsCount}</div>
                <div className="text-xs text-muted-foreground">Shards</div>
              </div>
              <div className="w-px h-8 bg-border/40" />
              <div className="text-center px-3 py-2 bg-primary/5 rounded-xl border border-primary/10">
                <div className="text-2xl font-medium text-primary">
                  {crystalStats.recentActivity.crystalsThisWeek + crystalStats.recentActivity.shardsThisWeek}
                </div>
                <div className="text-xs text-muted-foreground">This Week</div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Stats */}
        {crystalStats && (
          <div className="sm:hidden grid grid-cols-3 gap-3">
            <div className="bg-muted/10 rounded-xl p-3 text-center">
              <div className="text-xl font-light text-foreground">{crystalStats.crystalsCount}</div>
              <div className="text-xs text-muted-foreground">Crystals</div>
            </div>
            <div className="bg-muted/10 rounded-xl p-3 text-center">
              <div className="text-xl font-light text-foreground">{crystalStats.shardsCount}</div>
              <div className="text-xs text-muted-foreground">Shards</div>
            </div>
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 text-center">
              <div className="text-xl font-medium text-primary">
                {crystalStats.recentActivity.crystalsThisWeek + crystalStats.recentActivity.shardsThisWeek}
              </div>
              <div className="text-xs text-muted-foreground">This Week</div>
            </div>
          </div>
        )}

        <CrystalSystemExplanation />
        
        {/* Navigation */}
        <InsightsNavigation 
          activeView={activeView} 
          onViewChange={setActiveView} 
        />

        {/* Main Content */}
        <div className="min-h-[400px]">
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

          {activeView === 'stars' && (
            <StarsView userId={userId} />
          )}

          {activeView === 'crystals' && (
            <CrystalsView recentCrystals={recentCrystals} />
          )}

          {activeView === 'shards' && (
            <ShardsView recentShards={recentShards} />
          )}

          {activeView === 'stardust' && (
            <StardustView />
          )}
        </div>

        {/* System Tools - Collapsible */}
        <div className="space-y-3 pt-8 border-t border-border/20">
          
          {/* Migration Tools */}
          <div className="border border-border/40 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowMigrationTools(!showMigrationTools)}
              className="w-full px-6 py-4 flex items-center justify-between bg-muted/10 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <div className="font-medium text-foreground">Migration & Formation</div>
                  <div className="text-sm text-muted-foreground font-light">
                    {!needsMigration ? 'Migration complete' : 'Migration available'} • Form new crystals
                  </div>
                </div>
              </div>
              {showMigrationTools ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>
            
            {showMigrationTools && (
              <div className="px-6 py-4 space-y-4 bg-background">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm text-foreground">Content Migration</h4>
                      {!needsMigration && contentProcessed && (
                        <div className="text-xs text-muted-foreground">
                          {contentProcessed.totalItems} items processed
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 font-light">
                      {!needsMigration 
                        ? 'Your content has been migrated to the crystal system' 
                        : 'Process your existing content into crystals and shards'}
                    </p>
                    <button
                      onClick={handleManualMigration}
                      disabled={isMigrating || !needsMigration || isMigrationStatusLoading}
                      className={`px-4 py-2 text-sm rounded-xl border transition-all ${
                        (isMigrating || !needsMigration || isMigrationStatusLoading)
                          ? 'bg-muted/20 text-muted-foreground cursor-not-allowed border-border/20'
                          : 'bg-background hover:bg-muted/30 text-foreground border-border/40'
                      }`}
                    >
                      {isMigrating ? 'Processing...' : !needsMigration ? 'Already Migrated' : 'Run Migration'}
                    </button>
                    {attempts > 0 && needsMigration && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Previous attempts: {attempts}
                      </p>
                    )}
                  </div>

                  <div className="pt-3 border-t border-border/20">
                    <h4 className="font-medium text-sm text-foreground mb-2">Crystal Formation</h4>
                    <p className="text-sm text-muted-foreground mb-3 font-light">
                      Create new crystals from your existing shards
                    </p>
                    <button
                      onClick={handleManualCrystalFormation}
                      disabled={isFormingCrystals}
                      className={`px-4 py-2 text-sm rounded-xl border transition-all ${
                        isFormingCrystals
                          ? 'bg-muted/20 text-muted-foreground cursor-not-allowed border-border/20'
                          : 'bg-background hover:bg-muted/30 text-foreground border-border/40'
                      }`}
                    >
                      {isFormingCrystals ? 'Forming...' : 'Form Crystals'}
                    </button>
                  </div>

                  {/* Data Management */}
                  {userId && (
                    <div className="pt-4 border-t border-border/20">
                      <DeletionTools userId={userId} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* System Debug Information */}
          <SystemDebugInfo
            crystalStats={crystalStats}
            formationStatus={formationStatus}
            formationEligibility={formationEligibility}
            needsMigration={needsMigration}
            contentProcessed={contentProcessed}
            migrationAttempts={attempts}
            formationRuns={formationRuns}
          />
        </div>
      </div>
    </div>
  );
}
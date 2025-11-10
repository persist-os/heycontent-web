'use client'

/**
 * Crystals Page
 * 
 * Main view for cosmic intelligence - cognitive fields and insights from your content.
 * Shows cognitive fields, shards, formation status, and system tools.
 */

import React, { useState } from 'react';
import { T } from '@/components/translation';
import { 
  useCrystalData, 
  useFormationData,
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
import { toast } from 'sonner';
import { getApiKey, getCurrentUserId } from '@/app/lib/api-helpers';
import { Activity } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';

export default function CrystalsPage() {
  const [activeView, setActiveView] = useState<ViewType>('overview');
  const [isFormingCrystals, setIsFormingCrystals] = useState(false);
  const [showFormationTools, setShowFormationTools] = useState(false);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  
  // Get user ID using centralized helper
  React.useEffect(() => {
    const fetchUserId = async () => {
      try {
        const id = await getCurrentUserId();
        setUserId(id);
      } catch (error) {
        console.error('Failed to get user ID:', error);
        setUserId(undefined);
      }
    };
    fetchUserId();
  }, []);
  
  const { crystalStats, recentCrystals, recentShards } = useCrystalData(userId);
  const { formationStatus, formationEligibility } = useFormationData(userId);
  const { formationRuns } = useFormationRuns(userId, 5);
  
  // Cognitive field queries
  const cognitiveFields = useQuery(
    api.cognitiveQueries.getAllCognitiveFields,
    userId ? { userId, limit: 20 } : "skip"
  );
  const cognitiveFieldsCount = useQuery(
    api.cognitiveQueries.countCognitiveFields,
    userId ? { userId } : "skip"
  );
  
  const handleManualCrystalFormation = async () => {
    if (!userId || isFormingCrystals) return;

    setIsFormingCrystals(true);
    try {
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

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.triggered) {
        toast.success(
          result.message || <T context="toast.dashboard.crystals.formation.success">Cognitive field formation completed successfully!</T>,
          { duration: 5000 }
        );
      } else if (result.success && !result.triggered) {
        toast.info(
          result.message || <T context="toast.dashboard.crystals.formation.not_triggered">Cognitive field formation not triggered - check eligibility requirements</T>,
          { duration: 4000 }
        );
      } else {
        toast.error(
          result.message || result.error || <T context="toast.dashboard.crystals.formation.error">Cognitive field formation failed</T>,
          { duration: 5000 }
        );
      }
      
    } catch (error) {
      console.error('💎 [MANUAL FORMATION] Error:', error);
      toast.error(
        <T context="toast.dashboard.crystals.formation.error.detailed">Cognitive field formation failed: {error instanceof Error ? error.message : 'Unknown error'}</T>,
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
            <h1 className="text-3xl font-light tracking-tight text-foreground">
              <T context="crystals.page.title">Cosmic Intelligence</T>
            </h1>
            <p className="text-muted-foreground font-light">
              <T context="crystals.page.subtitle">Dual-species organisms: stars for what you do, cognitive fields for who you are</T>
            </p>
          </div>

          {/* Quick Stats */}
          {crystalStats && (
            <div className="hidden sm:flex items-center gap-6">
              <div className="text-center">
                <div className="text-2xl font-light text-foreground">{cognitiveFieldsCount || 0}</div>
                <div className="text-xs text-muted-foreground"><T context="crystals.stats.cognitive_fields">Cognitive Fields</T></div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-light text-foreground">{crystalStats.shardsCount}</div>
                <div className="text-xs text-muted-foreground"><T context="crystals.stats.shards">Shards</T></div>
              </div>
              <div className="w-px h-8 bg-border/40" />
              <div className="text-center px-3 py-2 bg-primary/5 rounded-xl border border-primary/10">
                <div className="text-2xl font-medium text-primary">
                  {(cognitiveFieldsCount || 0) + crystalStats.recentActivity.shardsThisWeek}
                </div>
                <div className="text-xs text-muted-foreground"><T context="crystals.stats.this_week">This Week</T></div>
              </div>
            </div>
          )}
        </div>

        {/* Mobile Stats */}
        {crystalStats && (
          <div className="sm:hidden grid grid-cols-3 gap-3">
            <div className="bg-muted/10 rounded-xl p-3 text-center">
              <div className="text-xl font-light text-foreground">{cognitiveFieldsCount || 0}</div>
              <div className="text-xs text-muted-foreground"><T context="crystals.stats.cognitive_fields">Cognitive Fields</T></div>
            </div>
            <div className="bg-muted/10 rounded-xl p-3 text-center">
              <div className="text-xl font-light text-foreground">{crystalStats.shardsCount}</div>
              <div className="text-xs text-muted-foreground"><T context="crystals.stats.shards">Shards</T></div>
            </div>
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-3 text-center">
              <div className="text-xl font-medium text-primary">
                {(cognitiveFieldsCount || 0) + crystalStats.recentActivity.shardsThisWeek}
              </div>
              <div className="text-xs text-muted-foreground"><T context="crystals.stats.this_week">This Week</T></div>
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
            <CrystalsView recentCrystals={cognitiveFields || []} />
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
          
          {/* Formation Tools */}
          <div className="border border-border/40 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowFormationTools(!showFormationTools)}
              className="w-full px-6 py-4 flex items-center justify-between bg-muted/10 hover:bg-muted/20 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-muted-foreground" />
                <div className="text-left">
                  <div className="font-medium text-foreground"><T context="crystals.tools.formation">Cognitive Field Formation</T></div>
                  <div className="text-sm text-muted-foreground font-light">
                    <T context="crystals.tools.form_new">Form new cognitive fields from shards</T>
                  </div>
                </div>
              </div>
            </button>
            
            {showFormationTools && (
              <div className="px-6 py-4 space-y-4 bg-background">
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm text-foreground mb-2"><T context="crystals.formation.title">Cognitive Field Formation</T></h4>
                    <p className="text-sm text-muted-foreground mb-3 font-light">
                      <T context="crystals.formation.description">Create new cognitive fields from your existing shards</T>
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
                      {isFormingCrystals ? 
                        <T context="crystals.formation.forming">Forming...</T> : 
                        <T context="crystals.formation.form_crystals">Form Cognitive Fields</T>
                      }
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
            formationRuns={formationRuns}
          />
        </div>
      </div>
    </div>
  );
}
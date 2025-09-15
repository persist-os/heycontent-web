import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useConvex } from 'convex/react';
import { motion } from "framer-motion";
import { Info } from "lucide-react";
import { api } from '@/convex/_generated/api';
import { usePersonaCrystallization } from '@/hooks/usePersonaCrystallization';

interface PersonaCrystallizationContextType {
  // Data
  recentTraces: any[];
  crystallizedInsights: any[];
  isLoading: boolean;
  
  // Processing status
  isProcessing: boolean;
  lastUpdate: number | null;
  
  // Profile info
  profileCompleteness: number;
  overallConfidence: number;
  totalTraces: number;
  totalInsights: number;
  
  // Actions
  refreshData: () => void;
  
  // Development info
  debugInfo?: {
    triggerCount: number;
    processingStatus: string;
    userId?: string;
  };
}

const PersonaCrystallizationContext = createContext<PersonaCrystallizationContextType | undefined>(undefined);

interface PersonaCrystallizationProviderProps {
  userId?: string;
  children: React.ReactNode;
}

/**
 * Provider that makes persona crystallization data available throughout the app
 * This connects the crystallization system to UI components
 */
export function PersonaCrystallizationProvider({ 
  userId, 
  children 
}: PersonaCrystallizationProviderProps) {
  const convex = useConvex();
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  
  // Get comprehensive persona profile
  const personaProfile = useQuery(
    api.personaCrystallizationQueries.getUserPersonaProfile,
    userId ? { 
      user_id: userId, 
      include_recent_traces: true,
      trace_limit: 20,
      insight_limit: 10,
      _refresh_key: lastRefresh
    } : "skip"
  );

  // Get unprocessed triggers for debug info
  const triggers = useQuery(
    api.personaCrystallizationQueries.getUnprocessedTriggers,
    userId ? { 
      user_id: userId, 
      limit: 5,
      _refresh_key: lastRefresh
    } : "skip"
  );

  // Hook for processing status
  const { state: processingState } = usePersonaCrystallization(userId);

  const refreshData = () => {
    console.log('🔄 [PERSONA DEBUG] Manual refresh triggered');
    setLastRefresh(Date.now());
  };

  // Auto-refresh data periodically
  useEffect(() => {
    if (!userId) return;

    console.log('🔄 [PERSONA DEBUG] Setting up refresh interval for user:', userId);
    
    const interval = setInterval(() => {
      const now = Date.now();
      console.log('🔄 [PERSONA DEBUG] Auto-refreshing data at:', new Date(now).toISOString());
      setLastRefresh(now);
    }, 10000); // Refresh every 10 seconds for debugging

    return () => {
      console.log('🛑 [PERSONA DEBUG] Clearing refresh interval');
      clearInterval(interval);
    };
  }, [userId]);

  // Debug logging for data changes
  useEffect(() => {
    if (personaProfile) {
      console.log('📊 [PERSONA DEBUG] PersonaProfile updated:', {
        totalTraces: personaProfile.summary?.total_traces || 0,
        totalInsights: personaProfile.summary?.total_insights || 0,
        recentTraces: personaProfile.recent_traces?.length || 0,
        lastUpdated: personaProfile.last_updated ? new Date(personaProfile.last_updated).toISOString() : 'never'
      });
    }
  }, [personaProfile]);

  useEffect(() => {
    if (triggers) {
      console.log('🎯 [PERSONA DEBUG] Triggers updated:', {
        count: triggers.length,
        triggers: triggers.map(t => ({ id: t._id, type: t.trigger_type, processed: t.processed }))
      });
    }
  }, [triggers]);

  const contextValue: PersonaCrystallizationContextType = {
    // Data
    recentTraces: personaProfile?.recent_traces || [],
    crystallizedInsights: personaProfile?.crystallized_insights || [],
    isLoading: personaProfile === undefined,
    
    // Processing status
    isProcessing: processingState.isExtracting || processingState.isCrystallizing,
    lastUpdate: personaProfile?.last_updated || null,
    
    // Profile info
    profileCompleteness: personaProfile?.profile_completeness || 0,
    overallConfidence: personaProfile?.confidence_scores?.overall || 0,
    totalTraces: personaProfile?.summary?.total_traces || 0,
    totalInsights: personaProfile?.summary?.total_insights || 0,
    
    // Actions
    refreshData,
    
    // Development info
    debugInfo: process.env.NODE_ENV === 'development' ? {
      triggerCount: triggers?.length || 0,
      processingStatus: processingState.isExtracting ? 'extracting' :
                      processingState.isCrystallizing ? 'crystallizing' : 'idle',
      userId: userId
    } : undefined
  };

  return (
    <PersonaCrystallizationContext.Provider value={contextValue}>
      {children}
    </PersonaCrystallizationContext.Provider>
  );
}

/**
 * Hook to access persona crystallization data in components
 */
export function usePersonaCrystallizationData() {
  const context = useContext(PersonaCrystallizationContext);
  if (context === undefined) {
    throw new Error('usePersonaCrystallizationData must be used within PersonaCrystallizationProvider');
  }
  return context;
}

/**
 * Persona Crystallization Status Widget
 * Shows processing status and basic stats
 */
export function PersonaCrystallizationStatus({ className }: { className?: string }) {
  const data = usePersonaCrystallizationData();
  
  if (data.isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-muted rounded w-24"></div>
      </div>
    );
  }

  return (
    <div className={`text-sm text-muted-foreground ${className}`}>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${
          data.isProcessing ? 'bg-yellow-500 animate-pulse' : 
          data.totalTraces > 0 ? 'bg-green-500' : 'bg-gray-400'
        }`} />
        <span>
          {data.totalTraces} trace{data.totalTraces !== 1 ? 's' : ''}, {data.totalInsights} insight{data.totalInsights !== 1 ? 's' : ''}
        </span>
        {data.isProcessing && <span className="text-yellow-600">(processing...)</span>}
      </div>
      {data.profileCompleteness > 0 && (
        <div className="mt-1 text-xs">
          Profile: {Math.round(data.profileCompleteness * 100)}% complete
        </div>
      )}
    </div>
  );
}

/**
 * Development Debug Panel
 * Shows detailed crystallization status in development
 */
export function PersonaCrystallizationDebugPanel() {
  const data = usePersonaCrystallizationData();
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Always show in development mode, even if debugInfo is not ready yet
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  console.log('🎛️ [DEBUG PANEL] Rendering with data:', {
    hasData: !!data,
    hasDebugInfo: !!data?.debugInfo,
    totalTraces: data?.totalTraces || 0,
    totalInsights: data?.totalInsights || 0,
    isLoading: data?.isLoading
  });

  return (
    <motion.div
      drag
      dragMomentum={false}
      whileTap={{ scale: 0.95, cursor: "grabbing" }}
      className="fixed top-4 right-4 z-50 cursor-grab"
    >
      <motion.div
        animate={{
          width: isExpanded ? "auto" : "40px",
          height: isExpanded ? "auto" : "40px"
        }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-background/90 backdrop-blur-sm border border-border rounded-lg overflow-hidden"
      >
        <div 
          className={`${isExpanded ? 'p-3' : 'p-2 flex items-center justify-center'} cursor-pointer`}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {!isExpanded ? (
            <Info className="h-6 w-6 text-muted-foreground hover:text-foreground transition-colors" />
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <div className="text-foreground font-semibold text-xs font-mono">Persona Debug</div>
                <Info className="h-4 w-4 text-muted-foreground hover:text-foreground transition-colors ml-2" />
              </div>
              <div className="space-y-1 text-muted-foreground text-xs font-mono max-w-xs">
                <div>Status: {data.debugInfo?.processingStatus || 'loading'}</div>
                <div>Triggers: {data.debugInfo?.triggerCount || 0}</div>
                <div>Traces: {data.totalTraces}</div>
                <div>Insights: {data.totalInsights}</div>
                <div>Confidence: {Math.round(data.overallConfidence * 100)}%</div>
                <div>Complete: {Math.round(data.profileCompleteness * 100)}%</div>
                <div>Loading: {data.isLoading ? 'Yes' : 'No'}</div>
                {data.lastUpdate && (
                  <div>Updated: {new Date(data.lastUpdate).toLocaleTimeString()}</div>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    data.refreshData();
                    console.log('🔄 [DEBUG PANEL] Manual refresh triggered');
                  }}
                  className="mt-2 px-2 py-1 bg-accent text-accent-foreground rounded text-xs hover:bg-accent/80 transition-colors"
                >
                  Refresh
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    console.log('🔥 [DEBUG PANEL] Force crystallization with low confidence threshold');

                    try {
                      // Force crystallization with very low confidence threshold
                      const { triggerInsightCrystallization } = await import('@/app/lib/persona-api');
                      const result = await triggerInsightCrystallization(data.debugInfo?.userId || '', [], 0.1);
                      console.log('✅ [DEBUG PANEL] Force crystallization result:', result);
                      data.refreshData();
                    } catch (error) {
                      console.error('❌ [DEBUG PANEL] Force crystallization failed:', error);
                    }
                  }}
                  className="mt-1 px-2 py-1 bg-orange-600 text-white rounded text-xs hover:bg-orange-700 transition-colors"
                >
                  Force Crystallize (0.1)
                </button>
                <button
                  onClick={async (e) => {
                    e.stopPropagation();
                    console.log('🔥 [DEBUG PANEL] Force crystallization with medium confidence threshold');

                    try {
                      const { triggerInsightCrystallization } = await import('@/app/lib/persona-api');
                      const result = await triggerInsightCrystallization(data.debugInfo?.userId || '', [], 0.3);
                      console.log('✅ [DEBUG PANEL] Force crystallization result:', result);
                      data.refreshData();
                    } catch (error) {
                      console.error('❌ [DEBUG PANEL] Force crystallization failed:', error);
                    }
                  }}
                  className="mt-1 px-2 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 transition-colors"
                >
                  Force Crystallize (0.3)
                </button>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

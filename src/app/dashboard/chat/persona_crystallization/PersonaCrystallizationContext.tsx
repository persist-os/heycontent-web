import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useConvex } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { usePersonaCrystallization } from '@/hooks/usePersonaCrystallization';
import type { 
  PersonaCrystallizationContextType, 
  PersonaCrystallizationProviderProps,
  DamStatus 
} from './types';

const PersonaCrystallizationContext = createContext<PersonaCrystallizationContextType | undefined>(undefined);

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
  
  // Get comprehensive persona profile with increased limits for better display
  const personaProfile = useQuery(
    api.personaCrystallizationQueries.getUserPersonaProfile,
    userId ? { 
      user_id: userId, 
      include_recent_traces: true,
      trace_limit: 100, // Increased for more traces display
      insight_limit: 50, // Increased for more insights display
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

  // Get dam status (for development/debugging)
  const [damStatus, setDamStatus] = useState<DamStatus | null>(null);
  
  // Fetch dam status periodically
  useEffect(() => {
    if (!userId || process.env.NODE_ENV !== 'development') return;

    const fetchDamStatus = async () => {
      try {
        const response = await fetch(`/api/persona-crystallization/dam-status/${userId}`, {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setDamStatus(data.dam_status);
        }
      } catch (error) {
        console.warn('Failed to fetch dam status:', error);
      }
    };

    fetchDamStatus();
    const interval = setInterval(fetchDamStatus, 5000); // Check every 5 seconds in dev

    return () => clearInterval(interval);
  }, [userId, lastRefresh]);

  // Hook for processing status
  const { state: processingState } = usePersonaCrystallization(userId);

  const refreshData = () => {
    console.log('[PERSONA DEBUG] Manual refresh triggered');
    setLastRefresh(Date.now());
  };

  // Auto-refresh data periodically
  useEffect(() => {
    if (!userId) return;

    console.log('[PERSONA DEBUG] Setting up refresh interval for user:', userId);
    
    const interval = setInterval(() => {
      const now = Date.now();
      console.log('[PERSONA DEBUG] Auto-refreshing data at:', new Date(now).toISOString());
      setLastRefresh(now);
    }, 10000); // Refresh every 10 seconds for debugging

    return () => {
      console.log('[PERSONA DEBUG] Clearing refresh interval');
      clearInterval(interval);
    };
  }, [userId]);

  // Debug logging for data changes
  useEffect(() => {
    if (personaProfile) {
      console.log('[PERSONA DEBUG] PersonaProfile updated:', {
        totalTraces: personaProfile.summary?.total_traces || 0,
        totalInsights: personaProfile.summary?.total_insights || 0,
        recentTraces: personaProfile.recent_traces?.length || 0,
        lastUpdated: personaProfile.last_updated ? new Date(personaProfile.last_updated).toISOString() : 'never'
      });
    }
  }, [personaProfile]);

  useEffect(() => {
    if (triggers) {
      console.log('[PERSONA DEBUG] Triggers updated:', {
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
    
    // Token Dam info
    damStatus: damStatus || undefined,
    
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
 * Shows processing status and basic stats in a compact format
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

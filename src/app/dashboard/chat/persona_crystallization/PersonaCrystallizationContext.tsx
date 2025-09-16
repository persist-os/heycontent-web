import React, { createContext, useContext } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import type { 
  PersonaCrystallizationContextType, 
  PersonaCrystallizationProviderProps
} from './types';

const PersonaCrystallizationContext = createContext<PersonaCrystallizationContextType | undefined>(undefined);

/**
 * Simple provider for persona crystallization data from Convex
 * No polling, triggers, or complex state management - just data display
 */
export function PersonaCrystallizationProvider({ 
  userId, 
  children 
}: PersonaCrystallizationProviderProps) {
  // Simple Convex query - real-time updates handled by Convex subscription
  const personaProfile = useQuery(
    api.personaCrystallizationQueries.getUserPersonaProfile,
    userId ? { 
      user_id: userId, 
      include_recent_traces: true,
      trace_limit: 100,
      insight_limit: 50
    } : "skip"
  );

  const contextValue: PersonaCrystallizationContextType = {
    // Data from Convex (read-only display)
    recentTraces: personaProfile?.recent_traces || [],
    crystallizedInsights: personaProfile?.crystallized_insights || [],
    isLoading: personaProfile === undefined,
    
    // Basic profile info
    lastUpdate: personaProfile?.last_updated || null,
    profileCompleteness: personaProfile?.profile_completeness || 0,
    overallConfidence: personaProfile?.confidence_scores?.overall || 0,
    totalTraces: personaProfile?.summary?.total_traces || 0,
    totalInsights: personaProfile?.summary?.total_insights || 0
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
 * Simple display of current stats from Convex
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
          data.totalTraces > 0 ? 'bg-green-500' : 'bg-gray-400'
        }`} />
        <span>
          {data.totalTraces} trace{data.totalTraces !== 1 ? 's' : ''}, {data.totalInsights} insight{data.totalInsights !== 1 ? 's' : ''}
        </span>
      </div>
      {data.profileCompleteness > 0 && (
        <div className="mt-1 text-xs">
          Profile: {Math.round(data.profileCompleteness * 100)}% complete
        </div>
      )}
    </div>
  );
}

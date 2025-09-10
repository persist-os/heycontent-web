import React from 'react';
import { create } from 'zustand';
import { subscribeWithSelector, persist } from 'zustand/middleware';
import { ConvexReactClient, useMutation, useConvex } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Doc, Id } from '@/convex/_generated/dataModel';
import { ProjectFingerprint, FingerprintEvolutionHistory } from '@/app/dashboard/chat/types';

export interface PersonaStoreState {
  // Data
  allPersonas: Doc<'personas'>[];
  personaHistory: Doc<'personas'>[];
  currentPersona: Doc<'personas'> | null;
  
  // Loading states
  isLoading: boolean;
  isInitialized: boolean;
  lastFetchedUserId: string | null;
  
  // Cache metadata
  cacheTimestamp: number;
  cacheValidDuration: number; // 5 minutes in milliseconds
  
  // Error state
  error: string | null;
  
  // Actions
  initializePersonaData: (userId: string, convex: ConvexReactClient) => Promise<void>;
  refreshPersonaData: (userId: string, convex: ConvexReactClient) => Promise<void>;
  invalidatePersonaData: () => void;
  setCurrentPersona: (persona: Doc<'personas'> | null) => void;
  addPersona: (persona: Doc<'personas'>) => void;
  updatePersona: (personaId: Id<'personas'>, updates: Partial<Doc<'personas'>>) => void;
  removePersona: (personaId: Id<'personas'>) => void;
  isCacheValid: () => boolean;
}

export const usePersonaStore = create<PersonaStoreState>()(
  persist(
    subscribeWithSelector((set, get) => ({
      // Initial state
      allPersonas: [],
      personaHistory: [],
      currentPersona: null,
      isLoading: false,
      isInitialized: false,
      lastFetchedUserId: null,
      cacheTimestamp: 0,
      cacheValidDuration: 5 * 60 * 1000, // 5 minutes
      error: null,

      // Check if cache is still valid
      isCacheValid: () => {
        const state = get();
        const now = Date.now();
        return state.cacheTimestamp > 0 && (now - state.cacheTimestamp) < state.cacheValidDuration;
      },

      // Initialize persona data with aggressive caching
      initializePersonaData: async (userId: string, convex: ConvexReactClient) => {
        const state = get();
        const initStartTime = performance.now();
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🚀 [PERSONA STORE] FAST initializePersonaData called for userId:', userId, 'at:', new Date().toISOString());
        }
        
        // Check if we have valid cached data for this user
        if (state.isInitialized && 
            state.lastFetchedUserId === userId && 
            state.isCacheValid() && 
            state.allPersonas.length > 0) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🚀 [PERSONA STORE] ⚡ USING CACHED DATA - skipping network request!');
          }
          return;
        }

        // Skip if already loading for this user
        if (state.isLoading && state.lastFetchedUserId === userId) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🚀 [PERSONA STORE] Skipping init - already loading for user:', userId);
          }
          return;
        }

        const setLoadingTime = performance.now();
        set({ isLoading: true, error: null, lastFetchedUserId: userId });
        
        if (process.env.NODE_ENV === 'development') {
          console.log('🚀 [PERSONA STORE] Set loading state in:', Math.round(setLoadingTime - initStartTime), 'ms');
        }

        try {
          // Use optimized single query
          if (process.env.NODE_ENV === 'development') {
            console.log('🚀 [PERSONA STORE] Starting FAST Convex query at:', new Date().toISOString());
          }
          const queryStartTime = performance.now();
          
          const personaData = await convex.query(api.personas.getPersonaData, { userId });
          
          const queryEndTime = performance.now();
          if (process.env.NODE_ENV === 'development') {
            console.log('🚀 [PERSONA STORE] ⚡ FAST query completed in:', Math.round(queryEndTime - queryStartTime), 'ms');
          }

          const setStateStartTime = performance.now();
          set({
            allPersonas: personaData.allPersonas || [],
            personaHistory: personaData.personaHistory || [],
            currentPersona: personaData.activePersona || null,
            isLoading: false,
            isInitialized: true,
            cacheTimestamp: Date.now(), // Set cache timestamp
            error: null
          });
          const setStateEndTime = performance.now();
          
          const totalTime = setStateEndTime - initStartTime;
          if (process.env.NODE_ENV === 'development') {
            console.log('🚀 [PERSONA STORE] ⚡ FAST initializePersonaData COMPLETED in:', Math.round(totalTime), 'ms');
          }
          
        } catch (error) {
          const errorTime = performance.now();
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ [PERSONA STORE] Failed to initialize persona data in:', Math.round(errorTime - initStartTime), 'ms, error:', error);
          }
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load persona data',
            allPersonas: [],
            personaHistory: [],
            currentPersona: null
          });
        }
      },

      // Refresh persona data (force refetch)
      refreshPersonaData: async (userId: string, convex: ConvexReactClient) => {
        const refreshStartTime = performance.now();
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 [PERSONA STORE] refreshPersonaData called for userId:', userId, 'at:', new Date().toISOString());
        }
        
        // Force clear cache first for true refresh
        set({ 
          isLoading: true, 
          error: null, 
          lastFetchedUserId: userId,
          cacheTimestamp: 0 // Invalidate cache immediately
        });

        try {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 [PERSONA STORE] Starting FORCED refresh query (cache invalidated) at:', new Date().toISOString());
          }
          const queryStartTime = performance.now();
          
          const personaData = await convex.query(api.personas.getPersonaData, { userId });
          
          const queryEndTime = performance.now();
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 [PERSONA STORE] FORCED refresh query completed in:', Math.round(queryEndTime - queryStartTime), 'ms');
            console.log('🔄 [PERSONA STORE] Fresh persona data received:', {
              allPersonasCount: personaData.allPersonas?.length || 0,
              hasActivePersona: !!personaData.activePersona,
              activePersonaName: personaData.activePersona?.current_name || 'none'
            });
          }

          set({
            allPersonas: personaData.allPersonas || [],
            personaHistory: personaData.personaHistory || [],
            currentPersona: personaData.activePersona || null,
            isLoading: false,
            isInitialized: true,
            cacheTimestamp: Date.now(), // Set fresh cache timestamp
            error: null
          });
          
          const totalRefreshTime = performance.now() - refreshStartTime;
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 [PERSONA STORE] ✅ FORCED refreshPersonaData COMPLETED in:', Math.round(totalRefreshTime), 'ms');
          }
          
        } catch (error) {
          const errorTime = performance.now();
          if (process.env.NODE_ENV === 'development') {
            console.error('❌ [PERSONA STORE] Failed to refresh persona data in:', Math.round(errorTime - refreshStartTime), 'ms, error:', error);
          }
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to refresh persona data'
          });
        }
      },

      // Invalidate data (force next fetch)
      invalidatePersonaData: () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('🗑️ [PERSONA STORE] invalidatePersonaData called - clearing all cached data');
        }
        set({
          isInitialized: false,
          lastFetchedUserId: null,
          cacheTimestamp: 0,
          allPersonas: [],
          personaHistory: [],
          currentPersona: null,
          error: null,
          isLoading: false
        });
      },

      // Set current persona
      setCurrentPersona: (persona: Doc<'personas'> | null) => {
        set({ currentPersona: persona });
      },

      // Add new persona to store
      addPersona: (persona: Doc<'personas'>) => {
        const state = get();
        const updatedPersonas = [persona, ...state.allPersonas];
        const updatedHistory = persona.isActive 
          ? state.personaHistory 
          : [persona, ...state.personaHistory];
        
        set({
          allPersonas: updatedPersonas,
          personaHistory: updatedHistory,
          currentPersona: persona.isActive ? persona : state.currentPersona,
          cacheTimestamp: Date.now() // Update cache timestamp
        });
      },

      // Update existing persona in store
      updatePersona: (personaId: Id<'personas'>, updates: Partial<Doc<'personas'>>) => {
        const state = get();
        
        const updatePersonaInArray = (personas: Doc<'personas'>[]) => 
          personas.map(p => p._id === personaId ? { ...p, ...updates } : p);

        const updatedAllPersonas = updatePersonaInArray(state.allPersonas);
        const updatedHistory = updatePersonaInArray(state.personaHistory);
        
        // Update current persona if it's the one being updated
        const updatedCurrentPersona = state.currentPersona?._id === personaId
          ? { ...state.currentPersona, ...updates }
          : state.currentPersona;

        set({
          allPersonas: updatedAllPersonas,
          personaHistory: updatedHistory,
          currentPersona: updatedCurrentPersona,
          cacheTimestamp: Date.now() // Update cache timestamp
        });
      },

      // Remove persona from store
      removePersona: (personaId: Id<'personas'>) => {
        const state = get();
        
        const filteredAllPersonas = state.allPersonas.filter(p => p._id !== personaId);
        const filteredHistory = state.personaHistory.filter(p => p._id !== personaId);
        const updatedCurrentPersona = state.currentPersona?._id === personaId 
          ? null 
          : state.currentPersona;

        set({
          allPersonas: filteredAllPersonas,
          personaHistory: filteredHistory,
          currentPersona: updatedCurrentPersona,
          cacheTimestamp: Date.now() // Update cache timestamp
        });
      }
    })),
    {
      name: 'persona-store-cache',
      partialize: (state) => ({
        allPersonas: state.allPersonas,
        personaHistory: state.personaHistory,
        currentPersona: state.currentPersona,
        isInitialized: state.isInitialized,
        lastFetchedUserId: state.lastFetchedUserId,
        cacheTimestamp: state.cacheTimestamp
      }),
    }
  )
);

// Selector hooks for common use cases
export const usePersonaData = () => {
  const currentPersona = usePersonaStore(state => state.currentPersona);
  const isLoading = usePersonaStore(state => state.isLoading);
  const error = usePersonaStore(state => state.error);
  
  return {
    persona: currentPersona,
    rawPersona: currentPersona,
    isLoading,
    isError: !!error,
    hasPersona: !!currentPersona
  };
};

export const useAllPersonas = () => {
  const allPersonas = usePersonaStore(state => state.allPersonas);
  const personaHistory = usePersonaStore(state => state.personaHistory);
  const isLoading = usePersonaStore(state => state.isLoading);
  
  return {
    allPersonas,
    personaHistory,
    isLoading,
    hasHistory: personaHistory.length > 0
  };
};

// Optimized persona manager hook that uses the centralized store
export const useOptimizedPersonaManager = (userId: string | undefined) => {
  const hookStartTime = performance.now();
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 [PERSONA MANAGER] Hook called for userId:', userId, 'at:', new Date().toISOString());
  }
  
  const convex = useConvex(); // Reuse existing convex instance
  const updatePersonaMutation = useMutation(api.personas.updatePersona);
  const createPersonaMutation = useMutation(api.personas.createPersona);
  const activatePersonaMutation = useMutation(api.personas.activatePersona);
  const deletePersonaMutation = useMutation(api.personas.deletePersona);

  // Get data from store (no additional queries)
  const currentPersona = usePersonaStore(state => state.currentPersona);
  const allPersonas = usePersonaStore(state => state.allPersonas);
  const personaHistory = usePersonaStore(state => state.personaHistory);
  const isLoading = usePersonaStore(state => state.isLoading);
  const refreshPersonaData = usePersonaStore(state => state.refreshPersonaData);
  const updatePersonaInStore = usePersonaStore(state => state.updatePersona);
  const addPersonaToStore = usePersonaStore(state => state.addPersona);
  const removePersonaFromStore = usePersonaStore(state => state.removePersona);

  const hookEndTime = performance.now();
  if (process.env.NODE_ENV === 'development') {
    console.log('🔧 [PERSONA MANAGER] Hook data retrieval completed in:', Math.round(hookEndTime - hookStartTime), 'ms');
    console.log('🔧 [PERSONA MANAGER] Store state:', {
      hasCurrentPersona: !!currentPersona,
      allPersonasCount: allPersonas.length,
      personaHistoryCount: personaHistory.length,
      isLoading,
      timestamp: new Date().toISOString()
    });
  }

  const updatePersona = async (updates: Partial<Doc<'personas'>>): Promise<boolean> => {
    if (!currentPersona || !userId) return false;

    try {
      // Optimistically update store first
      updatePersonaInStore(currentPersona._id, updates);

      // Update backend
      await updatePersonaMutation({ 
        personaId: currentPersona._id, 
        ...updates 
      });
      
      // Force refresh to ensure we have the latest data
      await refreshPersonaData(userId, convex);
      
      return true;
    } catch (error) {
      // Revert on error by refreshing from server
      if (userId) {
        refreshPersonaData(userId, convex);
      }
      return false;
    }
  };

  const createPersona = async (personaData: {
    current_name: string;
    current_description: string;
    experience_level: string;
    content_formats: string[];
    content_tone: string;
    content_voice: string;
    content_pillars: string[];
    unique_value: string;
    future_name: string;
    future_description: string;
    goals: string[];
    desired_impact: string;
    primary_topics: string[];
    secondary_topics: string[];
    tone_descriptors: string[];
    style_descriptors: string[];
    audience_type: string;
    engagement_style: string[];
  }): Promise<boolean> => {
    if (!userId) return false;

    try {
      const result = await createPersonaMutation({
        userId,
        ...personaData
      });
      
      if (result) {
        // Force refresh to get the new persona immediately
        await refreshPersonaData(userId, convex);
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  const activatePersona = async (personaId: Id<"personas">): Promise<boolean> => {
    if (!userId) return false;

    try {
      // Optimistically update store
      if (currentPersona) {
        updatePersonaInStore(currentPersona._id, { isActive: false });
      }
      updatePersonaInStore(personaId, { isActive: true });

      // Update backend
      await activatePersonaMutation({ personaId, userId });
      
      // Force refresh to ensure we have the latest data
      await refreshPersonaData(userId, convex);
      
      return true;
    } catch (error) {
      // Revert on error by refreshing from server
      if (userId) {
        refreshPersonaData(userId, convex);
      }
      return false;
    }
  };

  const deletePersona = async (personaId: Id<"personas">): Promise<boolean> => {
    try {
      // Optimistically remove from store
      removePersonaFromStore(personaId);

      // Update backend
      await deletePersonaMutation({ personaId });
      
      // Force refresh to ensure we have the latest data
      if (userId) {
        await refreshPersonaData(userId, convex);
      }
      
      return true;
    } catch (error) {
      // Revert on error by refreshing from server
      if (userId) {
        refreshPersonaData(userId, convex);
      }
      return false;
    }
  };

  const deleteCurrentPersonaAndSelectNext = async (): Promise<boolean> => {
    if (!currentPersona || !userId) return false;

    try {
      const currentPersonaId = currentPersona._id;
      
      // Find the most recently created persona that's not the current one
      const otherPersonas = allPersonas.filter(p => p._id !== currentPersonaId);
      const mostRecentPersona = otherPersonas.length > 0 
        ? otherPersonas.reduce((newest, current) => 
            current._creationTime > newest._creationTime ? current : newest
          )
        : null;

      // Delete the current persona
      await deletePersonaMutation({ personaId: currentPersonaId });

      // If we have another persona, activate it
      if (mostRecentPersona) {
        await activatePersonaMutation({ 
          personaId: mostRecentPersona._id, 
          userId 
        });
      }
      
      // Force refresh to ensure we have the latest data
      await refreshPersonaData(userId, convex);
      
      return true;
    } catch (error) {
      console.error('Failed to delete current persona and select next:', error);
      // Revert on error by refreshing from server
      if (userId) {
        refreshPersonaData(userId, convex);
      }
      return false;
    }
  };

  return {
    // Data from store (no queries)
    currentPersona,
    allPersonas,
    personaHistory,
    isLoading,
    hasPersona: !!currentPersona,
    hasHistory: personaHistory.length > 0,

    // Actions
    activatePersona,
    deletePersona,
    deleteCurrentPersonaAndSelectNext,
    updatePersona,
    createPersona,
  };
}; 
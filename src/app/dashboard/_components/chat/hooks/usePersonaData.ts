import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { PersonaData } from '../types';
import { Id } from '@/convex/_generated/dataModel';

/**
 * Hook to fetch persona data from Convex
 * @param userId The user ID to fetch persona for
 * @param enabled Whether to enable the query (useful for conditional fetching)
 * @returns Object with persona data and loading state
 */
export function usePersonaData(userId: string | undefined, enabled: boolean = true) {
  console.log('🔍 usePersonaData called:', { userId, enabled, shouldQuery: userId && enabled });
  
  const persona = useQuery(
    api.personas.getPersona,
    userId && enabled ? { userId } : "skip"
  );

  console.log('🔍 Raw Convex persona result:', { 
    persona, 
    personaType: typeof persona,
    isUndefined: persona === undefined,
    isNull: persona === null,
    hasData: !!persona 
  });

  // Transform the Convex persona data to match our PersonaData interface
  const transformedPersona: PersonaData | null = persona ? {
    current_name: persona.current_name || '',
    current_description: persona.current_description || '',
    experience_level: persona.experience_level || '',
    content_formats: persona.content_formats || [],
    content_tone: persona.content_tone || '',
    content_voice: persona.content_voice || '',
    content_pillars: persona.content_pillars || [],
    unique_value: persona.unique_value || '',
    future_name: persona.future_name || '',
    future_description: persona.future_description || '',
    goals: persona.goals || [],
    desired_impact: persona.desired_impact || '',
    primary_topics: persona.primary_topics || [],
    secondary_topics: persona.secondary_topics || [],
    tone_descriptors: persona.tone_descriptors || [],
    style_descriptors: persona.style_descriptors || [],
    audience_type: persona.audience_type || '',
    engagement_style: persona.engagement_style || [],
  } : null;

  const result = {
    persona: transformedPersona,
    rawPersona: persona, // Include raw data with ID for updates
    isLoading: persona === undefined && enabled && userId,
    isError: persona === null && enabled && userId,
    hasPersona: !!transformedPersona
  };

  console.log('🔍 usePersonaData result:', {
    hasTransformedPersona: !!transformedPersona,
    hasPersona: result.hasPersona,
    isLoading: result.isLoading,
    isError: result.isError,
    personaName: transformedPersona?.current_name
  });

  // Log only when we actually have or fail to get persona data
  if (enabled && userId) {
    if (transformedPersona) {
      console.log('✅ Persona data loaded:', transformedPersona.current_name);
    } else if (persona === null) {
      console.log('❌ No persona found for user:', userId);
    } else if (persona === undefined) {
      console.log('⏳ Persona query still loading for user:', userId);
    }
  }

  return result;
}

/**
 * Hook to fetch all personas for a user with full context
 * @param userId The user ID to fetch personas for
 * @returns Object with all personas and loading state
 */
export function useAllPersonas(userId: string | undefined) {
  const allPersonas = useQuery(
    api.personas.getAllPersonas,
    userId ? { userId } : "skip"
  );

  const personaHistory = useQuery(
    api.personas.getPersonaHistory,
    userId ? { userId } : "skip"
  );

  return {
    allPersonas: allPersonas || [],
    personaHistory: personaHistory || [],
    isLoading: allPersonas === undefined || personaHistory === undefined,
    hasHistory: (personaHistory || []).length > 0
  };
}

/**
 * Hook for managing persona updates with full context injection
 * @param userId The user ID for persona management
 * @returns Object with update functions and state
 */
export function usePersonaManager(userId: string | undefined) {
  const updatePersonaMutation = useMutation(api.personas.updatePersona);
  const createPersonaMutation = useMutation(api.personas.createPersona);
  const activatePersonaMutation = useMutation(api.personas.activatePersona);
  const deletePersonaMutation = useMutation(api.personas.deletePersona);

  const { allPersonas, personaHistory, isLoading: historyLoading } = useAllPersonas(userId);
  const { persona: currentPersona, rawPersona } = usePersonaData(userId);

  /**
   * Update the current active persona with context injection
   * @param updates Partial persona data to update
   * @returns Promise resolving to success boolean
   */
  const updatePersona = async (updates: Partial<PersonaData>): Promise<boolean> => {
    if (!rawPersona?._id || !userId) {
      console.error('Cannot update persona: missing persona ID or user ID');
      return false;
    }

    try {
      // Prepare the update payload with persona context
      const updatePayload = {
        personaId: rawPersona._id,
        ...updates
      };

      console.log('🔄 Updating persona with context:', {
        personaId: rawPersona._id,
        userId,
        totalPersonasInHistory: allPersonas.length,
        updates: Object.keys(updates)
      });

      await updatePersonaMutation(updatePayload);
      
      console.log('✅ Persona updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to update persona:', error);
      return false;
    }
  };

  /**
   * Create a new persona with full context from previous personas
   * @param newPersonaData Complete persona data
   * @returns Promise resolving to success boolean
   */
  const createPersonaWithContext = async (newPersonaData: PersonaData): Promise<boolean> => {
    if (!userId) {
      console.error('Cannot create persona: missing user ID');
      return false;
    }

    try {
      // Inject context from all previous personas
      const contextPayload = {
        userId,
        ...newPersonaData,
        // Add metadata about persona evolution (could be used by backend)
        _context: {
          previousPersonaCount: allPersonas.length,
          hasHistory: allPersonas.length > 0,
          previousPersonaNames: allPersonas.map(p => p.current_name),
          evolutionStage: allPersonas.length + 1
        }
      };

      console.log('🆕 Creating persona with full context:', {
        userId,
        previousPersonaCount: allPersonas.length,
        hasHistory: allPersonas.length > 0
      });

      await createPersonaMutation(contextPayload);
      
      console.log('✅ Persona created successfully with context');
      return true;
    } catch (error) {
      console.error('❌ Failed to create persona:', error);
      return false;
    }
  };

  /**
   * Activate a specific persona from history
   * @param personaId The ID of the persona to activate
   * @returns Promise resolving to success boolean
   */
  const activatePersona = async (personaId: Id<"personas">): Promise<boolean> => {
    if (!userId) {
      console.error('Cannot activate persona: missing user ID');
      return false;
    }

    try {
      await activatePersonaMutation({ personaId, userId });
      console.log('✅ Persona activated successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to activate persona:', error);
      return false;
    }
  };

  /**
   * Delete a persona permanently
   * @param personaId The ID of the persona to delete
   * @returns Promise resolving to success boolean
   */
  const deletePersona = async (personaId: Id<"personas">): Promise<boolean> => {
    try {
      await deletePersonaMutation({ personaId });
      console.log('✅ Persona deleted successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to delete persona:', error);
      return false;
    }
  };

  /**
   * Get persona context for backend requests
   * @returns Object with full persona context
   */
  const getPersonaContext = () => {
    return {
      currentPersona,
      allPersonas,
      personaHistory,
      totalPersonas: allPersonas.length,
      hasEvolution: allPersonas.length > 1,
      evolutionSummary: allPersonas.map(p => ({
        id: p._id,
        name: p.current_name,
        createdAt: p.createdAt,
        isActive: p.isActive
      }))
    };
  };

  return {
    // Current state
    currentPersona,
    allPersonas,
    personaHistory,
    isLoading: historyLoading,
    hasPersona: !!currentPersona,
    hasHistory: allPersonas.length > 1,

    // Update functions
    updatePersona,
    createPersonaWithContext,
    activatePersona,
    deletePersona,

    // Context
    getPersonaContext
  };
} 
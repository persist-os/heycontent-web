import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';
import { Message } from '@/app/types/chat';

/**
 * Saves a persona to Convex database
 * @param personaData The persona data to save
 * @param userId The Firebase user ID
 * @returns Promise resolving to the ID of the saved persona or false if save failed
 */
export async function savePersonaToConvex(
  personaData: NonNullable<Message['metadata']>['persona'],
  userId: string,
  createPersonaMutation: any
): Promise<string | false> {
  if (!personaData || !userId) {
    console.error('[persona-utils] Cannot save persona: missing data or user ID');
    return false;
  }
  
  try {
    console.log('[persona-utils] Saving persona to Convex for user:', userId);
    console.log('[persona-utils] Persona data:', JSON.stringify({
      current_name: personaData.current_name,
      experience_level: personaData.experience_level,
      content_tone: personaData.content_tone,
    }));
    
    // Call the Convex mutation with all required fields
    const result = await createPersonaMutation({
      userId,
      current_name: personaData.current_name || 'Unnamed Persona',
      current_description: personaData.current_description || '',
      experience_level: personaData.experience_level || 'Beginner',
      content_formats: Array.isArray(personaData.content_formats) ? personaData.content_formats : [],
      content_tone: personaData.content_tone || '',
      content_voice: personaData.content_voice || '',
      content_pillars: Array.isArray(personaData.content_pillars) ? personaData.content_pillars : [],
      unique_value: personaData.unique_value || '',
      future_name: personaData.future_name || '',
      future_description: personaData.future_description || '',
      goals: Array.isArray(personaData.goals) ? personaData.goals : [],
      desired_impact: personaData.desired_impact || '',
      primary_topics: Array.isArray(personaData.primary_topics) ? personaData.primary_topics : [],
      secondary_topics: Array.isArray(personaData.secondary_topics) ? personaData.secondary_topics : [],
      tone_descriptors: Array.isArray(personaData.tone_descriptors) ? personaData.tone_descriptors : [],
      style_descriptors: Array.isArray(personaData.style_descriptors) ? personaData.style_descriptors : [],
      audience_type: personaData.audience_type || '',
      engagement_style: Array.isArray(personaData.engagement_style) ? personaData.engagement_style : [],
    });
    
    console.log('[persona-utils] Persona saved successfully with ID:', result);
    return result;
  } catch (error) {
    console.error('[persona-utils] Failed to save persona:', error);
    return false;
  }
}

/**
 * Checks if a message contains a completed persona
 * @param message The message to check
 * @returns True if the message contains a completed persona
 */
export function hasCompletedPersona(message: Message): boolean {
  return (
    message.role === 'assistant' &&
    !!message.metadata?.is_persona_complete &&
    !!message.metadata.persona
  );
}

/**
 * Hook to save personas to Convex
 * @returns An object with functions to save personas
 */
export function usePersonaManager() {
  const createPersona = useMutation(api.personas.createPersona);
  
  /**
   * Save a persona from a chat message
   */
  const savePersonaFromMessage = async (message: Message, userId: string): Promise<boolean> => {
    if (!hasCompletedPersona(message) || !userId) {
      return false;
    }
    
    const personaData = message.metadata!.persona;
    const result = await savePersonaToConvex(personaData, userId, createPersona);
    return !!result;
  };
  
  /**
   * Save a persona from API response metadata
   */
  const savePersonaFromResponse = async (
    metadata: Message['metadata'],
    userId: string
  ): Promise<boolean> => {
    if (!metadata?.is_persona_complete || !metadata.persona || !userId) {
      return false;
    }
    
    const result = await savePersonaToConvex(metadata.persona, userId, createPersona);
    return !!result;
  };
  
  /**
   * Find and save the most recent completed persona in a list of messages
   */
  const saveLatestPersona = async (messages: Message[], userId: string): Promise<boolean> => {
    // Find messages with completed personas
    const messagesWithPersona = messages
      .filter(hasCompletedPersona)
      .sort((a, b) => {
        // Sort by timestamp descending (newest first)
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });
    
    if (messagesWithPersona.length > 0) {
      const latestPersonaMessage = messagesWithPersona[0];
      const personaData = latestPersonaMessage.metadata!.persona;
      
      console.log('[persona-utils] Found completed persona in message history, saving');
      const result = await savePersonaToConvex(personaData, userId, createPersona);
      return !!result;
    }
    
    return false;
  };
  
  return {
    savePersonaFromMessage,
    savePersonaFromResponse,
    saveLatestPersona,
    hasCompletedPersona
  };
}

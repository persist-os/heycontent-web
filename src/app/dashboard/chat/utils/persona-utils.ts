import { Message } from '@/app/types/chat';
import { useOptimizedPersonaManager } from '@/store/persona-store';

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
 * Hook to save personas using optimized store
 * @returns An object with functions to save personas
 */
export function usePersonaManager(userId?: string) {
  const { createPersona } = useOptimizedPersonaManager(userId);
  
  /**
   * Save a persona from a chat message
   */
  const savePersonaFromMessage = async (message: Message, userId: string): Promise<boolean> => {
    if (!hasCompletedPersona(message) || !userId) {
      return false;
    }
    
    const personaData = message.metadata!.persona;
    
    // Prepare the data with defaults for required fields
    const personaPayload = {
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
    };
    
    return await createPersona(personaPayload);
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
    
    // Create a fake message structure to reuse the same logic
    const fakeMessage: Message = {
      id: 'temp',
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
      chat_response: '',
      metadata
    };
    
    return await savePersonaFromMessage(fakeMessage, userId);
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
      console.log('[persona-utils] Found completed persona in message history, saving');
      return await savePersonaFromMessage(latestPersonaMessage, userId);
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
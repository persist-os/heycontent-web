import { useMemo } from 'react';
import { Message } from '@/app/types/chat';

interface OnboardingState {
  isOnboardingFlow: boolean;
  shouldShowPersonaTip: boolean;
  hasCompletedPersona: boolean;
}

/**
 * Hook to determine onboarding flow state and when to show persona tip
 * @param messages Chat messages
 * @param sessionId Current session ID
 * @returns Onboarding state information
 */
export function useOnboardingState(messages: Message[], sessionId: string | null): OnboardingState {
  return useMemo(() => {
    // Check if we're in an onboarding flow
    const isOnboardingFlow = Boolean(
      sessionId && 
      (sessionId.includes('onboarding_') || sessionId.includes('persona_')) ||
      messages.some(msg => msg.metadata?.is_persona_flow === true)
    );

    // Check if persona has been completed in this session
    const hasCompletedPersona = messages.some(msg => 
      msg.metadata?.is_persona_complete === true || 
      msg.metadata?.persona_created === true
    );

    // Check if user has asked for persona creation
    const hasRequestedPersona = messages.some(msg => 
      msg.role === 'user' && 
      msg.content.toLowerCase().includes('hey content write my persona')
    );

    // Show tip if:
    // 1. We're in onboarding flow
    // 2. Persona hasn't been completed yet
    // 3. User hasn't requested persona creation yet
    // 4. We have meaningful conversation going (at least 4 messages, meaning 2 back-and-forth exchanges)
    const shouldShowPersonaTip = isOnboardingFlow && 
                                !hasCompletedPersona && 
                                !hasRequestedPersona &&
                                messages.length >= 4;

    console.log('🎯 Onboarding state:', {
      isOnboardingFlow,
      hasCompletedPersona,
      hasRequestedPersona,
      messageCount: messages.length,
      shouldShowPersonaTip,
      sessionId
    });

    return {
      isOnboardingFlow,
      shouldShowPersonaTip,
      hasCompletedPersona
    };
  }, [messages, sessionId]);
} 
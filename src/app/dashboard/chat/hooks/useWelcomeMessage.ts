import { useState, useEffect } from 'react'
import { welcomeMessageSteps, getWelcomeStepMessage, welcomeSuggestions, welcomeSuggestionsWithPersona } from '../data/welcome-message'

export function useWelcomeMessage(
  messages: any[], 
  isLoading: boolean, 
  user: any, 
  setMessages: (messages: any[] | ((prev: any[]) => any[])) => void,
  hasPersona: boolean,
  isPersonaLoading: boolean = false
) {
  const [welcomeStep, setWelcomeStep] = useState(0);

  // Handle welcome message for users without a persona (onboarding)
  useEffect(() => {
    console.log('🔄 Welcome message effect:', {
      hasPersona,
      isPersonaLoading,
      messagesLength: messages.length,
      isLoading,
      hasUser: !!user
    });

    // Show onboarding if user doesn't have a persona and chat is empty
    // Wait for both chat loading and persona loading to complete
    if (hasPersona === false && !isPersonaLoading && messages.length === 0 && !isLoading && user) {
      console.log('✅ Triggering welcome message for user without persona');
      setWelcomeStep(0);
      setMessages([getWelcomeStepMessage(0)]);
    }
  }, [hasPersona, isPersonaLoading, messages.length, isLoading, setMessages, user]);

  // Modified handleSuggestionClick to send messages automatically
  const handleSuggestionClick = (suggestion: any, onSendMessage: (msg: string) => void) => {
    const cleanSuggestionText = (text: string): string => {
      return text
        .replace(/^[\s]*[-*•]\s*/, '') // Remove leading bullet points (-, *, •)
        .replace(/^[\s]*\*\s*/, '') // Remove leading asterisks
        .trim();
    };

    // If we're in the welcome step flow, advance the step
    if (
      messages.length > 0 &&
      messages[messages.length - 1].id.startsWith('welcome-step-') &&
      messages[messages.length - 1].role === 'assistant'
    ) {
      const currentStep = messages[messages.length - 1].metadata?.step || 0;
      const isLastStep = currentStep === welcomeMessageSteps.length - 1;
      const lastWelcomeWithSuggestions = messages[messages.length - 1].suggestions &&
        Array.isArray(messages[messages.length - 1].suggestions) &&
        messages[messages.length - 1].suggestions.length > 1 &&
        messages[messages.length - 1].suggestions.includes('hey content persona');
      
      // Prevent duplicate appending after the last step
      if (isLastStep && lastWelcomeWithSuggestions) {
        // After the last step, treat as a normal suggestion click
        const message = typeof suggestion === 'string' ? suggestion : suggestion.description;
        onSendMessage(message);
        return;
      }
      
      const userMessage = {
        id: `welcome-user-${currentStep}`,
        content: suggestion,
        chat_response: suggestion,
        role: 'user',
        timestamp: new Date().toISOString(),
        suggestions: [],
      };
      
      if (currentStep < welcomeMessageSteps.length - 1) {
        const nextStep = currentStep + 1;
        setWelcomeStep(nextStep);
        setMessages(prev => [
          ...prev,
          userMessage,
          { ...getWelcomeStepMessage(nextStep), role: 'assistant' }
        ]);
        return;
      } else {
        // Last step: show normal suggestions only once
        setMessages(prev => [
          ...prev,
          userMessage,
          {
            ...getWelcomeStepMessage(currentStep),
            role: 'assistant',
            suggestions: hasPersona ? welcomeSuggestionsWithPersona : welcomeSuggestions,
          },
        ]);
        return;
      }
    }
    
    // Auto-send the suggestion message
    const message = typeof suggestion === 'string' ? suggestion : suggestion.description;
    onSendMessage(cleanSuggestionText(message));
  };

  return {
    welcomeStep,
    setWelcomeStep,
    handleSuggestionClick
  }
} 
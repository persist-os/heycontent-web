import React, { useEffect, useState } from 'react';
import { PersonaCard } from './PersonaCard';
import { usePersonaData } from '../hooks/usePersonaData';
import { Message } from '@/app/types/chat';

interface PersonaCardRendererProps {
  message: Message;
  userId: string;
}

export const PersonaCardRenderer: React.FC<PersonaCardRendererProps> = ({ message, userId }) => {
  const [retryCount, setRetryCount] = useState(0);
  const [shouldShow, setShouldShow] = useState(false);
  
  // Always fetch persona if this is an assistant message
  const isAssistantMessage = message.role === 'assistant';
  const shouldFetchPersona = isAssistantMessage && !!userId;

  const { persona, isLoading, hasPersona, isError } = usePersonaData(userId, shouldFetchPersona);

  // Check if this message indicates persona completion
  const hasPersonaCompletionFlags = message.metadata?.is_persona_complete === true || 
                                   message.metadata?.persona_created === true;

  // FALLBACK: Check message content for persona indicators since metadata is unreliable
  const hasPersonaContentPattern = message.content && (
    message.content.includes('🎭 *Your Content Persona*') ||
    message.content.includes('Content Persona') ||
    (message.content.includes('🎭') && message.content.includes('Content Style')) ||
    (message.content.includes('Content Focus') && message.content.includes('Future Goals'))
  );

  // Combined trigger: metadata flags OR content pattern
  const hasPersonaIndicators = hasPersonaCompletionFlags || hasPersonaContentPattern;

  useEffect(() => {
    if (!hasPersonaIndicators || !shouldFetchPersona) {
      setShouldShow(false);
      return;
    }

    if (hasPersona && persona) {
      setShouldShow(true);
      return;
    }

    if (isLoading) {
      return;
    }

    if (!hasPersona && retryCount < 3) {
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 1000);
      return () => clearTimeout(timer);
    }

    if (!hasPersona && retryCount >= 3) {
      setShouldShow(false);
    }
  }, [hasPersonaIndicators, shouldFetchPersona, hasPersona, persona, isLoading, retryCount]);

  // Loading state
  if (shouldFetchPersona && isLoading) {
    return (
      <div className="w-full p-6 text-center">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
        <p className="text-sm text-gray-500 mt-2">Loading your persona...</p>
      </div>
    );
  }

  // Error state
  if (shouldFetchPersona && isError) {
    return (
      <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 text-sm">Unable to load your persona. Please try refreshing the page.</p>
      </div>
    );
  }

  // Render PersonaCard if conditions are met
  if (shouldFetchPersona && shouldShow && hasPersona && persona) {
    return (
      <div className="mt-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
        <div className="mb-3 text-center">
          <h3 className="text-lg font-bold text-purple-800 mb-1">🎭 Your Content Persona</h3>
          <p className="text-sm text-purple-600">Your personalized content identity has been created!</p>
        </div>
        <PersonaCard persona={persona} userId={userId} variant="compact" />
      </div>
    );
  }

  // Don't render anything if conditions aren't met
  return null;
}; 
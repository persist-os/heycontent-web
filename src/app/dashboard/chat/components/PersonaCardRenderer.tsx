import React, { useEffect, useState } from 'react';
import { getApiKey } from '@/app/lib/api-helpers';
import { NewPersonaCard } from '@/app/settings/tabs/account/NewPersonaCard';
import { usePersonaData } from '../hooks/usePersonaData';
import { Message } from '@/app/types/chat';
import { useRouter } from 'next/navigation';

interface PersonaCardRendererProps {
  message: Message;
  userId: string;
}

export const PersonaCardRenderer: React.FC<PersonaCardRendererProps> = ({ message, userId }) => {
  const [retryCount, setRetryCount] = useState(0);
  const [shouldShow, setShouldShow] = useState(false);
  const [showSettingsButton, setShowSettingsButton] = useState(false);
  const router = useRouter();
  
  // Always fetch persona if this is an assistant message
  const isAssistantMessage = message.role === 'assistant';
  const shouldFetchPersona = isAssistantMessage && !!userId;

  const { persona, isLoading, hasPersona, isError } = usePersonaData(userId, shouldFetchPersona);

  // Check if this message indicates persona completion
  const hasPersonaCompletionFlags = message.metadata?.is_persona_complete === true || 
                                   message.metadata?.persona_created === true;

  // FALLBACK: Check message content for persona indicators since metadata is unreliable
  const hasPersonaContentPattern = message.content && (
    message.content.includes('*Your Content Persona*') ||
    message.content.includes('Content Persona') ||
    (message.content.includes('Content Style')) ||
    (message.content.includes('Content Focus') && message.content.includes('Future Goals'))
  );

  // Combined trigger: metadata flags OR content pattern
  const hasPersonaIndicators = hasPersonaCompletionFlags || hasPersonaContentPattern;

  // Call ambient_insights API after successful persona generation
  useEffect(() => {
    const callAmbientInsights = async () => {
      if (hasPersona && persona && hasPersonaIndicators) {
        try {
          console.log('Calling ambient_insights API after persona generation');
          const apiKey = await getApiKey();
          
          if (!apiKey) {
            console.error('No API key found for ambient_insights call');
            return;
          }
          
          const response = await fetch('/api/ambient_insights', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
              context_type: 'persona_generation',
              content: JSON.stringify(persona)
            })
          });
          
          if (!response.ok) {
            const errorData = await response.json();
            console.error('Error calling ambient_insights API:', errorData);
          } else {
            const data = await response.json();
            console.log('Ambient insights generated successfully:', data);
          }
        } catch (error) {
          console.error('Exception calling ambient_insights API:', error);
        }
      }
    };
    
    callAmbientInsights();
  }, [hasPersona, persona, hasPersonaIndicators]);

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

  useEffect(() => {
    // Check if PersonaTip was clicked
    if (typeof window !== 'undefined' && localStorage.getItem('personaTipClicked') === 'true') {
      setShowSettingsButton(true);
    }
  }, []);

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
      <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-xl">
        <div className="mb-4 text-center">
          <h3 className="text-lg font-semibold text-gray-900">Your Content Persona</h3>
          <p className="text-sm text-gray-500">Your personalized content identity has been created.</p>
        </div>
        <NewPersonaCard persona={persona} />
        {showSettingsButton && (
          <div className="flex justify-center mt-6">
            <button
              className="px-4 py-2 bg-gray-900 text-white font-semibold rounded-lg shadow-sm hover:bg-gray-800 transition-colors"
              onClick={() => router.push('/settings')}
              type="button"
            >
              View Persona in Settings
            </button>
          </div>
        )}
      </div>
    );
  }

  // Don't render anything if conditions aren't met
  return null;
}; 
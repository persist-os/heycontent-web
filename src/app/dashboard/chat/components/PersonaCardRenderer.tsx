import React, { useEffect, useState } from 'react';
import { getApiKey } from '@/app/lib/api-helpers';
import { NewPersonaCard } from '@/app/settings/tabs/account/NewPersonaCard';
import { usePersonaData, usePersonaStore } from '@/store/persona-store';
import { Message } from '@/app/types/chat';
import { useRouter } from 'next/navigation';
import { useConvex } from 'convex/react';
import { Skeleton } from '@/components/ui/skeleton';

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

  const { persona, isLoading, hasPersona, isError } = usePersonaData();

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
      <div className="w-full p-6">
        <div className="space-y-3">
          <Skeleton className="h-6 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
          <Skeleton className="h-32 w-full rounded-xl mt-4" />
        </div>
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
      <div className="mt-4 p-6 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/5 border border-primary/20 rounded-xl shadow-sm overflow-hidden">
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <h3 className="text-lg font-semibold text-foreground">Your Content Persona</h3>
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          </div>
          <p className="text-sm text-muted-foreground">Your personalized content identity has been created.</p>
        </div>
        <NewPersonaCard persona={persona} />
        {showSettingsButton && (
          <div className="flex justify-center mt-6">
            <button
              className="px-6 py-2 bg-primary text-primary-foreground font-semibold rounded-lg shadow-sm hover:bg-primary/90 transition-colors"
              onClick={() => router.push('/dashboard/self-hub')}
              type="button"
            >
              View Persona in Self
            </button>
          </div>
        )}
      </div>
    );
  }

  // Don't render anything if conditions aren't met
  return null;
}; 
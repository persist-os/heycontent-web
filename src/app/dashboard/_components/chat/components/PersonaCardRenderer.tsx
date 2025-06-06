import React, { useEffect, useState } from 'react';
import { PersonaCard } from './PersonaCard';
import { usePersonaData } from '../hooks/usePersonaData';
import { Message } from '@/app/types/chat';

interface PersonaCardRendererProps {
  message: Message;
  userId: string;
}

export const PersonaCardRenderer: React.FC<PersonaCardRendererProps> = ({ message, userId }) => {
  // Always fetch persona if this is an assistant message that might have persona data
  const isAssistantMessage = message.role === 'assistant';
  const shouldFetchPersona = isAssistantMessage && !!userId;

  const { persona, isLoading, hasPersona, isError } = usePersonaData(userId, shouldFetchPersona);

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

  // Render PersonaCard if we have valid persona data
  if (shouldFetchPersona && hasPersona && persona) {
    return <PersonaCard persona={persona} userId={userId} />;
  }

  // Don't render anything if conditions aren't met
  return null;
}; 
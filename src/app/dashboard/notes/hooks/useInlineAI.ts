"use client";

import { useState } from 'react';
import { getApiKey } from '@/app/lib/api-helpers';

interface UseInlineAIProps {
  noteId?: string;
  noteContent: string;
  noteTitle?: string;
  platform?: string;
  tags?: string[];
  userId: string;
}

interface GenericWritingResponse {
  success: boolean;
  continuation: string;
  metadata?: any;
}

interface AnalysisResponse {
  success: boolean;
  analysis: string;
  type: string;
  metadata?: any;
}

interface IdeasResponse {
  success: boolean;
  ideas: Array<{
    content: string;
    summary?: string;
    actionable_steps?: string[];
    confidence?: number;
  }>;
  metadata?: any;
}

const API_BASE = "/api/smart_note_inline";

const getContentForAPI = (content: string, title?: string): string => {
  if (content.trim() !== '') {
    return content;
  }
  if (title && title.trim() !== '') {
    return `This note is currently empty. The title is "${title}". Please provide a response based on the title.`;
  }
  return "This note is currently empty. Please provide general suggestions or analysis.";
};

export function useInlineAI({
  noteId,
  noteContent,
  noteTitle,
  platform = 'any',
  tags = [],
}: UseInlineAIProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const askAI = async (userPrompt: string): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get API key for authentication
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('You are not authenticated. Please log in again.');
      }

      const contentForAPI = getContentForAPI(noteContent, noteTitle);

      console.log('🤖 [useInlineAI] Calling askAI with:', {
        noteId,
        noteTitle,
        platform,
        userPrompt: userPrompt.substring(0, 50) + '...',
        contentLength: contentForAPI.length
      });

      const response = await fetch(`${API_BASE}/generic-writing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          noteId,
          noteContent: contentForAPI,
          userPrompt,
          title: noteTitle,
          platform,
          tags,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: GenericWritingResponse = await response.json();
      
      if (!data.success) {
        throw new Error('AI request failed');
      }

      console.log('✨ [useInlineAI] askAI response received:', {
        success: data.success,
        continuationLength: data.continuation?.length || 0
      });

      return data.continuation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get AI response';
      console.error('❌ [useInlineAI] askAI error:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const requestAnalysis = async (noteType: string): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get API key for authentication
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('You are not authenticated. Please log in again.');
      }

      const contentForAPI = getContentForAPI(noteContent, noteTitle);

      console.log('🧠 [useInlineAI] Calling requestAnalysis with:', {
        noteId,
        noteTitle,
        platform,
        noteType,
        contentLength: contentForAPI.length
      });

      const response = await fetch(`${API_BASE}/smart-note-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          noteId,
          noteContent: contentForAPI,
          noteType,
          title: noteTitle,
          platform,
          tags,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: AnalysisResponse = await response.json();
      
      if (!data.success) {
        throw new Error('Analysis request failed');
      }

      console.log('✨ [useInlineAI] requestAnalysis response received:', {
        success: data.success,
        type: data.type,
        analysisLength: data.analysis?.length || 0
      });

      return data.analysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get analysis';
      console.error('❌ [useInlineAI] requestAnalysis error:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const requestIdeas = async (): Promise<string[]> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get API key for authentication
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('You are not authenticated. Please log in again.');
      }

      const contentForAPI = getContentForAPI(noteContent, noteTitle);

      console.log('💡 [useInlineAI] Calling requestIdeas with:', {
        noteId,
        noteTitle,
        platform,
        contentLength: contentForAPI.length
      });

      const response = await fetch(`${API_BASE}/note-idea-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          noteId,
          noteContent: contentForAPI,
          platform,
          limit: 5,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: IdeasResponse = await response.json();
      
      if (!data.success) {
        throw new Error('Ideas request failed');
      }

      console.log('✨ [useInlineAI] requestIdeas response received:', {
        success: data.success,
        ideasCount: data.ideas?.length || 0
      });

      return data.ideas.map(idea => idea.content);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get ideas';
      console.error('❌ [useInlineAI] requestIdeas error:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    askAI,
    requestAnalysis,
    requestIdeas,
    isLoading,
    error,
  };
} 
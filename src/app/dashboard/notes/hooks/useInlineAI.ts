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
  emailThreadData?: {
    messages: Array<{
      from: string;
      body: string;
      timestamp: number;
    }>;
    subject: string;
    brandName: string;
    recipientEmail: string;
  };
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

const getContentForAPI = (content: string, title?: string, emailThreadData?: any): string => {
  // For email replies, don't use the note content at all - use email thread context
  if (emailThreadData) {
    return "EMAIL REPLY CONTEXT: The user is writing a direct email response.";
  }
  
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
  emailThreadData,
}: UseInlineAIProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to format email thread context for AI
  const getEmailThreadContext = (): string => {
    if (!emailThreadData) {
      console.log('[DEBUG] No email thread data available for AI context');
      return '';
    }
    
    const { messages, subject, brandName, recipientEmail } = emailThreadData;
    
    console.log('[DEBUG] Formatting email context for AI:', {
      hasMessages: !!messages,
      messageCount: messages?.length || 0,
      firstMessageLength: messages?.[0]?.body?.length || 0,
      firstMessage: messages?.[0]?.body?.substring(0, 100) + '...',
      subject,
      brandName,
      recipientEmail
    });
    
    let context = `\n\nEMAIL REPLY CONTEXT:\n`;
    context += `You are drafting an EMAIL REPLY to: ${recipientEmail}\n`;
    context += `Their company/brand: ${brandName}\n`;
    context += `Email subject: ${subject}\n`;
    context += `\nOriginal Email Content:\n`;
    
    messages.forEach((msg, index) => {
      const date = new Date(msg.timestamp).toLocaleDateString();
      context += `\n--- Email from ${msg.from} (${date}) ---\n${msg.body}\n`;
    });
    
    context += `\n--- END OF EMAIL THREAD ---\n\n`;
    context += `IMPORTANT INSTRUCTIONS:\n`;
    context += `- Use your established persona/profile when responding\n`;
    context += `- Write a direct, professional email reply that addresses their specific message\n`;
    context += `- Respond to what they actually said, don't ask generic partnership questions\n`;
    context += `- Be contextual and specific to their email content\n\n`;
    
    console.log('[DEBUG] Final AI context length:', context.length);
    console.log('[DEBUG] Context preview:', context.substring(0, 400) + '...');
    
    return context;
  };

  const askAI = async (userPrompt: string): Promise<string> => {
    setIsLoading(true);
    setError(null);

    try {
      // Get API key for authentication
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('You are not authenticated. Please log in again.');
      }

      const contentForAPI = getContentForAPI(noteContent, noteTitle, emailThreadData);
      const emailContext = getEmailThreadContext();
      
      // Combine content with email context for better AI responses
      const contextualContent = emailContext ? `${contentForAPI}${emailContext}` : contentForAPI;

      console.log('[useInlineAI] Calling askAI with email context:', {
        noteId,
        noteTitle,
        platform,
        userPrompt: userPrompt.substring(0, 50) + '...',
        contentLength: contextualContent.length,
        hasEmailContext: !!emailThreadData
      });

      const response = await fetch(`${API_BASE}/generic-writing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          noteId,
          noteContent: contextualContent,
          userPrompt: emailThreadData ? 
            `You are writing an email reply. ${userPrompt}` : 
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

      console.log('[useInlineAI] askAI response received:', {
        success: data.success,
        continuationLength: data.continuation?.length || 0
      });

      return data.continuation;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get AI response';
      console.error('[useInlineAI] askAI error:', errorMessage);
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

      const contentForAPI = getContentForAPI(noteContent, noteTitle, emailThreadData);
      const emailContext = getEmailThreadContext();
      
      // Combine content with email context for better AI responses
      const contextualContent = emailContext ? `${contentForAPI}${emailContext}` : contentForAPI;

      console.log('[useInlineAI] Calling requestAnalysis with email context:', {
        noteId,
        noteTitle,
        platform,
        noteType,
        contentLength: contextualContent.length,
        hasEmailContext: !!emailThreadData
      });

      const response = await fetch(`${API_BASE}/smart-note-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          noteId,
          noteContent: contextualContent,
          noteType: emailThreadData ? 
            `email_reply_${noteType}` : 
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

      console.log('[useInlineAI] requestAnalysis response received:', {
        success: data.success,
        type: data.type,
        analysisLength: data.analysis?.length || 0
      });

      return data.analysis;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get analysis';
      console.error('[useInlineAI] requestAnalysis error:', errorMessage);
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

      const contentForAPI = getContentForAPI(noteContent, noteTitle, emailThreadData);
      const emailContext = getEmailThreadContext();
      
      // Combine content with email context for better AI responses
      const contextualContent = emailContext ? `${contentForAPI}${emailContext}` : contentForAPI;

      console.log('[useInlineAI] Calling requestIdeas with email context:', {
        noteId,
        noteTitle,
        platform,
        contentLength: contextualContent.length,
        hasEmailContext: !!emailThreadData
      });

      const response = await fetch(`${API_BASE}/note-idea-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          noteId,
          noteContent: contextualContent,
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

      console.log('[useInlineAI] requestIdeas response received:', {
        success: data.success,
        ideasCount: data.ideas?.length || 0
      });

      return data.ideas.map(idea => idea.content);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get ideas';
      console.error('[useInlineAI] requestIdeas error:', errorMessage);
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

"use client";

import { useState } from 'react';
import { getApiKey } from '@/app/lib/api-helpers';

interface UseEmailAIProps {
  emailContent: string;
  emailSubject?: string;
  recipientEmail?: string;
  brandName?: string;
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
  editorRef: React.RefObject<HTMLDivElement>;
}

interface GenericWritingResponse {
  success: boolean;
  continuation: string;
  metadata?: any;
}

const API_BASE = "/api/smart_note_inline";

export function useEmailAI({
  emailContent,
  emailSubject,
  recipientEmail,
  brandName,
  userId,
  emailThreadData,
  editorRef
}: UseEmailAIProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper to format email thread context for AI
  const getEmailThreadContext = (): string => {
    if (!emailThreadData) {
      return '';
    }
    
    const { messages, subject, brandName: threadBrandName, recipientEmail: threadRecipientEmail } = emailThreadData;
    
    let context = `\n\nEMAIL REPLY CONTEXT:\n`;
    context += `You are drafting an EMAIL REPLY to: ${threadRecipientEmail || recipientEmail}\n`;
    context += `Their company/brand: ${threadBrandName || brandName}\n`;
    context += `Email subject: ${subject || emailSubject}\n`;
    context += `\nOriginal Email Content:\n`;
    
    messages.forEach((msg, index) => {
      const date = new Date(msg.timestamp).toLocaleDateString();
      context += `\n--- Email from ${msg.from} (${date}) ---\n${msg.body}\n`;
    });
    
    context += `\n--- END OF EMAIL THREAD ---\n\n`;
    context += `IMPORTANT INSTRUCTIONS:\n`;
    context += `- Write a direct, professional email reply that addresses their specific message\n`;
    context += `- Respond to what they actually said, don't ask generic partnership questions\n`;
    context += `- Be contextual and specific to their email content\n`;
    context += `- Return ONLY the email content to be inserted, no extra formatting\n\n`;
    
    return context;
  };

  // Insert text into the editor at cursor position
  const insertTextIntoEditor = (text: string) => {
    if (!editorRef.current) return;

    editorRef.current.focus();
    
    // Try to insert at cursor position
    const success = document.execCommand('insertText', false, text);
    
    if (!success) {
      // Fallback: append to the end of the editor
      const currentContent = editorRef.current.innerHTML;
      editorRef.current.innerHTML = currentContent + text;
    }
    
    // Update content and move cursor to end
    const selection = window.getSelection();
    if (selection) {
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };

  const processEmailAI = async (userPrompt: string): Promise<void> => {
    setIsProcessing(true);
    setError(null);

    try {
      // Get API key for authentication
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('You are not authenticated. Please log in again.');
      }

      const emailContext = getEmailThreadContext();
      const contextualContent = `EMAIL REPLY CONTEXT: The user is writing a direct email response.${emailContext}`;

      console.log('📧 [useEmailAI] Processing email AI request:', {
        userPrompt: userPrompt.substring(0, 50) + '...',
        contextLength: contextualContent.length,
        hasEmailContext: !!emailThreadData
      });

      const response = await fetch(`${API_BASE}/generic-writing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          noteContent: contextualContent,
          userPrompt: userPrompt,
          title: `Email Reply: ${emailSubject || 'Partnership Email'}`,
          platform: 'partnerships',
          tags: ['email-reply', 'partnership', brandName].filter(Boolean),
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

      console.log('✨ [useEmailAI] AI response received:', {
        success: data.success,
        responseLength: data.continuation?.length || 0
      });

      // Insert the AI response directly into the editor
      if (data.continuation) {
        console.log('📝 [useEmailAI] Inserting AI response into editor');
        insertTextIntoEditor(data.continuation);
        console.log('✅ [useEmailAI] Text insertion completed successfully');
      } else {
        console.warn('⚠️ [useEmailAI] No continuation text received');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get AI response';
      console.error('❌ [useEmailAI] Error:', errorMessage);
      setError(errorMessage);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const refineEmailText = async (selectedText: string, refinementPrompt: string): Promise<void> => {
    setIsProcessing(true);
    setError(null);

    try {
      // Get API key for authentication
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('You are not authenticated. Please log in again.');
      }

      const emailContext = getEmailThreadContext();
      const contextualContent = `EMAIL REPLY CONTEXT: The user is writing a direct email response.${emailContext}`;

      console.log('🔧 [useEmailAI] Processing text refinement:', {
        selectedTextLength: selectedText.length,
        refinementPrompt: refinementPrompt.substring(0, 50) + '...',
        hasEmailContext: !!emailThreadData
      });

      const fullPrompt = `Please refine this email text: "${selectedText}"\n\nRefinement request: ${refinementPrompt}\n\nReturn ONLY the refined text, nothing else.`;

      const response = await fetch(`${API_BASE}/generic-writing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          noteContent: contextualContent,
          userPrompt: fullPrompt,
          title: `Email Reply: ${emailSubject || 'Partnership Email'}`,
          platform: 'email',
          tags: ['email-reply', 'partnership', 'refinement', brandName].filter(Boolean),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: GenericWritingResponse = await response.json();
      
      if (!data.success) {
        throw new Error('Text refinement failed');
      }

      console.log('✨ [useEmailAI] Refinement response received:', {
        success: data.success,
        refinedLength: data.continuation?.length || 0
      });

      // Replace the selected text with the refined version
      if (data.continuation && editorRef.current) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          range.insertNode(document.createTextNode(data.continuation));
          
          // Move cursor to end of replaced text
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        } else {
          // Fallback: just insert the refined text
          insertTextIntoEditor(data.continuation);
        }
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refine text';
      console.error('❌ [useEmailAI] Refinement error:', errorMessage);
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    processEmailAI,
    refineEmailText,
    isProcessing,
    error,
  };
} 
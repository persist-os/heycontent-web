'use client';

import { useState, useCallback } from 'react';
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
}

const API_BASE = '/api/smart_note_inline';

// Helper to format email thread context for AI
const getEmailThreadContext = (emailThreadData?: UseEmailAIProps['emailThreadData']): string => {
  if (!emailThreadData) {
    return '';
  }
  
  const { messages, subject, brandName, recipientEmail } = emailThreadData;
  
  let context = `\n\n=== EMAIL REPLY CONTEXT ===\n`;
  context += `RECIPIENT: ${recipientEmail}\n`;
  context += `COMPANY/BRAND: ${brandName}\n`;
  context += `SUBJECT: ${subject}\n`;
  context += `\n--- EMAIL THREAD HISTORY ---\n`;
  
  messages.forEach((msg, idx) => {
    const date = new Date(msg.timestamp).toLocaleDateString();
    context += `\n[Message ${idx + 1}] From: ${msg.from} | Date: ${date}\n${msg.body}\n`;
  });
  
  context += `\n--- END OF THREAD ---\n\n`;
  context += `EMAIL REPLY GUIDELINES:\n`;
  context += `- Write a professional, contextual email reply that directly addresses their message\n`;
  context += `- Respond to what they ACTUALLY said - be specific and relevant\n`;
  context += `- Use your established persona/profile and voice\n`;
  context += `- Keep it concise and focused - professional but warm\n`;
  context += `- DO NOT ask generic partnership questions if they didn't ask about partnerships\n`;
  context += `- DO NOT use fake information - use placeholders like [SPECIFIC DETAIL] if needed\n`;
  context += `- Match the tone and formality level of their email\n\n`;
  
  return context;
};

// Helper to insert text into contentEditable div
const insertTextIntoEditor = (
  editorRef: React.RefObject<HTMLDivElement>,
  text: string
): void => {
  if (!editorRef.current) {
    console.warn('⚠️ [useEmailAI] Editor ref not available');
    return;
  }

  const editor = editorRef.current;
  editor.focus();

  // Get current selection
  const selection = window.getSelection();
  const range = selection?.rangeCount ? selection.getRangeAt(0) : null;

  if (range && editor.contains(range.commonAncestorContainer)) {
    // Insert at cursor position
    range.deleteContents();
    const textNode = document.createTextNode(text);
    range.insertNode(textNode);
    range.setStartAfter(textNode);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
  } else {
    // Insert at end
    const textNode = document.createTextNode(text);
    editor.appendChild(textNode);
    
    // Move cursor to end
    const newRange = document.createRange();
    newRange.selectNodeContents(editor);
    newRange.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(newRange);
  }

  // Trigger input event to update content state
  const event = new Event('input', { bubbles: true });
  editor.dispatchEvent(event);
};

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

  // Process AI prompt and insert result into editor
  const processEmailAI = useCallback(async (prompt: string): Promise<void> => {
    setIsProcessing(true);

    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Build email context
      const emailContext = emailThreadData ? getEmailThreadContext(emailThreadData) : '';
      
      // Build comprehensive email composition context
      let contextualContent = `=== EMAIL COMPOSITION CONTEXT ===\n`;
      contextualContent += `TASK: ${emailThreadData ? 'Writing an email REPLY' : 'Composing a NEW email'}\n`;
      
      if (emailThreadData) {
        contextualContent += emailContext;
      } else {
        contextualContent += `RECIPIENT: ${recipientEmail || '[RECIPIENT EMAIL]'}\n`;
        contextualContent += `SUBJECT: ${emailSubject || '[EMAIL SUBJECT]'}\n`;
        if (brandName) {
          contextualContent += `RECIPIENT COMPANY/BRAND: ${brandName}\n`;
        }
        contextualContent += `\nEMAIL COMPOSITION GUIDELINES:\n`;
        contextualContent += `- Write a professional, clear email appropriate for the recipient\n`;
        contextualContent += `- Use your established persona/profile and voice\n`;
        contextualContent += `- Keep it concise and focused - get to the point quickly\n`;
        contextualContent += `- DO NOT use fake information - use placeholders like [SPECIFIC DETAIL] if needed\n`;
        contextualContent += `- Structure: Clear greeting, main message, call-to-action if needed, professional closing\n`;
        contextualContent += `- Match the appropriate tone (formal vs casual) based on recipient relationship\n\n`;
      }

      // Enhanced prompt with email-specific instructions
      const enhancedPrompt = emailThreadData
        ? `EMAIL REPLY TASK: ${prompt}\n\nWrite a professional email reply that directly addresses their message. Be specific, contextual, and relevant. Use placeholders like [SPECIFIC DETAIL] instead of fake information.`
        : `EMAIL COMPOSITION TASK: ${prompt}\n\nWrite a professional email appropriate for the recipient. Be clear, concise, and purposeful. Use placeholders like [SPECIFIC DETAIL] instead of fake information.`;

      console.log('🤖 [useEmailAI] Calling AI with email context:', {
        prompt: prompt.substring(0, 50) + '...',
        hasEmailThreadData: !!emailThreadData,
        recipientEmail,
        subject: emailSubject
      });

      const response = await fetch(`${API_BASE}/generic-writing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          noteContent: contextualContent,
          userPrompt: enhancedPrompt,
          title: `Email ${emailThreadData ? 'Reply' : 'Compose'}: ${emailSubject || 'New Email'}`,
          platform: 'email',
          tags: ['email', emailThreadData ? 'reply' : 'compose', brandName].filter(Boolean),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: GenericWritingResponse = await response.json();
      
      if (!data.success || !data.continuation) {
        throw new Error('AI request failed');
      }

      console.log('✨ [useEmailAI] AI response received, inserting into editor');

      // Insert the AI response into the editor
      insertTextIntoEditor(editorRef, data.continuation);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get AI response';
      console.error('❌ [useEmailAI] processEmailAI error:', errorMessage);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [emailContent, emailSubject, recipientEmail, brandName, emailThreadData, editorRef]);

  // Refine selected text (for refinement preview)
  const refineEmailText = useCallback(async (refinementPrompt: string, text: string): Promise<string> => {
    setIsProcessing(true);

    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Build email context for refinement
      const emailContext = emailThreadData ? getEmailThreadContext(emailThreadData) : '';
      
      let contextualContent = `=== EMAIL TEXT REFINEMENT CONTEXT ===\n`;
      contextualContent += `TASK: Refining email text for better clarity, tone, or effectiveness\n`;
      if (emailContext) {
        contextualContent += emailContext;
      } else {
        contextualContent += `RECIPIENT: ${recipientEmail || '[RECIPIENT]'}\n`;
        contextualContent += `SUBJECT: ${emailSubject || '[SUBJECT]'}\n`;
      }
      contextualContent += `\nREFINEMENT GUIDELINES:\n`;
      contextualContent += `- Maintain professional tone appropriate for email\n`;
      contextualContent += `- Improve clarity, conciseness, and impact\n`;
      contextualContent += `- Keep the core message intact\n`;
      contextualContent += `- Preserve placeholders - do NOT replace with fake information\n`;
      contextualContent += `- Ensure proper email structure and flow\n\n`;
      
      const fullPrompt = `REFINE THIS EMAIL TEXT:\n\n"${text}"\n\nREFINEMENT REQUEST: ${refinementPrompt}\n\nReturn ONLY the refined email text. Maintain placeholders, improve clarity and tone, keep it professional and appropriate for email communication.`;

      const response = await fetch(`${API_BASE}/generic-writing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          noteContent: contextualContent,
          userPrompt: fullPrompt,
          title: `Email Refinement: ${emailSubject || 'Partnership Email'}`,
          platform: 'email',
          tags: ['email-reply', 'partnership', 'refinement', brandName].filter(Boolean),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data: GenericWritingResponse = await response.json();
      
      if (!data.success || !data.continuation) {
        throw new Error('Text refinement failed');
      }

      return data.continuation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to refine text';
      console.error('❌ [useEmailAI] refineEmailText error:', errorMessage);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [emailSubject, brandName, emailThreadData]);

  return {
    processEmailAI,
    refineEmailText,
    isProcessing
  };
}


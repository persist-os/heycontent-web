'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Send, 
  X, 
  Bold, 
  Italic, 
  Underline,
  Sparkles,
  AtSign,
  Save,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { EmailCommandPalette } from './EmailCommandPalette';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { useInlineReply } from '@/app/context/inline-reply-context';
import { useEmailAI } from '../hooks/useEmailAI';

interface InlineEmailReplyProps {
  isOpen: boolean;
  onClose: () => void;
  onSend: (content: string) => void;
  onSaveDraft: (content: string) => void;
  initialContext?: string;
  initialContent?: string; // New prop for initial email body content
  recipientEmail?: string;
  subject?: string;
  className?: string;
  brandName?: string;
  composeMode?: boolean; // New prop to distinguish between reply and compose modes
  emailContext?: 'compose' | 'reply'; // New prop for context-aware command palette
  themeColor?: string; // Theme color for styling buttons and elements
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

// Operation status types
type OperationStatus = 'idle' | 'loading' | 'success' | 'error';

interface OperationState {
  send: OperationStatus;
  draft: OperationStatus;
  message: string;
  error: string | null;
}

export function InlineEmailReply({
  isOpen,
  onClose,
  onSend,
  onSaveDraft,
  initialContext,
  initialContent = '', // New prop for initial email body content
  recipientEmail,
  subject,
  className = '',
  brandName,
  composeMode = false, // Default to reply mode for backward compatibility
  emailContext,
  themeColor = '#FFDF39', // Default to HeyContext Yellow
  emailThreadData
}: InlineEmailReplyProps) {
  const [content, setContent] = useState(initialContent || '');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandPalettePosition, setCommandPalettePosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [pendingRefinedText, setPendingRefinedText] = useState<string | null>(null);
  const [lastSelection, setLastSelection] = useState<Range | null>(null);

  // Theme color logic
  const isYellow = themeColor === '#FFDF39';
  const buttonClasses = isYellow 
    ? 'bg-yellow-600 hover:bg-yellow-700' 
    : 'bg-primary hover:bg-primary/90';
  
  const buttonStyle = !isYellow ? {
    backgroundColor: themeColor,
    '--tw-bg-opacity': '1'
  } as React.CSSProperties : undefined;
  
  // Operation states
  const [operationState, setOperationState] = useState<OperationState>({
    send: 'idle',
    draft: 'idle',
    message: '',
    error: null
  });

  const editorRef = useRef<HTMLDivElement>(null);
  const { setIsInlineReplyActive } = useInlineReply();

  // Clear status after delay
  useEffect(() => {
    if (operationState.send === 'success' || operationState.draft === 'success') {
      const timer = setTimeout(() => {
        setOperationState(prev => ({
          ...prev,
          send: prev.send === 'success' ? 'idle' : prev.send,
          draft: prev.draft === 'success' ? 'idle' : prev.draft,
          message: '',
          error: null
        }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [operationState.send, operationState.draft]);

  // Initialize the email AI hook with direct insertion
  const { processEmailAI, refineEmailText, isProcessing } = useEmailAI({
    emailContent: content,
    emailSubject: subject,
    recipientEmail: recipientEmail,
    brandName: brandName,
    userId: getCurrentUserId() ?? '',
    emailThreadData: emailThreadData,
    editorRef: editorRef
  });

  // Debug: Log the emailThreadData being passed
  useEffect(() => {
    console.log('📧 [DEBUG] InlineEmailReply context:', {
      composeMode,
      hasEmailThreadData: !!emailThreadData,
      messageCount: emailThreadData?.messages?.length || 0,
      firstMessage: emailThreadData?.messages?.[0]?.body?.substring(0, 150) + '...',
      threadSubject: emailThreadData?.subject,
      threadBrandName: emailThreadData?.brandName,
      manualSubject: subject,
      recipientEmail,
      brandName,
      contextType: emailThreadData ? 'Reply (has thread data)' : 'Compose (manual inputs)'
    });
  }, [emailThreadData, composeMode, recipientEmail, subject, brandName]);

  // Set inline reply as active when component mounts
  useEffect(() => {
    if (isOpen) {
      setIsInlineReplyActive(true);
      return () => setIsInlineReplyActive(false);
    }
  }, [isOpen, setIsInlineReplyActive]);

  // Remove the automatic context insertion - keep editor clean
  useEffect(() => {
    if (isOpen && !isInitialized) {
      setIsInitialized(true);
      
      // Set initial content if provided
      if (initialContent && editorRef.current) {
        editorRef.current.innerHTML = initialContent;
        setContent(initialContent);
      }
      
      // Just focus the editor without inserting context
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen, isInitialized, initialContent]);

  // Sync content when initialContent changes (for artifact updates)
  useEffect(() => {
    if (initialContent && editorRef.current && editorRef.current.innerHTML !== initialContent) {
      editorRef.current.innerHTML = initialContent;
      setContent(initialContent);
    }
  }, [initialContent]);

  // Helper to save the current selection with more robust handling
  const saveCurrentSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && editorRef.current) {
      const range = selection.getRangeAt(0);
      // Ensure the range is within our editor
      if (editorRef.current.contains(range.commonAncestorContainer)) {
        setLastSelection(range.cloneRange());
        console.log('💾 [InlineEmailReply] Selection saved:', {
          startOffset: range.startOffset,
          endOffset: range.endOffset,
          selectedText: range.toString()
        });
      }
    }
  };

  // Helper to restore selection with validation
  const restoreSelection = () => {
    if (lastSelection && editorRef.current) {
      try {
        const selection = window.getSelection();
        if (selection) {
          // Ensure editor is focused first
          editorRef.current.focus();
          selection.removeAllRanges();
          selection.addRange(lastSelection);
          console.log('🔄 [InlineEmailReply] Selection restored');
          return true;
        }
      } catch (error) {
        console.warn('⚠️ [InlineEmailReply] Failed to restore selection:', error);
        return false;
      }
    }
    return false;
  };

  // Helper to replace text at a specific range with better error handling
  const replaceTextAtRange = (range: Range, newText: string) => {
    try {
      if (!editorRef.current) {
        throw new Error('Editor ref not available');
      }

      // Ensure editor is focused
      editorRef.current.focus();
      
      // Delete the selected content
      range.deleteContents();
      
      // Insert the new text as a text node
      const textNode = document.createTextNode(newText);
      range.insertNode(textNode);
      
      // Position cursor at the end of inserted text
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      range.collapse(false);
      
      // Update selection to new position
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      
      // Update the content state
      updateContentFromEditor();
      
      console.log('✅ [InlineEmailReply] Text replaced successfully');
    } catch (error) {
      console.error('❌ [InlineEmailReply] Text replacement failed:', error);
      // Fallback: try to insert at current cursor position
      if (editorRef.current) {
        editorRef.current.focus();
        document.execCommand('insertText', false, newText);
        updateContentFromEditor();
      }
    }
  };

  // New refinement handler that returns refined text for preview
  const handleRefineTextForPreview = useCallback(async (refinementPrompt: string, text: string): Promise<string> => {
    try {
      // Save the current selection so we can apply changes later
      saveCurrentSelection();
      
      console.log('🔧 [InlineEmailReply] Starting refinement for preview:', {
        prompt: refinementPrompt,
        textLength: text.length,
        hasSelection: !!lastSelection
      });

      // Call the backend to get refined text (modified to return string instead of applying directly)
      const refinedText = await getRefinedTextFromAPI(refinementPrompt, text);
      
      console.log('✨ [InlineEmailReply] Refinement preview ready:', {
        originalLength: text.length,
        refinedLength: refinedText.length,
        selectionSaved: !!lastSelection
      });

      // Store the refined text for later application
      setPendingRefinedText(refinedText);
      
      return refinedText;
    } catch (error) {
      console.error('❌ [InlineEmailReply] Refinement preview failed:', error);
      // Clean up on error
      setPendingRefinedText(null);
      setLastSelection(null);
      throw error;
    }
  }, [lastSelection]);

  // Helper function to call the refinement API and return the text
  const getRefinedTextFromAPI = async (refinementPrompt: string, text: string): Promise<string> => {
    const { getApiKey } = await import('@/app/lib/api-helpers');
    const key = await getApiKey();
    
    if (!key) {
      throw new Error('Authentication required');
    }

    const emailContext = emailThreadData ? `
EMAIL THREAD CONTEXT:
Subject: ${emailThreadData.subject}
Brand: ${emailThreadData.brandName}
Recipient: ${emailThreadData.recipientEmail}

Previous messages:
${emailThreadData.messages.map(msg => `From ${msg.from}: ${msg.body}`).join('\n\n')}
    `.trim() : '';

    const contextualContent = `EMAIL REPLY CONTEXT: The user is writing a direct email response.${emailContext}`;
    const fullPrompt = `Please refine this email text: "${text}"\n\nRefinement request: ${refinementPrompt}\n\nReturn ONLY the refined text, nothing else.`;

    const response = await fetch('/api/smart_note_inline/generic-writing', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${key}`,
      },
      body: JSON.stringify({
        noteContent: contextualContent,
        userPrompt: fullPrompt,
        title: `Email Reply: ${subject || 'Partnership Email'}`,
        platform: 'email',
        tags: ['email-reply', 'partnership', 'refinement', brandName].filter(Boolean),
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.continuation) {
      throw new Error('Text refinement failed');
    }

    return data.continuation;
  };

  // Accept refinement handler
  const handleAcceptRefinement = useCallback(async () => {
    if (!pendingRefinedText || !lastSelection) {
      console.warn('⚠️ [InlineEmailReply] Cannot accept refinement - missing data:', {
        hasPendingText: !!pendingRefinedText,
        hasLastSelection: !!lastSelection
      });
      return;
    }

    try {
      console.log('✅ [InlineEmailReply] Accepting refinement:', {
        textLength: pendingRefinedText.length,
        selectionValid: !!lastSelection
      });
      
      // Try to restore selection first
      const selectionRestored = restoreSelection();
      
      if (selectionRestored && lastSelection) {
        // Use the restored selection
        replaceTextAtRange(lastSelection, pendingRefinedText);
      } else {
        // Fallback: insert at current cursor position
        console.log('🔄 [InlineEmailReply] Using fallback insertion method');
        if (editorRef.current) {
          editorRef.current.focus();
          document.execCommand('insertText', false, pendingRefinedText);
          updateContentFromEditor();
        }
      }
      
      // Clean up
      setPendingRefinedText(null);
      setLastSelection(null);
      
      console.log('🎉 [InlineEmailReply] Refinement accepted and applied');
    } catch (error) {
      console.error('❌ [InlineEmailReply] Failed to accept refinement:', error);
      // Don't throw - just clean up
      setPendingRefinedText(null);
      setLastSelection(null);
    }
  }, [pendingRefinedText, lastSelection]);

  // Reject refinement handler
  const handleRejectRefinement = useCallback(async () => {
    console.log('❌ [InlineEmailReply] Rejecting refinement');
    
    // Just clean up the pending state
    setPendingRefinedText(null);
    setLastSelection(null);
  }, []);

  // Retry refinement handler
  const handleRetryRefinement = useCallback(async (): Promise<string> => {
    if (!selectedText || !lastSelection) {
      throw new Error('No text selected for retry');
    }

    console.log('🔄 [InlineEmailReply] Retrying refinement');
    
    // Use the same refinement prompt as before, but generate a new result
    // For retry, we'll use a generic "improve this text" prompt
    return handleRefineTextForPreview('improve and enhance this text', selectedText);
  }, [selectedText, lastSelection, handleRefineTextForPreview]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Disable shortcuts during operations
      const isOperating = operationState.send === 'loading' || operationState.draft === 'loading';
      if (isOperating) return;

      // Check if command palette is open - prevent other shortcuts when it is
      if (showCommandPalette && e.key !== 'Escape') {
        return;
      }

      // Handle specific key combinations with exact matching
      const isMetaOrCtrl = e.metaKey || e.ctrlKey;
      
      if (isMetaOrCtrl) {
        switch (e.key.toLowerCase()) {
          case 'k':
            // Only trigger if it's exactly Cmd/Ctrl+K (no other modifiers)
            // AND if the editor is focused (to prevent multiple instances responding)
            if (!e.shiftKey && !e.altKey && document.activeElement === editorRef.current) {
              e.preventDefault();
              e.stopPropagation();
              handleOpenCommandPalette();
            }
            break;
          case 'enter':
            // Cmd/Ctrl + Enter to send
            e.preventDefault();
            e.stopPropagation();
            handleSend();
            break;
          case 's':
            // Cmd/Ctrl + S to save as draft
            e.preventDefault();
            e.stopPropagation();
            handleSaveAsDraft();
            break;
          case 'b':
            // Bold formatting
            e.preventDefault();
            execCommand('bold');
            break;
          case 'i':
            // Italic formatting
            e.preventDefault();
            execCommand('italic');
            break;
          case 'u':
            // Underline formatting
            e.preventDefault();
            execCommand('underline');
            break;
        }
      } else if (e.key === 'Escape' && !showCommandPalette) {
        // Escape to close (only when command palette is not open)
        e.preventDefault();
        onClose();
      }
    };

    // Use capture phase to ensure we handle events before other components
    document.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => document.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [isOpen, showCommandPalette, content, operationState]);

  const execCommand = (command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
      updateContentFromEditor();
    }
  };

  const updateContentFromEditor = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setContent(newContent);
    }
  };

  // Helper function to check if content is truly empty (ignoring HTML tags)
  const isContentEmpty = () => {
    if (!content) return true;
    
    // Create a temporary div to extract text content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const textContent = tempDiv.textContent || tempDiv.innerText || '';
    
    // Check if there's any actual text (ignoring whitespace)
    return textContent.trim().length === 0;
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    updateContentFromEditor();
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
    updateContentFromEditor();
  };

  const handleOpenCommandPalette = () => {
    console.log('🚀 [InlineEmailReply] Opening command palette', { composeMode, emailContext });
    
    // Prevent opening if already open
    if (showCommandPalette) {
      console.log('⚠️ [InlineEmailReply] Command palette already open, ignoring');
      return;
    }

    // Ensure editor is focused first
    if (editorRef.current) {
      editorRef.current.focus();
    }

    const selection = window.getSelection();
    const selectedText = selection?.toString() || '';
    setSelectedText(selectedText);

    console.log('📝 [InlineEmailReply] Selected text for refinement:', {
      hasSelection: !!selectedText,
      textLength: selectedText.length,
      preview: selectedText.substring(0, 50) + (selectedText.length > 50 ? '...' : '')
    });

    // Save the current selection for later use
    saveCurrentSelection();

    // Get cursor position for palette placement
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      setCommandPalettePosition({
        left: rect.left + (rect.width / 2),
        top: rect.bottom + 10
      });
    } else if (editorRef.current) {
      const rect = editorRef.current.getBoundingClientRect();
      setCommandPalettePosition({
        left: rect.left + 20,
        top: rect.top + 100
      });
    }

    setShowCommandPalette(true);
  };

  const handleCloseCommandPalette = () => {
    setShowCommandPalette(false);
    setSelectedText('');
    editorRef.current?.focus();
  };

  // AI handlers that use the email AI hook - text insertion is handled internally
  const handleAskAI = useCallback(async (prompt: string) => {
    try {
      // The email AI hook handles text insertion automatically
      await processEmailAI(prompt);
      updateContentFromEditor();
      handleCloseCommandPalette();
    } catch (error) {
      console.error('Failed to get AI response:', error);
    }
  }, [processEmailAI]);

  const handleSend = async () => {
    if (isContentEmpty() || operationState.send === 'loading') return;
    
    setOperationState(prev => ({
      ...prev,
      send: 'loading',
      error: null,
      message: 'Sending email...'
    }));

    // Preserve HTML content for rich email formatting
    const htmlContent = content;
    
    // Also create plain text version for the parent handler
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const plainTextContent = tempDiv.textContent || tempDiv.innerText || '';
    
    try {
      // Get API key for authentication
      const { getApiKey } = await import('@/app/lib/api-helpers');
      const key = await getApiKey();
      
      if (!key) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Send email via Gmail API with HTML content
      const response = await fetch('/api/social/gmail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
          to: recipientEmail,
          subject: `Re: ${subject || 'Partnership Opportunity'}`,
          body: htmlContent,
          is_html: true
          // Note: Omitting thread_id since we don't have access to the actual Gmail thread ID
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Email sent successfully:', data);
      
      setOperationState(prev => ({
        ...prev,
        send: 'success',
        message: 'Email sent successfully!'
      }));
      
      // Call the parent's onSend handler for any additional processing (using plain text for compatibility)
      onSend(plainTextContent);
      
      // Keep content like draft functionality - don't clear or close
      
    } catch (error) {
      console.error('❌ Failed to send email:', error);
      setOperationState(prev => ({
        ...prev,
        send: 'error',
        error: error instanceof Error ? error.message : 'Failed to send email',
        message: ''
      }));
    }
  };

  const handleSaveAsDraft = async () => {
    if (isContentEmpty() || operationState.draft === 'loading') return;
    
    setOperationState(prev => ({
      ...prev,
      draft: 'loading',
      error: null,
      message: 'Saving draft...'
    }));

    // Preserve HTML content for rich email formatting
    const htmlContent = content;
    
    // Also create plain text version for the parent handler
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const plainTextContent = tempDiv.textContent || tempDiv.innerText || '';
    
    try {
      // Get API key for authentication
      const { getApiKey } = await import('@/app/lib/api-helpers');
      const key = await getApiKey();
      
      if (!key) {
        throw new Error('Authentication required. Please log in again.');
      }

      // Save email as draft via Gmail API with HTML content
      const response = await fetch('/api/social/gmail/drafts/create-with-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
          to: recipientEmail,
          subject: `Re: ${subject || 'Partnership Opportunity'}`,
          body: htmlContent,
          is_html: true,
          // Note: Omitting thread_id since we don't have access to the actual Gmail thread ID
          partnership_context: {
            brandName: brandName,
            recipientEmail: recipientEmail,
            originalSubject: subject,
            threadData: emailThreadData
          }
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Email draft saved successfully:', data);
      
      setOperationState(prev => ({
        ...prev,
        draft: 'success',
        message: 'Draft saved successfully!'
      }));
      
      // Call the parent's onSaveDraft handler for any additional processing (using plain text for compatibility)
      onSaveDraft(plainTextContent);
      
    } catch (error) {
      console.error('❌ Failed to save email draft:', error);
      setOperationState(prev => ({
        ...prev,
        draft: 'error',
        error: error instanceof Error ? error.message : 'Failed to save draft',
        message: ''
      }));
    }
  };

  const handleCancel = () => {
    // Don't allow canceling during operations
    if (operationState.send === 'loading' || operationState.draft === 'loading') {
      return;
    }
    
    if (!isContentEmpty()) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmClose) return;
    }
    setContent('');
    setOperationState({
      send: 'idle',
      draft: 'idle',
      message: '',
      error: null
    });
    onClose();
  };

  const handleRetryOperation = (operation: 'send' | 'draft') => {
    if (operation === 'send') {
      handleSend();
    } else {
      handleSaveAsDraft();
    }
  };

  // Helper to get status icon
  const getStatusIcon = (status: OperationStatus) => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-4 h-4 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  // Determine if any operation is in progress
  const isOperating = operationState.send === 'loading' || operationState.draft === 'loading';

  if (!isOpen) return null;

  return (
    <>
      <div className={`bg-background ${className}`}>
        <div className="border-b border-border pb-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-foreground">
              {composeMode ? 'Compose' : 'Reply'}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-8 w-8 p-0"
              disabled={isOperating}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          
          {/* Email Headers */}
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-12">To:</span>
              <span className="text-foreground">{recipientEmail || 'recipient@example.com'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground w-12">Subject:</span>
              <span className="text-foreground">
                {composeMode 
                  ? (subject || 'New Email') 
                  : `Re: ${subject || 'Partnership Opportunity'}`
                }
              </span>
            </div>
          </div>

          {/* Status Messages */}
          {(operationState.message || operationState.error) && (
            <div className="mt-3 p-3 rounded-md border">
              {operationState.error ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm font-medium">Error: {operationState.error}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRetryOperation(operationState.send === 'error' ? 'send' : 'draft')}
                    className="h-7 px-2"
                  >
                    <RefreshCw className="w-3 h-3 mr-1" />
                    Retry
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-blue-700">
                  {isOperating && <Loader2 className="w-4 h-4 animate-spin" />}
                  {operationState.send === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  {operationState.draft === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                  <span className="text-sm font-medium">{operationState.message}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          {/* Formatting Toolbar */}
          <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => execCommand('bold')}
              className="h-8 px-2"
              title="Bold (⌘B)"
              disabled={isOperating}
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => execCommand('italic')}
              className="h-8 px-2"
              title="Italic (⌘I)"
              disabled={isOperating}
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => execCommand('underline')}
              className="h-8 px-2"
              title="Underline (⌘U)"
              disabled={isOperating}
            >
              <Underline className="w-4 h-4" />
            </Button>
            <div className="w-px h-4 bg-border mx-1" />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenCommandPalette}
              className="h-8 px-2 text-primary"
              title="AI Assistant (⌘K)"
              disabled={isOperating}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Content Editor */}
          <div
            ref={editorRef}
            contentEditable={!isOperating}
            className={`min-h-[200px] p-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background relative transition-opacity ${
              isOperating ? 'opacity-60 cursor-not-allowed' : ''
            }`}
            style={{ 
              lineHeight: '1.6',
              fontSize: '14px',
              color: 'hsl(var(--foreground))',
              caretColor: 'hsl(var(--foreground))'
            }}
            onInput={handleInput}
            onPaste={handlePaste}
            onBlur={updateContentFromEditor}
            suppressContentEditableWarning={true}
          >
            {/* Placeholder when empty */}
            {isContentEmpty() && (
              <div 
                className="absolute top-3 left-3 text-muted-foreground/40 pointer-events-none select-none"
                style={{ 
                  fontSize: '14px',
                  lineHeight: '1.6',
                  zIndex: 1
                }}
              >
                {composeMode 
                  ? 'Type your email here... Press ⌘K for AI assistance'
                  : 'Type your reply here... Press ⌘K for AI assistance'
                }
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-xs text-muted-foreground">
              Press ⌘K for AI • ⌘S to save draft • ⌘Enter to send
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="px-4"
                disabled={isOperating}
              >
                Cancel
              </Button>
              <Button
                variant="outline"
                onClick={handleSaveAsDraft}
                disabled={isContentEmpty() || isOperating}
                className="px-4"
              >
                {operationState.draft === 'loading' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <>
                    {getStatusIcon(operationState.draft)}
                    <Save className="w-4 h-4 mr-2" />
                  </>
                )}
                Save as Draft
              </Button>
              <Button
                onClick={handleSend}
                disabled={isContentEmpty() || isOperating}
                className={`px-6 ${buttonClasses} text-foreground`}
                style={buttonStyle}
              >
                {operationState.send === 'loading' ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <>
                    {getStatusIcon(operationState.send)}
                    <Send className="w-4 h-4 mr-2" />
                  </>
                )}
                {composeMode ? 'Send Email' : 'Send Reply'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Command Palette */}
      <EmailCommandPalette
        isOpen={showCommandPalette}
        onClose={handleCloseCommandPalette}
        position={commandPalettePosition}
        selectedText={selectedText}
        onCustomInput={handleAskAI}
        onRefineText={handleRefineTextForPreview}
        onAcceptRefinement={handleAcceptRefinement}
        onRejectRefinement={handleRejectRefinement}
        onRetryRefinement={handleRetryRefinement}
        emailContext={emailContext || (composeMode ? 'compose' : 'reply')}
      />
    </>
  );
} 
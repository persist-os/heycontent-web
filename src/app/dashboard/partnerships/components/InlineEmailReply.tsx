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
  AtSign
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
  recipientEmail?: string;
  subject?: string;
  className?: string;
  brandName?: string;
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

export function InlineEmailReply({
  isOpen,
  onClose,
  onSend,
  onSaveDraft,
  initialContext,
  recipientEmail,
  subject,
  className = '',
  brandName,
  emailThreadData
}: InlineEmailReplyProps) {
  const [content, setContent] = useState('');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [commandPalettePosition, setCommandPalettePosition] = useState({ top: 0, left: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [pendingRefinedText, setPendingRefinedText] = useState<string | null>(null);
  const [lastSelection, setLastSelection] = useState<Range | null>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const { setIsInlineReplyActive } = useInlineReply();

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
    console.log('📧 [DEBUG] InlineEmailReply emailThreadData:', {
      hasEmailThreadData: !!emailThreadData,
      messageCount: emailThreadData?.messages?.length || 0,
      firstMessage: emailThreadData?.messages?.[0]?.body?.substring(0, 150) + '...',
      subject: emailThreadData?.subject,
      brandName: emailThreadData?.brandName
    });
  }, [emailThreadData]);

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
      
      // Just focus the editor without inserting context
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.focus();
        }
      }, 50);
    }
  }, [isOpen, isInitialized]);

  // Helper to save the current selection
  const saveCurrentSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      setLastSelection(selection.getRangeAt(0).cloneRange());
    }
  };

  // Helper to restore selection
  const restoreSelection = () => {
    if (lastSelection) {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(lastSelection);
      }
    }
  };

  // Helper to replace text at a specific range
  const replaceTextAtRange = (range: Range, newText: string) => {
    range.deleteContents();
    range.insertNode(document.createTextNode(newText));
    range.collapse(false);
    
    // Update the content state
    updateContentFromEditor();
  };

  // New refinement handler that returns refined text for preview
  const handleRefineTextForPreview = useCallback(async (refinementPrompt: string, text: string): Promise<string> => {
    try {
      // Save the current selection so we can apply changes later
      saveCurrentSelection();
      
      console.log('🔧 [InlineEmailReply] Starting refinement for preview:', {
        prompt: refinementPrompt,
        textLength: text.length
      });

      // Call the backend to get refined text (modified to return string instead of applying directly)
      const refinedText = await getRefinedTextFromAPI(refinementPrompt, text);
      
      console.log('✨ [InlineEmailReply] Refinement preview ready:', {
        originalLength: text.length,
        refinedLength: refinedText.length
      });

      // Store the refined text for later application
      setPendingRefinedText(refinedText);
      
      return refinedText;
    } catch (error) {
      console.error('❌ [InlineEmailReply] Refinement preview failed:', error);
      throw error;
    }
  }, []);

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
    if (!pendingRefinedText || !lastSelection) return;

    try {
      console.log('✅ [InlineEmailReply] Accepting refinement');
      
      // Restore selection and replace the text
      restoreSelection();
      
      if (lastSelection) {
        replaceTextAtRange(lastSelection, pendingRefinedText);
      }
      
      // Clean up
      setPendingRefinedText(null);
      setLastSelection(null);
      
      console.log('🎉 [InlineEmailReply] Refinement accepted and applied');
    } catch (error) {
      console.error('❌ [InlineEmailReply] Failed to accept refinement:', error);
      throw error;
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

      // Cmd/Ctrl + K for AI palette
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        handleOpenCommandPalette();
      }

      // Cmd/Ctrl + Enter to send
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSend();
      }

      // Escape to close
      if (e.key === 'Escape' && !showCommandPalette) {
        e.preventDefault();
        onClose();
      }

      // Text formatting shortcuts
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case 'b':
            e.preventDefault();
            execCommand('bold');
            break;
          case 'i':
            e.preventDefault();
            execCommand('italic');
            break;
          case 'u':
            e.preventDefault();
            execCommand('underline');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showCommandPalette, content]);

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
    const selection = window.getSelection();
    const selectedText = selection?.toString() || '';
    setSelectedText(selectedText);

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

  const handleSend = () => {
    if (!content.trim()) return;
    
    // Convert HTML to plain text for email MIME
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const plainTextContent = tempDiv.textContent || tempDiv.innerText || '';
    
    onSend(plainTextContent);
    setContent('');
    onClose();
  };

  const handleCancel = () => {
    if (content.trim()) {
      const confirmClose = window.confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmClose) return;
    }
    setContent('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={`bg-background ${className}`}>
        <div className="border-b border-border pb-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-foreground">Reply</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-8 w-8 p-0"
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
              <span className="text-foreground">Re: {subject || 'Partnership Opportunity'}</span>
            </div>
          </div>
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
            >
              <Bold className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => execCommand('italic')}
              className="h-8 px-2"
              title="Italic (⌘I)"
            >
              <Italic className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => execCommand('underline')}
              className="h-8 px-2"
              title="Underline (⌘U)"
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
            >
              <Sparkles className="w-4 h-4" />
            </Button>
          </div>

          {/* Content Editor */}
          <div
            ref={editorRef}
            contentEditable
            className="min-h-[200px] p-3 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 bg-background text-foreground relative"
            style={{ 
              lineHeight: '1.6',
              fontSize: '14px'
            }}
            onInput={handleInput}
            onPaste={handlePaste}
            onBlur={updateContentFromEditor}
            suppressContentEditableWarning={true}
          >
            {/* Placeholder when empty */}
            {!content && (
              <div 
                className="absolute top-3 left-3 text-muted-foreground/50 pointer-events-none"
                style={{ fontSize: '14px' }}
              >
                Type your reply here... Press ⌘K for AI assistance
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-xs text-muted-foreground">
              Press ⌘K for AI • ⌘Enter to send
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="px-4"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSend}
                disabled={!content.trim()}
                className="px-6 bg-primary hover:bg-primary/90"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Reply
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
      />
    </>
  );
} 
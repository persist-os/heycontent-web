'use client';

import React, { forwardRef, useImperativeHandle, useEffect } from 'react';
import { LexicalNotepadEditor, LexicalNotepadEditorRef } from '@/components/ui/lexical-editor/LexicalNotepadEditor';
import { PresenceProvider } from '../PresenceProvider';
import { CollaboratorPanel } from '../CollaboratorPanel';
import { useAuth } from '@/hooks/useAuth';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getSelection, $isRangeSelection, SELECTION_CHANGE_COMMAND } from 'lexical';
import { usePresenceStore } from '@/store/presence-store';

interface LexicalPresencePluginProps {
  noteId: string;
  userId: string;
  userName: string;
}

// Plugin to integrate Lexical editor with presence system
function LexicalPresencePlugin({ noteId, userId, userName }: LexicalPresencePluginProps) {
  const [editor] = useLexicalComposerContext();
  const { updateCursorPosition, updateSelection, setTyping } = usePresenceStore();
  
  useEffect(() => {
    let typingTimeout: NodeJS.Timeout | null = null;
    
    const handleSelectionChange = () => {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        
        if ($isRangeSelection(selection)) {
          const anchor = selection.anchor;
          const focus = selection.focus;
          
          // Update cursor position (use anchor offset)
          updateCursorPosition(anchor.offset);
          
          // Update selection if there's a range
          if (anchor.offset !== focus.offset) {
            const start = Math.min(anchor.offset, focus.offset);
            const end = Math.max(anchor.offset, focus.offset);
            updateSelection(start, end);
          } else {
            updateSelection(anchor.offset, anchor.offset);
          }
        }
      });
    };
    
    const handleTyping = () => {
      setTyping(true);
      
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
      
      typingTimeout = setTimeout(() => {
        setTyping(false);
      }, 1000);
    };
    
    // Register listeners
    const removeSelectionListener = editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      () => {
        handleSelectionChange();
        return false;
      },
      1
    );
    
    const removeUpdateListener = editor.registerUpdateListener(({ editorState }) => {
      handleTyping();
      handleSelectionChange();
    });
    
    return () => {
      removeSelectionListener();
      removeUpdateListener();
      if (typingTimeout) {
        clearTimeout(typingTimeout);
      }
    };
  }, [editor, updateCursorPosition, updateSelection, setTyping]);
  
  return null;
}

interface PresenceEnabledLexicalEditorProps {
  noteId: string;
  content: string;
  onContentChange: (content: string) => void;
  showCollaboratorPanel?: boolean;
  showFloatingIndicator?: boolean;
  enablePresence?: boolean;
  availableNotes?: any[];
  onLinkNote?: (noteId: string) => void;
  onAskAI?: (selectedText: string, context: string) => void;
  onRequestAnalysis?: (content: string) => void;
  onRequestIdeas?: (content: string) => void;
  userId?: string;
  noteType?: string;
  containerRef?: React.RefObject<HTMLElement>;
  onRefineText?: (text: string) => void;
  onAcceptRefinement?: () => void;
  onRejectRefinement?: () => void;
  onRetryRefinement?: () => void;
}

export const PresenceEnabledLexicalEditor = forwardRef<LexicalNotepadEditorRef, PresenceEnabledLexicalEditorProps>(({
  noteId,
  content = '',
  onContentChange,
  showCollaboratorPanel = true,
  showFloatingIndicator = false,
  enablePresence = true,
  ...editorProps
}, ref) => {
  const { user } = useAuth();
  const editorRef = React.useRef<LexicalNotepadEditorRef>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // Forward the ref to the underlying editor
  useImperativeHandle(ref, () => editorRef.current!, []);

  // Don't render presence if user is not authenticated
  if (!enablePresence || !user?.uid || !user?.displayName) {
    return (
      <LexicalNotepadEditor 
        ref={editorRef} 
        content={content} 
        onContentChange={onContentChange}
        {...editorProps} 
      />
    );
  }

  return (
    <div className="relative w-full h-full" ref={containerRef}>
      <div className="flex gap-4 h-full">
        {/* Main editor area */}
        <div className="flex-1 relative">
          <PresenceProvider
            noteId={noteId}
            userId={user.uid}
            userName={user.displayName}
            editorRef={containerRef}
            textContent={content}
            enabled={enablePresence}
            showNotifications={true}
            showFloatingIndicator={showFloatingIndicator}
          >
            <LexicalNotepadEditor 
              ref={editorRef} 
              content={content} 
              onContentChange={onContentChange}
              {...editorProps}
            >
              {/* Add presence plugin to Lexical editor */}
              <LexicalPresencePlugin 
                noteId={noteId}
                userId={user.uid}
                userName={user.displayName}
              />
            </LexicalNotepadEditor>
          </PresenceProvider>
        </div>
        
        {/* Collaborator panel */}
        {showCollaboratorPanel && (
          <div className="w-80 flex-shrink-0">
            <CollaboratorPanel />
          </div>
        )}
      </div>
    </div>
  );
});

PresenceEnabledLexicalEditor.displayName = 'PresenceEnabledLexicalEditor';

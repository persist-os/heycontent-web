'use client';

import React, { forwardRef, useImperativeHandle } from 'react';
import { RichTextEditor, RichTextEditorRef, RichTextEditorProps } from '@/components/ui/rich-text-editor/rich-text-editor';
import { PresenceProvider } from '../PresenceProvider';
import { CollaboratorPanel } from '../CollaboratorPanel';
import { useAuth } from '@/hooks/useAuth';

interface PresenceEnabledNoteEditorProps extends RichTextEditorProps {
  noteId: string;
  showCollaboratorPanel?: boolean;
  showFloatingIndicator?: boolean;
  enablePresence?: boolean;
}

export const PresenceEnabledNoteEditor = forwardRef<RichTextEditorRef, PresenceEnabledNoteEditorProps>(({
  noteId,
  content = '',
  showCollaboratorPanel = true,
  showFloatingIndicator = false,
  enablePresence = true,
  ...editorProps
}, ref) => {
  const { user } = useAuth();
  const editorRef = React.useRef<RichTextEditorRef>(null);
  
  // Forward the ref to the underlying editor
  useImperativeHandle(ref, () => editorRef.current!, []);

  // Don't render presence if user is not authenticated
  if (!enablePresence || !user?.uid || !user?.displayName) {
    return <RichTextEditor ref={editorRef} content={content} {...editorProps} />;
  }

  return (
    <div className="relative w-full h-full">
      <div className="flex gap-4 h-full">
        {/* Main editor area */}
        <div className="flex-1 relative">
          <PresenceProvider
            noteId={noteId}
            userId={user.uid}
            userName={user.displayName}
            editorRef={editorRef}
            textContent={content}
            enabled={enablePresence}
            showNotifications={true}
            showFloatingIndicator={showFloatingIndicator}
          >
            <RichTextEditor 
              ref={editorRef} 
              content={content} 
              {...editorProps} 
            />
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

PresenceEnabledNoteEditor.displayName = 'PresenceEnabledNoteEditor';

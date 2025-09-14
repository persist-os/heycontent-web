'use client';

import React from 'react';
import { NoteArea } from '@/app/dashboard/notes/NoteArea';
import { PresenceProvider, CollaboratorPanel } from '../index';
import { useAuth } from '@/hooks/useAuth';

interface PresenceEnabledNoteAreaProps {
  note: any;
  onUpdate: (updates: any) => void;
  onSave: () => void;
  onToggleShortcuts: () => void;
  onBack: () => void;
  isMobile: boolean;
  availableNotes?: any[];
  onLinkNote?: (noteId: string) => void;
  onLinkContent?: (contentId: string) => void;
  flushRef?: React.RefObject<any>;
  fromChat?: boolean;
  fromProject?: boolean;
  forcePreview?: boolean;
  enablePresence?: boolean;
  showCollaboratorPanel?: boolean;
}

export function PresenceEnabledNoteArea({
  note,
  enablePresence = true,
  showCollaboratorPanel = true,
  ...noteAreaProps
}: PresenceEnabledNoteAreaProps) {
  const { user } = useAuth();
  const editorContainerRef = React.useRef<HTMLDivElement>(null);

  // Don't render presence if user is not authenticated
  if (!enablePresence || !user?.uid || !user?.displayName || !note?._id) {
    return <NoteArea note={note} {...noteAreaProps} />;
  }

  return (
    <div className="flex h-full gap-4">
      {/* Main note area */}
      <div className="flex-1 relative" ref={editorContainerRef}>
        <PresenceProvider
          noteId={String(note._id)}
          userId={user.uid}
          userName={user.displayName}
          editorRef={editorContainerRef}
          textContent={note.content || ''}
          enabled={enablePresence}
          showNotifications={true}
          showFloatingIndicator={!showCollaboratorPanel}
        >
          <NoteArea note={note} {...noteAreaProps} />
        </PresenceProvider>
      </div>
      
      {/* Collaborator panel */}
      {showCollaboratorPanel && (
        <div className="w-80 flex-shrink-0 border-l bg-background/50">
          <div className="p-4 border-b">
            <h3 className="font-medium text-sm text-muted-foreground">
              Collaboration
            </h3>
          </div>
          <div className="p-4">
            <CollaboratorPanel />
          </div>
        </div>
      )}
    </div>
  );
}

// Example usage in a page component
export function ExampleNotePage() {
  const [note, setNote] = React.useState({
    _id: 'example-note-123',
    title: 'My Collaborative Note',
    content: 'Start typing here...',
    userId: 'user-123',
    // ... other note properties
  });

  const handleUpdate = (updates: any) => {
    setNote(prev => ({ ...prev, ...updates }));
  };

  const handleSave = () => {
    console.log('Saving note:', note);
  };

  return (
    <div className="h-screen">
      <PresenceEnabledNoteArea
        note={note}
        onUpdate={handleUpdate}
        onSave={handleSave}
        onToggleShortcuts={() => {}}
        onBack={() => {}}
        isMobile={false}
        enablePresence={true}
        showCollaboratorPanel={true}
      />
    </div>
  );
}

import React from 'react';
import { Id } from '@/convex/_generated/dataModel';
import { CollaborativeNotepadEditor } from '@/components/ui/lexical-editor/CollaborativeNotepadEditor';
import { NotepadHeader } from './NotepadHeader';
import { NotepadSidebar } from './NotepadSidebar';
import { Note } from '../../../notes/types';

interface CollaborativeDesktopLayoutProps {
  note: Note;
  content: string;
  currentNoteId: string | null;
  availableNotes: Array<{ _id: string; title: string; type: string }>;
  noteTagData: any;
  shouldShowSmartButton: boolean;
  isGeneratingMetadata: boolean;
  isCreating: boolean;
  firebaseUserId?: string;
  width: number;
  style: React.CSSProperties;
  sidebarRef: React.RefObject<HTMLDivElement>;
  lexicalEditorRef: React.RefObject<any>;
  noteHandlers: {
    handleContentChange: (content: string) => void;
    handleTitleChange: (title: string) => void;
    handleTypeChange: (type: string) => void;
    handleTagsChange: (tags: string[]) => void;
    handleImportantToggle: () => void;
  };
  aiHandlers: {
    handleAskAI: (text: string, context?: any) => void;
    handleRequestAnalysis: () => void;
    handleRequestIdeas: () => void;
    handleRefineText: (text: string, refinementType: string) => void;
    handleAcceptRefinement: () => void;
    handleRejectRefinement: () => void;
    handleRetryRefinement: () => void;
  };
  onEditingTitleChange: (editing: boolean) => void;
  onLinkNote: (noteId: string) => void;
  onShare: () => void;
  isReadOnly?: boolean;
  notePermission?: string | null;
  // Collaborative editing props
  enableCollaboration?: boolean;
  onCollaborationToggle?: (enabled: boolean) => void;
}

export function CollaborativeDesktopLayout({
  note,
  content,
  currentNoteId,
  availableNotes,
  noteTagData,
  shouldShowSmartButton,
  isGeneratingMetadata,
  isCreating,
  firebaseUserId,
  width,
  style,
  sidebarRef,
  lexicalEditorRef,
  noteHandlers,
  aiHandlers,
  onEditingTitleChange,
  onLinkNote,
  onShare,
  isReadOnly = false,
  notePermission = null,
  enableCollaboration = true,
  onCollaborationToggle,
}: CollaborativeDesktopLayoutProps) {
  
  return (
    <div className="flex h-full bg-background" style={{ width, ...style }}>
      {/* Sidebar */}
      <NotepadSidebar
        ref={sidebarRef}
        note={note}
        noteTagData={noteTagData}
        shouldShowSmartButton={shouldShowSmartButton}
        isGeneratingMetadata={isGeneratingMetadata}
        isCreating={isCreating}
        onTitleChange={noteHandlers.handleTitleChange}
        onTypeChange={noteHandlers.handleTypeChange}
        onTagsChange={noteHandlers.handleTagsChange}
        onImportantToggle={noteHandlers.handleImportantToggle}
        onEditingTitleChange={onEditingTitleChange}
        onShare={onShare}
        isReadOnly={isReadOnly}
        notePermission={notePermission}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <NotepadHeader
          note={note}
          onShare={onShare}
          isReadOnly={isReadOnly}
          notePermission={notePermission}
        />

        {/* Editor Area */}
        <div className="flex-1 overflow-auto relative">
          <CollaborativeNotepadEditor
            ref={lexicalEditorRef}
            noteId={note._id as Id<"notes">}
            content={content}
            onContentChange={noteHandlers.handleContentChange}
            placeholder={isReadOnly ? "This note is read-only" : "Start writing your note..."}
            onAskAI={aiHandlers.handleAskAI}
            onRequestAnalysis={aiHandlers.handleRequestAnalysis}
            onRequestIdeas={aiHandlers.handleRequestIdeas}
            userId={firebaseUserId}
            noteType={note.type || "idea_bank"}
            availableNotes={availableNotes}
            onLinkNote={onLinkNote}
            className="h-full border-0"
            containerRef={sidebarRef}
            onRefineText={aiHandlers.handleRefineText}
            onAcceptRefinement={aiHandlers.handleAcceptRefinement}
            onRejectRefinement={aiHandlers.handleRejectRefinement}
            onRetryRefinement={aiHandlers.handleRetryRefinement}
            disabled={isReadOnly}
            enableCollaborationByDefault={enableCollaboration && !note.isTemporary}
            showCollaborationToggle={!isReadOnly && !note.isTemporary}
            onCollaborationToggle={onCollaborationToggle}
          />
        </div>
      </div>
    </div>
  );
}

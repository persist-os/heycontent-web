import type { Note, NoteUpdate, NoteType } from '../../../notes/types/index'
import type { Id } from "@/convex/_generated/dataModel"
import type { LexicalNotepadEditorRef } from '@/components/ui/lexical-editor/LexicalNotepadEditor'

export interface MarkdownNotepadProps {
  isOpen: boolean
  onClose: () => void
  quotedContent?: string
  onClearQuoted?: () => void
  width: string
  style: React.CSSProperties
  // Note linking
  availableNotes?: Array<{ _id: string; title: string; type: string }>
  onLinkNote?: (noteId: string) => void
  // Mobile props
  isMobile?: boolean
  activeTab?: 'chat' | 'notes'
  onScrollPositionChange?: (position: number) => void
  // Enhanced note editing mode
  noteId?: string | Id<"notes"> // Pass this to edit an existing note
  fromChat?: boolean
  canNavigateBack?: boolean
  onBack?: () => void
  // Conversation linking
  sessionId?: string | null
}

export interface MarkdownNotepadRef {
  hasUnsavedContent: () => boolean
  clearContent: () => void
  getContent: () => string
  saveNote: () => Promise<string | null>
  getCurrentNote: () => Note
  isNewNote: () => boolean
  setNoteForEditing: (noteId: string | Id<"notes">) => void
  createNewNote: () => void
}

export interface NotepadState {
  isEditingTitle: boolean
  isNewNote: boolean
  currentNoteId: string | Id<"notes"> | null
  content: string
  refinementPreview: string | null
  isRefining: boolean
}

export interface AIHandlers {
  handleAskAI: (prompt: string) => Promise<void>
  handleRequestAnalysis: (noteType: string) => Promise<void>
  handleRequestIdeas: () => Promise<void>
  handleRefineText: (refinementType: string, selectedText: string) => Promise<string>
  handleAcceptRefinement: () => Promise<void>
  handleRejectRefinement: () => Promise<void>
  handleRetryRefinement: () => Promise<void>
}

export interface NoteHandlers {
  handleNoteUpdate: (noteId: string | Id<"notes">, updates: NoteUpdate) => Promise<Note | null>
  handleSaveAsNote: () => Promise<string | null>
  handleGenerateMetadata: () => Promise<void>
  handleCreateNewNote: () => void
  handleSwitchToNote: (noteId: string) => void
  handleContentChange: (newContent: string) => void
  handleTriggerCommandPalette: () => void
}

export interface NotepadRefs {
  sidebarRef: React.RefObject<HTMLDivElement>
  lexicalEditorRef: React.RefObject<LexicalNotepadEditorRef>
  metadataGenerationInProgress: React.MutableRefObject<boolean>
}

// Utility: Build safe NoteUpdate object
export function buildNoteUpdate(changes: Partial<Note>, currentNote: Note): NoteUpdate {
  const update: NoteUpdate = {};
  if (changes.content !== undefined && changes.content !== currentNote.content) {
    update.content = changes.content;
  }
  if (changes.title !== undefined && changes.title !== currentNote.title) {
    update.title = changes.title;
  }
  if (changes.tags !== undefined && JSON.stringify(changes.tags) !== JSON.stringify(currentNote.tags)) {
    update.tags = changes.tags;
  }
  if (changes.type !== undefined && changes.type !== currentNote.type) {
    update.type = changes.type;
  }
  if (changes.typeGenerated !== undefined && changes.typeGenerated !== currentNote.typeGenerated) {
    update.typeGenerated = changes.typeGenerated;
  }
  return update;
}

// Validation layer for NoteUpdate
export function validateNoteUpdate(update: NoteUpdate, context: string): NoteUpdate {
  if (update.tags !== undefined && update.tags.length === 0) {
    console.warn(`⚠️ Empty tags being sent from: ${context}`);
  }
  return update;
}

import React from 'react';

export interface InlineCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
  onAskAI: (prompt: string) => Promise<void>;
  onRequestAnalysis: (noteType: string) => Promise<void>;
  onRequestIdeas: () => Promise<void>;
  onLinkNote?: (noteId: string) => void;
  onInsertBulletList: () => void;
  onInsertNumberedList: () => void;
  onInsertHeading: (level: number) => void;
  onInsertLink?: (url: string, text: string) => void;
  onInsertLinkEmbed?: (url: string) => void;
  onInsertTable?: (rows: number, cols: number) => void;
  onGenerateTableFromContent?: () => Promise<void>;
  noteType?: string;
  availableNotes?: Array<{ _id: string; title: string; type: string }>;
  currentNoteId?: string;
  showNoteLinks?: boolean;
  // New refinement mode props
  selectedText?: string;
  refinementMode?: boolean;
  onRefineText?: (refinementType: string, text: string) => Promise<string | void>;
  showRefinementPreview?: boolean;
  refinedTextPreview?: string | null;
  onAcceptRefinement?: () => Promise<void>;
  onRejectRefinement?: () => Promise<void>;
  onRetryRefinement?: () => Promise<string | void>;
}

export interface NoteOption {
  id: string;
  title: string;
  type: string;
  icon: React.ReactNode;
  action: () => void;
}

export interface DisplayOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  category?: string;
}

export interface PaletteState {
  selectedIndex: number;
  loadingCommand: string | null;
  showAIPrompt: boolean;
  showAnalysisTypes: boolean;
  showLinkInput: boolean;
  showLinkEmbedInput: boolean;
  showTableInput: boolean;
  showPromptSuggestions: boolean;
  aiPrompt: string;
  noteSearchTerm: string;
  linkUrl: string;
  linkText: string;
  tableRows: number;
  tableCols: number;
}

export interface InputComponentProps {
  onSubmit: () => void;
  onCancel: () => void;
  autoFocus?: boolean;
}

export interface LinkInputProps extends InputComponentProps {
  linkUrl: string;
  linkText: string;
  onUrlChange: (url: string) => void;
  onTextChange: (text: string) => void;
}

export interface TableInputProps extends InputComponentProps {
  rows: number;
  cols: number;
  onRowsChange: (rows: number) => void;
  onColsChange: (cols: number) => void;
}

export interface AIPromptInputProps extends InputComponentProps {
  prompt: string;
  onPromptChange: (prompt: string) => void;
  showSuggestions: boolean;
  suggestions: string[];
  onSuggestionSelect: (suggestion: string) => void;
  noteType: string;
}

export interface RefinementPreviewProps {
  originalText: string;
  refinedText: string;
  refinementType: string;
  onAccept: () => void | Promise<void>;
  onReject: () => void | Promise<void>;
  onRetry: () => void | Promise<void>;
  isLoading?: boolean;
} 
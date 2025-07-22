import { useState, useEffect } from 'react';
import { useOperationState } from './useOperationState';
import { useRefinementState } from './useRefinementState';
import { createCommandHandlers } from '../utils/command-handlers';
import { PaletteState } from '../components/InlineCommandPalette.types';
import { NoteType as RefinementNoteType } from '../utils/refinement-configs';

export interface InlineCommandPaletteHookProps {
  isOpen: boolean;
  noteType: string;
  selectedText: string;
  onClose: () => void;
  
  // Command callbacks
  onRefineText?: (refinementType: string, text: string) => Promise<string | void>;
  onAskAI?: (prompt: string) => Promise<void>;
  onRequestIdeas?: () => Promise<void> | void;
  onRequestAnalysis?: (noteType: string) => Promise<void>;
  onInsertBulletList: () => void;
  onInsertNumberedList: () => void;
  onInsertHeading: (level: number) => void;
  onAcceptRefinement?: () => Promise<void>;
  onRejectRefinement?: () => Promise<void>;
  onRetryRefinement?: () => Promise<string | void>;
}

export function useInlineCommandPalette(props: InlineCommandPaletteHookProps) {
  const {
    isOpen,
    noteType,
    selectedText,
    onClose,
    onRefineText,
    onAskAI,
    onRequestIdeas,
    onRequestAnalysis,
    onInsertBulletList,
    onInsertNumberedList,
    onInsertHeading,
    onAcceptRefinement,
    onRejectRefinement,
    onRetryRefinement
  } = props;

  // State management
  const [state, setState] = useState<PaletteState>({
    selectedIndex: 0,
    loadingCommand: null,
    showAIPrompt: false,
    showAnalysisTypes: false,
    showLinkInput: false,
    showLinkEmbedInput: false,
    showTableInput: false,
    showPromptSuggestions: false,
    aiPrompt: '',
    noteSearchTerm: '',
    linkUrl: '',
    linkText: '',
    tableRows: 3,
    tableCols: 3,
  });

  // Initialize with current noteType instead of 'all'
  const [selectedNoteTypeForCommands, setSelectedNoteTypeForCommands] = useState<RefinementNoteType | 'all'>(noteType as RefinementNoteType);

  // State hooks
  const operationHook = useOperationState();
  const refinementHook = useRefinementState();

  // Auto-close after successful completion
  useEffect(() => {
    if (operationHook.operationState.completedCommandId) {
      const timer = setTimeout(() => {
        operationHook.resetOperation();
        onClose();
      }, 1500); // Show success state for 1.5 seconds

      return () => clearTimeout(timer);
    }
  }, [operationHook.operationState.completedCommandId, onClose]);

  // Reset state when opening - default to current noteType instead of 'all'
  useEffect(() => {
    if (isOpen) {
      setState(prev => ({
        ...prev,
        selectedIndex: 0,
        loadingCommand: null,
        showAIPrompt: false,
        showAnalysisTypes: false,
        showLinkInput: false,
        showLinkEmbedInput: false,
        showTableInput: false,
        showPromptSuggestions: false,
        aiPrompt: '',
        noteSearchTerm: '',
        linkUrl: '',
        linkText: '',
        tableRows: 3,
        tableCols: 3,
      }));
      // Reset to current noteType instead of 'all'
      setSelectedNoteTypeForCommands(noteType as RefinementNoteType);
      operationHook.resetOperation();
      refinementHook.resetRefinement();
    }
  }, [isOpen, noteType]);

  // Create command handlers
  const commandHandlers = createCommandHandlers({
    onRefineText,
    onAskAI,
    onRequestIdeas,
    onRequestAnalysis,
    onInsertBulletList,
    onInsertNumberedList,
    onInsertHeading,
    onAcceptRefinement: onAcceptRefinement || (async () => {}),
    onRejectRefinement: onRejectRefinement || (async () => {}),
    onRetryRefinement: onRetryRefinement || (async () => {}),
    onClose,
    operationState: operationHook.operationState,
    refinementState: refinementHook.refinementState,
    operationHandlers: operationHook,
    refinementHandlers: refinementHook,
    selectedText,
    noteType
  });

  return {
    // State
    state,
    setState,
    selectedNoteTypeForCommands,
    setSelectedNoteTypeForCommands,
    
    // Operation state
    operationState: operationHook.operationState,
    refinementState: refinementHook.refinementState,
    
    // Command handlers
    ...commandHandlers
  };
} 
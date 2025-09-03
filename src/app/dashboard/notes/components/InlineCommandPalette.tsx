"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion } from "framer-motion";
import { Loader2, ArrowRight } from 'lucide-react';
import { useNotes } from '@/app/context/notes-context';
import { 
  getCommandsForNoteType, 
  NoteType
} from '../utils/command-configs';
import {
  getRefinementCommandsForNoteType,
  getRefinementsForNoteTypes,
  NoteType as RefinementNoteType
} from '../utils/refinement-configs';
import { TextRefinementPreview } from './TextRefinementPreview';
import { CommandPaletteHeader } from './CommandPaletteHeader';
import { CommandPaletteFooter } from './CommandPaletteFooter';
import { 
  InlineCommandPaletteProps, 
  DisplayOption
} from './InlineCommandPalette.types';
import { 
  NOTE_TYPE_ICONS, 
  PALETTE_CONFIG 
} from './InlineCommandPalette.constants';
import { useInlineCommandPalette } from '../hooks/useInlineCommandPalette';
import { calculatePalettePosition } from '../utils/position-calculator';

export function InlineCommandPalette({
  isOpen,
  onClose,
  position,
  onAskAI,
  onRequestAnalysis,
  onRequestIdeas,
  onLinkNote,
  onInsertBulletList,
  onInsertNumberedList,
  onInsertHeading,
  onInsertLink,
  onInsertLinkEmbed,
  onInsertTable,
  onGenerateTableFromContent,
  noteType = 'idea_bank',
  availableNotes = [],
  currentNoteId,
  showNoteLinks = false,
  selectedText = '',
  refinementMode = false,
  onRefineText,
  showRefinementPreview = false,
  refinedTextPreview = null,
  onAcceptRefinement,
  onRejectRefinement,
  onRetryRefinement
}: InlineCommandPaletteProps) {
  
  const menuRef = useRef<HTMLDivElement>(null);
  const { setActiveNoteId } = useNotes();

  // User input state for the header input
  const [userInput, setUserInput] = useState('');

  // Use the main hook
  const {
    state,
    setState,
    selectedNoteTypeForCommands,
    setSelectedNoteTypeForCommands,
    operationState,
    refinementState,
    handleRefinementSelect,
    handleGenerationCommandWithNoteType,
    handleGenerationCommand,
    handleUniversalCommand,
    handleInternalPreviewAccept,
    handleInternalPreviewRetry,
    handleInternalPreviewReject,
    handleCustomGeneration
  } = useInlineCommandPalette({
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
  });

  // Reset input and selection when mode changes
  useEffect(() => {
    setUserInput('');
    setState(prev => ({ ...prev, selectedIndex: 0 }));
  }, [refinementMode, selectedNoteTypeForCommands, setState]);

  // Get all available commands
  const getAllCommands = (): DisplayOption[] => {
    if (refinementMode) {
      // Refinement mode - get refinement commands
      if (selectedNoteTypeForCommands === 'all') {
        const allNoteTypes = Object.keys(NOTE_TYPE_ICONS) as RefinementNoteType[];
        const { coreRefinements, noteSpecificRefinements, advancedRefinements } = 
          getRefinementsForNoteTypes(allNoteTypes);
        
        return [
          ...coreRefinements,
          ...noteSpecificRefinements,
          ...advancedRefinements
        ].map(cmd => ({
          id: cmd.id,
          label: cmd.label,
          icon: cmd.icon,
          action: () => handleSuggestionSelect(cmd.label),
          category: cmd.category
        }));
      } else {
        const { allRefinements } = getRefinementCommandsForNoteType(selectedNoteTypeForCommands);
        return allRefinements.map(cmd => ({
          id: cmd.id,
          label: cmd.label,
          icon: cmd.icon,
          action: () => handleSuggestionSelect(cmd.label),
          category: cmd.category
        }));
      }
    } else {
      // Generation mode - respect selectedNoteTypeForCommands
      if (selectedNoteTypeForCommands === 'all') {
        // Get commands from all note types
        const allNoteTypes = Object.keys(NOTE_TYPE_ICONS) as NoteType[];
        const allCommands: DisplayOption[] = [];
        
        // Collect universal commands (only once)
        const { universalCommands } = getCommandsForNoteType(noteType as NoteType);
        allCommands.push(...universalCommands.map(cmd => ({
          id: cmd.id,
          label: cmd.label,
          icon: cmd.icon,
          action: () => handleSuggestionSelect(cmd.label),
          category: cmd.category
        })));
        
        // Collect type-specific commands from all types
        const NOTE_TYPE_CONFIG: Record<NoteType, { label: string }> = {
          idea_bank: { label: 'Ideas' },
          content_script: { label: 'Writing' },
          analytics_insight: { label: 'Insights' },
          collaboration_note: { label: 'People' },
          reflection_journal: { label: 'Reflection' },
          task_checklist: { label: 'Tasks' },
          email_draft: { label: 'Messages' }
        };
        
        for (const nt of allNoteTypes) {
          const { typeSpecificCommands } = getCommandsForNoteType(nt);
          allCommands.push(...typeSpecificCommands.map(cmd => ({
            id: `${nt}-${cmd.id}`,
            label: `${NOTE_TYPE_CONFIG[nt].label}: ${cmd.label}`,
            icon: cmd.icon,
            action: () => handleSuggestionSelect(cmd.label),
            category: `${NOTE_TYPE_CONFIG[nt].label} Commands`
          })));
        }
        
        return allCommands;
      } else {
        // Get commands for specific note type
        const { typeSpecificCommands, universalCommands } = getCommandsForNoteType(selectedNoteTypeForCommands as NoteType);
        
        return [
          ...typeSpecificCommands.map(cmd => ({
            id: cmd.id,
            label: cmd.label,
            icon: cmd.icon,
            action: () => handleSuggestionSelect(cmd.label),
            category: cmd.category
          })),
          ...universalCommands.map(cmd => ({
            id: cmd.id,
            label: cmd.label,
            icon: cmd.icon,
            action: () => handleSuggestionSelect(cmd.label),
            category: cmd.category
          }))
        ];
      }
    }
  };

  // Filter commands based on user input
  const getFilteredCommands = (): DisplayOption[] => {
    const allCommands = getAllCommands();
    
    if (!userInput.trim()) {
      return allCommands;
    }
    
    const searchTerm = userInput.toLowerCase();
    return allCommands.filter(cmd => 
      cmd.label.toLowerCase().includes(searchTerm) ||
      cmd.category?.toLowerCase().includes(searchTerm)
    );
  };

  // Handle suggestion selection - populate text input instead of auto-executing
  const handleSuggestionSelect = (suggestion: string) => {
    // Remove "..." from the end of suggestions
    const cleanSuggestion = suggestion.replace(/\.\.\.\s*$/, '');
    setUserInput(cleanSuggestion);
    
    // Focus the input so user can edit if needed
    setTimeout(() => {
      const input = document.querySelector('input[type="text"]') as HTMLInputElement;
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }, 100);
  };

  // Handle custom user input execution from header
  const handleCustomInputExecute = async (input: string) => {
    if (!input.trim()) return;
    
    if (refinementMode) {
      // Send custom input to refinement
      if (onRefineText && selectedText) {
        await handleRefinementSelect(`custom:${input}`);
      }
    } else {
      // Send custom input to generation with proper loading state
      await handleCustomGeneration(input);
    }
  };

  // Enhanced keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Handle internal refinement preview shortcuts
      if (refinementState.showInternalPreview) {
        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            handleInternalPreviewAccept();
            break;
          case 'r':
          case 'R':
            e.preventDefault();
            handleInternalPreviewRetry();
            break;
          case 'Escape':
            e.preventDefault();
            if (refinementState.previewTransition === 'completing') {
              onClose(); // Force close during completion
            } else {
              // Go back to command list
              setSelectedNoteTypeForCommands('all');
            }
            break;
          case 'Backspace':
            e.preventDefault();
            // Go back to command list
            setSelectedNoteTypeForCommands('all');
            break;
        }
        return;
      }

      // Handle external refinement preview shortcuts (fallback)
      // 🎯 FIX: Only handle external refinement when palette is OPEN and showing preview
      // This prevents competing ESC handlers from resetting refinement state during transitions
      if (showRefinementPreview && isOpen && !refinementState.showInternalPreview) {
        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            onAcceptRefinement?.();
            break;
          case 'r':
          case 'R':
            e.preventDefault();
            onRetryRefinement?.();
            break;
          case 'Escape':
            e.preventDefault();
            onRejectRefinement?.();
            break;
        }
        return;
      }

      // Disable navigation during operations
      if (operationState.isOperationInProgress || refinementState.isProcessingRefinement) {
        if (e.key === 'Escape') {
          e.preventDefault();
          onClose();
        }
        return;
      }

      // Normal command palette navigation with filtering
      const filteredCommands = getFilteredCommands();
      
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setState(prev => ({ 
            ...prev, 
            selectedIndex: (prev.selectedIndex + 1) % Math.max(1, filteredCommands.length)
          }));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setState(prev => ({ 
            ...prev, 
            selectedIndex: (prev.selectedIndex - 1 + Math.max(1, filteredCommands.length)) % Math.max(1, filteredCommands.length)
          }));
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands.length > 0 && state.selectedIndex < filteredCommands.length) {
            // Execute selected preset command
            filteredCommands[state.selectedIndex]?.action();
          } else if (userInput.trim()) {
            // Execute custom user input
            handleCustomInputExecute(userInput.trim());
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, state.selectedIndex, userInput, showRefinementPreview, operationState.isOperationInProgress, refinementState, onAcceptRefinement, onRejectRefinement, onRetryRefinement]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen && !operationState.isOperationInProgress && !refinementState.isProcessingRefinement) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, operationState.isOperationInProgress, refinementState.isProcessingRefinement, onClose]);

  if (!isOpen) return null;



  const finalPosition = calculatePalettePosition(position);
  const filteredCommands = getFilteredCommands();

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, command) => {
    const category = command.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(command);
    return acc;
  }, {} as Record<string, DisplayOption[]>);

  return (
    <motion.div
      ref={menuRef}
      drag
      dragMomentum={false}
      whileDrag={{ cursor: "grabbing" }}
      className="fixed z-[200] bg-background border border-border rounded-lg shadow-2xl overflow-hidden backdrop-blur-sm cursor-grab"
      style={{
        top: finalPosition.top + 'px',
        left: finalPosition.left + 'px',
        width: `${PALETTE_CONFIG.width}px`,
        maxHeight: `${PALETTE_CONFIG.maxHeight}px`,
        maxWidth: 'calc(100vw - 40px)'
      }}
    >
      <CommandPaletteHeader
        operationState={operationState}
        refinementState={refinementState}
        refinementMode={refinementMode}
        selectedText={selectedText}
        noteType={noteType}
        selectedNoteTypeForCommands={selectedNoteTypeForCommands}
        onNoteTypeSelect={setSelectedNoteTypeForCommands}
        userInput={userInput}
        onUserInputChange={setUserInput}
        onCustomInputExecute={handleCustomInputExecute}
        isOpen={isOpen}
      />

      {/* Content */}
      <div className="max-h-80 overflow-y-auto">
        {refinementState.showInternalPreview ? (
          <div className={`transition-all duration-300 ${
            refinementState.previewTransition === 'showing' ? 'opacity-100 translate-y-0' : 
            refinementState.previewTransition === 'loading' ? 'opacity-50 translate-y-2' :
            'opacity-0 translate-y-4'
          }`}>
            {(refinementState.internalRefinedText || refinedTextPreview) ? (
              <TextRefinementPreview
                originalText={selectedText}
                refinedText={refinementState.internalRefinedText || refinedTextPreview || ''}
                onAccept={handleInternalPreviewAccept}
                onReject={handleInternalPreviewReject}
                onRetry={handleInternalPreviewRetry}
                isProcessing={refinementState.previewTransition === 'completing'}
              />
            ) : (
              <div className="p-4 flex items-center justify-center">
                              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span>Waiting for refined text...</span>
              </div>
              </div>
            )}
          </div>
        ) : refinementState.previewTransition === 'loading' ? (
          <div className="p-4 flex items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span>Refining your text...</span>
            </div>
          </div>
        ) : (
          <div className="py-2">
            {filteredCommands.length === 0 && userInput.trim() ? (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">No preset commands found for "{userInput}"</p>
                <p className="text-xs text-muted-foreground">The input field above will execute your custom {refinementMode ? 'refinement' : 'prompt'}</p>
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, commands]) => (
                <div key={category} className="mb-3 last:mb-0">
                  <div className="px-3 py-1">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {category}
                    </h3>
                  </div>
                  <div className="space-y-0.5">
                    {commands.map((option, index) => {
                      const globalIndex = filteredCommands.indexOf(option);
                      const isOptionLoading = operationState.loadingCommandId === option.id;
                      const isOptionCompleted = operationState.completedCommandId === option.id;
                      const isSelected = state.selectedIndex === globalIndex;
                      const isDisabled = operationState.isOperationInProgress || operationState.completedCommandId !== null;
                      
                      return (
                        <button
                          key={option.id}
                          onClick={option.action}
                          disabled={isDisabled}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-all duration-200 ${
                            isOptionCompleted
                              ? 'bg-green-500/10 text-green-600 dark:text-green-400 ring-2 ring-green-500/20'
                              : isOptionLoading
                              ? 'bg-primary/20 text-primary ring-2 ring-primary/30'
                              : isSelected && !isDisabled
                              ? 'bg-primary/10 text-primary' 
                              : isDisabled
                              ? 'opacity-50 text-muted-foreground'
                              : 'hover:bg-muted/50 text-foreground'
                          } ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <div className="flex-shrink-0">
                            {isOptionCompleted ? (
                              <Loader2 className="w-4 h-4 text-green-500 animate-pulse" />
                            ) : isOptionLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            ) : (
                              <div className={
                                isSelected && !isDisabled 
                                  ? 'text-primary' 
                                  : isDisabled 
                                  ? 'text-muted-foreground/50' 
                                  : 'text-muted-foreground'
                              }>
                                {option.icon}
                              </div>
                            )}
                          </div>
                          <span className={`text-sm font-medium ${
                            isOptionCompleted ? 'font-semibold' : ''
                          }`}>
                            {option.label}
                          </span>
                          {isSelected && !isDisabled && !isOptionLoading && !isOptionCompleted && (
                            <ArrowRight className="w-3 h-3 ml-auto text-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      <CommandPaletteFooter
        operationState={operationState}
        refinementState={refinementState}
      />
    </motion.div>
  );
} 
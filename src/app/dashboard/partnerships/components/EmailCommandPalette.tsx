'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { TextRefinementPreview } from '@/app/dashboard/notes/components/TextRefinementPreview';
import { CommandPaletteHeader } from '@/app/dashboard/notes/components/CommandPaletteHeader';
import { CommandPaletteFooter } from '@/app/dashboard/notes/components/CommandPaletteFooter';
import { useEmailCommandPalette } from '../hooks/useEmailCommandPalette';
import { 
  getEmailCommandsForContext, 
  getEmailRefinementCommands,
  type EmailCommand 
} from '../utils/email-command-configs';
import { calculatePalettePosition } from '@/app/dashboard/notes/utils/position-calculator';
import { PALETTE_CONFIG } from '@/app/dashboard/notes/components/InlineCommandPalette.constants';
import { T } from '@/components/translation/T';

interface EmailCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
  selectedText: string;
  onCustomInput: (prompt: string) => Promise<void>;
  onRefineText: (refinementPrompt: string, text: string) => Promise<string>;
  onAcceptRefinement: () => Promise<void>;
  onRejectRefinement: () => Promise<void>;
  onRetryRefinement: () => Promise<string>;
  emailContext: 'compose' | 'reply';
}

export function EmailCommandPalette({
  isOpen,
  onClose,
  position,
  selectedText,
  onCustomInput,
  onRefineText,
  onAcceptRefinement,
  onRejectRefinement,
  onRetryRefinement,
  emailContext
}: EmailCommandPaletteProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [userInput, setUserInput] = useState('');

  // Use the email command palette hook
  const {
    selectedIndex,
    setSelectedIndex,
    refinementMode,
    operationState,
    refinementState,
    handleCustomGeneration,
    handleRefinementSelect,
    handleInternalPreviewAccept,
    handleInternalPreviewRetry,
    handleInternalPreviewReject
  } = useEmailCommandPalette({
    isOpen,
    emailContext,
    selectedText,
    onClose,
    onCustomInput,
    onRefineText,
    onAcceptRefinement,
    onRejectRefinement,
    onRetryRefinement
  });

  // Get available commands based on context and mode
  const getAvailableCommands = useCallback((): EmailCommand[] => {
    if (refinementMode && selectedText) {
      return getEmailRefinementCommands();
    }
    return getEmailCommandsForContext(emailContext);
  }, [emailContext, refinementMode, selectedText]);

  // Filter commands based on user input
  const getFilteredCommands = useCallback((): EmailCommand[] => {
    const commands = getAvailableCommands();
    
    if (!userInput.trim()) {
      return commands;
    }
    
    const searchTerm = userInput.toLowerCase();
    return commands.filter(cmd => 
      cmd.label.toLowerCase().includes(searchTerm) ||
      cmd.category.toLowerCase().includes(searchTerm)
    );
  }, [userInput, getAvailableCommands]);

  // Handle command selection
  const handleCommandSelect = useCallback(async (command: EmailCommand) => {
    if (refinementMode && selectedText) {
      await handleRefinementSelect(command.id);
    } else {
      // For generation commands, populate input instead of auto-executing
      const cleanCommand = command.label.replace(/\.\.\.\s*$/, '');
      setUserInput(cleanCommand);
    }
  }, [refinementMode, selectedText, handleRefinementSelect]);

  // Handle custom input execution
  const handleCustomInputExecute = useCallback(async () => {
    if (!userInput.trim()) return;
    
    if (refinementMode && selectedText) {
      await handleRefinementSelect(`custom:${userInput}`);
    } else {
      await handleCustomGeneration(userInput);
    }
  }, [userInput, refinementMode, selectedText, handleCustomGeneration, handleRefinementSelect]);

  // Reset input when mode changes
  useEffect(() => {
    setUserInput('');
    setSelectedIndex(0);
  }, [refinementMode, emailContext, setSelectedIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Handle refinement preview shortcuts
      if (refinementState.showInternalPreview) {
        switch (e.key) {
          case 'Enter':
            e.preventDefault();
            handleInternalPreviewAccept();
            return;
          case 'r':
          case 'R':
            e.preventDefault();
            handleInternalPreviewRetry();
            return;
          case 'Escape':
          case 'Backspace':
            e.preventDefault();
            handleInternalPreviewReject();
            return;
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

      const filteredCommands = getFilteredCommands();

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            (prev + 1) % Math.max(1, filteredCommands.length)
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            (prev - 1 + Math.max(1, filteredCommands.length)) % Math.max(1, filteredCommands.length)
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands.length > 0 && selectedIndex < filteredCommands.length) {
            handleCommandSelect(filteredCommands[selectedIndex]);
          } else if (userInput.trim()) {
            handleCustomInputExecute();
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
  }, [
    isOpen,
    selectedIndex,
    userInput,
    refinementState.showInternalPreview,
    operationState.isOperationInProgress,
    refinementState.isProcessingRefinement,
    getFilteredCommands,
    handleCommandSelect,
    handleCustomInputExecute,
    handleInternalPreviewAccept,
    handleInternalPreviewRetry,
    handleInternalPreviewReject,
    onClose,
    setSelectedIndex
  ]);

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

  const filteredCommands = getFilteredCommands();
  const finalPosition = calculatePalettePosition(position);

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, command) => {
    const category = command.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(command);
    return acc;
  }, {} as Record<string, EmailCommand[]>);

  return (
    <motion.div
      ref={menuRef}
      drag
      dragMomentum={false}
      whileDrag={{ cursor: 'grabbing' }}
      className="fixed z-[200] bg-background border border-border rounded-lg shadow-2xl overflow-hidden backdrop-blur-sm cursor-grab"
      style={{
        top: finalPosition.top + 'px',
        left: finalPosition.left + 'px',
        width: `${PALETTE_CONFIG.width}px`,
        maxHeight: `${PALETTE_CONFIG.maxHeight}px`,
        maxWidth: 'calc(100vw - 40px)'
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
    >
      <CommandPaletteHeader
        operationState={operationState}
        refinementState={refinementState}
        refinementMode={refinementMode}
        selectedText={selectedText}
        noteType="email_draft"
        selectedNoteTypeForCommands="email_draft"
        onNoteTypeSelect={() => {}}
        userInput={userInput}
        onUserInputChange={setUserInput}
        onCustomInputExecute={handleCustomInputExecute}
        isOpen={isOpen}
      />

      {/* Content */}
      <div className="max-h-80 overflow-y-auto">
        {refinementState.showInternalPreview && refinementState.internalRefinedText ? (
          <TextRefinementPreview
            originalText={selectedText}
            refinedText={refinementState.internalRefinedText}
            onAccept={handleInternalPreviewAccept}
            onReject={handleInternalPreviewReject}
            onRetry={handleInternalPreviewRetry}
            isProcessing={refinementState.previewTransition === 'completing'}
          />
        ) : refinementState.previewTransition === 'loading' ? (
          <div className="p-4 flex items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span><T context="emailpalette.status">Refining your text...</T></span>
            </div>
          </div>
        ) : (
          <div className="py-2">
            {filteredCommands.length === 0 && userInput.trim() ? (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  <T context="emailpalette.empty">No preset commands found for</T> "{userInput}"
                </p>
                <p className="text-xs text-muted-foreground">
                  <T context="emailpalette.hint">Press Enter to execute your custom</T> {refinementMode ? <T context="emailpalette.refinement">refinement</T> : <T context="emailpalette.prompt">prompt</T>}
                </p>
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, commands]) => (
                <div key={category} className="mb-3 last:mb-0">
                  <div className="px-3 py-1">
                    <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      <T context="emailpalette.category">{category}</T>
                    </h3>
                  </div>
                  <div className="space-y-0.5">
                    {commands.map((command) => {
                      const globalIndex = filteredCommands.indexOf(command);
                      const isSelected = selectedIndex === globalIndex;
                      const isOptionLoading = operationState.loadingCommandId === command.id;
                      const isOptionCompleted = operationState.completedCommandId === command.id;
                      const isDisabled = operationState.isOperationInProgress || operationState.completedCommandId !== null;
                      
                      return (
                        <button
                          key={command.id}
                          onClick={() => handleCommandSelect(command)}
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
                                {command.icon}
                              </div>
                            )}
                          </div>
                          <span className={`text-sm font-medium ${
                            isOptionCompleted ? 'font-semibold' : ''
                          }`}>
                            <T context={`emailpalette.command.${command.id}`}>{command.label}</T>
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

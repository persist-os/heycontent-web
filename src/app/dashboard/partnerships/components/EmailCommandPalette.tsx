'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion } from "framer-motion";
import { Loader2, ArrowRight, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TextRefinementPreview } from '../../notes/components/TextRefinementPreview';
import { 
  getCommandsForNoteType,
  UNIVERSAL_COMMANDS 
} from '../../notes/utils/command-configs';
import {
  getRefinementCommandsForNoteType
} from '../../notes/utils/refinement-configs';

interface EmailCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
  selectedText: string;
  onCustomInput: (input: string) => Promise<void>;
  onRefineText?: (refinementPrompt: string, text: string) => Promise<string>;
  onAcceptRefinement?: () => Promise<void>;
  onRejectRefinement?: () => Promise<void>;
  onRetryRefinement?: () => Promise<string>;
  emailContext?: 'compose' | 'reply'; // New prop for context awareness
}

interface DisplayOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  category?: string;
}

interface RefinementState {
  isProcessingRefinement: boolean;
  currentRefinementId: string | null;
  refinedText: string | null;
  showPreview: boolean;
  previewTransition: 'idle' | 'loading' | 'showing' | 'completing';
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
  emailContext = 'reply' // Default to reply mode for backward compatibility
}: EmailCommandPaletteProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [userInput, setUserInput] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedCommandId, setCompletedCommandId] = useState<string | null>(null);

  // Refinement state management (like InlineCommandPalette)
  const [refinementState, setRefinementState] = useState<RefinementState>({
    isProcessingRefinement: false,
    currentRefinementId: null,
    refinedText: null,
    showPreview: false,
    previewTransition: 'idle'
  });

  const refinementMode = !!selectedText;

  // Refinement state handlers
  const startRefinement = (refinementId: string) => {
    setRefinementState({
      isProcessingRefinement: true,
      currentRefinementId: refinementId,
      refinedText: null,
      showPreview: false,
      previewTransition: 'loading'
    });
  };

  const setRefinementResult = (result: string) => {
    setRefinementState(prev => ({
      ...prev,
      isProcessingRefinement: false,
      refinedText: result,
      showPreview: true,
      previewTransition: 'showing'
    }));
  };

  const resetRefinement = () => {
    setRefinementState({
      isProcessingRefinement: false,
      currentRefinementId: null,
      refinedText: null,
      showPreview: false,
      previewTransition: 'idle'
    });
  };

  const setCompleting = () => {
    setRefinementState(prev => ({
      ...prev,
      previewTransition: 'completing'
    }));
  };

  // Get email-specific commands
  const getEmailCommands = (): DisplayOption[] => {
    // Debug logging to verify context detection
    console.log('[EmailCommandPalette] Email context:', emailContext, 'Refinement mode:', refinementMode);
    
    if (refinementMode) {
      // Get refinement commands for email drafts
      const { allRefinements } = getRefinementCommandsForNoteType('email_draft');
      return allRefinements.map(cmd => ({
        id: cmd.id,
        label: cmd.label,
        icon: cmd.icon,
        action: () => handleRefinementSelect(cmd.id, cmd.label),
        category: cmd.category
      }));
    } else {
      // Get generation commands for email drafts
      const { typeSpecificCommands, universalCommands } = getCommandsForNoteType('email_draft');
      
      // Filter universal commands to only include email-relevant ones
      const emailRelevantUniversalCommands = universalCommands.filter(cmd => 
        ['bullet-list', 'numbered-list', 'action-items', 'summary'].includes(cmd.id)
      );

      // Add additional email-specific commands based on context
      const getContextSpecificCommands = () => {
        if (emailContext === 'compose') {
          // Commands specific to composing fresh emails - direct, one-shot prompts
          return [
            {
              id: 'write-cold-outreach',
              label: 'Write a professional outreach email',
              icon: UNIVERSAL_COMMANDS.find(cmd => cmd.id === 'summary')?.icon || '✍️',
              action: () => handleGenerationCommand('write-cold-outreach', 'Write a complete professional outreach email that introduces me, explains my value, and includes a clear call-to-action. Make it personalized and compelling.'),
              category: 'Complete Email'
            },
            {
              id: 'write-partnership-pitch',
              label: 'Write a partnership proposal email',
              icon: UNIVERSAL_COMMANDS.find(cmd => cmd.id === 'summary')?.icon || '🤝',
              action: () => handleGenerationCommand('write-partnership-pitch', 'Write a complete partnership proposal email that presents a collaboration opportunity, highlights mutual benefits, and proposes next steps.'),
              category: 'Complete Email'
            },
            {
              id: 'write-follow-up',
              label: 'Write a follow-up email',
              icon: UNIVERSAL_COMMANDS.find(cmd => cmd.id === 'summary')?.icon || '📧',
              action: () => handleGenerationCommand('write-follow-up', 'Write a polite follow-up email that references our previous conversation, adds value, and gently reminds them to respond.'),
              category: 'Complete Email'
            },
            {
              id: 'compelling-subject-line',
              label: 'Create compelling subject lines',
              icon: UNIVERSAL_COMMANDS.find(cmd => cmd.id === 'summary')?.icon || '🎯',
              action: () => handleGenerationCommand('compelling-subject-line', 'Generate 3-5 compelling subject line options that will increase open rates and clearly communicate the email\'s purpose.'),
              category: 'Email Elements'
            },
            {
              id: 'strong-opening',
              label: 'Write an engaging opening line',
              icon: UNIVERSAL_COMMANDS.find(cmd => cmd.id === 'summary')?.icon || '✨',
              action: () => handleGenerationCommand('strong-opening', 'Write an engaging opening line that immediately captures attention and makes the recipient want to read more.'),
              category: 'Email Elements'
            },
            {
              id: 'value-proposition',
              label: 'Articulate my unique value',
              icon: UNIVERSAL_COMMANDS.find(cmd => cmd.id === 'summary')?.icon || '⭐',
              action: () => handleGenerationCommand('value-proposition', 'Clearly articulate what makes me unique and valuable as a creator/professional, focusing on specific benefits I can provide.'),
              category: 'Email Elements'
            },
            {
              id: 'clear-call-to-action',
              label: 'Create a clear call-to-action',
              icon: UNIVERSAL_COMMANDS.find(cmd => cmd.id === 'action-items')?.icon || '👆',
              action: () => handleGenerationCommand('clear-call-to-action', 'Write a clear, specific call-to-action that tells the recipient exactly what to do next and makes it easy for them to respond.'),
              category: 'Email Elements'
            },
            {
              id: 'professional-intro',
              label: 'Introduce myself professionally',
              icon: UNIVERSAL_COMMANDS.find(cmd => cmd.id === 'summary')?.icon || '👋',
              action: () => handleGenerationCommand('professional-intro', 'Write a concise professional introduction that establishes credibility and explains who I am and why I\'m reaching out.'),
              category: 'Email Elements'
            }
          ];
        } else {
          // Commands specific to replying to existing emails - response-focused prompts
          return [
            {
              id: 'craft-thoughtful-reply',
              label: 'Craft a complete thoughtful reply',
              icon: UNIVERSAL_COMMANDS.find(cmd => cmd.id === 'summary')?.icon || '💭',
              action: () => handleGenerationCommand('craft-thoughtful-reply', 'Write a complete, thoughtful reply that addresses their points, demonstrates understanding, and moves the conversation forward professionally.'),
              category: 'Complete Reply'
            },
            {
              id: 'respond-to-opportunity',
              label: 'Respond to this opportunity',
              icon: UNIVERSAL_COMMANDS.find(cmd => cmd.id === 'summary')?.icon || '🚀',
              action: () => handleGenerationCommand('respond-to-opportunity', 'Write a professional response expressing interest, highlighting relevant qualifications, and suggesting next steps for this opportunity.'),
              category: 'Complete Reply'
            },
            {
              id: 'decline-professionally',
              label: 'Decline politely but keep doors open',
              icon: UNIVERSAL_COMMANDS.find(cmd => cmd.id === 'summary')?.icon || '🙏',
              action: () => handleGenerationCommand('decline-professionally', 'Write a polite decline that maintains the relationship, explains why this isn\'t a fit right now, and leaves the door open for future opportunities.'),
              category: 'Complete Reply'
            },
            {
              id: 'match-their-tone',
              label: 'Match their communication style',
              icon: UNIVERSAL_COMMANDS.find(cmd => cmd.id === 'summary')?.icon || '🎯',
              action: () => handleGenerationCommand('match-their-tone', 'Analyze their email tone and communication style, then help me respond in a way that matches their level of formality and energy.'),
              category: 'Response Strategy'
            },
            {
              id: 'address-concerns',
              label: 'Address their questions/concerns',
              icon: UNIVERSAL_COMMANDS.find(cmd => cmd.id === 'summary')?.icon || '💡',
              action: () => handleGenerationCommand('address-concerns', 'Identify and thoughtfully address any questions, concerns, or objections they raised while maintaining a positive, solution-focused approach.'),
              category: 'Response Strategy'
            },
            {
              id: 'communicate-timeline',
              label: 'Set clear expectations and timelines',
              icon: UNIVERSAL_COMMANDS.find(cmd => cmd.id === 'action-items')?.icon || '📅',
              action: () => handleGenerationCommand('communicate-timeline', 'Clearly communicate realistic timelines, deliverables, and expectations based on their request while keeping commitments achievable.'),
              category: 'Response Strategy'
            },
            {
              id: 'show-expertise',
              label: 'Demonstrate relevant expertise',
              icon: UNIVERSAL_COMMANDS.find(cmd => cmd.id === 'summary')?.icon || '🎓',
              action: () => handleGenerationCommand('show-expertise', 'Highlight relevant experience and expertise that directly relates to their needs without being boastful.'),
              category: 'Response Strategy'
            },
            {
              id: 'next-steps-reply',
              label: 'Propose clear next steps',
              icon: UNIVERSAL_COMMANDS.find(cmd => cmd.id === 'action-items')?.icon || '➡️',
              action: () => handleGenerationCommand('next-steps-reply', 'Suggest specific, actionable next steps that move this conversation forward and make it easy for them to proceed.'),
              category: 'Response Strategy'
            }
          ];
        }
      };

      const additionalEmailCommands = getContextSpecificCommands();
      
      // In compose mode, prioritize context-specific commands
      if (emailContext === 'compose') {
        return [
          ...additionalEmailCommands,
          ...typeSpecificCommands.map(cmd => ({
            id: cmd.id,
            label: cmd.label,
            icon: cmd.icon,
            action: () => handleGenerationCommand(cmd.id, cmd.description || cmd.label),
            category: cmd.category
          })),
          ...emailRelevantUniversalCommands.map(cmd => ({
            id: cmd.id,
            label: cmd.label,
            icon: cmd.icon,
            action: () => handleGenerationCommand(cmd.id, cmd.description || cmd.label),
            category: cmd.category
          }))
        ];
      } else {
        // In reply mode, show type-specific commands first, then context commands
        return [
          ...typeSpecificCommands.map(cmd => ({
            id: cmd.id,
            label: cmd.label,
            icon: cmd.icon,
            action: () => handleGenerationCommand(cmd.id, cmd.description || cmd.label),
            category: cmd.category
          })),
          ...additionalEmailCommands,
          ...emailRelevantUniversalCommands.map(cmd => ({
            id: cmd.id,
            label: cmd.label,
            icon: cmd.icon,
            action: () => handleGenerationCommand(cmd.id, cmd.description || cmd.label),
            category: cmd.category
          }))
        ];
      }
    }
  };

  // Filter commands based on user input
  const getFilteredCommands = (): DisplayOption[] => {
    const allCommands = getEmailCommands();
    
    if (!userInput.trim()) {
      return allCommands;
    }
    
    const searchTerm = userInput.toLowerCase();
    return allCommands.filter(cmd => 
      cmd.label.toLowerCase().includes(searchTerm) ||
      cmd.category?.toLowerCase().includes(searchTerm)
    );
  };

  // Updated refinement handler with preview (like InlineCommandPalette)
  const handleRefinementSelect = async (commandId: string, label: string) => {
    if (!onRefineText || !selectedText || refinementState.isProcessingRefinement) return;
    
    startRefinement(commandId);
    
    try {
      let refinementPrompt: string;
      
      if (commandId === 'custom-input') {
        refinementPrompt = userInput.trim();
      } else {
        // Extract the refinement prompt from the label
        refinementPrompt = label.replace('Can you ', '').replace('?', '');
      }
      
      console.log(`[EmailCommandPalette] Executing refinement: "${refinementPrompt}"`);
      
      // Call the refinement function - this should return the refined text
      const result = await onRefineText(refinementPrompt, selectedText);
      
      if (result && result.trim() !== selectedText.trim()) {
        // We have a valid refined result that's different from original
        setRefinementResult(result);
      } else if (result) {
        // Result is the same as original - still show it but user will see no diffs
        setRefinementResult(result);
      } else {
        // No result returned - create a mock result to show the diff preview functionality
        const mockRefinedText = `${selectedText}\n\n[Mock refinement based on: "${refinementPrompt}"] - This demonstrates the diff preview. In a real implementation, this would be the AI-refined text.`;
        setRefinementResult(mockRefinedText);
      }
    } catch (error) {
      console.error('Refinement failed:', error);
      
      // Show a mock result even on error to demonstrate the diff functionality
      const mockRefinedText = `${selectedText}\n\n[Error occurred, but showing mock refinement to demonstrate diff preview functionality]`;
      setRefinementResult(mockRefinedText);
    }
  };

  const handleGenerationCommand = async (commandId: string, prompt: string) => {
    setIsProcessing(true);
    try {
      await onCustomInput(prompt);
      setCompletedCommandId(commandId);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomInputExecute = async () => {
    if (!userInput.trim()) return;
    
    if (refinementMode && onRefineText) {
      await handleRefinementSelect('custom-input', userInput.trim());
    } else {
      await handleGenerationCommand('custom-input', userInput.trim());
    }
  };

  // Internal preview handlers (like InlineCommandPalette)
  const handleInternalPreviewAccept = async () => {
    if (!onAcceptRefinement) return;

    setCompleting();

    try {
      await onAcceptRefinement();
      
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (error) {
      console.error('Failed to accept refinement:', error);
      setRefinementState(prev => ({
        ...prev,
        previewTransition: 'showing'
      }));
    }
  };

  const handleInternalPreviewRetry = async () => {
    if (!onRetryRefinement || !refinementState.currentRefinementId) return;

    setRefinementState(prev => ({
      ...prev,
      isProcessingRefinement: true,
      refinedText: null,
      showPreview: false,
      previewTransition: 'loading'
    }));

    try {
      const result = await onRetryRefinement();
      
      if (result && result.trim() !== selectedText.trim()) {
        // We have a valid retry result that's different from original
        setRefinementResult(result);
      } else if (result) {
        // Result is the same as original - still show it
        setRefinementResult(result);
      } else {
        // No result returned - create a different mock result to show retry worked
        const mockRetryText = `${selectedText}\n\n[Mock RETRY refinement - attempt #2] - This shows a different refinement result to demonstrate the retry functionality with visible diffs.`;
        setRefinementResult(mockRetryText);
      }
    } catch (error) {
      console.error('Failed to retry refinement:', error);
      
      // Show a different mock result for retry
      const mockRetryText = `${selectedText}\n\n[Retry failed, but showing mock retry result to demonstrate diff preview functionality]`;
      setRefinementResult(mockRetryText);
    }
  };

  const handleInternalPreviewReject = async () => {
    resetRefinement();
    
    if (onRejectRefinement) {
      try {
        await onRejectRefinement();
      } catch (error) {
        console.error('Failed to reject refinement:', error);
      }
    }
  };

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setUserInput('');
      setSelectedIndex(0);
      setIsProcessing(false);
      setCompletedCommandId(null);
      resetRefinement();
    }
  }, [isOpen]);

  // Enhanced keyboard navigation with refinement preview support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Handle refinement preview shortcuts
      if (refinementState.showPreview) {
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
              handleInternalPreviewReject();
            }
            break;
        }
        return;
      }

      if (isProcessing || refinementState.isProcessingRefinement) {
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
          setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredCommands.length));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + Math.max(1, filteredCommands.length)) % Math.max(1, filteredCommands.length));
          break;
        case 'Enter':
          e.preventDefault();
          
          if (filteredCommands.length > 0 && selectedIndex < filteredCommands.length) {
            filteredCommands[selectedIndex]?.action();
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
  }, [isOpen, selectedIndex, userInput, isProcessing, refinementState]);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen && !isProcessing && !refinementState.isProcessingRefinement) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isProcessing, refinementState.isProcessingRefinement, onClose]);

  if (!isOpen) return null;

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
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className="fixed z-[200] bg-background border border-border rounded-lg shadow-2xl overflow-hidden backdrop-blur-sm cursor-grab"
      style={{
        top: position.top + 'px',
        left: position.left + 'px',
        width: '400px',
        maxHeight: '500px',
        maxWidth: 'calc(100vw - 40px)'
      }}
    >
      {/* Header */}
      <div className="p-3 border-b border-border bg-muted/20">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Send className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">
              {refinementMode 
                ? 'Refine Selected Text' 
                : emailContext === 'compose' 
                  ? 'Email Compose Assistant' 
                  : 'Email Reply Assistant'
              }
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-6 w-6 p-0"
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
        
        {!refinementState.showPreview && (
          <input
            ref={inputRef}
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                if (userInput.trim()) {
                  handleCustomInputExecute();
                }
              }
            }}
            placeholder={refinementMode 
              ? "How should I refine this text?" 
              : emailContext === 'compose' 
                ? "Ask AI to help compose your email..." 
                : "Ask AI to help with your reply..."
            }
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-primary/50"
            disabled={isProcessing || refinementState.isProcessingRefinement}
          />
        )}
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto">
        {refinementState.showPreview ? (
          <div className={`transition-all duration-300 ${
            refinementState.previewTransition === 'showing' ? 'opacity-100 translate-y-0' : 
            refinementState.previewTransition === 'loading' ? 'opacity-50 translate-y-2' :
            'opacity-0 translate-y-4'
          }`}>
            {refinementState.refinedText ? (
              <TextRefinementPreview
                originalText={selectedText}
                refinedText={refinementState.refinedText}
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
        ) : refinementState.isProcessingRefinement ? (
          <div className="p-4 flex items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span>Refining text...</span>
            </div>
          </div>
        ) : isProcessing ? (
          <div className="p-4 flex items-center justify-center">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
              <span>Processing your request...</span>
            </div>
          </div>
        ) : (
          <div className="py-2">
            {filteredCommands.length === 0 && userInput.trim() ? (
              <div className="p-4 text-center">
                <p className="text-sm text-muted-foreground mb-2">No preset commands found for "{userInput}"</p>
                <p className="text-xs text-muted-foreground">Press Enter to execute your custom {refinementMode ? 'refinement' : 'prompt'}</p>
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
                      const isOptionCompleted = completedCommandId === option.id;
                      const isSelected = selectedIndex === globalIndex;
                      const isDisabled = isProcessing || refinementState.isProcessingRefinement;
                      
                      return (
                        <button
                          key={option.id}
                          onClick={option.action}
                          disabled={isDisabled}
                          className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-all duration-200 ${
                            isOptionCompleted
                              ? 'bg-green-500/10 text-green-600 dark:text-green-400'
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
                          {isSelected && !isDisabled && !isOptionCompleted && (
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

      {/* Footer */}
      <div className="p-2 border-t border-border bg-muted/10">
        <div className="text-xs text-muted-foreground text-center">
          {refinementState.showPreview ? 'Review refinement • ↵ accept • r retry • esc reject' : 
           refinementMode ? 'Refining selected text' : 
           emailContext === 'compose' ? 'Email compose assistance' : 'Email reply assistance'} • Press ↵ to execute
        </div>
      </div>
    </motion.div>
  );
} 
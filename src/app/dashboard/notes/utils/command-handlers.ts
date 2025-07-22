import { getCommandsForNoteType, NoteType } from './command-configs';
import { OperationHandlers, OperationState } from '../hooks/useOperationState';
import { RefinementHandlers, RefinementState } from '../hooks/useRefinementState';

export interface CommandHandlerDependencies {
  // Props from the main component
  onRefineText?: (refinementId: string, text: string) => Promise<string | void>;
  onAskAI?: (prompt: string) => Promise<void>;
  onRequestIdeas?: () => Promise<void> | void;
  onRequestAnalysis?: (noteType: string) => Promise<void>;
  onInsertBulletList: () => void;
  onInsertNumberedList: () => void;
  onInsertHeading: (level: number) => void;
  onAcceptRefinement?: () => Promise<void>;
  onRejectRefinement?: () => Promise<void>;
  onRetryRefinement?: () => Promise<string | void>;
  onClose: () => void;
  
  // State
  operationState: OperationState;
  refinementState: RefinementState;
  
  // State handlers
  operationHandlers: OperationHandlers;
  refinementHandlers: RefinementHandlers;
  
  // Data
  selectedText: string;
  noteType: string;
}

export function createCommandHandlers(deps: CommandHandlerDependencies) {
  const {
    onRefineText,
    onAskAI,
    onRequestIdeas,
    onRequestAnalysis,
    onInsertBulletList,
    onInsertNumberedList,
    onInsertHeading,
    onAcceptRefinement,
    onRejectRefinement,
    onRetryRefinement,
    onClose,
    operationState,
    refinementState,
    operationHandlers,
    refinementHandlers,
    selectedText,
    noteType
  } = deps;

  const handleCustomGeneration = async (input: string) => {
    if (!input.trim() || !onAskAI) return;
    
    operationHandlers.startOperation(`custom-generation`, 'generation');
    
    try {
      console.log(`[CommandHandlers] Executing custom generation: "${input}"`);
      await onAskAI(input);
      
      // Show success state briefly
      operationHandlers.completeOperation(`custom-generation`);
      
      // Auto-close after showing success
      setTimeout(() => {
        operationHandlers.resetOperation();
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to execute custom generation:', error);
      operationHandlers.resetOperation();
      // Don't close on error, let user try again
    }
  };

  const handleRefinementSelect = async (refinementId: string) => {
    if (!selectedText || refinementState.isProcessingRefinement) return;
    
    // Start the seamless refinement process
    refinementHandlers.startRefinement(refinementId);
    operationHandlers.startOperation(refinementId, 'refinement');

    try {
      // Handle custom user input
      if (refinementId.startsWith('custom:')) {
        const customPrompt = refinementId.replace('custom:', '');
        console.log(`[CommandHandlers] Executing custom refinement via generic writing: "${customPrompt}"`);
        
        // For custom refinements, use the refine-text API with the custom prompt if available
        // This allows for better refinement handling with proper response parsing
        if (onRefineText) {
          const result = await onRefineText(`custom_refinement:${customPrompt}`, selectedText);
          
          if (typeof result === 'string') {
            refinementHandlers.setRefinementResult(result);
          } else {
            // If onRefineText doesn't return a result, show preview and let external system handle it
            setTimeout(() => {
              refinementHandlers.showPreview();
            }, 500);
          }
        } else if (onAskAI) {
          // Fallback to generic AI writing
          const enhancedPrompt = `Please refine the following text: "${selectedText}"\n\nInstructions: ${customPrompt}\n\nPlease respond with only the refined text, no explanations.`;
          
          // For AI responses that don't return strings directly, we need to handle the response differently
          const result = await onAskAI(enhancedPrompt);
          
          // Since onAskAI might not return the refined text directly, show preview and let external system handle it
          setTimeout(() => {
            refinementHandlers.showPreview();
          }, 500);
        } else {
          throw new Error('No refinement function available');
        }
      } else {
        // Handle preset refinement commands using the refine-text API
        console.log(`[CommandHandlers] Executing preset refinement: ${refinementId}`);
        if (!onRefineText) {
          throw new Error('Refinement function not available');
        }
        
        const result = await onRefineText(refinementId, selectedText);
        
        // ALWAYS show preview, never auto-apply
        if (typeof result === 'string') {
          refinementHandlers.setRefinementResult(result);
        } else {
          // If onRefineText doesn't return a result, the external system should handle the preview
          // Just show the preview and let the external system populate it
          setTimeout(() => {
            refinementHandlers.showPreview();
          }, 500);
        }
      }

      operationHandlers.resetOperation();
    } catch (error) {
      console.error('Failed to refine text:', error);
      refinementHandlers.resetRefinement();
      operationHandlers.resetOperation();
    }
  };

  const handleGenerationCommandWithNoteType = async (sourceNoteType: NoteType, commandId: string, commandDescription?: string) => {
    if (operationState.isOperationInProgress) return;

    const fullCommandId = `${sourceNoteType}-${commandId}`;
    operationHandlers.startOperation(fullCommandId, 'generation');

    try {
      // Get the command from the specific note type
      const { typeSpecificCommands } = getCommandsForNoteType(sourceNoteType);
      const command = typeSpecificCommands.find(cmd => cmd.id === commandId);
      
      if (command && onAskAI) {
        console.log(`[CommandHandlers] Executing generation command: ${commandId} from ${sourceNoteType}`);
        await onAskAI(command.description || command.label);
      } else if (commandDescription && onAskAI) {
        // Fallback to provided description
        console.log(`[CommandHandlers] Executing generation command with fallback: ${commandId}`);
        await onAskAI(commandDescription);
      } else {
        console.error(`[CommandHandlers] Could not execute generation command: ${commandId} from ${sourceNoteType}`);
        throw new Error('Command not found');
      }

      operationHandlers.completeOperation(fullCommandId);
    } catch (error) {
      console.error('Failed to execute generation command:', error);
      operationHandlers.resetOperation();
    }
  };

  const handleGenerationCommand = async (commandId: string) => {
    if (operationState.isOperationInProgress) return;

    operationHandlers.startOperation(commandId, 'generation');

    try {
      const { typeSpecificCommands } = getCommandsForNoteType(noteType as NoteType);
      const command = typeSpecificCommands.find(cmd => cmd.id === commandId);
      if (command && onAskAI) {
        console.log(`[CommandHandlers] Executing generation command: ${commandId} for current note type ${noteType}`);
        await onAskAI(command.description || command.label);
      } else {
        console.error(`[CommandHandlers] Could not find generation command: ${commandId} for note type ${noteType}`);
        throw new Error('Command not found');
      }

      operationHandlers.completeOperation(commandId);
    } catch (error) {
      console.error('Failed to execute generation command:', error);
      operationHandlers.resetOperation();
    }
  };

  const handleUniversalCommand = async (commandId: string) => {
    if (operationState.isOperationInProgress) return;

    // For instant formatting commands, execute immediately and close
    const instantCommands = ['bullet-list', 'numbered-list', 'heading-1', 'heading-2', 'heading-3'];
    
    if (instantCommands.includes(commandId)) {
      switch (commandId) {
        case 'bullet-list':
          onInsertBulletList();
          break;
        case 'numbered-list':
          onInsertNumberedList();
          break;
        case 'heading-1':
          onInsertHeading(1);
          break;
        case 'heading-2':
          onInsertHeading(2);
          break;
        case 'heading-3':
          onInsertHeading(3);
          break;
      }
      onClose();
      return;
    }

    // For async AI-powered commands
    operationHandlers.startOperation(commandId, 'generation');

    try {
      switch (commandId) {
        case 'ideas':
          console.log(`[CommandHandlers] Executing ideas command`);
          const ideasResult = onRequestIdeas?.();
          if (ideasResult instanceof Promise) {
            await ideasResult;
          }
          break;

        case 'analysis':
          console.log(`[CommandHandlers] Executing deep analysis command with noteType: ${noteType}`);
          if (onRequestAnalysis) {
            await onRequestAnalysis(noteType);
          } else {
            throw new Error('Analysis function not available');
          }
          break;

        case 'action-items':
          console.log(`[CommandHandlers] Executing action items extraction command`);
          if (onAskAI) {
            const actionItemsPrompt = `Please analyze the content and extract specific, actionable next steps. Format them as a clear numbered list. Focus on concrete tasks that can be completed, not general advice.`;
            await onAskAI(actionItemsPrompt);
          } else {
            throw new Error('AI writing function not available');
          }
          break;

        case 'summary':
          console.log(`[CommandHandlers] Executing summary creation command`);
          if (onAskAI) {
            const summaryPrompt = `Please create a concise summary of the key points and main takeaways from this content. Focus on the most important information and present it in a clear, digestible format.`;
            await onAskAI(summaryPrompt);
          } else {
            throw new Error('AI writing function not available');
          }
          break;

        case 'table':
          console.log(`[CommandHandlers] Executing table generation command`);
          if (onAskAI) {
            const tablePrompt = `Please analyze the content and organize relevant information into a well-structured table format. Use appropriate columns and rows to present the data clearly.`;
            await onAskAI(tablePrompt);
          } else {
            throw new Error('AI writing function not available');
          }
          break;

        default:
          console.log(`Universal command not implemented: ${commandId}`);
          operationHandlers.resetOperation();
          onClose();
          return;
      }

      operationHandlers.completeOperation(commandId);
      
      // Auto-close after showing success briefly
      setTimeout(() => {
        operationHandlers.resetOperation();
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error(`Failed to execute universal command ${commandId}:`, error);
      operationHandlers.resetOperation();
      // Don't close on error, let user try again
    }
  };

  // Internal refinement preview handlers
  const handleInternalPreviewAccept = async () => {
    if (!onAcceptRefinement) return;

    refinementHandlers.setCompleting();

    try {
      await onAcceptRefinement();
      
      // Show success state briefly then close
      operationHandlers.setOperationState({
        isOperationInProgress: false,
        loadingCommandId: null,
        completedCommandId: 'accept-refinement',
        operationType: 'refinement'
      });

      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Failed to accept refinement:', error);
      refinementHandlers.showPreview(); // Reset to showing state
    }
  };

  const handleInternalPreviewRetry = async () => {
    if (!onRetryRefinement || !refinementState.currentRefinementId) return;

    refinementHandlers.setProcessing(true);

    try {
      const result = await onRetryRefinement();
      
      if (typeof result === 'string') {
        refinementHandlers.setRefinementResult(result);
      } else {
        setTimeout(() => {
          refinementHandlers.showPreview();
        }, 500);
      }
    } catch (error) {
      console.error('Failed to retry refinement:', error);
      refinementHandlers.resetRefinement();
    }
  };

  const handleInternalPreviewReject = async () => {
    refinementHandlers.resetRefinement();
    
    if (onRejectRefinement) {
      try {
        await onRejectRefinement();
      } catch (error) {
        console.error('Failed to reject refinement:', error);
      }
    }
  };

  return {
    handleRefinementSelect,
    handleGenerationCommandWithNoteType,
    handleGenerationCommand,
    handleUniversalCommand,
    handleInternalPreviewAccept,
    handleInternalPreviewRetry,
    handleInternalPreviewReject,
    handleCustomGeneration
  };
} 
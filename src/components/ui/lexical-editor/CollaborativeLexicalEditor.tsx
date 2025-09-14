import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { LinkPlugin } from '@lexical/react/LexicalLinkPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $createParagraphNode, $createTextNode, EditorState, LexicalEditor } from 'lexical';
import { $convertFromMarkdownString, $convertToMarkdownString, TRANSFORMERS } from '@lexical/markdown';

import { Id } from '@/convex/_generated/dataModel';
import { useCollaborativeEditor } from '@/lib/operationalTransform/useCollaborativeEditor';
import { getCurrentUserId } from '@/app/lib/api-helpers';
import { CommandPalettePlugin } from './plugins/CommandPalettePlugin';
import { useNoteRefPlugin } from './plugins/NoteRefPlugin';
import { initialConfig } from './config';

export interface CollaborativeLexicalEditorRef {
  triggerCommandPalette: () => void;
  getCurrentMarkdown: () => string;
  setMarkdown: (markdown: string) => void;
  focus: () => void;
}

interface CollaborativeLexicalEditorProps {
  noteId: Id<"notes">;
  content: string;
  onContentChange: (content: string) => void;
  placeholder?: string;
  className?: string;
  availableNotes?: Array<{ _id: string; title: string; type: string }>;
  onLinkNote?: (noteId: string) => void;
  onAskAI?: (text: string, context?: any) => void;
  onRequestAnalysis?: () => void;
  onRequestIdeas?: () => void;
  userId?: string;
  noteType?: string;
  containerRef?: React.RefObject<HTMLDivElement>;
  onRefineText?: (text: string, refinementType: string) => void;
  onAcceptRefinement?: () => void;
  onRejectRefinement?: () => void;
  onRetryRefinement?: () => void;
  disabled?: boolean;
  // Collaborative editing props
  enableCollaboration?: boolean;
  onCollaboratorsChange?: (collaborators: string[]) => void;
  onConnectionChange?: (isConnected: boolean) => void;
}

// Plugin to sync Lexical editor with OT system
function CollaborationPlugin({ 
  noteId, 
  userId, 
  onContentChange,
  enableCollaboration = true,
  onCollaboratorsChange,
  onConnectionChange 
}: {
  noteId: Id<"notes">;
  userId: string;
  onContentChange: (content: string) => void;
  enableCollaboration?: boolean;
  onCollaboratorsChange?: (collaborators: string[]) => void;
  onConnectionChange?: (isConnected: boolean) => void;
}) {
  const [editor] = useLexicalComposerContext();
  const [isUpdatingFromOT, setIsUpdatingFromOT] = useState(false);
  
  // Initialize collaborative editor
  const [collaborativeState, collaborativeActions] = useCollaborativeEditor(
    noteId,
    userId,
    {
      autoConnect: enableCollaboration,
      onError: (error) => {
        console.error('Collaborative editing error:', error);
      },
    }
  );
  
  // Update callbacks when state changes
  useEffect(() => {
    if (onCollaboratorsChange) {
      onCollaboratorsChange(collaborativeState.collaborators);
    }
  }, [collaborativeState.collaborators, onCollaboratorsChange]);
  
  useEffect(() => {
    if (onConnectionChange) {
      onConnectionChange(collaborativeState.isConnected);
    }
  }, [collaborativeState.isConnected, onConnectionChange]);
  
  // Handle content changes from OT system
  useEffect(() => {
    if (collaborativeState.content && enableCollaboration) {
      setIsUpdatingFromOT(true);
      
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        
        // Convert markdown to Lexical nodes
        $convertFromMarkdownString(collaborativeState.content, TRANSFORMERS);
      });
      
      // Notify parent component
      onContentChange(collaborativeState.content);
      
      setIsUpdatingFromOT(false);
    }
  }, [collaborativeState.content, editor, onContentChange, enableCollaboration]);
  
  // Handle local content changes
  const handleLocalChange = (editorState: EditorState) => {
    if (isUpdatingFromOT || !enableCollaboration) return;
    
    editorState.read(() => {
      const markdown = $convertToMarkdownString(TRANSFORMERS);
      
      // Apply change through OT system
      collaborativeActions.updateContent(markdown);
    });
  };
  
  useEffect(() => {
    if (!enableCollaboration) return;
    
    return editor.registerUpdateListener(({ editorState }) => {
      handleLocalChange(editorState);
    });
  }, [editor, enableCollaboration]);
  
  return null;
}

// Status indicator for collaborative editing
function CollaborationStatus({ 
  isConnected, 
  collaborators, 
  pendingOperations 
}: {
  isConnected: boolean;
  collaborators: string[];
  pendingOperations: number;
}) {
  if (!isConnected) {
    return (
      <div className="absolute top-2 right-2 flex items-center gap-2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm rounded-md px-2 py-1 border">
        <div className="w-2 h-2 rounded-full bg-red-500" />
        Offline
      </div>
    );
  }
  
  return (
    <div className="absolute top-2 right-2 flex items-center gap-2 text-xs text-muted-foreground bg-background/80 backdrop-blur-sm rounded-md px-2 py-1 border">
      <div className="w-2 h-2 rounded-full bg-green-500" />
      <span>
        {collaborators.length > 1 ? `${collaborators.length} collaborators` : 'Connected'}
      </span>
      {pendingOperations > 0 && (
        <span className="text-yellow-600">
          ({pendingOperations} pending)
        </span>
      )}
    </div>
  );
}

// Internal component that has access to the editor context
function EditorContent({ 
  content, 
  onContentChange, 
  availableNotes,
  onLinkNote,
  onAskAI,
  onRequestAnalysis,
  onRequestIdeas,
  userId,
  noteType,
  containerRef,
  onRefineText,
  onAcceptRefinement,
  onRejectRefinement,
  onRetryRefinement,
  editorRef,
  noteId,
  enableCollaboration,
  onCollaboratorsChange,
  onConnectionChange,
  disabled = false
}: CollaborativeLexicalEditorProps & { 
  editorRef: React.RefObject<CollaborativeLexicalEditorRef>;
}) {
  const [editor] = useLexicalComposerContext();
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [pendingOperations, setPendingOperations] = useState(0);
  
  // Get current markdown content
  const getCurrentMarkdown = () => {
    return editor.getEditorState().read(() => {
      return $convertToMarkdownString(TRANSFORMERS);
    });
  };
  
  // Set markdown content
  const setMarkdown = (markdown: string) => {
    editor.update(() => {
      const root = $getRoot();
      root.clear();
      $convertFromMarkdownString(markdown, TRANSFORMERS);
    });
  };
  
  // Focus the editor
  const focus = () => {
    editor.focus();
  };
  
  // Expose methods through ref
  useImperativeHandle(editorRef, () => ({
    triggerCommandPalette: () => {
      // This would trigger the command palette
    },
    getCurrentMarkdown,
    setMarkdown,
    focus,
  }));
  
  // Initialize content
  useEffect(() => {
    if (content && !enableCollaboration) {
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        
        if (content.trim()) {
          $convertFromMarkdownString(content, TRANSFORMERS);
        } else {
          const paragraph = $createParagraphNode();
          root.append(paragraph);
        }
      });
    }
  }, [editor, content, enableCollaboration]);
  
  // Handle content changes for non-collaborative mode
  const handleChange = (editorState: EditorState) => {
    if (!enableCollaboration) {
      editorState.read(() => {
        const markdown = $convertToMarkdownString(TRANSFORMERS);
        onContentChange(markdown);
      });
    }
  };
  
  // Plugin for note references
  useNoteRefPlugin({ availableNotes, onLinkNote });
  
  const handleCollaboratorsChange = (newCollaborators: string[]) => {
    setCollaborators(newCollaborators);
    if (onCollaboratorsChange) {
      onCollaboratorsChange(newCollaborators);
    }
  };
  
  const handleConnectionChange = (connected: boolean) => {
    setIsConnected(connected);
    if (onConnectionChange) {
      onConnectionChange(connected);
    }
  };
  
  return (
    <div className="relative h-full">
      <RichTextPlugin
        contentEditable={
          <ContentEditable 
            className="w-full h-full min-h-[300px] p-4 bg-transparent border-0 focus:outline-none resize-none overflow-auto text-foreground selection:bg-blue-200/50 dark:selection:bg-blue-800/50"
            style={{
              fontFamily: 'inherit',
              fontSize: '16px',
              lineHeight: '1.625',
              fontWeight: 'inherit'
            }}
            readOnly={disabled}
          />
        }
        placeholder={
          <div className="absolute top-4 left-4 text-muted-foreground/50 pointer-events-none">
            Start writing...
          </div>
        }
        ErrorBoundary={LexicalErrorBoundary}
      />
      
      <OnChangePlugin onChange={handleChange} />
      <HistoryPlugin />
      <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
      <ListPlugin />
      <LinkPlugin />
      
      {/* Collaborative editing plugin */}
      {enableCollaboration && userId && (
        <CollaborationPlugin
          noteId={noteId}
          userId={userId}
          onContentChange={onContentChange}
          enableCollaboration={enableCollaboration}
          onCollaboratorsChange={handleCollaboratorsChange}
          onConnectionChange={handleConnectionChange}
        />
      )}
      
      {/* Command palette and other plugins */}
      <CommandPalettePlugin
        onAskAI={onAskAI}
        onRequestAnalysis={onRequestAnalysis}
        onRequestIdeas={onRequestIdeas}
        availableNotes={availableNotes}
        onLinkNote={onLinkNote}
        userId={userId}
        noteType={noteType}
        containerRef={containerRef}
        onRefineText={onRefineText}
        onAcceptRefinement={onAcceptRefinement}
        onRejectRefinement={onRejectRefinement}
        onRetryRefinement={onRetryRefinement}
      />
      
      {/* Collaboration status indicator */}
      {enableCollaboration && (
        <CollaborationStatus
          isConnected={isConnected}
          collaborators={collaborators}
          pendingOperations={pendingOperations}
        />
      )}
    </div>
  );
}

export const CollaborativeLexicalEditor = forwardRef<
  CollaborativeLexicalEditorRef,
  CollaborativeLexicalEditorProps
>(function CollaborativeLexicalEditor(props, ref) {
  const {
    noteId,
    content,
    onContentChange,
    placeholder = "Start writing...",
    className = "",
    availableNotes = [],
    onLinkNote,
    onAskAI,
    onRequestAnalysis,
    onRequestIdeas,
    userId: propUserId,
    noteType = "idea_bank",
    containerRef,
    onRefineText,
    onAcceptRefinement,
    onRejectRefinement,
    onRetryRefinement,
    disabled = false,
    enableCollaboration = true,
    onCollaboratorsChange,
    onConnectionChange,
  } = props;
  
  const editorRef = useRef<CollaborativeLexicalEditorRef>(null);
  const userId = propUserId || getCurrentUserId();
  
  // Forward ref
  useImperativeHandle(ref, () => editorRef.current!);
  
  const config = {
    ...initialConfig,
    editable: !disabled,
  };
  
  return (
    <div className={`h-full ${className}`}>
      <LexicalComposer initialConfig={config}>
        <EditorContent
          {...props}
          userId={userId}
          editorRef={editorRef}
          enableCollaboration={enableCollaboration}
          onCollaboratorsChange={onCollaboratorsChange}
          onConnectionChange={onConnectionChange}
        />
      </LexicalComposer>
    </div>
  );
});

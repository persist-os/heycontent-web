import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Id } from '@/convex/_generated/dataModel';
import { CollaborativeLexicalEditor, CollaborativeLexicalEditorRef } from './CollaborativeLexicalEditor';
import { LexicalNotepadEditor, LexicalNotepadEditorRef } from './LexicalNotepadEditor';
import { Button } from '@/components/ui/button';
import { Users, Wifi, WifiOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export interface CollaborativeNotepadEditorRef extends LexicalNotepadEditorRef {
  toggleCollaboration: () => void;
  getCollaborationStatus: () => {
    isEnabled: boolean;
    isConnected: boolean;
    collaborators: string[];
  };
}

interface CollaborativeNotepadEditorProps {
  noteId?: Id<"notes">;
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
  // Collaborative editing options
  enableCollaborationByDefault?: boolean;
  showCollaborationToggle?: boolean;
  onCollaborationToggle?: (enabled: boolean) => void;
}

export const CollaborativeNotepadEditor = forwardRef<
  CollaborativeNotepadEditorRef,
  CollaborativeNotepadEditorProps
>(function CollaborativeNotepadEditor(props, ref) {
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
    userId,
    noteType = "idea_bank",
    containerRef,
    onRefineText,
    onAcceptRefinement,
    onRejectRefinement,
    onRetryRefinement,
    disabled = false,
    enableCollaborationByDefault = true,
    showCollaborationToggle = true,
    onCollaborationToggle,
  } = props;
  
  const [collaborationEnabled, setCollaborationEnabled] = useState(
    enableCollaborationByDefault && !!noteId
  );
  const [collaborators, setCollaborators] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  
  const collaborativeEditorRef = useRef<CollaborativeLexicalEditorRef>(null);
  const standardEditorRef = useRef<LexicalNotepadEditorRef>(null);
  
  // Determine which editor to use
  const useCollaborativeEditor = collaborationEnabled && noteId;
  const currentEditorRef = useCollaborativeEditor ? collaborativeEditorRef : standardEditorRef;
  
  // Handle collaboration toggle
  const toggleCollaboration = () => {
    const newEnabled = !collaborationEnabled;
    setCollaborationEnabled(newEnabled);
    
    if (onCollaborationToggle) {
      onCollaborationToggle(newEnabled);
    }
  };
  
  // Handle collaborators change
  const handleCollaboratorsChange = (newCollaborators: string[]) => {
    setCollaborators(newCollaborators);
  };
  
  // Handle connection change
  const handleConnectionChange = (connected: boolean) => {
    setIsConnected(connected);
  };
  
  // Expose methods through ref
  useImperativeHandle(ref, () => ({
    triggerCommandPalette: () => {
      currentEditorRef.current?.triggerCommandPalette();
    },
    getCurrentMarkdown: () => {
      return currentEditorRef.current?.getCurrentMarkdown() || '';
    },
    setMarkdown: (markdown: string) => {
      currentEditorRef.current?.setMarkdown(markdown);
    },
    focus: () => {
      currentEditorRef.current?.focus();
    },
    toggleCollaboration,
    getCollaborationStatus: () => ({
      isEnabled: collaborationEnabled,
      isConnected,
      collaborators,
    }),
  }));
  
  // Render collaboration status and toggle
  const renderCollaborationControls = () => {
    if (!showCollaborationToggle || !noteId) return null;
    
    return (
      <div className="absolute top-2 left-2 flex items-center gap-2 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleCollaboration}
          className="h-8 px-2 bg-background/80 backdrop-blur-sm border"
          title={collaborationEnabled ? "Disable collaboration" : "Enable collaboration"}
        >
          <Users className="w-4 h-4" />
          {collaborationEnabled ? (
            <Badge variant={isConnected ? "default" : "secondary"} className="ml-1 h-5">
              {isConnected ? (
                <>
                  <Wifi className="w-3 h-3 mr-1" />
                  {collaborators.length > 1 ? collaborators.length : 'Live'}
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 mr-1" />
                  Offline
                </>
              )}
            </Badge>
          ) : (
            <Badge variant="outline" className="ml-1 h-5">
              Off
            </Badge>
          )}
        </Button>
      </div>
    );
  };
  
  return (
    <div className={`relative h-full ${className}`}>
      {renderCollaborationControls()}
      
      {useCollaborativeEditor ? (
        <CollaborativeLexicalEditor
          ref={collaborativeEditorRef}
          noteId={noteId}
          content={content}
          onContentChange={onContentChange}
          placeholder={placeholder}
          className="h-full"
          availableNotes={availableNotes}
          onLinkNote={onLinkNote}
          onAskAI={onAskAI}
          onRequestAnalysis={onRequestAnalysis}
          onRequestIdeas={onRequestIdeas}
          userId={userId}
          noteType={noteType}
          containerRef={containerRef}
          onRefineText={onRefineText}
          onAcceptRefinement={onAcceptRefinement}
          onRejectRefinement={onRejectRefinement}
          onRetryRefinement={onRetryRefinement}
          disabled={disabled}
          enableCollaboration={true}
          onCollaboratorsChange={handleCollaboratorsChange}
          onConnectionChange={handleConnectionChange}
        />
      ) : (
        <LexicalNotepadEditor
          ref={standardEditorRef}
          content={content}
          onContentChange={onContentChange}
          placeholder={placeholder}
          className="h-full"
          availableNotes={availableNotes}
          onLinkNote={onLinkNote}
          onAskAI={onAskAI}
          onRequestAnalysis={onRequestAnalysis}
          onRequestIdeas={onRequestIdeas}
          userId={userId}
          noteType={noteType}
          containerRef={containerRef}
          onRefineText={onRefineText}
          onAcceptRefinement={onAcceptRefinement}
          onRejectRefinement={onRejectRefinement}
          onRetryRefinement={onRetryRefinement}
          disabled={disabled}
        />
      )}
    </div>
  );
});

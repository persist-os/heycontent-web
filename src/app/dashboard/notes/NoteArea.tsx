"use client";

import React, { useState, useRef } from 'react';
import { Note, NoteUpdate } from './types';
import { CommandMenu } from './CommandMenu';
import { NoteHeader } from './components/NoteHeader';
import { NoteEditor } from './components/NoteEditor';
import { NoteMeta } from './components/NoteMeta';
import { useSmartNoteEditor } from './hooks/useSmartNoteEditor';
import { FullAnalysisModal } from './components/FullAnalysisModal';
import IdeasPanel from "./components/IdeasPanel";
import { AnalysisSection } from "./AnalysisSection";
import type { Id } from "@/convex/_generated/dataModel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Lightbulb, Edit } from 'lucide-react';


interface NoteAreaProps {
  note: Note;
  onUpdate: (noteId: string, updates: NoteUpdate) => Promise<Note>;
  onSave: (content: string, title?: string) => void;
  onToggleShortcuts: () => void;
  onRequestAIInsights: (noteId: string, note: Note) => Promise<void>;
  onBack: () => void;
  isMobile: boolean;
}

export function NoteArea({
  note,
  onUpdate,
  onSave,
  onToggleShortcuts,
  onRequestAIInsights,
  onBack,
  isMobile
}: NoteAreaProps) {
  // Local UI state
  const [activeTab, setActiveTab] = useState<string>("editor");
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  
  // Add event listener to switch to editor tab when an idea is applied
  React.useEffect(() => {
    const handleSwitchToEditor = () => {
      setActiveTab("editor");
    };
    
    window.addEventListener('switchToEditorTab', handleSwitchToEditor);
    
    return () => {
      window.removeEventListener('switchToEditorTab', handleSwitchToEditor);
    };
  }, []);
  
  // Use the hook for all editor functionality
  const {
    content,
    showFullAnalysis,
    setShowFullAnalysis,
    selectedInsight,
    cursorPosition,
    setCursorPosition,
    showCommands,
    setShowCommands,
    menuPosition,
    searchTerm,
    insertText,
    handleContentChange,
    handleCommand,
    handleKeyDown,
    textAreaRef,
    handleSave,
  } = useSmartNoteEditor({
    note,
    onUpdate,
    onSave,
    onToggleShortcuts,
    onRequestAIInsights,
    isEditingTitle
  });

  // Track the latest title from NoteMeta
  const [latestTitle, setLatestTitle] = useState(note.title || "Untitled Note");

  // Keep local latestTitle in sync with note prop
  React.useEffect(() => {
    setLatestTitle(note.title || "Untitled Note");
  }, [note._id, note.title]);

  // Callback to receive title changes from NoteMeta
  const handleMetaTitleChange = (title: string) => {
    setLatestTitle(title);
    console.log('[NoteArea] handleMetaTitleChange: received new title', title);
  };

  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <NoteHeader 
        note={note}
        onUpdate={onUpdate}
        onSave={handleSave}
        onRequestAIInsights={onRequestAIInsights}
        onBack={onBack} 
        isMobile={isMobile}
        currentContent={content}
      />
      
      {/* Note metadata */}
      <NoteMeta
        note={note}
        onUpdate={onUpdate}
        onTitleChange={handleMetaTitleChange}
        onEditingTitleChange={setIsEditingTitle}
      />
      
      {/* Main content area with tabs */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Tabs 
          defaultValue="editor" 
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <TabsList className="bg-white border-b border-gray-200 px-2 mb-0 w-full justify-start">
            <TabsTrigger value="editor" className="flex items-center gap-1 data-[state=active]:text-purple-700">
              <Edit size={16} />
              <span>Editor</span>
            </TabsTrigger>
            <TabsTrigger value="analysis" className="flex items-center gap-1 data-[state=active]:text-purple-700">
              <Brain size={16} />
              <span>Analysis</span>
            </TabsTrigger>
            <TabsTrigger value="ideas" className="flex items-center gap-1 data-[state=active]:text-purple-700">
              <Lightbulb size={16} />
              <span>Ideas</span>
            </TabsTrigger>
          </TabsList>
          
          <div className="flex flex-1 overflow-hidden">
            {/* Editor Tab - Always visible regardless of active tab */}
            <div className={`flex-1 overflow-hidden relative transition-all ${activeTab !== "editor" ? "lg:flex-[0.6] border-r border-gray-200" : ""}`}>
              <NoteEditor
                ref={textAreaRef}
                content={content}
                onContentChange={handleContentChange}
                onKeyDown={handleKeyDown}
                cursorPosition={cursorPosition}
                setCursorPosition={setCursorPosition}
              />
              
              {/* Command menu */}
              {showCommands && (
                <CommandMenu
                  onSelect={(cmd) => handleCommand(cmd as any)}
                  onClose={() => setShowCommands(false)}
                  searchTerm={searchTerm}
                  position={menuPosition}
                  userId={String(note.userId)}
                  noteId={String(note._id)}
                />
              )}
            </div>
            
            {/* Right panel for Analysis or Ideas based on active tab */}
            {activeTab !== "editor" && (
              <div className="flex-1 overflow-hidden lg:flex-[0.4] transition-all">
                <TabsContent value="analysis" className="h-full overflow-auto m-0 p-0 data-[state=active]:flex-1">
                  <div className="h-full overflow-auto">
                    <AnalysisSection noteId={note._id as Id<"notes">} userId={note.userId} />
                  </div>
                </TabsContent>
                
                <TabsContent value="ideas" className="h-full overflow-auto m-0 p-0 data-[state=active]:flex-1">
                  <div className="h-full overflow-auto p-4">
                    <IdeasPanel 
                      noteId={String(note._id)}
                      userId={String(note.userId)}
                      platform={note.platform}
                      mode="note"
                      limit={5}
                      onApplyIdea={(idea) => insertText(idea)}
                      isEmbedded={true}
                    />
                  </div>
                </TabsContent>
              </div>
            )}
          </div>
        </Tabs>
      </div>
      
      {/* Full Analysis Modal */}
      <FullAnalysisModal
        showFullAnalysis={showFullAnalysis}
        setShowFullAnalysis={setShowFullAnalysis}
        selectedInsight={selectedInsight}
      />
    </div>
  );
}

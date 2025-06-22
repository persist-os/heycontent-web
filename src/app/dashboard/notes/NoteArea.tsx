"use client";

import React, { useState, useRef } from 'react';
import { Note, NoteUpdate, NoteType } from './types';
import { CommandMenu } from './CommandMenu';
import { NoteHeader } from './components/NoteHeader';
import { NoteEditor } from './components/NoteEditor';
import { ImageUpload } from './components/ImageUpload';
import { NoteMeta } from './components/NoteMeta';
import { TypeSelector } from './components/TypeSelector';
import { useSmartNoteEditor } from './hooks/useSmartNoteEditor';
import { FullAnalysisModal } from './components/FullAnalysisModal';
import IdeasPanel from "./components/IdeasPanel";
import { AnalysisSection } from "./AnalysisSection";
import type { Id } from "@/convex/_generated/dataModel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Lightbulb, Edit } from 'lucide-react';


interface NoteAreaProps {
  note: Note;
  onUpdate: (noteId: string | Id<"notes">, updates: NoteUpdate) => Promise<Note>;
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

  const handleTypeChange = async (newType: NoteType) => {
    console.log('[NoteArea] handleTypeChange: updating type', { noteId: note._id, newType });
    await onUpdate(note._id, { type: newType, typeGenerated: false });
  };

  // Handle image uploads
  const handleImagesUploaded = async (images: Array<{
    url: string;
    filename: string;
    originalFilename?: string;
    uploadedAt: number;
    size?: number;
    mimeType?: string;
    width?: number;
    height?: number;
  }>) => {
    console.log('[NoteArea] handleImagesUploaded: updating note with images', { 
      noteId: note._id, 
      imageCount: images.length,
      images: images.map(img => ({
        url: img.url,
        filename: img.filename,
        size: img.size,
        mimeType: img.mimeType,
        hasWidth: img.width !== undefined,
        hasHeight: img.height !== undefined
      }))
    });
    
    try {
      // Clean up the images data to ensure no undefined values
      const cleanImages = images.map(img => {
        const cleanImg: any = {
          url: img.url,
          filename: img.filename,
          uploadedAt: img.uploadedAt
        };
        
        // Only add optional fields if they have actual values
        if (img.originalFilename) cleanImg.originalFilename = img.originalFilename;
        if (img.size) cleanImg.size = img.size;
        if (img.mimeType) cleanImg.mimeType = img.mimeType;
        if (img.width) cleanImg.width = img.width;
        if (img.height) cleanImg.height = img.height;
        
        return cleanImg;
      });
      
      console.log('[NoteArea] handleImagesUploaded: cleaned images data', cleanImages);
      
      await onUpdate(note._id, { images: cleanImages });
      console.log('[NoteArea] handleImagesUploaded: successfully updated note with images');
    } catch (error) {
      console.error('[NoteArea] handleImagesUploaded: failed to update note with images', error);
      // Don't throw the error, just log it so the user can still see their uploaded images
      // The images are already uploaded to GCS, they just aren't linked to the note yet
    }
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
          <TabsList className="bg-background/95 backdrop-blur-sm border-b border-border px-2 mb-0 w-full justify-between">
            <div className="flex items-center">
              <TabsTrigger 
                value="editor" 
                className="flex items-center gap-1.5 data-[state=active]:text-primary data-[state=active]:shadow-[0_-2px_0_0_hsl(var(--primary))_inset]"
              >
                <Edit size={16} className="h-4 w-4" />
                <span>Editor</span>
              </TabsTrigger>
              <TabsTrigger 
                value="analysis" 
                className="flex items-center gap-1.5 data-[state=active]:text-primary data-[state=active]:shadow-[0_-2px_0_0_hsl(var(--primary))_inset]"
              >
                <Brain size={16} className="h-4 w-4" />
                <span>Analysis</span>
              </TabsTrigger>
              <TabsTrigger 
                value="ideas" 
                className="flex items-center gap-1.5 data-[state=active]:text-primary data-[state=active]:shadow-[0_-2px_0_0_hsl(var(--primary))_inset]"
              >
                <Lightbulb size={16} className="h-4 w-4" />
                <span>Ideas</span>
              </TabsTrigger>
            </div>
            
            {/* Type Selector aligned with tabs */}
            <div className="flex items-center mr-4">
              <TypeSelector
                currentType={note.type || 'idea_bank'}
                typeGenerated={note.typeGenerated}
                onTypeChange={handleTypeChange}
              />
            </div>
          </TabsList>
          
          <div className="flex flex-1 overflow-hidden">
            {/* Editor Tab - Always visible regardless of active tab */}
            <div className={`flex-1 overflow-hidden relative transition-all ${
              activeTab !== "editor" ? "lg:flex-[0.6] border-r border-border/50" : ""
            }`}>
              <div className="h-full flex flex-col">
                <div className="flex-1 overflow-hidden">
                  <NoteEditor
                    ref={textAreaRef}
                    content={content}
                    onContentChange={handleContentChange}
                    onKeyDown={handleKeyDown}
                    cursorPosition={cursorPosition}
                    setCursorPosition={setCursorPosition}
                  />
                </div>
                
                {/* Image Upload Section */}
                <div className="border-t border-border p-4 bg-background/50">
                  <ImageUpload
                    onImagesUploaded={handleImagesUploaded}
                    existingImages={note.images || []}
                    maxImages={5}
                  />
                </div>
              </div>
              
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
                  <div className="h-full overflow-auto p-4 bg-background/50">
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

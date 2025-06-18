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
import { Brain, Lightbulb, Edit, Upload, Image as ImageIcon } from 'lucide-react';
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import ImageDisplay from "@/components/ImageDisplay";


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
  
  // Drag and drop state
  const [isDragActive, setIsDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Image upload mutations
  const generateUploadUrl = useMutation(api.images.generateImageUploadUrl);
  const saveImageMetadata = useMutation(api.images.saveImageMetadata);
  
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

  // Drag and drop handlers
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if dragged items contain files
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const hasFiles = Array.from(e.dataTransfer.items).some(
        item => item.kind === 'file' && item.type.startsWith('image/')
      );
      if (hasFiles) {
        setIsDragActive(true);
      }
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only hide if we're leaving the main container
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragActive(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('image/')
    );
    
    if (files.length === 0) return;
    
    setIsUploading(true);
    
    try {
      for (const file of files) {
        // Validate file size (10MB limit)
        if (file.size > 10 * 1024 * 1024) {
          console.warn(`Skipping ${file.name}: File too large (max 10MB)`);
          continue;
        }
        
        // Get upload URL
        const uploadUrl = await generateUploadUrl();
        
        // Upload file
        const uploadResponse = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        
        if (!uploadResponse.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }
        
        const { storageId } = await uploadResponse.json();
        
        // Save metadata with note association
        await saveImageMetadata({
          noteId: note._id as any,
          storageId,
          filename: file.name,
          contentType: file.type,
          size: file.size,
        });
      }
      
      console.log(`Successfully uploaded ${files.length} image(s) to note`);
      
    } catch (error) {
      console.error("Upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div 
      className="flex flex-col h-full w-full relative"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Overlay */}
      {(isDragActive || isUploading) && (
        <div className="absolute inset-0 bg-blue-50/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center border-2 border-dashed border-blue-400 rounded-lg">
          <div className="text-center p-8">
            {isUploading ? (
              <>
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h3 className="text-xl font-semibold text-blue-900 mb-2">Uploading Images...</h3>
                <p className="text-blue-700">Please wait while your images are being processed.</p>
              </>
            ) : (
              <>
                <ImageIcon className="w-16 h-16 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-blue-900 mb-2">Drop Images Here</h3>
                <p className="text-blue-700">Images will be attached to this note</p>
                <p className="text-sm text-blue-600 mt-2">Supports PNG, JPG, GIF up to 10MB each</p>
              </>
            )}
          </div>
        </div>
      )}

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
              
              {/* Image Display */}
              <ImageDisplay 
                noteId={String(note._id)}
                className="p-4 border-4 border-green-500"
              />
              
              {/* Debug info */}
              <div className="p-2 text-xs text-gray-500 border-t">
                Debug: Note ID = {note._id}
                <br />
                ImageDisplay should be rendering above this line
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

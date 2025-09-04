'use client'

import React, { forwardRef, useEffect, useImperativeHandle } from 'react'
import { Edit, Eye } from 'lucide-react'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { UnifiedContentSelector } from '@/components/ui/UnifiedContentSelector'
import { useRichTextEditor } from './use-rich-text-editor'
import { RichTextEditorProps } from './rich-text-editor.types'
import { ContentRenderer } from './content-renderer'
import { InlineCommandPalette } from '@/app/dashboard/notes/components/InlineCommandPalette'
import { getCursorCoordinates } from './formatting-utils'

export interface RichTextEditorRef {
  triggerCommandPalette: () => void;
}

export const RichTextEditor = forwardRef<RichTextEditorRef, RichTextEditorProps>(({
  content,
  onContentChange,
  placeholder = 'Start writing...',
  disabled = false,
  className = '',
  showPreview = true,
  onShowPreviewChange,
  onAskAI,
  onRequestAnalysis,
  onRequestIdeas,
  noteId,
  noteTitle,
  platform,
  tags,
  userId,
  noteType = 'idea_bank',
  availableNotes = [],
  onLinkNote,
  onLinkContent,
  allLinkableContent,
  containerRef,
  ...rest
}, ref) => {
  // Use the extracted hook for all state and logic
  const {
    currentShowPreview,
    showCommandPalette,
    showEnhancedContentSelector,
    palettePosition,
    paletteMode,
    contentSearchTerm,
    textAreaRef,
    // New refinement state
    selectedText,
    refinementMode,
    showRefinementPreview,
    refinedTextPreview,
    selectedNoteTypeForCommands,
    getDisplayContent,
    handleKeyDown,
    handleContentChange,
    togglePreview,
    handleAskAI,
    handleRequestAnalysis,
    handleRequestIdeas,
    handleGenerateTableFromContent,
    handleInsertBulletList,
    handleInsertNumberedList,
    handleInsertHeading,
    handleInsertLink,
    handleInsertLinkEmbed,
    handleInsertTable,
    handleLinkNote,
    handleLinkContent,
    handleClick,
    handleMouseDown,
    // New refinement handlers
    handleRefineText,
    handleAcceptRefinement,
    handleRejectRefinement,
    handleRetryRefinement,
    handleCancelRefinement,
    setShowCommandPalette,
    setShowEnhancedContentSelector,
    setContentSearchTerm,
    // New refinement setters
    setSelectedNoteTypeForCommands,
    setPalettePosition,
    setPaletteMode,
    setRefinementMode,
    setSelectedText
  } = useRichTextEditor({
    content,
    onContentChange,
    showPreview,
    onShowPreviewChange,
    onAskAI,
    onRequestAnalysis,
    onRequestIdeas,
    noteId,
    noteType,
    availableNotes,
    onLinkNote,
    onLinkContent,
    allLinkableContent,
    userId,
    containerRef
  })

  // Expose the trigger function to parent components
  useImperativeHandle(ref, () => ({
    triggerCommandPalette: () => {
      // If we're in preview mode, switch to edit mode first
      if (currentShowPreview) {
        togglePreview();
        // Wait for the textarea to be rendered, then trigger the palette
        setTimeout(() => {
          triggerCommandPaletteInternal();
        }, 100);
        return;
      }
      
      triggerCommandPaletteInternal();
    }
  }), [currentShowPreview, togglePreview, getDisplayContent, content, setPalettePosition, setPaletteMode, setShowCommandPalette, setRefinementMode, setSelectedText, setSelectedNoteTypeForCommands, noteType, textAreaRef, containerRef]);
  
  // Internal function to actually trigger the command palette
  const triggerCommandPaletteInternal = () => {
    const textarea = textAreaRef.current;
    if (!textarea) {
      return;
    }
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const hasSelection = start !== end;
    
    if (hasSelection) {
      // Refinement mode - text is selected
      const displayContent = getDisplayContent(content);
      const selectedText = displayContent.substring(start, end);
      
      // Set refinement mode state
      const coords = getCursorCoordinates(textAreaRef, containerRef);
      setPalettePosition(coords);
      setPaletteMode('commands');
      setShowCommandPalette(true);
      
      // Set refinement mode
      setRefinementMode(true);
      setSelectedText(selectedText);
      setSelectedNoteTypeForCommands(noteType as any);
    } else {
      // Generation mode - no text selected
      const coords = getCursorCoordinates(textAreaRef, containerRef);
      setPalettePosition(coords);
      setPaletteMode('commands');
      setShowCommandPalette(true);
      
      // Set generation mode
      setRefinementMode(false);
      setSelectedText('');
    }
  };
  
  // Remove the conflicting ref sync since we're using RichTextEditorRef interface

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Preview Toggle Button */}
      <div className="absolute top-2 right-2 z-10">
        <button
          onClick={togglePreview}
          className="flex items-center gap-1 px-2 py-1.5 rounded-md bg-background/90 backdrop-blur-sm border border-border hover:bg-muted transition-colors text-xs font-medium"
          title={currentShowPreview ? 'Switch to edit mode' : 'Switch to preview mode'}
        >
          {currentShowPreview ? (
            <>
              <Edit className="w-3 h-3" />
              Edit
            </>
          ) : (
            <>
              <Eye className="w-3 h-3" />
              Preview
            </>
          )}
        </button>
      </div>

      {currentShowPreview ? (
        /* Markdown Preview */
        <div 
          className="w-full h-full overflow-auto p-4 cursor-text"
          onClick={() => togglePreview()}
        >
          <ContentRenderer
            content={content}
            availableNotes={availableNotes}
            allLinkableContent={allLinkableContent}
            onLinkNote={onLinkNote}
            onLinkContent={onLinkContent}
          />
        </div>
      ) : (
        /* Text Editor */
        <div className="relative w-full h-full">
          <textarea
            ref={textAreaRef}
            value={getDisplayContent(content)}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            onClick={handleClick}
            onMouseDown={handleMouseDown}
            className={`w-full h-full min-h-[300px] resize-none p-4 text-base leading-relaxed bg-background text-foreground placeholder:text-muted-foreground/50 border-0 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2 transition-all duration-200 rounded-md transform-gpu will-change-contents ${
              selectedText && refinementMode 
                ? 'ring-2 ring-purple-500/30 dark:ring-yellow-500/30' 
                : ''
            }`}
            placeholder={`${placeholder}

⌘K or / for AI assistant • ⌘B bold • ⌘I italic • ⌘U underline • Click Preview to see rich text${selectedText ? ' • Text selected - ⌘K to refine' : ''}`}
            disabled={disabled}
            spellCheck={true}
            autoFocus={!disabled}
          />
          
          {/* Refinement Mode Indicator */}
          {selectedText && !showCommandPalette && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-purple-500/10 dark:bg-yellow-500/10 border border-purple-200 dark:border-yellow-200 rounded-md text-xs font-medium text-purple-600 dark:text-yellow-600 backdrop-blur-sm">
              <span>Text selected</span>
              <kbd className="px-1 py-0.5 bg-purple-500/20 dark:bg-yellow-500/20 rounded text-xs">⌘K</kbd>
              <span>to refine</span>
            </div>
          )}
        </div>
      )}
      
      {/* Inline Command Palette */}
      <InlineCommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        position={palettePosition}
        onAskAI={handleAskAI}
        onRequestAnalysis={handleRequestAnalysis}
        onRequestIdeas={handleRequestIdeas}
        onInsertBulletList={handleInsertBulletList}
        onInsertNumberedList={handleInsertNumberedList}
        onInsertHeading={handleInsertHeading}
        onInsertLink={handleInsertLink}
        onInsertLinkEmbed={handleInsertLinkEmbed}
        onInsertTable={handleInsertTable}
        onGenerateTableFromContent={handleGenerateTableFromContent}
        onLinkNote={handleLinkNote}
        noteType={noteType || 'idea_bank'}
        availableNotes={availableNotes}
        currentNoteId={noteId}
        showNoteLinks={paletteMode === 'notes'}
        // New refinement mode props
        selectedText={selectedText}
        refinementMode={refinementMode}
        onRefineText={handleRefineText}
        showRefinementPreview={showRefinementPreview}
        refinedTextPreview={refinedTextPreview}
        onAcceptRefinement={handleAcceptRefinement}
        onRejectRefinement={handleRejectRefinement}
        onRetryRefinement={handleRetryRefinement}
      />

      {/* Enhanced Content Selector */}
      <UnifiedContentSelector
        mode="link"
        isOpen={showEnhancedContentSelector}
        onClose={() => setShowEnhancedContentSelector(false)}
        onSelect={handleLinkContent}
        position={palettePosition}
        searchTerm={contentSearchTerm}
        onSearchChange={setContentSearchTerm}
        excludeContentId={noteId ? `notes:${noteId}` : undefined}
      />
    </div>
  )
})

RichTextEditor.displayName = 'RichTextEditor' 
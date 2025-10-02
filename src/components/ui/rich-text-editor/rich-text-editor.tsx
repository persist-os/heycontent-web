'use client'

import React, { forwardRef, useImperativeHandle } from 'react'
import { UnifiedContentSelector } from '@/components/ui/UnifiedContentSelector'
import { useRichTextEditor } from './use-rich-text-editor'
import { RichTextEditorProps } from './rich-text-editor.types'
import { InlineCommandPalette } from '@/app/dashboard/notes/components/InlineCommandPalette'
import { getCursorCoordinates } from './formatting-utils'
import { MarkdownRenderer } from '@/app/dashboard/thinking_lab/components/dialogue/messages/MarkdownRenderer'

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
      triggerCommandPaletteInternal();
    }
  }), [getDisplayContent, content, setPalettePosition, setPaletteMode, setShowCommandPalette, setRefinementMode, setSelectedText, setSelectedNoteTypeForCommands, noteType, textAreaRef, containerRef]);
  
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
      {/* Production-ready markdown overlay with perfect cursor alignment */}
      <div className="relative w-full h-full">
        {/* Markdown content renderer with exact textarea typography */}
        {content && (
          <div className="absolute inset-0 w-full h-full overflow-auto pointer-events-none z-0">
            <div 
              className="p-4"
              style={{
                fontFamily: 'inherit',
                fontSize: '16px',
                lineHeight: '1.625',
                fontWeight: 'inherit'
              }}
            >
              <MarkdownRenderer 
                content={content} 
                className="[&_p]:mb-0 [&_p]:leading-[1.625] [&_p]:text-base [&_h1]:mb-0 [&_h1]:leading-[1.625] [&_h2]:mb-0 [&_h2]:leading-[1.625] [&_h3]:mb-0 [&_h3]:leading-[1.625] [&_ul]:mb-0 [&_ul]:mt-0 [&_ol]:mb-0 [&_ol]:mt-0 [&_li]:leading-[1.625] [&_li]:mb-0 [&_strong]:font-semibold [&_em]:italic [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_pre]:mb-0 [&_pre]:mt-0 [&_blockquote]:mb-0 [&_blockquote]:mt-0 [&_hr]:mb-0 [&_hr]:mt-0"
              />
            </div>
          </div>
        )}
        
        {/* Textarea with identical typography to markdown renderer */}
        <textarea
          ref={textAreaRef}
          value={content || ''} // Use raw content, not transformed display content
          onChange={handleContentChange} // Use the hook's handler for @ support
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          onMouseDown={handleMouseDown}
          className={`relative w-full h-full min-h-[300px] resize-none p-4 bg-transparent border-0 focus:outline-none transition-all duration-200 caret-foreground selection:bg-blue-200/50 dark:selection:bg-blue-800/50 z-10 ${
            content ? 'text-transparent' : 'text-foreground placeholder:text-muted-foreground/50'
          } ${
            selectedText && refinementMode 
              ? 'bg-muted/10' 
              : ''
          }`}
          style={{
            fontFamily: 'inherit',
            fontSize: '16px',
            lineHeight: '1.625',
            fontWeight: 'inherit'
          }}
          placeholder={content ? '' : placeholder}
          title="Rich text editor"
          aria-label="Rich text editor"
          disabled={disabled}
          spellCheck={false}
          autoFocus={!disabled}
        />
        
        {/* Refinement Mode Indicator */}
        {selectedText && !showCommandPalette && (
          <div className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-2 bg-background/80 backdrop-blur-sm border border-border/50 rounded text-xs text-muted-foreground z-20">
            <span>Selection</span>
            <kbd className="px-1.5 py-0.5 bg-muted text-xs font-mono">⌘K</kbd>
          </div>
        )}
      </div>
      
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
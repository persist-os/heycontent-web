'use client'

import React, { forwardRef, useImperativeHandle } from 'react'
import { SimpleTiptapEditor, SimpleTiptapEditorRef } from '../tiptap-editor/SimpleTiptapEditor'
import { TiptapToolbar } from '../tiptap-editor/TiptapToolbar'
import { TiptapCommandPalettePlugin } from '../tiptap-editor/plugins/TiptapCommandPalettePlugin'
import { T } from '@/components/translation'

export interface LexicalNotepadEditorRef {
  triggerCommandPalette: () => void
  getContent: () => string
  setContent: (content: string) => void
  hasContent: () => boolean
  clear: () => void
}

interface LexicalNotepadEditorProps {
  content: string
  onContentChange: (content: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  isMobile?: boolean
  // AI handlers
  onAskAI?: (prompt: string) => Promise<void>
  onRequestAnalysis?: (noteType: string) => Promise<void>
  onRequestIdeas?: () => Promise<void>
  // Note linking
  availableNotes?: Array<{ _id: string; title: string; type: string }>
  onLinkNote?: (noteId: string) => void
  // User context
  userId?: string
  noteType?: string
  containerRef?: React.RefObject<HTMLElement>
  // Refinement props
  onRefineText?: (refinementType: string, text: string) => Promise<string | void>
  onAcceptRefinement?: () => Promise<void>
  onRejectRefinement?: () => Promise<void>
  onRetryRefinement?: () => Promise<string | void>
}

// Note: Command palette functionality will need to be re-implemented for Tiptap
// For now, we'll focus on the basic editor functionality

export const LexicalNotepadEditor = forwardRef<LexicalNotepadEditorRef, LexicalNotepadEditorProps>(
  (props, ref) => {
    const { 
      content, 
      onContentChange, 
      placeholder = 'Start writing or Cmd/Ctrl + K for AI assistance...',
      disabled = false,
      className = '',
      isMobile = false,
      ...rest 
    } = props
    
    const tiptapRef = React.useRef<SimpleTiptapEditorRef>(null)
    const [editor, setEditor] = React.useState<any>(null)
    
    // Forward ref with method mapping
    useImperativeHandle(ref, () => ({
      triggerCommandPalette: () => {
        // Access the trigger function from the editor instance
        if (tiptapRef.current?.editor && (tiptapRef.current.editor as any).triggerCommandPalette) {
          (tiptapRef.current.editor as any).triggerCommandPalette()
        }
      },
      getContent: () => tiptapRef.current?.getContent() || '',
      setContent: (newContent: string) => {
        tiptapRef.current?.setContent(newContent)
      },
      hasContent: () => tiptapRef.current?.hasContent() || false,
      clear: () => {
        tiptapRef.current?.clear()
      }
    }), [])

    // Get editor instance when it's available
    React.useEffect(() => {
      if (tiptapRef.current?.editor) {
        setEditor(tiptapRef.current.editor)
      }
    }, [tiptapRef.current?.editor])

    return (
      <div className={`relative w-full h-full ${className}`}>
        <div className="flex flex-col h-full w-full">
          {/* Toolbar */}
          {editor && (
            <TiptapToolbar 
              editor={editor} 
              className="border-b border-border/50 bg-background/95 backdrop-blur-sm w-full m-0 p-0"
            />
          )}
          
          {/* Editor */}
          <div className="flex-1">
            <SimpleTiptapEditor
              ref={tiptapRef}
              content={content}
              onContentChange={onContentChange}
              placeholder={placeholder}
              disabled={disabled}
              minHeight="300px"
              isMobile={isMobile}
            />
          </div>
        </div>
        
        {/* Command Palette Plugin */}
        {editor && (
          <TiptapCommandPalettePlugin
            editor={editor}
            onAskAI={rest.onAskAI}
            onRequestAnalysis={rest.onRequestAnalysis}
            onRequestIdeas={rest.onRequestIdeas}
            availableNotes={rest.availableNotes}
            onLinkNote={rest.onLinkNote}
            userId={rest.userId}
            noteType={rest.noteType}
            containerRef={rest.containerRef}
            onRefineText={rest.onRefineText}
            onAcceptRefinement={rest.onAcceptRefinement}
            onRejectRefinement={rest.onRejectRefinement}
            onRetryRefinement={rest.onRetryRefinement}
          />
        )}
      </div>
    )
  }
)

LexicalNotepadEditor.displayName = 'LexicalNotepadEditor'

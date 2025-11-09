'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Editor } from '@tiptap/react'
import { InlineCommandPalette } from '@/app/dashboard/notes/components/InlineCommandPalette'
import { useTiptapEditor } from '@/app/context/tiptap-editor-context'

interface TiptapCommandPalettePluginProps {
  editor: Editor
  onAskAI?: (prompt: string) => Promise<void>
  onRequestAnalysis?: (noteType: string) => Promise<void>
  onRequestIdeas?: () => Promise<void>
  availableNotes?: Array<{ _id: string; title: string; type: string }>
  onLinkNote?: (noteId: string) => void
  userId?: string
  noteType?: string
  containerRef?: React.RefObject<HTMLElement>
  // Refinement props
  onRefineText?: (refinementType: string, text: string) => Promise<string | void>
  onAcceptRefinement?: () => Promise<void>
  onRejectRefinement?: () => Promise<void>
  onRetryRefinement?: () => Promise<string | void>
}

interface PalettePosition {
  top: number
  left: number
}

export function TiptapCommandPalettePlugin({
  editor,
  onAskAI,
  onRequestAnalysis,
  onRequestIdeas,
  availableNotes = [],
  onLinkNote,
  userId,
  noteType = 'idea_bank',
  containerRef,
  onRefineText,
  onAcceptRefinement,
  onRejectRefinement,
  onRetryRefinement
}: TiptapCommandPalettePluginProps) {
  
  const { setTiptapEditorActive } = useTiptapEditor()
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [palettePosition, setPalettePosition] = useState<PalettePosition>({ top: 100, left: 100 })
  const [selectedText, setSelectedText] = useState<string>('')
  const [refinementMode, setRefinementMode] = useState<boolean>(false)
  const [isEditorFocused, setIsEditorFocused] = useState<boolean>(false)
  
  // Refinement state
  const [refinedTextPreview, setRefinedTextPreview] = useState<string | null>(null)
  const [showRefinementPreview, setShowRefinementPreview] = useState(false)

  // Calculate cursor coordinates
  const getCursorCoordinates = useCallback(() => {
    const selection = window.getSelection()
    if (!selection || selection.rangeCount === 0) {
      return { top: 100, left: 100 }
    }

    const range = selection.getRangeAt(0)
    const rect = range.getBoundingClientRect()
    
    // Get container offset if provided
    let containerOffset = { top: 0, left: 0 }
    if (containerRef?.current) {
      const containerRect = containerRef.current.getBoundingClientRect()
      containerOffset = { top: containerRect.top, left: containerRect.left }
    }

    return {
      top: rect.bottom - containerOffset.top + 8,
      left: rect.left - containerOffset.left
    }
  }, [containerRef])

  // Handle command palette trigger
  const triggerCommandPalette = useCallback(() => {
    if (!editor) return

    // Get selected text
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to, ' ')
    setSelectedText(selectedText)
    
    // Set refinement mode if text is selected
    setRefinementMode(selectedText.length > 0)
    
    // Calculate position
    const position = getCursorCoordinates()
    setPalettePosition(position)
    
    // Show palette
    setShowCommandPalette(true)
  }, [editor, getCursorCoordinates])

  // Handle AI requests
  const handleAskAI = useCallback(async (prompt: string) => {
    if (onAskAI) {
      await onAskAI(prompt)
    }
    setShowCommandPalette(false)
  }, [onAskAI])

  const handleRequestAnalysis = useCallback(async (noteType: string) => {
    if (onRequestAnalysis) {
      await onRequestAnalysis(noteType)
    }
    setShowCommandPalette(false)
  }, [onRequestAnalysis])

  const handleRequestIdeas = useCallback(async () => {
    if (onRequestIdeas) {
      await onRequestIdeas()
    }
    setShowCommandPalette(false)
  }, [onRequestIdeas])

  // Handle text refinement
  const handleRefineText = useCallback(async (refinementType: string, text: string) => {
    if (onRefineText) {
      const result = await onRefineText(refinementType, text)
      if (result) {
        setRefinedTextPreview(result)
        setShowRefinementPreview(true)
      }
    }
  }, [onRefineText])

  const handleAcceptRefinement = useCallback(async () => {
    if (refinedTextPreview && editor) {
      // Replace selected text with refined text
      const { from, to } = editor.state.selection
      editor.chain().focus().deleteRange({ from, to }).insertContent(refinedTextPreview).run()
    }
    if (onAcceptRefinement) {
      await onAcceptRefinement()
    }
    setShowRefinementPreview(false)
    setRefinedTextPreview(null)
    setShowCommandPalette(false)
  }, [refinedTextPreview, editor, onAcceptRefinement])

  const handleRejectRefinement = useCallback(async () => {
    if (onRejectRefinement) {
      await onRejectRefinement()
    }
    setShowRefinementPreview(false)
    setRefinedTextPreview(null)
    setShowCommandPalette(false)
  }, [onRejectRefinement])

  const handleRetryRefinement = useCallback(async () => {
    if (onRetryRefinement) {
      const result = await onRetryRefinement()
      if (result) {
        setRefinedTextPreview(result)
      }
    }
  }, [onRetryRefinement])

  // Handle note linking
  const handleLinkNote = useCallback((noteId: string) => {
    if (onLinkNote) {
      onLinkNote(noteId)
    }
    setShowCommandPalette(false)
  }, [onLinkNote])

  // Handle list insertion
  const handleInsertBulletList = useCallback(() => {
    if (editor) {
      editor.chain().focus().toggleBulletList().run()
    }
    setShowCommandPalette(false)
  }, [editor])

  const handleInsertNumberedList = useCallback(() => {
    if (editor) {
      editor.chain().focus().toggleOrderedList().run()
    }
    setShowCommandPalette(false)
  }, [editor])

  // Handle heading insertion
  const handleInsertHeading = useCallback((level: number) => {
    if (editor) {
      editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 }).run()
    }
    setShowCommandPalette(false)
  }, [editor])

  // Handle link insertion
  const handleInsertLink = useCallback(() => {
    if (editor) {
      const url = window.prompt('Enter URL:')
      if (url) {
        editor.chain().focus().setLink({ href: url }).run()
      }
    }
    setShowCommandPalette(false)
  }, [editor])

  const handleInsertLinkEmbed = useCallback(() => {
    // Tiptap doesn't have built-in embed support, but we can insert a link
    handleInsertLink()
  }, [handleInsertLink])

  // Handle table insertion
  const handleInsertTable = useCallback(() => {
    if (editor) {
      // Tiptap doesn't have built-in table support in StarterKit, but we can insert a simple table structure
      const tableHTML = `
        <table>
          <thead>
            <tr>
              <th>Column 1</th>
              <th>Column 2</th>
              <th>Column 3</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Row 1, Cell 1</td>
              <td>Row 1, Cell 2</td>
              <td>Row 1, Cell 3</td>
            </tr>
            <tr>
              <td>Row 2, Cell 1</td>
              <td>Row 2, Cell 2</td>
              <td>Row 2, Cell 3</td>
            </tr>
          </tbody>
        </table>
      `
      editor.chain().focus().insertContent(tableHTML).run()
    }
    setShowCommandPalette(false)
  }, [editor])

  const handleGenerateTableFromContent = useCallback(async () => {
    // This would need custom implementation for Tiptap
    setShowCommandPalette(false)
  }, [])

  // Set up keyboard shortcuts and focus tracking
  useEffect(() => {
    if (!editor) return

    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + K to open command palette - ONLY when editor is focused
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        // CRITICAL: Only trigger if editor is focused
        // Check multiple sources of truth for focus state
        const editorElement = editor.view.dom
        const isFocused = isEditorFocused || 
                         editor.isFocused || 
                         document.activeElement === editorElement ||
                         editorElement.contains(document.activeElement)
        
        if (isFocused) {
          event.preventDefault()
          event.stopPropagation() // Prevent bubbling to platform command palette
          triggerCommandPalette()
        }
        // If editor is not focused, let the event bubble to platform command palette
      }
    }

    const handleFocus = () => {
      setIsEditorFocused(true)
      setTiptapEditorActive(true)
    }

    const handleBlur = () => {
      setIsEditorFocused(false)
      setTiptapEditorActive(false)
    }

    // Add focus/blur listeners to the editor element
    const editorElement = editor.view.dom
    editorElement.addEventListener('focus', handleFocus)
    editorElement.addEventListener('blur', handleBlur)
    
    // Listen to document-level keydown but check focus before handling
    document.addEventListener('keydown', handleKeyDown, true) // Use capture phase to check first
    
    return () => {
      editorElement.removeEventListener('focus', handleFocus)
      editorElement.removeEventListener('blur', handleBlur)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [editor, triggerCommandPalette, setTiptapEditorActive, isEditorFocused])

  // Expose trigger function to parent
  useEffect(() => {
    if (editor) {
      // Store the trigger function on the editor instance for external access
      (editor as any).triggerCommandPalette = triggerCommandPalette
    }
  }, [editor, triggerCommandPalette])

  return (
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
      noteType={noteType}
      availableNotes={availableNotes}
      currentNoteId=""
      showNoteLinks={false}
      selectedText={selectedText}
      refinementMode={refinementMode}
      onRefineText={handleRefineText}
      showRefinementPreview={showRefinementPreview}
      refinedTextPreview={refinedTextPreview}
      onAcceptRefinement={handleAcceptRefinement}
      onRejectRefinement={handleRejectRefinement}
      onRetryRefinement={handleRetryRefinement}
    />
  )
}

'use client'

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { 
  $getSelection, 
  $isRangeSelection, 
  KEY_DOWN_COMMAND,
  COMMAND_PRIORITY_HIGH
} from 'lexical'
import React, { useEffect, useState, useCallback } from 'react'
import { InlineCommandPalette } from '@/app/dashboard/notes/components/InlineCommandPalette'

interface CommandPalettePluginProps {
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

export function CommandPalettePlugin({
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
}: CommandPalettePluginProps) {
  const [editor] = useLexicalComposerContext()
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [palettePosition, setPalettePosition] = useState<PalettePosition>({ top: 100, left: 100 })
  const [selectedText, setSelectedText] = useState<string>('')
  const [refinementMode, setRefinementMode] = useState<boolean>(false)
  
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
    editor.getEditorState().read(() => {
      const selection = $getSelection()
      
      if ($isRangeSelection(selection)) {
        const selectedText = selection.getTextContent()
        const hasSelection = selectedText.length > 0
        
        setSelectedText(hasSelection ? selectedText : '')
        setRefinementMode(hasSelection)
        
        const coords = getCursorCoordinates()
        setPalettePosition(coords)
        setShowCommandPalette(true)
      }
    })
  }, [editor, getCursorCoordinates])

  // Register keyboard shortcuts
  useEffect(() => {
    const unregisterKeyDown = editor.registerCommand(
      KEY_DOWN_COMMAND,
      (event: KeyboardEvent) => {
        // Cmd/Ctrl + K to open command palette
        if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
          event.preventDefault()
          event.stopPropagation()
          triggerCommandPalette()
          return true
        }
        
        // Escape to close command palette
        if (event.key === 'Escape' && showCommandPalette) {
          event.preventDefault()
          event.stopPropagation()
          setShowCommandPalette(false)
          setRefinementMode(false)
          setSelectedText('')
          return true
        }
        
        return false
      },
      COMMAND_PRIORITY_HIGH
    )

    return unregisterKeyDown
  }, [editor, triggerCommandPalette, showCommandPalette])

  // Register custom command for external trigger
  useEffect(() => {
    const unregisterCommand = editor.registerCommand(
      'TRIGGER_COMMAND_PALETTE' as any,
      () => {
        triggerCommandPalette()
        return true
      },
      COMMAND_PRIORITY_HIGH
    )

    return unregisterCommand
  }, [editor, triggerCommandPalette])

  // AI handler wrappers that work with Lexical
  const handleAskAI = useCallback(async (prompt: string) => {
    if (!onAskAI) return

    try {
      await onAskAI(prompt)
      setShowCommandPalette(false)
    } catch (error) {
      console.error('Failed to call onAskAI:', error)
    }
  }, [onAskAI])

  const handleRequestAnalysis = useCallback(async (analysisNoteType: string) => {
    if (!onRequestAnalysis) return

    try {
      await onRequestAnalysis(analysisNoteType)
      setShowCommandPalette(false)
    } catch (error) {
      console.error('Failed to request analysis:', error)
    }
  }, [onRequestAnalysis])

  const handleRequestIdeas = useCallback(async () => {
    if (!onRequestIdeas) return

    try {
      await onRequestIdeas()
      setShowCommandPalette(false)
    } catch (error) {
      console.error('Failed to request ideas:', error)
    }
  }, [onRequestIdeas])

  // Refinement handlers
  const handleRefineText = useCallback(async (refinementType: string, text: string) => {
    if (!onRefineText) return

    try {
      const result = await onRefineText(refinementType, text)
      
      if (typeof result === 'string') {
        // If refinement returns a string, show preview
        setRefinedTextPreview(result)
        setShowRefinementPreview(true)
      }
      // If it returns void, the external system handles the preview
      
    } catch (error) {
      console.error('Failed to refine text:', error)
    }
  }, [onRefineText])

  const handleAcceptRefinement = useCallback(async () => {
    if (!onAcceptRefinement) return

    try {
      await onAcceptRefinement()
      
      // Clear refinement state and close palette
      setRefinedTextPreview(null)
      setShowRefinementPreview(false)
      setRefinementMode(false)
      setSelectedText('')
      setShowCommandPalette(false)
      
    } catch (error) {
      console.error('Failed to accept refinement:', error)
    }
  }, [onAcceptRefinement])

  const handleRejectRefinement = useCallback(async () => {
    if (!onRejectRefinement) return

    try {
      await onRejectRefinement()
      
      // Clear refinement state but keep palette open
      setRefinedTextPreview(null)
      setShowRefinementPreview(false)
      
    } catch (error) {
      console.error('Failed to reject refinement:', error)
    }
  }, [onRejectRefinement])

  const handleRetryRefinement = useCallback(async () => {
    if (!onRetryRefinement) return

    try {
      const result = await onRetryRefinement()
      
      if (typeof result === 'string') {
        // If retry returns a string, update preview
        setRefinedTextPreview(result)
        setShowRefinementPreview(true)
      }
      // If it returns void, the external system handles the preview
      
    } catch (error) {
      console.error('Failed to retry refinement:', error)
    }
  }, [onRetryRefinement])

  // Note linking handler
  const handleLinkNote = useCallback((noteId: string) => {
    const note = availableNotes.find(n => n._id === noteId)
    
    // Insert note reference using the command
    editor.dispatchCommand('INSERT_NOTE_REF' as any, {
      noteId,
      noteTitle: note?.title
    })
    
    setShowCommandPalette(false)
  }, [editor, availableNotes])

  // Formatting handlers (simplified for now)
  const handleInsertBulletList = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        selection.insertText('• ')
      }
    })
    setShowCommandPalette(false)
  }, [editor])

  const handleInsertNumberedList = useCallback(() => {
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        selection.insertText('1. ')
      }
    })
    setShowCommandPalette(false)
  }, [editor])

  const handleInsertHeading = useCallback((level: number) => {
    const prefix = '#'.repeat(level) + ' '
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        selection.insertText(prefix)
      }
    })
    setShowCommandPalette(false)
  }, [editor])

  const handleInsertLink = useCallback((url: string, text: string) => {
    const linkText = `[${text}](${url})`
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        selection.insertText(linkText)
      }
    })
    setShowCommandPalette(false)
  }, [editor])

  const handleInsertLinkEmbed = useCallback((url: string) => {
    const embedText = `\n\n${url}\n\n`
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        selection.insertText(embedText)
      }
    })
    setShowCommandPalette(false)
  }, [editor])

  const handleInsertTable = useCallback((rows: number = 3, cols: number = 3) => {
    // Create a simple markdown table
    let tableText = '\n\n'
    
    // Header row
    tableText += '| ' + Array(cols).fill('Header').map((h, i) => `${h} ${i + 1}`).join(' | ') + ' |\n'
    
    // Separator row
    tableText += '| ' + Array(cols).fill('---').join(' | ') + ' |\n'
    
    // Data rows
    for (let i = 0; i < rows - 1; i++) {
      tableText += '| ' + Array(cols).fill('Cell').map((c, j) => `${c} ${i + 1},${j + 1}`).join(' | ') + ' |\n'
    }
    
    tableText += '\n'
    
    editor.update(() => {
      const selection = $getSelection()
      if ($isRangeSelection(selection)) {
        selection.insertText(tableText)
      }
    })
    setShowCommandPalette(false)
  }, [editor])

  const handleGenerateTableFromContent = useCallback(async () => {
    // For now, just insert a basic table
    handleInsertTable(3, 3)
  }, [handleInsertTable])

  return (
    <>
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
    </>
  )
}

'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { 
  RichTextEditorProps, 
  PalettePosition, 
  PaletteMode 
} from './rich-text-editor.types'
import { 
  extractPrefixedIds, 
  getDisplayContent, 
  getStorageContent 
} from './content-utils'
import { 
  formatText, 
  insertBulletList, 
  insertNumberedList, 
  insertHeading, 
  insertLink, 
  insertLinkEmbed, 
  insertTable,
  getCursorCoordinates
} from './formatting-utils'
import { AIHandlers, createAIHandlers } from './ai-utils'
import { NoteType } from '@/app/dashboard/notes/types'

type UseRichTextEditorProps = Pick<RichTextEditorProps, 
  'content' | 'onContentChange' | 'showPreview' | 'onShowPreviewChange' | 
  'onAskAI' | 'onRequestAnalysis' | 'onRequestIdeas' | 'noteId' | 'noteType' |
  'availableNotes' | 'onLinkNote' | 'onLinkContent' | 'allLinkableContent' |
  'userId' | 'containerRef'
>

export const useRichTextEditor = (props: UseRichTextEditorProps) => {
  const {
    content,
    onContentChange,
    showPreview,
    onShowPreviewChange,
    onAskAI,
    onRequestAnalysis,
    onRequestIdeas,
    noteId,
    noteType = 'idea_bank',
    availableNotes = [],
    onLinkNote,
    onLinkContent,
    allLinkableContent,
    userId,
    containerRef
  } = props

  // Convert string noteType to proper NoteType
  const normalizedNoteType: NoteType = (noteType as NoteType) || 'idea_bank'

  // Existing state
  const [localShowPreview, setLocalShowPreview] = useState(true)
  const [showCommandPalette, setShowCommandPalette] = useState(false)
  const [showEnhancedContentSelector, setShowEnhancedContentSelector] = useState(false)
  const [palettePosition, setPalettePosition] = useState<PalettePosition>({ top: 100, left: 100 })
  const [paletteMode, setPaletteMode] = useState<PaletteMode>('commands')
  const [cursorPosition, setCursorPosition] = useState(0)
  const [contentSearchTerm, setContentSearchTerm] = useState('')
  const [fetchedContentTitles, setFetchedContentTitles] = useState<Record<string, string>>({})
  
  // New refinement mode state
  const [selectedText, setSelectedText] = useState<string>('')
  const [refinementMode, setRefinementMode] = useState<boolean>(false)
  const [showRefinementPreview, setShowRefinementPreview] = useState<boolean>(false)
  const [refinedTextPreview, setRefinedTextPreview] = useState<string | null>(null)
  const [selectedNoteTypeForCommands, setSelectedNoteTypeForCommands] = useState<NoteType>(normalizedNoteType)
  const [currentRefinementType, setCurrentRefinementType] = useState<string>('')
  
  const textAreaRef = useRef<HTMLTextAreaElement>(null)

  // Convert display content to storage content before extracting prefixed IDs
  const storageContent = getStorageContent(content, availableNotes, fetchedContentTitles, allLinkableContent)
  const prefixedIds = extractPrefixedIds(storageContent, userId)

  // Fetch content titles using the batch query
  const contentTitles = useQuery(
    api.notes.getContentTitlesByPrefixedIds,
    prefixedIds.length > 0 && userId 
      ? { prefixedIds, userId }
      : 'skip'
  )

  // Update fetched titles when content titles change
  useEffect(() => {
    if (contentTitles && typeof contentTitles === 'object') {
      setFetchedContentTitles(prev => ({ ...prev, ...contentTitles }))
    }
  }, [contentTitles])

  // Sync preview state - default to showing rich text
  const currentShowPreview = onShowPreviewChange ? showPreview : localShowPreview
  const setCurrentShowPreview = onShowPreviewChange || setLocalShowPreview

  // Content conversion functions
  const getDisplayContentMemo = useCallback((rawContent: string) => {
    return getDisplayContent(rawContent, availableNotes, fetchedContentTitles, allLinkableContent)
  }, [availableNotes, fetchedContentTitles, allLinkableContent])

  const getStorageContentMemo = useCallback((displayContent: string) => {
    return getStorageContent(displayContent, availableNotes, fetchedContentTitles, allLinkableContent)
  }, [availableNotes, fetchedContentTitles, allLinkableContent])

  // Create AI handlers
  const aiHandlers: AIHandlers = {
    onAskAI,
    onRequestAnalysis,
    onRequestIdeas
  }

  const { handleAskAI, handleRequestAnalysis, handleRequestIdeas, handleGenerateTableFromContent, handleRefineText } = createAIHandlers(
    { content, textAreaRef, onContentChange },
    aiHandlers
  )

  // New refinement handlers
  const handleRefinementRequest = useCallback(async (refinementType: string, textToRefine: string) => {
    console.log('🎯 REFINEMENT START:', { refinementType, textToRefine: textToRefine.substring(0, 50) });
    
    if (!textToRefine.trim()) {
      console.warn('🎯 Empty text, aborting refinement');
      return;
    }

    const textarea = textAreaRef.current;
    if (!textarea) {
      console.warn('🎯 No textarea ref, aborting refinement');
      return;
    }

    try {
      console.log('🎯 Setting initial states...');
      setCurrentRefinementType(refinementType);
      setShowRefinementPreview(true);
      setRefinedTextPreview(null); // Clear previous preview
      
      console.log('🎯 States set, keeping command palette open for preview...');
      // KEEP palette open - preview will replace its content
      
      console.log('🎯 Processing refinement type...');
      
      // Handle custom refinements (with "custom:" prefix)
      if (refinementType.startsWith('custom:')) {
        console.log('🎯 Processing custom refinement...');
        const customPrompt = refinementType.replace('custom:', '');
        console.log(`🎯 Custom prompt extracted: "${customPrompt}"`);
        
        // For custom refinements, use the generic writing API instead of refinement API
        if (onAskAI) {
          console.log('🎯 onAskAI available, calling with enhanced prompt...');
          const enhancedPrompt = `Please refine the following text: "${textToRefine}"\n\nInstructions: ${customPrompt}`;
          
          console.log('🎯 About to call onAskAI...');
          const result = await onAskAI(enhancedPrompt);
          console.log('🎯 onAskAI result received:', { hasResult: !!result, length: result?.length });
          
          // ALWAYS show preview, never auto-apply - user must explicitly accept
          console.log('🎯 Setting refined text preview...');
          setRefinedTextPreview(result);
          console.log('🎯 Custom refinement complete');
        } else {
          throw new Error('AI writing function not available');
        }
      } else {
        // Handle preset refinements using the specialized refinement API
        console.log(`🎯 Processing preset refinement: "${refinementType}"`);
        
        // Get selection positions from textarea
        console.log('🎯 Getting selection positions...');
        const selectionStart = textarea.selectionStart;
        const selectionEnd = textarea.selectionEnd;
        console.log('🎯 Selection positions:', { selectionStart, selectionEnd });
        
        console.log('🎯 Getting display content...');
        const displayContent = getDisplayContentMemo(content);
        console.log('🎯 Display content length:', displayContent?.length);
        
        console.log('🎯 About to call handleRefineText...');
        console.log('🎯 Parameters check:', {
          refinementType: !!refinementType,
          textToRefine: !!textToRefine,
          normalizedNoteType: !!normalizedNoteType,
          displayContent: !!displayContent,
          selectionStart: typeof selectionStart,
          selectionEnd: typeof selectionEnd,
          handleRefineTextExists: !!handleRefineText
        });
        
        // Call the enhanced refinement handler from ai-utils
        const refinementResponse = await handleRefineText(
          refinementType,
          textToRefine,
          normalizedNoteType,
          displayContent,
          selectionStart,
          selectionEnd,
          undefined // Note title - could be passed from props if available
        );
        
        console.log('🎯 Refinement response received:', {
          hasRefinedText: !!refinementResponse?.refined_text,
          confidence: refinementResponse?.confidence_score,
          responseType: typeof refinementResponse
        });
        
        // ALWAYS show preview, never auto-apply - user must explicitly accept
        console.log('🎯 Setting refined text preview...');
        setRefinedTextPreview(refinementResponse.refined_text);
        
        // Store additional metadata for potential use in TextRefinementPreview
        console.log('🎯 Refinement metadata:', {
          confidence_score: refinementResponse.confidence_score,
          changes_summary: refinementResponse.changes_summary,
          change_count: refinementResponse.change_count,
          preservation_notes: refinementResponse.preservation_notes,
        });
        
        console.log('🎯 Preset refinement complete');
      }
      
      console.log('🎯 REFINEMENT SUCCESS - preview state updated');
      
    } catch (error: any) {
      console.error('🚨 REFINEMENT ERROR:', {
        message: error.message,
        stack: error.stack,
        type: typeof error,
        name: error.name,
        refinementType,
        textToRefineLength: textToRefine?.length
      });
      
      // Reset states on error
      console.log('🎯 Resetting states due to error...');
      setShowRefinementPreview(false);
      setRefinedTextPreview(null);
      setShowCommandPalette(true); // Reopen palette so user can try again
      
      // Show user-friendly error message
      const errorMsg = error.message || 'Failed to refine text. Please try again.';
      console.error('🚨 Showing error to user:', errorMsg);
      alert(`Refinement failed: ${errorMsg}`);
    }
  }, [normalizedNoteType, content, getDisplayContentMemo, handleRefineText, onAskAI])

  const handleAcceptRefinement = useCallback(async () => {
    if (!refinedTextPreview || !textAreaRef.current) return

    const textarea = textAreaRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const displayContent = getDisplayContentMemo(content)
    
    // Replace selected text with refined text
    const beforeSelection = displayContent.substring(0, start)
    const afterSelection = displayContent.substring(end)
    const newDisplayContent = beforeSelection + refinedTextPreview + afterSelection
    
    // Convert back to storage format and save
    const newStorageContent = getStorageContentMemo(newDisplayContent)
    onContentChange(newStorageContent)
    
    // Reset refinement state
    setShowRefinementPreview(false)
    setRefinedTextPreview(null)
    setSelectedText('')
    setRefinementMode(false)
    
    // Set cursor position after the refined text
    const newCursorPos = start + refinedTextPreview.length
    setTimeout(() => {
      textarea.setSelectionRange(newCursorPos, newCursorPos)
      textarea.focus()
    }, 0)
  }, [refinedTextPreview, content, onContentChange, getDisplayContentMemo, getStorageContentMemo])

  const handleRejectRefinement = useCallback(async () => {
    // Reset refinement state and return to command palette
    setShowRefinementPreview(false)
    setRefinedTextPreview(null)
    
    // Optionally reopen command palette to allow different refinement selection
    setShowCommandPalette(true)
  }, [])

  const handleRetryRefinement = useCallback(async () => {
    if (!currentRefinementType || !selectedText) return
    
    // Clear current preview and regenerate with same refinement type
    setRefinedTextPreview(null)
    await handleRefinementRequest(currentRefinementType, selectedText)
  }, [currentRefinementType, selectedText, handleRefinementRequest])

  const handleCancelRefinement = useCallback(() => {
    // Completely cancel refinement mode
    setShowRefinementPreview(false)
    setRefinedTextPreview(null)
    setSelectedText('')
    setRefinementMode(false)
    setShowCommandPalette(false)
    
    // Return focus to textarea
    if (textAreaRef.current) {
      textAreaRef.current.focus()
    }
  }, [])

  // Formatting handlers
  const handleInsertBulletList = useCallback(() => {
    const params = { content, textAreaRef, onContentChange }
    insertBulletList(params)
  }, [content, onContentChange])

  const handleInsertNumberedList = useCallback(() => {
    const params = { content, textAreaRef, onContentChange }
    insertNumberedList(params)
  }, [content, onContentChange])

  const handleInsertHeading = useCallback((level: number) => {
    const params = { content, textAreaRef, onContentChange }
    insertHeading(params, level)
  }, [content, onContentChange])

  const handleInsertLink = useCallback((url: string, text: string) => {
    const params = { content, textAreaRef, onContentChange }
    insertLink(params, url, text)
  }, [content, onContentChange])

  const handleInsertLinkEmbed = useCallback((url: string) => {
    const params = { content, textAreaRef, onContentChange }
    insertLinkEmbed(params, url)
  }, [content, onContentChange])

  const handleInsertTable = useCallback((rows: number = 3, cols: number = 3) => {
    const params = { content, textAreaRef, onContentChange }
    insertTable(params, rows, cols)
  }, [content, onContentChange])

  // Handle note linking
  const handleLinkNote = useCallback((noteId: string) => {
    if (!textAreaRef.current) {
      return
    }

    const selectedNote = availableNotes.find(note => String(note._id) === noteId)
    if (!selectedNote) {
      return
    }

    // Close the palette immediately
    setShowCommandPalette(false)

    const textarea = textAreaRef.current
    const cursorPos = textarea.selectionStart
    const displayContent = getDisplayContentMemo(content)
    const beforeCursor = displayContent.substring(0, cursorPos)
    
    // Look for @ symbol by checking backwards
    let atPosition = -1
    for (let i = cursorPos - 1; i >= Math.max(0, cursorPos - 20); i--) {
      if (beforeCursor[i] === '@') {
        atPosition = i
        break
      }
      // Stop if we hit whitespace or newline
      if (beforeCursor[i] === ' ' || beforeCursor[i] === '\n') {
        break
      }
    }
    
    const linkText = `@[note:${selectedNote._id}]@`
    
    if (atPosition !== -1) {
      // Replace @ and any typed text with note link
      const beforeAt = displayContent.substring(0, atPosition)
      const afterCursor = displayContent.substring(cursorPos)
      const newDisplayContent = beforeAt + linkText + afterCursor
      const newCursorPos = atPosition + linkText.length
      
      // Convert back to storage format and save
      const newStorageContent = getStorageContentMemo(newDisplayContent)
      onContentChange(newStorageContent)
      
      // Set cursor position after the link
      setTimeout(() => {
        textarea.setSelectionRange(newCursorPos, newCursorPos)
        textarea.focus()
      }, 0)
    } else {
      // No @ found, just insert the note link
      const beforeCursor = displayContent.substring(0, cursorPos)
      const afterCursor = displayContent.substring(cursorPos)
      const newDisplayContent = beforeCursor + linkText + afterCursor
      const newCursorPos = cursorPos + linkText.length
      
      // Convert back to storage format and save
      const newStorageContent = getStorageContentMemo(newDisplayContent)
      onContentChange(newStorageContent)
      
      // Set cursor position after the link
      setTimeout(() => {
        textarea.setSelectionRange(newCursorPos, newCursorPos)
        textarea.focus()
      }, 0)
    }
  }, [content, onContentChange, availableNotes, getDisplayContentMemo, getStorageContentMemo])

  // Handle content linking
  const handleLinkContent = useCallback((prefixedId: string) => {
    if (!textAreaRef.current) {
      return
    }

    // Close the selector immediately
    setShowEnhancedContentSelector(false)

    const textarea = textAreaRef.current
    const cursorPos = textarea.selectionStart
    const displayContent = getDisplayContentMemo(content)
    const beforeCursor = displayContent.substring(0, cursorPos)
    
    // Look for @ symbol by checking backwards
    let atPosition = -1
    for (let i = cursorPos - 1; i >= Math.max(0, cursorPos - 20); i--) {
      if (beforeCursor[i] === '@') {
        atPosition = i
        break
      }
      // Stop if we hit whitespace or newline
      if (beforeCursor[i] === ' ' || beforeCursor[i] === '\n') {
        break
      }
    }
    
    const linkText = `@[${prefixedId}]@`
    
    if (atPosition !== -1) {
      // Replace @ and any typed text with content link
      const beforeAt = displayContent.substring(0, atPosition)
      const afterCursor = displayContent.substring(cursorPos)
      const newDisplayContent = beforeAt + linkText + '\n' + afterCursor
      
      // Convert back to storage format and save
      const newStorageContent = getStorageContentMemo(newDisplayContent)
      onContentChange(newStorageContent)
      
      // Find the position of the inserted link in the storage content
      const storageLinkText = `@[${prefixedId}]@`
      const linkStartInStorage = newStorageContent.indexOf(storageLinkText)
      const newCursorPos = linkStartInStorage + storageLinkText.length + 1 // +1 for the newline
      
      // Set cursor position after the link and newline
      setTimeout(() => {
        textarea.setSelectionRange(newCursorPos, newCursorPos)
        textarea.focus()
      }, 0)
    } else {
      // No @ found, just insert the content link
      const beforeCursor = displayContent.substring(0, cursorPos)
      const afterCursor = displayContent.substring(cursorPos)
      const newDisplayContent = beforeCursor + linkText + '\n' + afterCursor
      
      // Convert back to storage format and save
      const newStorageContent = getStorageContentMemo(newDisplayContent)
      onContentChange(newStorageContent)
      
      // Find the position of the inserted link in the storage content
      const storageLinkText = `@[${prefixedId}]@`
      const linkStartInStorage = newStorageContent.indexOf(storageLinkText)
      const newCursorPos = linkStartInStorage + storageLinkText.length + 1 // +1 for the newline
      
      // Set cursor position after the link and newline
      setTimeout(() => {
        textarea.setSelectionRange(newCursorPos, newCursorPos)
        textarea.focus()
      }, 0)
    }
  }, [content, onContentChange, getDisplayContentMemo, getStorageContentMemo])

  // Handle click events to prevent cursor placement inside @[...]@ blocks
  const handleClick = useCallback((e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    const clickPosition = textarea.selectionStart
    
    // Get the display content to check for @[...]@ blocks
    const displayContent = getDisplayContentMemo(content)
    
    // Find all @[...]@ blocks and their positions
    const linkRegex = /@\[([^\]]+)\]@/g
    let match
    let blockPositions: Array<{ start: number; end: number }> = []
    
    while ((match = linkRegex.exec(displayContent)) !== null) {
      const start = match.index
      const end = start + match[0].length
      blockPositions.push({ start, end })
    }
    
    // Check if click position is inside any @[...]@ block
    for (const block of blockPositions) {
      if (clickPosition > block.start && clickPosition < block.end) {
        // Move cursor to the end of the block
        setTimeout(() => {
          textarea.setSelectionRange(block.end, block.end)
          textarea.focus()
        }, 0)
        return
      }
    }
    }, [content, getDisplayContentMemo])

  // Handle mouse down to prevent selection inside @[...]@ blocks
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    
    // Use a small delay to get the cursor position after the mouse down
    setTimeout(() => {
      const cursorPosition = textarea.selectionStart
      const displayContent = getDisplayContentMemo(content)
      
      // Find all @[...]@ blocks and their positions
      const linkRegex = /@\[([^\]]+)\]@/g
      let match
      let blockPositions: Array<{ start: number; end: number }> = []
      
      while ((match = linkRegex.exec(displayContent)) !== null) {
        const start = match.index
        const end = start + match[0].length
        blockPositions.push({ start, end })
      }
      
      // Check if cursor position is inside any @[...]@ block
      for (const block of blockPositions) {
        if (cursorPosition > block.start && cursorPosition < block.end) {
          // Move cursor to the end of the block
          textarea.setSelectionRange(block.end, block.end)
          textarea.focus()
          return
        }
      }
    }, 10)
  }, [content, getDisplayContentMemo])

  // Handle keyboard shortcuts - Modified to support refinement mode
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle arrow key navigation to prevent cursor inside @[...]@ blocks
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      const textarea = e.currentTarget
      const currentPosition = textarea.selectionStart
      const displayContent = getDisplayContentMemo(content)
      
      // Find all @[...]@ blocks and their positions
      const linkRegex = /@\[([^\]]+)\]@/g
      let match
      let blockPositions: Array<{ start: number; end: number }> = []
      
      while ((match = linkRegex.exec(displayContent)) !== null) {
        const start = match.index
        const end = start + match[0].length
        blockPositions.push({ start, end })
      }
      
      // Check if the next position would be inside a block
      const nextPosition = e.key === 'ArrowLeft' ? currentPosition - 1 : currentPosition + 1
      
      for (const block of blockPositions) {
        if (nextPosition > block.start && nextPosition < block.end) {
          // Prevent the default behavior and jump to the appropriate end
          e.preventDefault()
          const targetPosition = e.key === 'ArrowLeft' ? block.start : block.end
          setTimeout(() => {
            textarea.setSelectionRange(targetPosition, targetPosition)
            textarea.focus()
          }, 0)
          return
        }
      }
    }
    
    // Cmd/Ctrl + K to open inline command palette
    // Cmd/Ctrl + K to open inline command palette
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      e.stopPropagation()
      
      // Small delay to ensure textarea is focused and cursor position is accurate
      setTimeout(() => {
        const textarea = textAreaRef.current
        if (!textarea) return
        
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const hasSelection = start !== end
        
        if (hasSelection) {
          // Refinement mode - text is selected
          const displayContent = getDisplayContentMemo(content)
          const selectedText = displayContent.substring(start, end)
          
          setSelectedText(selectedText)
          setRefinementMode(true)
          setSelectedNoteTypeForCommands(normalizedNoteType) // Default to current note type
        } else {
          // Generation mode - no text selected
          setSelectedText('')
          setRefinementMode(false)
        }
        
        const coords = getCursorCoordinates(textAreaRef, containerRef)
        setPalettePosition(coords)
        setPaletteMode('commands')
        setShowCommandPalette(true)
      }, 0)
      return
    }

    // Handle ESC to close refinement preview or command palette
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      
      if (showRefinementPreview) {
        handleCancelRefinement()
      } else if (showCommandPalette) {
        setShowCommandPalette(false)
        setRefinementMode(false)
        setSelectedText('')
      }
      return
    }

    // Handle Enter to accept refinement when preview is shown
    if (e.key === 'Enter' && showRefinementPreview && refinedTextPreview) {
      e.preventDefault()
      e.stopPropagation()
      handleAcceptRefinement()
      return
    }

    // Handle 'r' to retry refinement when preview is shown
    if (e.key === 'r' && showRefinementPreview) {
      e.preventDefault()
      e.stopPropagation()
      handleRetryRefinement()
      return
    }

    // Traditional formatting shortcuts
    if (e.metaKey || e.ctrlKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault()
          formatText({ content, textAreaRef, onContentChange }, '**', '**')
          return
        case 'i':
          e.preventDefault()
          formatText({ content, textAreaRef, onContentChange }, '*', '*')
          return
        case 'u':
          e.preventDefault()
          formatText({ content, textAreaRef, onContentChange }, '<u>', '</u>')
          return
      }
    }

    // '/' at the start of a line to open command palette
    if (e.key === '/') {
      const textarea = textAreaRef.current
      if (!textarea) return
      
      const start = textarea.selectionStart
      const lineStart = content.lastIndexOf('\n', start - 1) + 1
      const lineContent = content.substring(lineStart, start)
      
      if (lineContent.trim() === '') {
        e.preventDefault()
        e.stopPropagation()
        setTimeout(() => {
          setRefinementMode(false) // Always generation mode for '/' trigger
          setSelectedText('')
          const coords = getCursorCoordinates(textAreaRef, containerRef)
          setPalettePosition(coords)
          setPaletteMode('commands')
          setShowCommandPalette(true)
        }, 0)
        return
      }
    }

    // '@' to open note linking palette
    if (e.key === '@') {
      // Let the @ be typed first, then open palette
      setTimeout(() => {
        if (textAreaRef.current) {
          const coords = getCursorCoordinates(textAreaRef, containerRef)
          setPalettePosition(coords)
          setShowEnhancedContentSelector(true)
          setShowCommandPalette(false)
        }
      }, 10) // Slightly longer delay to ensure @ is typed and cursor updated
      return
    }
  }, [content, showCommandPalette, showRefinementPreview, refinedTextPreview, onContentChange, containerRef, normalizedNoteType, getDisplayContentMemo, handleAcceptRefinement, handleRetryRefinement, handleCancelRefinement])

  // Helper function to ensure cursor is never inside @[...]@ blocks
  const ensureCursorOutsideBlocks = useCallback((cursorPosition: number, displayContent: string) => {
    const linkRegex = /@\[([^\]]+)\]@/g
    let match
    let blockPositions: Array<{ start: number; end: number }> = []
    
    while ((match = linkRegex.exec(displayContent)) !== null) {
      const start = match.index
      const end = start + match[0].length
      blockPositions.push({ start, end })
    }
    
    // Check if cursor position is inside any @[...]@ block
    for (const block of blockPositions) {
      if (cursorPosition > block.start && cursorPosition < block.end) {
        // Move cursor to the end of the block
        return block.end
      }
    }
    
    return cursorPosition
  }, [])

  // Handle content changes from typing
  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const displayContent = e.target.value
    const newCursorPosition = e.target.selectionStart
    const oldContent = content
    
    // Check if this is a deletion that might break @[...]@ blocks
    if (displayContent.length < oldContent.length) {
      // Find all @[...]@ blocks in the old content
      const linkRegex = /@\[([^\]]+)\]@/g
      const links: Array<{ start: number; end: number; content: string }> = []
      let match
      
      while ((match = linkRegex.exec(oldContent)) !== null) {
        links.push({
          start: match.index,
          end: match.index + match[0].length,
          content: match[0]
        })
      }
      
      // Check if any link was partially deleted (missing @[ or ]@)
      for (const link of links) {
        // Check if the link is now incomplete in the new content
        const linkContentWithoutBrackets = link.content.substring(2, link.content.length - 2) // Remove @[ and ]@
        
        // Look for the link content without brackets in the new content
        const linkStartInNew = displayContent.indexOf(linkContentWithoutBrackets)
        
        if (linkStartInNew !== -1) {
          // Check if the brackets are missing
          const hasOpeningBracket = displayContent.substring(linkStartInNew - 2, linkStartInNew) === '@['
          const hasClosingBracket = displayContent.substring(linkStartInNew + linkContentWithoutBrackets.length, linkStartInNew + linkContentWithoutBrackets.length + 2) === ']@'
          
          if (!hasOpeningBracket || !hasClosingBracket) {
            // Link was partially deleted - remove the entire link
            const beforeLink = oldContent.substring(0, link.start)
            const afterLink = oldContent.substring(link.end)
            const newContent = beforeLink + afterLink
            onContentChange(newContent)
            
            // Set cursor position to where the link was
            const newCursorPos = link.start
            setTimeout(() => {
              if (textAreaRef.current) {
                textAreaRef.current.setSelectionRange(newCursorPos, newCursorPos)
                textAreaRef.current.focus()
              }
            }, 0)
            return
          }
        }
      }
    }
    
    // Only convert if the content actually contains link patterns
    if (displayContent.includes('@[')) {
      // Convert display content (with titles) back to storage format (with IDs)
      const storageContent = getStorageContentMemo(displayContent)
      
      // Prevent saving "Missing Note" - if conversion resulted in missing notes, keep original
      if (storageContent.includes('@[Missing Note]@') && !displayContent.includes('@[Missing Note]@')) {
        onContentChange(displayContent)
      } else {
        onContentChange(storageContent)
      }
    } else {
      // No links, just pass through the content
      onContentChange(displayContent)
    }
    
    setCursorPosition(newCursorPosition)
  }, [onContentChange, getStorageContentMemo, content, textAreaRef])

  const togglePreview = useCallback(() => {
    setCurrentShowPreview(!currentShowPreview)
  }, [currentShowPreview, setCurrentShowPreview])

  return {
    // Existing state
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
    
    // Content functions
    getDisplayContent: getDisplayContentMemo,
    
    // Existing handlers
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
    handleRefineText: handleRefinementRequest,
    handleAcceptRefinement,
    handleRejectRefinement,
    handleRetryRefinement,
    handleCancelRefinement,
    
    // Existing setters
    setShowCommandPalette,
    setShowEnhancedContentSelector,
    setContentSearchTerm,
    
    // New refinement setters
    setSelectedNoteTypeForCommands,
    
    // Props pass-through
    noteType,
    availableNotes,
    noteId
  }
} 
'use client'

import React, { useState, useRef, useEffect, useCallback, useImperativeHandle, forwardRef } from 'react'
import { X, Send, Copy, Sparkles, Wand2, Loader2 } from 'lucide-react'
import { CreateNoteButton } from '@/components/ui/CreateNoteButton'
import { useAuth } from '@/app/context/auth-context'
import { useInlineAI } from '../../../notes/hooks/useInlineAI'
import { LexicalNotepadEditor, LexicalNotepadEditorRef } from '@/components/ui/lexical-editor/LexicalNotepadEditor'
import { getApiKey } from '@/app/lib/api-helpers'
import { NoteMeta } from '../../../notes/components/NoteMeta'
import { TypeSelector } from '../../../notes/components/TypeSelector'
import { useNotes } from '@/app/context/notes-context'
import { useCreateNote } from '@/app/dashboard/notes/hooks/useCreateNote'
// Note: buildNoteUpdate and validateNoteUpdate functions are now inlined
// Utility: Build safe NoteUpdate object
function buildNoteUpdate(changes: Partial<Note>, currentNote: Note): NoteUpdate {
  const update: NoteUpdate = {};
  if (changes.content !== undefined && changes.content !== currentNote.content) {
    update.content = changes.content;
  }
  if (changes.title !== undefined && changes.title !== currentNote.title) {
    update.title = changes.title;
  }
  if (changes.tags !== undefined && JSON.stringify(changes.tags) !== JSON.stringify(currentNote.tags)) {
    update.tags = changes.tags;
  }
  if (changes.type !== undefined && changes.type !== currentNote.type) {
    update.type = changes.type;
  }
  if (changes.typeGenerated !== undefined && changes.typeGenerated !== currentNote.typeGenerated) {
    update.typeGenerated = changes.typeGenerated;
  }
  return update;
}

// Validation layer for NoteUpdate
function validateNoteUpdate(update: NoteUpdate, context: string): NoteUpdate {
  if (update.tags !== undefined && update.tags.length === 0) {
    console.warn(`⚠️ Empty tags being sent from: ${context}`);
  }
  return update;
}
import type { Note, NoteUpdate, NoteType } from '../../../notes/types'
import type { Id } from "@/convex/_generated/dataModel"
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'

interface MarkdownNotepadProps {
  isOpen: boolean
  onClose: () => void
  onSendToChat?: (content: string) => void
  quotedContent?: string
  onClearQuoted?: () => void
  width: string
  style: React.CSSProperties
  // Note linking
  availableNotes?: Array<{ _id: string; title: string; type: string }>
  onLinkNote?: (noteId: string) => void
  // Mobile props
  isMobile?: boolean
  activeTab?: 'chat' | 'notes'
  onScrollPositionChange?: (position: number) => void
  // Enhanced note editing mode
  noteId?: string | Id<"notes"> // Pass this to edit an existing note
  fromChat?: boolean
  canNavigateBack?: boolean
  onBack?: () => void
  // Conversation linking
  sessionId?: string | null
}

export const MarkdownNotepad = forwardRef(function MarkdownNotepad({ 
  isOpen, 
  onClose, 
  onSendToChat, 
  quotedContent, 
  onClearQuoted, 
  width, 
  style,
  availableNotes = [],
  onLinkNote,
  isMobile = false,
  activeTab = 'notes',
  onScrollPositionChange,
  noteId,
  fromChat = false,
  canNavigateBack = false,
  onBack,
  sessionId
}: MarkdownNotepadProps, ref) {
  const { firebaseUser } = useAuth()
  const { notes, generateMetadataManually, isGeneratingMetadata, updateNote } = useNotes()
  const { createNote, isCreating } = useCreateNote()
  
  // State for note management
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [isNewNote, setIsNewNote] = useState(!noteId)
  const [currentNoteId, setCurrentNoteId] = useState<string | Id<"notes"> | null>(noteId || null)
  
  // Content and UI state
  const [content, setContent] = useState('')
  
  // Fetch existing note if editing
  const existingNote = useQuery(
    api.notes.getNote, 
    currentNoteId && !isNewNote
      ? {
          noteId: currentNoteId as Id<"notes">, 
          userId: firebaseUser?.uid || ''
        }
      : "skip"
  )
  
  // Create a note object for components that expect it
  // Use existingNote data when available (for saved notes), otherwise use local state (for new notes)
  const note: Note = React.useMemo(() => {
    if (existingNote && !isNewNote) {
      // For existing notes, use the live data from Convex
      return {
        ...existingNote,
        content: content || existingNote.content, // Use local content if editing
        isTemporary: false
      } as Note
    } else {
      // For new notes, use local state
      return {
        _id: currentNoteId || 'temp',
        _creationTime: Date.now(),
        userId: firebaseUser?.uid || '',
        title: 'Untitled Note',
        content: content,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        tags: [],
        type: 'idea_bank',
        isTemporary: isNewNote
      }
    }
  }, [existingNote, isNewNote, content, currentNoteId, firebaseUser?.uid])


  // Initialize content from existing note
  useEffect(() => {
    if (existingNote && existingNote.content && !content) {
      setContent(existingNote.content)
    }
  }, [existingNote, content])

  // Tag data for suggestions
  const noteTagData = React.useMemo(() => 
    notes
      .filter(n => String(n._id) !== String(note._id))
      .map(n => ({
        tags: n.tags || [],
        updatedAt: n.updatedAt || n._creationTime || 0
      }))
  , [notes, note._id])

  // Note update function
  const handleNoteUpdate = useCallback(async (noteId: string | Id<"notes">, updates: NoteUpdate): Promise<Note | null> => {
    if (isNewNote || !existingNote) {
      // For new notes, just update local state - this will be reflected when note is created
      console.log('📝 [MarkdownNotepad] Updating local note state for new note:', updates)
      return note
    }
    
    // For existing notes, use the notes context update mechanism
    // This will trigger the live query to update and reflect in the UI
    console.log('📝 [MarkdownNotepad] Updating existing note via context:', noteId, updates)
    try {
      const updatedNote = await updateNote(noteId, updates)
      return updatedNote
    } catch (error) {
      console.error('❌ [MarkdownNotepad] Failed to update note:', error)
      return null
    }
  }, [isNewNote, existingNote, note, updateNote])

  // Create or save note function
  const handleSaveAsNote = useCallback(async () => {
    if (!content.trim()) return
    
    if (isNewNote) {
      // Create new note with conversation link
      const newNoteId = await createNote(content.trim(), {
        redirect: false,
        customTitle: note.title !== 'Untitled Note' ? note.title : undefined,
        customType: note.type,
        sourceConversationId: sessionId || undefined
      })
      
      if (newNoteId) {
        setIsNewNote(false)
        setCurrentNoteId(newNoteId)
        console.log('✅ [MarkdownNotepad] New note created:', newNoteId)
        return newNoteId
      }
    } else {
      // Update existing note
      console.log('✅ [MarkdownNotepad] Note saved')
      return currentNoteId
    }
    return null
  }, [content, isNewNote, createNote, note, sessionId])

  // Smart metadata generation
  const shouldShowSmartButton = React.useMemo(() => {
    return content.trim().length >= 10 && !isGeneratingMetadata
  }, [content, isGeneratingMetadata])

  const handleGenerateMetadata = useCallback(async () => {
    if (!shouldShowSmartButton || isGeneratingMetadata || metadataGenerationInProgress.current) return
    
    metadataGenerationInProgress.current = true
    
    try {
      let noteIdToUse = currentNoteId
      
      // If it's a new note, save it first to get a real note ID
      if (isNewNote) {
        console.log('📝 [MarkdownNotepad] Saving new note before metadata generation')
        noteIdToUse = await handleSaveAsNote()
        if (!noteIdToUse) {
          console.error('❌ [MarkdownNotepad] Failed to save note before metadata generation')
          return
        }
      } else if (!noteIdToUse) {
        // If it's supposed to be an existing note but no ID, save it
        console.log('📝 [MarkdownNotepad] No note ID found, saving note first')
        noteIdToUse = await handleSaveAsNote()
        if (!noteIdToUse) {
          console.error('❌ [MarkdownNotepad] Failed to save note before metadata generation')
          return
        }
      }
      
      // Now generate metadata with the confirmed note ID
      console.log('🤖 [MarkdownNotepad] Generating metadata for note:', noteIdToUse)
      const result = await generateMetadataManually(String(noteIdToUse), content.trim())
      
      if (result && result.success) {
        // Check if a new note was created (different noteId returned)
        if (result.noteId && result.noteId !== String(noteIdToUse)) {
          console.log('✅ [MarkdownNotepad] New note created during metadata generation:', result.noteId)
          // Update to point to the new note
          setCurrentNoteId(result.noteId)
          setIsNewNote(false)
        }
        console.log('✅ [MarkdownNotepad] Metadata generation completed successfully')
      } else {
        console.error('❌ [MarkdownNotepad] Metadata generation failed:', result)
      }
    } catch (error) {
      console.error('❌ [MarkdownNotepad] Exception during metadata generation:', error)
    } finally {
      // Always reset the flag
      metadataGenerationInProgress.current = false
    }
  }, [shouldShowSmartButton, isGeneratingMetadata, handleSaveAsNote, currentNoteId, isNewNote, generateMetadataManually, content])

  // 🚀 Debug content state changes
  const handleContentChange = useCallback((newContent: string) => {
    console.log('📝 [MarkdownNotepad] Content state changing:', {
      oldLength: content.length,
      newLength: newContent.length,
      oldPreview: content.substring(0, 50) + '...',
      newPreview: newContent.substring(0, 50) + '...',
      contentChanged: content !== newContent
    })
    setContent(newContent)
  }, [content])

  // --- Add sidebar container ref ---
  const sidebarRef = useRef<HTMLDivElement>(null)
  
  // --- Add LexicalNotepadEditor ref ---
  const lexicalEditorRef = useRef<LexicalNotepadEditorRef>(null)
  
  // --- Add ref to prevent multiple metadata generation calls ---
  const metadataGenerationInProgress = useRef(false)

  const { askAI, requestAnalysis, requestIdeas } = useInlineAI({
    noteContent: content,
    userId: firebaseUser?.uid ?? '',
  })

  // Refinement state
  const [refinementPreview, setRefinementPreview] = useState<string | null>(null)
  const [isRefining, setIsRefining] = useState(false)

  // Handle quoted content insertion
  useEffect(() => {
    if (quotedContent && isOpen) {
      // Remove only leading/trailing quotes while preserving all markdown formatting (bold, italics, etc.) and newlines
      let cleanedContent = quotedContent.replace(/^['"]|['"]$/g, '').trim()
      // Remove leading '>' and whitespace from each line
      cleanedContent = cleanedContent
        .split('\n')
        .map(line => line.replace(/^\s*>\s?/, ''))
        .join('\n')
      const quotedText = `${cleanedContent}\n\n`
      setContent(prev => prev + quotedText)
      onClearQuoted?.()
    }
  }, [quotedContent, isOpen, onClearQuoted])

  // AI handlers that append content automatically
  const handleAskAI = useCallback(async (prompt: string) => {
    console.log('🤖 [MarkdownNotepad] handleAskAI called:', {
      prompt: prompt.substring(0, 100) + '...',
      currentContentLength: content.length
    })
    
    try {
      const response = await askAI(prompt)
      console.log('✨ [MarkdownNotepad] AI response received:', {
        responseLength: response.length,
        responsePreview: response.substring(0, 100) + '...'
      })
      
      // Automatically append the AI response to the current content
      const newContent = content.trim() ? `${content}\n\n${response}` : response
      setContent(newContent)
      console.log('✅ [MarkdownNotepad] AI content appended to editor')
      
    } catch (error) {
      console.error('❌ [MarkdownNotepad] Failed to get AI response:', error)
      throw error
    }
  }, [askAI, content, setContent])

  const handleRequestAnalysis = useCallback(async (noteType: string) => {
    try {
      const analysis = await requestAnalysis(noteType)
      
      // Automatically append the analysis to the current content
      const newContent = content.trim() ? `${content}\n\n${analysis}` : analysis
      setContent(newContent)
      console.log('✅ [MarkdownNotepad] Analysis content appended to editor')
      
    } catch (error) {
      console.error('❌ [MarkdownNotepad] Failed to get analysis:', error)
      throw error
    }
  }, [requestAnalysis, content, setContent])

  const handleRequestIdeas = useCallback(async () => {
    try {
      const ideas = await requestIdeas()
      const ideasText = Array.isArray(ideas) ? ideas.join('\n\n') : ideas
      
      // Automatically append the ideas to the current content
      const newContent = content.trim() ? `${content}\n\n${ideasText}` : ideasText
      setContent(newContent)
      console.log('✅ [MarkdownNotepad] Ideas content appended to editor')
      
    } catch (error) {
      console.error('❌ [MarkdownNotepad] Failed to get ideas:', error)
      throw error
    }
  }, [requestIdeas, content, setContent])

  // Refinement API function
  const refineText = useCallback(async (refinementType: string, selectedText: string): Promise<string> => {
    const apiKey = await getApiKey()
    if (!apiKey) {
      throw new Error('You are not authenticated. Please log in again.')
    }

    // Find the position of selected text in content to create proper context
    const selectionStart = content.indexOf(selectedText)
    
    let beforeText = ''
    let afterText = ''
    
    if (selectionStart >= 0) {
      // Found the selected text in content
      beforeText = content.substring(0, selectionStart)
      afterText = content.substring(selectionStart + selectedText.length)
    } else {
      // Fallback: couldn't find exact selection, provide full content as context
      beforeText = content
      afterText = ''
    }
    
    console.log('🔍 [MarkdownNotepad] Refinement context debug:', {
      selectedTextLength: selectedText.length,
      contentLength: content.length,
      selectionStart,
      beforeTextLength: beforeText.length,
      afterTextLength: afterText.length,
      beforeTextPreview: beforeText.substring(0, 50) + '...',
      afterTextPreview: afterText.substring(0, 50) + '...'
    })

    const response = await fetch('/api/smart_note_inline/refine-text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        selected_text: selectedText,
        surrounding_context: {
          before_text: String(beforeText || ''),
          after_text: String(afterText || ''),
          selection_position: {
            start_paragraph: 0,
            end_paragraph: 0,
            paragraph_total: 1,
            is_full_paragraph: false
          },
          note_title: null
        },
        refinement_type: refinementType,
        note_type: 'idea_bank'
      }),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`)
    }

    const data = await response.json()
    if (!data.success) {
      throw new Error('Refinement request failed')
    }

    return data.refined_text
  }, [content])

  // Refinement handlers
  const handleRefineText = useCallback(async (refinementType: string, selectedText: string) => {
    setIsRefining(true)
    
    try {
      const refinedText = await refineText(refinementType, selectedText)
      setRefinementPreview(refinedText)
      console.log('✨ [MarkdownNotepad] Text refinement completed:', {
        originalLength: selectedText.length,
        refinedLength: refinedText.length,
        refinementType
      })
      return refinedText
    } catch (error) {
      console.error('❌ [MarkdownNotepad] Failed to refine text:', error)
      throw error
    } finally {
      setIsRefining(false)
    }
  }, [refineText])

  const handleAcceptRefinement = useCallback(async () => {
    if (!refinementPreview) return

    // Replace the selected text with the refined version
    // For now, just append to content - in a real implementation, we'd replace the selected text
    const newContent = content.trim() ? `${content}\n\n${refinementPreview}` : refinementPreview
    setContent(newContent)
    setRefinementPreview(null)
    
    console.log('✅ [MarkdownNotepad] Refinement accepted and applied')
  }, [refinementPreview, content, setContent])

  const handleRejectRefinement = useCallback(async () => {
    setRefinementPreview(null)
    console.log('❌ [MarkdownNotepad] Refinement rejected')
  }, [])

  const handleRetryRefinement = useCallback(async () => {
    // For retry, we'd need to store the original refinement parameters
    // This is a simplified implementation
    setRefinementPreview(null)
    console.log('🔄 [MarkdownNotepad] Refinement retry requested')
  }, [])

  // Handle command palette trigger
  const handleTriggerCommandPalette = useCallback(() => {
    lexicalEditorRef.current?.triggerCommandPalette()
  }, [])


  const handleClear = () => {
    setContent('')
  }

  const handleSendToChat = () => {
    if (content.trim() && onSendToChat) {
      onSendToChat(content.trim())
      onClose()
    }
  }

  const handleCopy = async () => {
    if (content.trim()) {
      try {
        await navigator.clipboard.writeText(content)
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement('textarea')
        textArea.value = content
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
    }
  }

  // Expose enhanced note functionality to parent
  useImperativeHandle(ref, () => ({
    hasUnsavedContent: () => lexicalEditorRef.current?.hasContent() || false,
    clearContent: () => {
      lexicalEditorRef.current?.clear()
      setContent('')
      setIsNewNote(true)
      setCurrentNoteId(null)
    },
    getContent: () => lexicalEditorRef.current?.getContent() || '',
    saveNote: () => handleSaveAsNote(),
    getCurrentNote: () => note,
    isNewNote: () => isNewNote,
    setNoteForEditing: (noteId: string | Id<"notes">) => {
      setCurrentNoteId(noteId)
      setIsNewNote(false)
    }
  }), [note, isNewNote, handleSaveAsNote]);

  // Don't render on mobile if not the active tab
  if (isMobile && activeTab !== 'notes') {
    return null
  }


  // Don't render on desktop if not open - REMOVED: Notepad should always be visible
  // if (!isMobile && !isOpen) {
  //   return null
  // }

  // Mobile layout - complete note editing experience
  if (isMobile) {
    return (
      <div className="flex flex-col h-full bg-background">
        {/* Note metadata with enhanced mobile layout */}
        <div className="px-4 py-4 border-b border-border/30 bg-background/95">
          <div className="space-y-4">
            <NoteMeta
              note={note}
              onUpdate={handleNoteUpdate}
              onTitleChange={() => {}}
              onTagsChange={(tags) => handleNoteUpdate(note._id, { tags })}
              onEditingTitleChange={setIsEditingTitle}
              noteTagData={noteTagData}
            />
            
            {/* Mobile action row with beautiful spacing */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <TypeSelector
                  noteId={note._id}
                  userId={note.userId}
                  currentType={note.type || 'idea_bank'}
                  typeGenerated={note.typeGenerated}
                  onTypeChange={(type) => handleNoteUpdate(note._id, { type })}
                />
                
                <div className="h-4 w-px bg-border/40" />
                
                <button
                  onClick={handleTriggerCommandPalette}
                  className="px-2 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors duration-300"
                  title="AI Assistant (⌘K)"
                >
                  <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                  AI
                </button>
              </div>

              <div className="flex items-center gap-3">
              {shouldShowSmartButton && (
                <button
                  onClick={handleGenerateMetadata}
                  disabled={isGeneratingMetadata || metadataGenerationInProgress.current}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium hover:scale-[1.02] text-foreground border-l border-blue-400/60 pl-3 transition-all duration-300 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-50"
                  title="Generate smart title and tags"
                >
                  {(isGeneratingMetadata || metadataGenerationInProgress.current) ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Wand2 size={12} />
                  )}
                  <span>Smart</span>
                </button>
              )}
                
                <button
                  onClick={handleSaveAsNote}
                  disabled={isCreating || !content.trim()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground hover:scale-[1.02] hover:text-primary transition-all duration-300 disabled:opacity-50"
                  title="Save note"
                >
                  {isCreating ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    'Save'
                  )}
                </button>

                {onSendToChat && (
                  <button
                    onClick={handleSendToChat}
                    disabled={!content.trim()}
                    className="p-1.5 text-muted-foreground hover:text-foreground hover:scale-[1.02] transition-all duration-300 disabled:opacity-30"
                    title="Send to chat"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Clean editor area */}
        <div className="flex-1 overflow-auto relative">
          <LexicalNotepadEditor
            content={content}
            onContentChange={handleContentChange}
            placeholder="Start writing your note..."
            onAskAI={handleAskAI}
            onRequestAnalysis={handleRequestAnalysis}
            onRequestIdeas={handleRequestIdeas}
            userId={firebaseUser?.uid}
            noteType={note.type || "idea_bank"}
            availableNotes={availableNotes}
            onLinkNote={onLinkNote}
            className="h-full border-0"
            containerRef={sidebarRef}
            ref={lexicalEditorRef}
            onRefineText={handleRefineText}
            onAcceptRefinement={handleAcceptRefinement}
            onRejectRefinement={handleRejectRefinement}
            onRetryRefinement={handleRetryRefinement}
          />
        </div>
      </div>
    )
  }

  // Desktop layout - complete note editing experience
  return (
    <div 
      ref={sidebarRef}
      className="h-full bg-background border-l border-border/50 flex flex-col"
      style={{ ...style, width }}
    >

      {/* Note metadata and actions */}
      <div className="px-6 py-5 border-b border-border/30 bg-background/95">
        <div className="space-y-5">
          <NoteMeta
            note={note}
            onUpdate={handleNoteUpdate}
            onTitleChange={() => {}}
            onTagsChange={(tags) => handleNoteUpdate(note._id, { tags })}
            onEditingTitleChange={setIsEditingTitle}
            noteTagData={noteTagData}
          />
          
          {/* Desktop action row with anti-corporate spacing */}
          <div className="flex items-center justify-between pt-3">
            <div className="flex items-center gap-4">
              <TypeSelector
                noteId={note._id}
                userId={note.userId}
                currentType={note.type || 'idea_bank'}
                typeGenerated={note.typeGenerated}
                onTypeChange={(type) => handleNoteUpdate(note._id, { type })}
              />
              
              <div className="h-4 w-px bg-gradient-to-b from-transparent via-border/60 to-transparent" />
              
              <button
                onClick={handleTriggerCommandPalette}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-light text-muted-foreground hover:text-foreground hover:scale-[1.02] transition-all duration-300"
                title="AI Assistant (⌘K)"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Assistant</span>
              </button>
            </div>

            <div className="flex items-center gap-4">
              {shouldShowSmartButton && (
                <button
                  onClick={handleGenerateMetadata}
                  disabled={isGeneratingMetadata || metadataGenerationInProgress.current}
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-foreground border-l border-blue-400/60 pl-4 hover:scale-[1.02] hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 disabled:opacity-50"
                  title="Generate smart title and tags using AI"
                >
                  {(isGeneratingMetadata || metadataGenerationInProgress.current) ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Wand2 size={14} />
                  )}
                  <span>Smart Title + Tags</span>
                </button>
              )}
              
              <button
                onClick={handleSaveAsNote}
                disabled={isCreating || !content.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-medium text-foreground hover:scale-[1.02] hover:text-primary transition-all duration-300 disabled:opacity-50"
                title="Save note"
              >
                {isCreating ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  'Save Note'
                )}
              </button>

              {onSendToChat && (
                <button
                  onClick={handleSendToChat}
                  disabled={!content.trim()}
                  className="p-2 text-muted-foreground hover:text-foreground hover:scale-[1.02] transition-all duration-300 disabled:opacity-30"
                  title="Send to chat"
                >
                  <Send className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-auto relative">
        <LexicalNotepadEditor
          content={content}
          onContentChange={handleContentChange}
          placeholder="Start writing your note..."
          onAskAI={handleAskAI}
          onRequestAnalysis={handleRequestAnalysis}
          onRequestIdeas={handleRequestIdeas}
          userId={firebaseUser?.uid}
          noteType={note.type || "idea_bank"}
          availableNotes={availableNotes}
          onLinkNote={onLinkNote}
          className="h-full border-0"
          containerRef={sidebarRef}
          ref={lexicalEditorRef}
          onRefineText={handleRefineText}
          onAcceptRefinement={handleAcceptRefinement}
          onRejectRefinement={handleRejectRefinement}
          onRetryRefinement={handleRetryRefinement}
        />
      </div>
    </div>
  )
})
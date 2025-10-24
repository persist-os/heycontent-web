'use client'

import { useCallback, useState } from 'react'
import { useInlineAI } from '../../../../notes/hooks/useInlineAI'
import { getApiKey } from '@/app/lib/api-helpers'
import type { AIHandlers } from '../types'

interface UseNotepadAIProps {
  content: string
  userId: string
  setContent: (content: string) => void
  setRefinementPreview: (preview: string | null) => void
  setIsRefining: (refining: boolean) => void
  onGenerationComplete?: () => void
}

export function useNotepadAI({
  content,
  userId,
  setContent,
  setRefinementPreview,
  setIsRefining,
  onGenerationComplete
}: UseNotepadAIProps): AIHandlers {
  const { askAI, requestAnalysis, requestIdeas } = useInlineAI({
    noteContent: content,
    userId,
  })

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
      
      // Notify that generation completed
      onGenerationComplete?.()
      
    } catch (error) {
      console.error('❌ [MarkdownNotepad] Failed to get AI response:', error)
      throw error
    }
  }, [askAI, content, setContent, onGenerationComplete])

  const handleRequestAnalysis = useCallback(async (noteType: string) => {
    try {
      const analysis = await requestAnalysis(noteType)
      
      // Automatically append the analysis to the current content
      const newContent = content.trim() ? `${content}\n\n${analysis}` : analysis
      setContent(newContent)
      
      // Notify that generation completed
      onGenerationComplete?.()
      
    } catch (error) {
      console.error('❌ [MarkdownNotepad] Failed to get analysis:', error)
      throw error
    }
  }, [requestAnalysis, content, setContent, onGenerationComplete])

  const handleRequestIdeas = useCallback(async () => {
    try {
      const ideas = await requestIdeas()
      const ideasText = Array.isArray(ideas) ? ideas.join('\n\n') : ideas
      
      // Automatically append the ideas to the current content
      const newContent = content.trim() ? `${content}\n\n${ideasText}` : ideasText
      setContent(newContent)
      
      // Notify that generation completed
      onGenerationComplete?.()
      
    } catch (error) {
      console.error('❌ [MarkdownNotepad] Failed to get ideas:', error)
      throw error
    }
  }, [requestIdeas, content, setContent, onGenerationComplete])

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
      
      // Notify that generation completed
      onGenerationComplete?.()
      
      return refinedText
    } catch (error) {
      console.error('❌ [MarkdownNotepad] Failed to refine text:', error)
      throw error
    } finally {
      setIsRefining(false)
    }
  }, [refineText, setIsRefining, setRefinementPreview, onGenerationComplete])

  const handleAcceptRefinement = useCallback(async () => {
    // This would be called when a refinement preview exists and user accepts it
    // The actual refinement preview would be passed from the parent component
    // For now, this is a placeholder implementation
    setRefinementPreview(null)
    console.log('✅ [MarkdownNotepad] Refinement accepted and applied')
  }, [setRefinementPreview])

  const handleRejectRefinement = useCallback(async () => {
    setRefinementPreview(null)
    console.log('❌ [MarkdownNotepad] Refinement rejected')
  }, [setRefinementPreview])

  const handleRetryRefinement = useCallback(async () => {
    // For retry, we'd need to store the original refinement parameters
    // This is a simplified implementation
    setRefinementPreview(null)
    console.log('🔄 [MarkdownNotepad] Refinement retry requested')
  }, [setRefinementPreview])

  return {
    handleAskAI,
    handleRequestAnalysis,
    handleRequestIdeas,
    handleRefineText,
    handleAcceptRefinement,
    handleRejectRefinement,
    handleRetryRefinement
  }
}

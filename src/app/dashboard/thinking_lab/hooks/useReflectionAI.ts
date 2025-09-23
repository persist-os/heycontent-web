/**
 * Reflection AI Hook
 * 
 * Provides AI functionality for the reflection component.
 * Integrates with the reflection store and existing AI services.
 */

import { useCallback } from 'react'
import { useAuth } from '@/app/context/auth-context'
import { useInlineAI } from '../../notes/hooks/useInlineAI'
import { useReflectionStore } from '../stores/reflectionStore'
import type { ReflectionAIHandlers } from '../types/api/reflectionApi'

export function useReflectionAI(): ReflectionAIHandlers {
  const { firebaseUser } = useAuth()
  const { 
    content, 
    noteId,
    setRefinementPreview,
    setIsRefining,
    updateContent 
  } = useReflectionStore()

  // Initialize the AI service with reflection-specific context
  const { askAI, requestAnalysis, requestIdeas, isLoading, error } = useInlineAI({
    noteId: noteId || undefined,
    noteContent: content,
    noteTitle: 'Reflection Note',
    platform: 'thinking_lab',
    tags: ['reflection'],
    userId: firebaseUser?.uid || '',
  })

  // Ask AI for help with current content
  const handleAskAI = useCallback(async (prompt: string): Promise<void> => {
    try {
      console.log('🤖 [ReflectionAI] handleAskAI called:', {
        prompt: prompt.substring(0, 100) + '...',
        currentContentLength: content.length
      })

      const response = await askAI(prompt)
      
      if (response) {
        // Append AI response to current content
        const newContent = content ? `${content}\n\n${response}` : response
        updateContent(newContent)
        console.log('✅ [ReflectionAI] AI response added to content')
      }
    } catch (error) {
      console.error('❌ [ReflectionAI] handleAskAI error:', error)
      throw error
    }
  }, [content, askAI, updateContent])

  // Request analysis of current content
  const handleRequestAnalysis = useCallback(async (noteType: string): Promise<void> => {
    try {
      console.log('🧠 [ReflectionAI] handleRequestAnalysis called:', { noteType })
      
      const analysis = await requestAnalysis(noteType)
      
      if (analysis) {
        // Append analysis to current content
        const newContent = content ? `${content}\n\n## Analysis\n\n${analysis}` : `## Analysis\n\n${analysis}`
        updateContent(newContent)
        console.log('✅ [ReflectionAI] Analysis added to content')
      }
    } catch (error) {
      console.error('❌ [ReflectionAI] handleRequestAnalysis error:', error)
      throw error
    }
  }, [content, requestAnalysis, updateContent])

  // Request ideas based on current content
  const handleRequestIdeas = useCallback(async (): Promise<void> => {
    try {
      console.log('💡 [ReflectionAI] handleRequestIdeas called')
      
      const ideas = await requestIdeas()
      
      if (ideas && ideas.length > 0) {
        // Format ideas as a list and append to content
        const ideasText = ideas.map((idea, index) => `${index + 1}. ${idea}`).join('\n')
        const newContent = content ? `${content}\n\n## Ideas\n\n${ideasText}` : `## Ideas\n\n${ideasText}`
        updateContent(newContent)
        console.log('✅ [ReflectionAI] Ideas added to content')
      }
    } catch (error) {
      console.error('❌ [ReflectionAI] handleRequestIdeas error:', error)
      throw error
    }
  }, [content, requestIdeas, updateContent])

  // Text refinement functionality
  const handleRefineText = useCallback(async (refinementType: string, selectedText: string): Promise<string> => {
    setIsRefining(true)
    
    try {
      console.log('✨ [ReflectionAI] handleRefineText called:', { refinementType, selectedText: selectedText.substring(0, 100) + '...' })
      
      // Use askAI with a refinement prompt
      const refinementPrompt = `Please refine the following text for ${refinementType}:\n\n"${selectedText}"\n\nProvide only the refined version without additional commentary.`
      const refinedText = await askAI(refinementPrompt)
      
      if (refinedText) {
        setRefinementPreview(refinedText)
        console.log('✅ [ReflectionAI] Text refinement completed')
        return refinedText
      } else {
        throw new Error('No refinement generated')
      }
    } catch (error) {
      console.error('❌ [ReflectionAI] handleRefineText error:', error)
      setIsRefining(false)
      throw error
    }
  }, [askAI, setIsRefining, setRefinementPreview])

  // Accept refinement
  const handleAcceptRefinement = useCallback(async (): Promise<void> => {
    try {
      const refinementPreview = useReflectionStore.getState().refinementPreview
      if (refinementPreview) {
        // This would typically replace selected text in the editor
        // For now, we'll append it to content
        const newContent = content ? `${content}\n\n${refinementPreview}` : refinementPreview
        updateContent(newContent)
        setRefinementPreview(undefined)
        console.log('✅ [ReflectionAI] Refinement accepted')
      }
    } catch (error) {
      console.error('❌ [ReflectionAI] handleAcceptRefinement error:', error)
      throw error
    } finally {
      setIsRefining(false)
    }
  }, [content, updateContent, setRefinementPreview, setIsRefining])

  // Reject refinement
  const handleRejectRefinement = useCallback(async (): Promise<void> => {
    try {
      setRefinementPreview(undefined)
      console.log('✅ [ReflectionAI] Refinement rejected')
    } catch (error) {
      console.error('❌ [ReflectionAI] handleRejectRefinement error:', error)
      throw error
    } finally {
      setIsRefining(false)
    }
  }, [setRefinementPreview, setIsRefining])

  // Retry refinement
  const handleRetryRefinement = useCallback(async (): Promise<void> => {
    try {
      // This would retry the last refinement request
      // For now, just clear the preview
      setRefinementPreview(undefined)
      console.log('✅ [ReflectionAI] Refinement retry initiated')
    } catch (error) {
      console.error('❌ [ReflectionAI] handleRetryRefinement error:', error)
      throw error
    } finally {
      setIsRefining(false)
    }
  }, [setRefinementPreview, setIsRefining])

  return {
    // AI handlers that match the notepad interface
    handleAskAI,
    handleRequestAnalysis,
    handleRequestIdeas,
    handleRefineText,
    handleAcceptRefinement,
    handleRejectRefinement,
    handleRetryRefinement,
    // State
    isLoading,
    error
  }
}

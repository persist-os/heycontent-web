/**
 * Project Discovery Container Component
 * 
 * Main orchestrator component for the project discovery system.
 * Coordinates all sub-components and manages the overall component
 * lifecycle. Replaces the monolithic ProjectDiscoveryChat component
 * with a clean, modular architecture.
 * 
 * Used by: Main page component, project discovery routing
 */
'use client'

import React, { useCallback, useMemo, useState } from 'react'
import { InputArea } from './components/InputArea'
import MessageDisplay from './components/MessageDisplay'
import SuggestionsDisplay from './components/SuggestionsDisplay'
import { ProgressDisplay } from './components/ProgressDisplay'
import { useConversationState } from './state/useConversationState'
import { useDiscoveryState } from './state/useDiscoveryState'
import { useProgressTracking } from './state/useProgressTracking'
import { discoveryApiService } from './services/discoveryApiService'
import type { MessageData, ProjectDiscoveryChatProps } from './types/discoveryTypes'

/**
 * ProjectDiscoveryOrchestrator
 *
 * Orchestrates state hooks, sub-components, and API calls to deliver the
 * complete Project Discovery experience.
 */
export default function ProjectDiscoveryOrchestrator({ projectId }: ProjectDiscoveryChatProps) {
  const { messages, addMessage, updateMessage } = useConversationState([])
  const { discoveryState, suggestions, updateSuggestions, setComplete, setError, setDiscoveryState } = useDiscoveryState()
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  
  // Use real field-based progress from API response
  const progress = useMemo(() => {
    // Backend already sends completion_percentage as decimal (0.0-1.0), no conversion needed
    const completionPercentage = discoveryState.completion_percentage
    const fieldBasedConfidence = discoveryState.field_based_confidence
    
    return {
      completionPercentage,
      fieldBasedConfidence,
      traditionalConfidence: completionPercentage,
      completedFields: discoveryState.completed_fields,
      partialFields: discoveryState.partial_fields,
      emptyFields: discoveryState.empty_fields,
      totalFields: discoveryState.total_fields
    }
  }, [discoveryState])

  const send = useCallback(async (text: string) => {
    if (!text.trim() || !projectId) return
    const userMsg: MessageData = { id: crypto.randomUUID(), role: 'user', content: text, timestamp: new Date().toISOString(), status: 'sent' }
    // Capture current length BEFORE pushing new messages to compute the typing index reliably
    const prevLen = messages.length
    addMessage(userMsg)
    addMessage({ id: `typing-${Date.now()}`, role: 'assistant', content: '', timestamp: new Date().toISOString(), status: 'typing' })
    setLoading(true)
    try {
      const isFirst = !sessionId
      const res = await discoveryApiService.sendMessage(text, projectId, {
        conversationHistory: messages.map(m => ({ role: m.role, content: m.content, timestamp: Date.parse(m.timestamp) })),
        isFirstMessage: isFirst,
        sessionId: isFirst ? null : sessionId,
        contentContext: null
      })
      if (res.session_id && res.session_id !== sessionId) setSessionId(res.session_id)
      // Replace the typing message (which is now at index prevLen + 1)
      updateMessage(prevLen + 1, { id: crypto.randomUUID(), role: 'assistant', content: res.response || 'Okay.', timestamp: new Date().toISOString(), status: 'sent' })
      
      // Update discovery state with real field-based data from API
      if (res.metadata) {
        // Use actual suggestions from backend, extract title strings
        const suggestionTitles = (res.suggestions || []).map(s => 
          typeof s === 'string' ? s : s.title
        )
        updateSuggestions(suggestionTitles)
        // Update field completion data directly from metadata
        setDiscoveryState(prev => ({
          ...prev,
          completion_percentage: res.metadata.completion_percentage || 0,
          field_based_confidence: res.metadata.field_based_confidence || 0,
          completed_fields: res.metadata.completed_fields || 0,
          partial_fields: res.metadata.partial_fields || 0,
          empty_fields: res.metadata.empty_fields || 0,
          total_fields: res.metadata.total_fields || 46,
          next_priority_field: res.metadata.next_priority_field || null,
          missing_fields: res.metadata.missing_fields || []
        }))
      }
      
      if (res.fingerprint_state?.is_complete) setComplete(res.fingerprint_state?.current_fingerprint)
    } catch (e: any) {
      setError(e?.message || 'Failed to send message')
      updateMessage(prevLen + 1, { id: crypto.randomUUID(), role: 'assistant', content: 'Something went wrong. Please try again.', timestamp: new Date().toISOString(), status: 'error' })
    } finally {
      setLoading(false)
    }
  }, [projectId, messages, addMessage, updateMessage, updateSuggestions, setComplete, setError])

  const onSuggestion = useCallback((s: string) => send(s), [send])
  const onGenerate = useCallback(async () => { if (!projectId) return; setLoading(true); try { await discoveryApiService.generateFingerprint(projectId, true) } finally { setLoading(false) } }, [projectId])

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 pt-3">
        {/* Welcome message when no conversation has started */}
        {messages.length === 0 && (
          <div className="mb-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-200 dark:border-blue-800/20 rounded-lg">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-100 mb-3">
                Welcome to Project Discovery! 🚀
              </h2>
              <p className="text-blue-800 dark:text-blue-200 mb-4">
                I'm here to help you discover and understand your project through conversation. 
                Together, we'll explore your project's unique characteristics, goals, and potential.
              </p>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
                <p><strong>How it works:</strong></p>
                <ul className="text-left space-y-1">
                  <li>• Share what you're working on</li>
                  <li>• I'll ask thoughtful questions to understand your project</li>
                  <li>• Watch the progress bar fill as we build your project fingerprint</li>
                  <li>• Get targeted suggestions for missing information</li>
                </ul>
              </div>
            </div>
          </div>
        )}
        
        <MessageDisplay messages={messages} showTypingIndicator={loading} />
        <SuggestionsDisplay suggestions={suggestions} isLoading={loading} onSuggestionClick={onSuggestion} showContainer />
        <ProgressDisplay progress={progress} missingAreas={discoveryState.missing_fields} isGeneratingFingerprint={loading} onGenerateFingerprint={onGenerate} />
      </div>
      <InputArea inputValue={input} onInputChange={setInput} onSend={send} isLoading={loading} />
    </div>
  )
}



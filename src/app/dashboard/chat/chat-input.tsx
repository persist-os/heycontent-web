'use client'

import React, { useRef, useEffect, useState } from 'react'
import { UnifiedContentSelector } from '@/components/ui/UnifiedContentSelector'
import { Send, Loader2, MessageSquare, FileText, Search, Mic } from 'lucide-react'
import { useVoiceRecording } from './hooks/useVoiceRecording'
import { useThemeColors } from './hooks/useThemeColors'
import { useInputState } from './hooks/useInputState'
import { useContentLinking } from './hooks/useContentLinking'
import { useTextProcessing } from './hooks/useTextProcessing'
import { useKeyboardHandlers } from './hooks/useKeyboardHandlers'
import type { Message } from '@/app/types/chat'

interface ChatInputProps {
  onSend: (message: string) => void
  isLoading?: boolean
  inputRef?: React.RefObject<HTMLTextAreaElement>
  maxLength?: number
  referencedMessage?: Message | null
  onClearReference?: () => void
  autoFocus?: boolean
  hasContext?: boolean
  contextPlatform?: string
  hasAnalysis?: boolean
  inputValue?: string
  onInputChange?: (value: string) => void
  notepadOpen?: boolean
  openNotepad?: () => void
  quotedForNotepad?: string
  onClearQuoted?: () => void
  disabled?: boolean
  currentTab?: string // Add currentTab prop for tab-specific @ linking
  // Mobile props
  isMobile?: boolean
  activeTab?: 'chat' | 'notes'
}


export function ChatInput({
  onSend,
  isLoading,
  inputRef,
  maxLength = 10000,
  referencedMessage,
  onClearReference,
  autoFocus = true,
  hasContext = false,
  contextPlatform,
  hasAnalysis = false,
  inputValue,
  onInputChange,
  notepadOpen = false,
  openNotepad,
  quotedForNotepad,
  onClearQuoted,
  disabled = false,
  currentTab = 'all',
  isMobile = false,
  activeTab = 'chat'
}: ChatInputProps) {
  const [showFullReply, setShowFullReply] = useState(false)
  const internalInputRef = useRef<HTMLTextAreaElement>(null)
  const textareaRef = inputRef || internalInputRef
  
  // Initialize hooks
  const themeColors = useThemeColors()
  
  const inputState = useInputState({
    inputValue,
    onInputChange,
    hasAnalysis,
    maxLength,
    autoFocus,
    isLoading,
    referencedMessage,
    textareaRef
  })
  
  const contentLinking = useContentLinking({
    currentTab,
    textareaRef,
    setCurrentInput: inputState.setCurrentInput
  })
  
  const textProcessing = useTextProcessing({ 
    allLinkableContent: contentLinking.allLinkableContent 
  })
  
  // Voice recording functionality - initialize before keyboard handlers
  const { 
    isRecording, 
    voiceSupported, 
    toggleRecording,
    resetAccumulatedText,
    getAccumulatedText
  } = useVoiceRecording({
    currentInput: inputState.currentInput,
    onInputChange,
    setCurrentInput: inputState.setCurrentInput
  })
  
  const keyboardHandlers = useKeyboardHandlers({
    currentInput: inputState.currentInput,
    isLoading,
    isAtLimit: inputState.isAtLimit,
    convertTitlesToContentIds: textProcessing.convertTitlesToContentIds,
    onSend,
    setCurrentInput: inputState.setCurrentInput,
    openContentSelector: contentLinking.openContentSelector,
    closeContentSelector: contentLinking.closeContentSelector,
    showEnhancedContentSelector: contentLinking.showEnhancedContentSelector,
    resetAccumulatedText
  })




  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (inputState.currentInput.trim() && !isLoading && inputState.currentInput.length <= maxLength) {
      // Convert truncated titles back to content IDs before sending
      const processedMessage = textProcessing.convertTitlesToContentIds(inputState.currentInput.trim())
      onSend(processedMessage)
      inputState.setCurrentInput('')
      
      // Reset accumulated voice text since we're starting fresh
      resetAccumulatedText()
    }
  }

  // Override reference handling when notepad is open
  const handleReferenceClick = () => {
    if (notepadOpen && referencedMessage && quotedForNotepad !== undefined) {
      // Add to notepad logic is handled by parent
      if (onClearQuoted) {
        onClearQuoted()
      }
      onClearReference?.()
    }
  }


  // Dynamic placeholder based on context
  let contextPlaceholder = inputState.placeholder
  if (hasContext && contextPlatform) {
    if (contextPlatform === 'ai-insights') {
      contextPlaceholder = "Ask about these insights..."
    } else if (contextPlatform === 'smart-notes') {
      contextPlaceholder = "Ask about your notes..."
    } else {
      contextPlaceholder = `Ask about your ${contextPlatform} content...`
    }
  } else if (hasAnalysis) {
    contextPlaceholder = "Ask me anything about your content..."
  }

  return (
    <div className="shrink-0 bg-background relative will-change-auto">
      <form onSubmit={handleSubmit} className="p-2 sm:p-3">
        {/* Context indicator */}
        {hasContext && (
          <div className="w-full mb-2">
            <div className={`flex items-center gap-2 text-xs p-2 rounded-lg border ${themeColors.accentColor} ${themeColors.accentBgLight} ${themeColors.accentBorder}/20`}>
              <Search className="w-4 h-4 flex-shrink-0" />
              <span className="break-words">
                {hasAnalysis 
                  ? `AI analysis for this ${contextPlatform} content will be included as context`
                  : `Discussing ${contextPlatform} content`
                }
              </span>
            </div>
          </div>
        )}

        {/* Reference preview */}
        {referencedMessage && !notepadOpen && (
          <div className="w-full mb-2">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground bg-muted/80 p-2 rounded-lg border border-border/50 min-w-0">
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <button 
                onClick={() => setShowFullReply(!showFullReply)}
                className="flex-1 text-left hover:text-foreground min-w-0"
              >
                <span className={showFullReply ? "break-words whitespace-pre-wrap min-w-0" : "truncate block min-w-0"}>
                  Replying to: {showFullReply 
                    ? referencedMessage.content 
                    : referencedMessage.content.length > 60 
                      ? `${referencedMessage.content.slice(0, 60)}...` 
                      : referencedMessage.content}
                </span>
              </button>
              <button
                onClick={() => {
                  setShowFullReply(false)
                  onClearReference?.()
                }}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-muted flex-shrink-0"
                aria-label="Clear reply"
              >
                <span className="text-base font-medium">×</span>
              </button>
            </div>
          </div>
        )}

        {/* Reference notification when notepad is open */}
        {referencedMessage && notepadOpen && (
          <div className="w-full mb-2">
            <div className="flex items-center gap-3 text-xs text-foreground bg-muted/50 p-3 rounded-lg border border-border/50">
              <FileText className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
              <button 
                onClick={handleReferenceClick}
                className="flex-1 text-left hover:text-foreground font-medium"
              >
                Add quote to notepad
              </button>
              <button
                onClick={() => {
                  setShowFullReply(false)
                  onClearReference?.()
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded"
                aria-label="Clear reply"
              >
                <span className="text-sm">×</span>
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2 items-end w-full relative">
          <div className="flex-1 relative rounded-xl">
            {/* Top section - Text input area */}
            <div className="flex items-start rounded-t-xl bg-muted/50 pl-3 py-2 pr-3">
              <textarea
                ref={textareaRef}
                value={inputState.currentInput}
                onChange={keyboardHandlers.handleTextareaChange}
                placeholder={contextPlaceholder}
                className="text-base leading-relaxed flex-1 bg-transparent border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0 ring-offset-0 focus:ring-offset-0 focus-visible:ring-offset-0 resize-none placeholder:text-muted-foreground chat-font min-h-[40px] max-h-[80px] will-change-auto
                [&::-webkit-scrollbar]:w-0 
                [&::-webkit-scrollbar]:h-0
                [&::-webkit-scrollbar-track]:bg-transparent
                [&::-webkit-scrollbar-thumb]:bg-transparent 
                [&::-webkit-scrollbar-corner]:bg-transparent
                [scrollbar-width:none]
                [-ms-overflow-style:none]"
                disabled={isLoading || disabled}
                onKeyDown={keyboardHandlers.handleKeyDown}
                onSelect={keyboardHandlers.handleTextareaSelect}
                maxLength={maxLength}
                data-chat-input
              />
            </div>

            {/* Bottom section - Buttons area */}
            <div className="flex items-center justify-between rounded-b-xl bg-muted/50 px-3 py-2 h-10">
              {/* Left side - empty now, toggles moved to top bar */}
              <div className="flex items-center">
              </div>

              {/* Right side - Character count, Notes, Send */}
              <div className="flex items-center gap-3">
                {/* Character count */}
                {!isLoading && (
                  <div className={`text-xs
                    ${inputState.isAtLimit ? 'text-destructive font-medium' : ''}
                    ${inputState.isNearLimit && !inputState.isAtLimit ? 'text-warning font-medium' : 'text-muted-foreground'}
                  `}>
                    {inputState.characterCount.toLocaleString()}/{maxLength.toLocaleString()}
                  </div>
                )}

                {voiceSupported && (
                  <button
                    type="button"
                    aria-label={isRecording ? "Stop voice input" : "Start voice input"}
                    disabled={disabled}
                    onClick={toggleRecording}
                    className={`relative w-7 h-7 rounded-lg flex items-center justify-center
                      ${disabled 
                        ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                        : isRecording 
                          ? 'bg-red-500 text-white shadow-lg shadow-red-500/50 ring-2 ring-red-300' 
                          : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
                      }`}
                  >
                    <Mic className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Send button */}
                <button
                  type="submit"
                  aria-label="Send message"
                  disabled={isLoading || !inputState.currentInput.trim() || inputState.isAtLimit || disabled}
                  className={`w-7 h-7 rounded-lg flex items-center justify-center
                    ${isLoading || !inputState.currentInput.trim() || inputState.isAtLimit || disabled 
                      ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                      : `${themeColors.accentBg} text-white ${themeColors.accentBgHover} shadow-sm hover:shadow-md`
                    }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-1.5 text-xs text-muted-foreground text-center">
          Press Enter to send, Shift+Enter for new line, @ to link content
        </div>
      </form>

      {/* Enhanced Content Selector */}
      <UnifiedContentSelector
        mode="link"
        isOpen={contentLinking.showEnhancedContentSelector}
        onClose={contentLinking.closeContentSelector}
        onSelect={contentLinking.handleLinkContent}
        position={contentLinking.contentSelectorPosition}
        searchTerm={contentLinking.contentSearchTerm}
        onSearchChange={contentLinking.setContentSearchTerm}
        currentTab={currentTab}
      />
    </div>
  )
}
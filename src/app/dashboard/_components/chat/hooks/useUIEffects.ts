import { useCallback, useEffect, useRef, useState } from 'react'
import { Message } from '@/app/types/chat'
import { AmbientInsight, SuggestedAction } from '../types'

export const useUIEffects = (
  messages: Message[],
  isExpanded: boolean
) => {
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [showAmbient, setShowAmbient] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [ambientLoading, setAmbientLoading] = useState(false)

  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      })
    }
  }, [])

  const scrollToMessage = useCallback((messageId: number) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Add a brief highlight effect
      messageElement.classList.add('bg-yellow-100/50');
      setTimeout(() => {
        messageElement.classList.remove('bg-yellow-100/50');
      }, 2000);
    }
  }, []);

  const handleInsightClick = useCallback((action: string, insight: AmbientInsight, onSendMessage: (message: string) => void) => {
    setShowAmbient(false)
    const message = `${action} - Regarding: ${insight.title} (${insight.description})`
    onSendMessage(message)
  }, [])

  const handleSuggestionClick = useCallback((suggestion: string | SuggestedAction, onSendMessage: (message: string) => void) => {
    const message = typeof suggestion === 'string' 
      ? suggestion 
      : suggestion.description;
    
    onSendMessage(message);
  }, [])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      // Simulate API call - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setLastRefresh(new Date())
    } finally {
      setIsRefreshing(false)
    }
  }, [])

  const resetChat = useCallback(() => {
    setShowAmbient(true)
  }, [])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom()
    }
  }, [messages.length, scrollToBottom])

  // Scroll to bottom when sidebar state changes
  useEffect(() => {
    if (messages.length > 0) {
      // Add a small delay to allow the layout to update
      const timer = setTimeout(() => {
        scrollToBottom()
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [isExpanded, scrollToBottom, messages.length])

  // Add resize observer to handle window resizing
  useEffect(() => {
    if (messages.length > 0) {
      const handleResize = () => {
        scrollToBottom()
      }

      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [scrollToBottom, messages.length])

  return {
    chatContainerRef,
    inputRef,
    showAmbient,
    setShowAmbient,
    isRefreshing,
    lastRefresh,
    ambientLoading,
    setAmbientLoading,
    scrollToBottom,
    scrollToMessage,
    handleInsightClick,
    handleSuggestionClick,
    handleRefresh,
    resetChat
  }
} 
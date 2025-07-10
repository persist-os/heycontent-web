'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import ChatScreen from './utils/chat-screen'
import { useContentContextStore } from '@/store/content-context-store'

export default function ChatPage() {
  const searchParams = useSearchParams()
  const chatId = searchParams.get('id')
  const contentContext = searchParams.get('contentContext')
  let askQuery = searchParams.get('ask')
  const welcome = searchParams.get('welcome')
  const autoSend = searchParams.get('autoSend')

  // Get the content context from Zustand store
  const currentContext = useContentContextStore(state => state.currentContext)
  const setContentContext = useContentContextStore(state => state.setContentContext)

  // Parse content context from URL if it exists (backward compatibility)
  useEffect(() => {
    if (contentContext && !currentContext) {
      try {
        const parsedContext = JSON.parse(decodeURIComponent(contentContext))
        
        // If we have messageToSend in the context and autoSend is true,
        // use it as the askQuery to auto-send, but don't duplicate it in the context
        if (autoSend === 'true' && parsedContext.messageToSend && !askQuery) {
          askQuery = parsedContext.messageToSend
          // Remove messageToSend from context to prevent duplicate sending
          delete parsedContext.messageToSend
        }

        // Set the context in Zustand store
        setContentContext(parsedContext)
      } catch (error) {
        console.error('Failed to parse content context:', error)
      }
    }
  }, [contentContext, currentContext, setContentContext, autoSend, askQuery])

  return <ChatScreen 
    chatId={chatId} 
    contentContext={currentContext} 
    askQuery={askQuery} 
  />
}

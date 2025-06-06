'use client'

import { useSearchParams } from 'next/navigation'
import ChatScreen from '../_components/chat-screen'

export default function ChatPage() {
  const searchParams = useSearchParams()
  const chatId = searchParams.get('id')
  const contentContext = searchParams.get('contentContext')
  let askQuery = searchParams.get('ask')
  const welcome = searchParams.get('welcome')
  const autoSend = searchParams.get('autoSend')

  // Parse content context if it exists
  let parsedContext = null
  if (contentContext) {
    try {
      parsedContext = JSON.parse(decodeURIComponent(contentContext))
      
      // If we have messageToSend in the context and autoSend is true,
      // use it as the askQuery to auto-send, but don't duplicate it in the context
      if (autoSend === 'true' && parsedContext.messageToSend && !askQuery) {
        askQuery = parsedContext.messageToSend
        // Remove messageToSend from context to prevent duplicate sending
        delete parsedContext.messageToSend
      }
    } catch (error) {
      console.error('Failed to parse content context:', error)
    }
  }

  return <ChatScreen 
    chatId={chatId} 
    contentContext={parsedContext} 
    askQuery={askQuery} 
    welcome={welcome === 'true'} 
  />
}

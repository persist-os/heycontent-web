'use client'

import { useSearchParams } from 'next/navigation'
import ChatScreen from '../_components/chat-screen'

export default function ChatPage() {
  const searchParams = useSearchParams()
  const chatId = searchParams.get('id')
  const contentContext = searchParams.get('contentContext')
  const askQuery = searchParams.get('ask')

  // Parse content context if it exists
  let parsedContext = null
  if (contentContext) {
    try {
      parsedContext = JSON.parse(decodeURIComponent(contentContext))
    } catch (error) {
      console.error('Failed to parse content context:', error)
    }
  }

  return <ChatScreen chatId={chatId} contentContext={parsedContext} askQuery={askQuery} />
}
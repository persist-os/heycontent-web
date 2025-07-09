'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import ChatScreen from './utils/chat-screen'
import { useContentContext } from '@/store/content-context-store'
import { ContentContext } from './types'

export default function ChatPage() {
  const searchParams = useSearchParams()
  const chatId = searchParams.get('id')
  const welcome = searchParams.get('welcome')
  const autoSend = searchParams.get('autoSend')
  const askQuery = searchParams.get('ask')

  const { context: contentContext } = useContentContext()
  const [currentContext, setCurrentContext] = useState<ContentContext | null>(null)

  useEffect(() => {
    if (contentContext && contentContext !== currentContext) {
      setCurrentContext(contentContext)
    }
  }, [contentContext, currentContext, autoSend, askQuery])
  
  return <ChatScreen 
    chatId={chatId} 
    contentContext={currentContext} 
    askQuery={askQuery} 
    welcome={welcome === 'true'} 
  />
}

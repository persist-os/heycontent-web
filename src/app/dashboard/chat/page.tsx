'use client'

import { useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import ChatScreen from './utils/chat-screen'
import { useContentContext, useContentContextActions } from '@/store/content-context-store'
import { ContentContext } from './types'

export default function ChatPage() {
  const searchParams = useSearchParams()
  const chatId = searchParams.get('id')
  const welcome = searchParams.get('welcome')
  const autoSend = searchParams.get('autoSend')
  const askQuery = searchParams.get('ask')
  const projectId = searchParams.get('projectId')
  const noteId = searchParams.get('noteId')

  const { context: contentContext, isLoading, isInitialized } = useContentContext()
  const { clearContentContext } = useContentContextActions()
  const [currentContext, setCurrentContext] = useState<ContentContext | null>(null)

  // Clear context when navigating to regular chat (not from a specific content source)
  useEffect(() => {
    // If we're on regular chat page without specific context triggers, clear any lingering context
    if (isInitialized && !askQuery && !autoSend && !projectId && !noteId && !searchParams.get('contentContext')) {
      // Only clear if we have context but no valid reason to keep it
      if (contentContext) {
        console.log('🧹 Clearing lingering context on regular chat navigation')
        clearContentContext()
      }
    }
  }, [isInitialized, askQuery, autoSend, projectId, noteId, searchParams, contentContext, clearContentContext])

  useEffect(() => {
    if (contentContext && isInitialized) {
      setCurrentContext(contentContext)
    }
  }, [contentContext, isInitialized, autoSend, askQuery])
  
  if (isLoading) {
    return <div className="flex items-center justify-center h-full min-h-[300px]"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div></div>;
  }

  return <ChatScreen 
    chatId={chatId} 
    contentContext={currentContext} 
    askQuery={askQuery} 
    noteId={noteId}
  />
}

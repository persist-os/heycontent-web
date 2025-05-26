'use client'

import { useSearchParams } from 'next/navigation'
import ChatScreen from '../_components/chat-screen'

export default function ChatPage() {
  const searchParams = useSearchParams()
  const chatId = searchParams.get('id')

  return <ChatScreen chatId={chatId} />
}
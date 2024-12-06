'use client'

import { Message } from '@/types/chat'

interface MessageBubbleProps {
  message: Message
  isLastMessage: boolean
}

export function MessageBubble({ message, isLastMessage }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div className={`max-w-[70%] rounded-2xl px-4 py-3 ${
        isUser ? 'bg-blue-500 text-white' : 'bg-gray-100'
      }`}>
        {message.content}
      </div>
    </div>
  )
} 
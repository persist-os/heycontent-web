import { useState } from 'react'
import { Message } from '@/app/types/chat'

export type ChatStateReturnType = {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  conversationSaved: boolean;
  setConversationSaved: React.Dispatch<React.SetStateAction<boolean>>;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
}

export const useChatState = (): ChatStateReturnType => {
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [conversationSaved, setConversationSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return {
    messages,
    setMessages,
    sessionId,
    setSessionId,
    conversationSaved,
    setConversationSaved,
    isLoading,
    setIsLoading,
    error,
    setError
  }
} 
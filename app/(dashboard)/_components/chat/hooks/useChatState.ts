import { useState } from 'react'
import { Message } from '@/app/types/chat'

export type ChatStateReturnType = {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  isLoading: boolean;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  error: string | null;
  setError: React.Dispatch<React.SetStateAction<string | null>>;
  isFirstMessage: boolean;
  setIsFirstMessage: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useChatState = (): ChatStateReturnType => {
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFirstMessage, setIsFirstMessage] = useState(true) // Initialize to true for new chats

  return {
    messages,
    setMessages,
    sessionId,
    setSessionId,
    isLoading,
    setIsLoading,
    error,
    setError,
    isFirstMessage,
    setIsFirstMessage
    }
} 
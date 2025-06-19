import { useState } from 'react'
import { Message } from '@/app/types/chat'
import { ContentContext } from '../types'

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
  contentContext: ContentContext | null;
  setContentContext: React.Dispatch<React.SetStateAction<ContentContext | null>>;
  includeAnalysisInQuery: boolean;
  setIncludeAnalysisInQuery: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useChatState = (): ChatStateReturnType => {
  const [messages, setMessages] = useState<Message[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFirstMessage, setIsFirstMessage] = useState(true) // Initialize to true for new chats
  const [contentContext, setContentContext] = useState<ContentContext | null>(null)
  const [includeAnalysisInQuery, setIncludeAnalysisInQuery] = useState(true) // Default to true

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
    setIsFirstMessage,
    contentContext,
    setContentContext,
    includeAnalysisInQuery,
    setIncludeAnalysisInQuery
    }
} 
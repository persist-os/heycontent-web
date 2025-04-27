import { create } from 'zustand'

// Define types based on your Prisma schema
interface Message {
  id: string
  content: string
  role: string
  timestamp: Date
  conversationId: string
  referencedMessageId?: string | null
}

interface Conversation {
  id: string
  userId: string
  title: string
  createdAt: Date
  updatedAt: Date
  messages: Message[]
  starred: boolean
}

interface ChatState {
  conversations: Conversation[]
  currentConversation: Conversation | null
  isLoading: boolean
  error: string | null
  fetchConversations: () => Promise<void>
  setCurrentConversation: (conversation: Conversation | null) => void
  addMessage: (message: Message) => void
  starConversation: (conversationId: string) => Promise<void>
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  currentConversation: null,
  isLoading: false,
  error: null,

  fetchConversations: async () => {
    set({ isLoading: true })
    try {
      const response = await fetch('/api/chat/history')
      if (!response.ok) throw new Error('Failed to fetch conversations')
      const conversations = await response.json()
      set({ conversations, isLoading: false })
    } catch (error) {
      set({ error: (error as Error).message, isLoading: false })
    }
  },

  setCurrentConversation: (conversation: Conversation | null) => {
    set({ currentConversation: conversation })
  },

  addMessage: (message: Message) => {
    set((state: ChatState) => {
      const currentConversation = state.currentConversation
      if (!currentConversation) return state

      const updatedConversation = {
        ...currentConversation,
        messages: [...currentConversation.messages, message]
      }

      const updatedConversations = state.conversations.map((conv: Conversation) =>
        conv.id === currentConversation.id ? updatedConversation : conv
      )

      return {
        conversations: updatedConversations,
        currentConversation: updatedConversation
      }
    })
  },

  starConversation: async (conversationId: string) => {
    try {
      const response = await fetch(`/api/chat/history/${conversationId}/star`, {
        method: 'POST'
      })
      if (!response.ok) throw new Error('Failed to star conversation')
      
      set((state: ChatState) => ({
        conversations: state.conversations.map((conv: Conversation) =>
          conv.id === conversationId ? { ...conv, starred: !conv.starred } : conv
        )
      }))
    } catch (error) {
      set({ error: (error as Error).message })
    }
  }
})) 
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/auth-context'
import {
  Search,
  MessageSquare,
  Trash2,
  Star
} from 'lucide-react'
import { ChatHistory } from '@/app/types/chat'

export default function HistoryPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [chats, setChats] = useState<ChatHistory[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Fetch chats
  useEffect(() => {
    const fetchChats = async () => {
      if (!user?.uid) return
      try {
        const response = await fetch('/api/chat/history')
        const data = await response.json()
        if (data.conversations) {
          setChats(data.conversations)
        }
      } catch (error) {
        console.error('Failed to fetch chats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchChats()
  }, [user?.uid])

  const handleDeleteChat = async (chatId: string) => {
    try {
      await fetch(`/api/chat/${chatId}`, { method: 'DELETE' })
      setChats(chats.filter(chat => chat.id !== chatId))
    } catch (error) {
      console.error('Failed to delete chat:', error)
    }
  }

  const filteredChats = chats.filter(chat =>
    chat.topic.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border rounded-xl bg-white/50 backdrop-blur-sm"
          />
        </div>
      </div>

      {/* Chat List */}
      {isLoading ? (
        <div className="text-center text-gray-500">Loading...</div>
      ) : (
        <div className="space-y-3">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              className="group bg-white border rounded-xl p-4 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => router.push(`/chat?id=${chat.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <MessageSquare className="w-5 h-5 text-gray-400" />
                    <div>
                      <h3 className="font-medium">{chat.topic}</h3>
                      <p className="text-sm text-gray-500 mt-1">{chat.preview}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {chat.starred && (
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  )}
                  <button
                    onClick={() => handleDeleteChat(chat.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 rounded transition-all"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
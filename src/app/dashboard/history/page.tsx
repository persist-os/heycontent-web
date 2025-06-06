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
import { getApiKey } from '@/app/lib/api-helpers'

export default function HistoryPage() {
  const router = useRouter()
  const { firebaseUser } = useAuth()
  const [chats, setChats] = useState<ChatHistory[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  // Fetch chats
  useEffect(() => {
    const fetchChats = async () => {
      if (!firebaseUser?.uid) return
      try {
        const apiKey = await getApiKey();
        
        const response = await fetch('/api/chat/history', {
          headers: { Authorization: `Bearer ${apiKey}` },
        });
        
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
  }, [firebaseUser?.uid])

  const handleDeleteChat = async (chatId: string) => {
    // Show confirmation dialog
    const isConfirmed = window.confirm(
      'Are you sure you want to delete this conversation? This action cannot be undone.'
    );
    
    if (!isConfirmed) {
      return;
    }

    try {
      const apiKey = await getApiKey();
      
      const response = await fetch(`/api/chat/${chatId}`, { 
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete conversation');
      }
      
      // Remove from local state only after successful deletion
      setChats(chats.filter(chat => chat.id !== chatId));
      console.log('Successfully deleted conversation:', chatId);
    } catch (error) {
      console.error('Failed to delete chat:', error);
      alert('Failed to delete conversation. Please try again.');
    }
  }

  const filteredChats = chats.filter(chat =>
    chat.topic.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Search */}
      <div className="mt-16 mb-6">
        <p className="text-gray-600 mb-2 font-medium text-lg">Your chat history</p>
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
      ) : filteredChats.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-500 mb-2">No conversations found</h3>
          <p className="text-gray-400 mb-4">
            {searchQuery ? 'No conversations match your search.' : 'Start a conversation to see your chat history here.'}
          </p>
          <button
            onClick={() => router.push('/dashboard/chat')}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Start New Chat
          </button>
        </div>
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
                  onClick={() => router.push(`/dashboard/chat?id=${chat.id}`)}
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
                    title="Delete chat"
                    aria-label="Delete chat"
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
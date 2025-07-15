'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/auth-context'
import {
  Search,
  MessageSquare,
  Trash2,
  Star,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { ChatHistory } from '@/app/types/chat'
import { getApiKey } from '@/app/lib/api-helpers'
import { Skeleton } from '@/components/ui/skeleton'
import { DeleteConfirmationDialog } from '@/components/ui/DeleteConfirmationDialog'
import { Button } from '@/components/ui/button'

// Helper function to format relative time
const formatRelativeTime = (timestamp: string | number): string => {
  const now = Date.now();
  const time = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
  const diffMs = now - time;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  // For older chats, show the actual date
  return new Date(time).toLocaleDateString();
};

export default function HistoryPage() {
  const router = useRouter()
  const { firebaseUser } = useAuth()
  const [chats, setChats] = useState<ChatHistory[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false)
  const [chatToDelete, setChatToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeletingAll, setIsDeletingAll] = useState(false)

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
    setIsDeleting(true)
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
    } finally {
      setIsDeleting(false)
      setDeleteDialogOpen(false)
      setChatToDelete(null)
    }
  }

  const handleDeleteAllChats = async () => {
    setIsDeletingAll(true)
    try {
      const apiKey = await getApiKey();
      
      // Delete all chats one by one
      const deletePromises = chats.map(chat => 
        fetch(`/api/chat/${chat.id}`, { 
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
          },
        })
      );
      
      const results = await Promise.allSettled(deletePromises);
      
      // Check for any failures
      const failures = results.filter(result => result.status === 'rejected');
      if (failures.length > 0) {
        console.error('Some deletions failed:', failures);
        alert(`Failed to delete ${failures.length} conversations. Please try again.`);
      } else {
        // All deletions successful
        setChats([]);
        console.log('Successfully deleted all conversations');
      }
    } catch (error) {
      console.error('Failed to delete all chats:', error);
      alert('Failed to delete all conversations. Please try again.');
    } finally {
      setIsDeletingAll(false)
      setDeleteAllDialogOpen(false)
    }
  }

  const openDeleteDialog = (chatId: string) => {
    setChatToDelete(chatId)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (chatToDelete) {
      handleDeleteChat(chatToDelete)
    }
  }

  const cancelDelete = () => {
    setDeleteDialogOpen(false)
    setChatToDelete(null)
  }

  const openDeleteAllDialog = () => {
    setDeleteAllDialogOpen(true)
  }

  const cancelDeleteAll = () => {
    setDeleteAllDialogOpen(false)
  }

  const confirmDeleteAll = () => {
    handleDeleteAllChats()
  }

  const filteredChats = chats.filter(chat =>
    chat.topic.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const totalChats = chats.length
  const displayedChats = filteredChats.length

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      {/* Header with count and actions */}
      <div className="mt-4 sm:mt-8 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-foreground text-xl font-semibold">Chat History</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isLoading ? (
                'Loading conversations...'
              ) : (
                <>
                  {totalChats === 0 ? (
                    'No conversations yet'
                  ) : (
                    <>
                      {searchQuery ? (
                        `${displayedChats} of ${totalChats} conversations`
                      ) : (
                        `${totalChats} conversation${totalChats === 1 ? '' : 's'}`
                      )}
                    </>
                  )}
                </>
              )}
            </p>
          </div>
          {!isLoading && totalChats > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={openDeleteAllDialog}
              disabled={isDeletingAll}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              {isDeletingAll ? 'Deleting All...' : 'Delete All'}
            </Button>
          )}
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Chat List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="group bg-card border border-border/50 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-5 h-5 rounded bg-muted/50" />
                    <div className="w-full space-y-2">
                      <Skeleton className="h-4 w-1/2 bg-muted/50" />
                      <Skeleton className="h-3 w-full bg-muted/50" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredChats.length === 0 ? (
        <div className="text-center py-12">
          <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground/80 mb-2">
            {searchQuery ? 'No conversations found' : 'No conversations yet'}
          </h3>
          <p className="text-muted-foreground/70 mb-6">
            {searchQuery ? 'No conversations match your search.' : 'Start a conversation to see your chat history here.'}
          </p>
          <Button
            onClick={() => router.push('/dashboard/chat')}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Start New Chat
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredChats.map((chat) => (
            <div
              key={chat.id}
              className="group bg-card border border-border/50 rounded-lg p-4 hover:shadow-sm transition-all hover:border-border/70"
            >
              <div className="flex items-start justify-between">
                <div
                  className="flex-1 cursor-pointer"
                  onClick={() => router.push(`/dashboard/chat?id=${chat.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <MessageSquare className="w-5 h-5 text-muted-foreground/70 shrink-0 mt-0.5" />
                    <div className="overflow-hidden flex-1">
                      <div className="flex items-center justify-between gap-3 mb-1">
                        <h3 className="font-medium text-foreground/90 truncate">{chat.topic}</h3>
                        {chat.createdAt && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground/60 shrink-0">
                            <Clock className="w-3 h-3" />
                            <span>{formatRelativeTime(chat.createdAt)}</span>
                          </div>
                        )}
                      </div>
                      {chat.preview && (
                        <p className="text-sm text-muted-foreground/80 line-clamp-1">
                          {chat.preview}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 pl-2">
                  {chat.starred && (
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 shrink-0" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      openDeleteDialog(chat.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 rounded-md transition-all text-destructive/80 hover:text-destructive"
                    title="Delete chat"
                    aria-label="Delete chat"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Single Chat Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Conversation"
        description="Are you sure you want to delete this conversation? This action cannot be undone."
        isLoading={isDeleting}
      />

      {/* Delete All Chats Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteAllDialogOpen}
        onClose={cancelDeleteAll}
        onConfirm={confirmDeleteAll}
        title="Delete All Conversations"
        description={`Are you sure you want to delete all ${totalChats} conversations? This action cannot be undone and will permanently remove all your chat history.`}
        confirmText="Delete All"
        isLoading={isDeletingAll}
      />
    </div>
  )
}
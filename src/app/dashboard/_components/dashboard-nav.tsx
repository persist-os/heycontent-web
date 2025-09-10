'use client'

import React, { memo, useCallback, useMemo, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Logo } from '@/components/ui/logo'
import {
  Users, Settings, FileText, LogOut, BarChart3, Menu, X, MessageSquare, Clock, Handshake, Trash2, Shield, Zap
} from 'lucide-react'
import { ThemeToggle } from '@/components/theme-toggle'
import { useSidebar } from '@/app/context/sidebar-context'
import { getApiKey } from '@/app/lib/api-helpers'
import { DeleteConfirmationDialog } from '@/components/ui/DeleteConfirmationDialog'
import { useAdminAuth } from '@/app/lib/admin-auth'
import { usePlatformConnections } from '@/app/hooks/usePlatformConnections'

const navItems = [
  {
    id: 'living-projects',
    label: 'Living Projects',
    icon: Zap,
    href: '/dashboard/living-projects',
    dataAttr: 'data-living-projects-link',
  },
  {
    id: 'chat',
    label: 'Chat with Content',
    icon: BarChart3,
    href: '/dashboard/chat',
    dataAttr: 'data-chat-link',
  },
  // Timeline - completely hidden
  // {
  //   id: 'timeline',
  //   label: 'Timeline',
  //   icon: Clock,
  //   href: '/dashboard/timeline',
  //   dataAttr: 'data-timeline-link',
  // },
  {
    id: 'content-hub',
    label: 'Content Hub',
    icon: BarChart3,
    href: '/dashboard/content-hub',
    dataAttr: 'data-content-hub-link',
    requiresConnection: 'instagram_or_youtube', // Hidden until Instagram OR YouTube is connected
  },
  {
    id: 'notes',
    label: 'Smart Notes',
    icon: FileText,
    href: '/dashboard/notes',
    dataAttr: 'data-smart-notes-link',
  },
  {
    id: 'partnerships',
    label: 'Partnership Hub',
    icon: Handshake,
    href: '/dashboard/partnerships',
    dataAttr: 'data-partnerships-link',
    requiresConnection: 'gmail', // Hidden until Gmail is connected
  },
]

interface ChatHistory {
  id: string;
  topic: string;
  preview?: string;
  createdAt?: number;
}

// Helper function to format relative time
const formatRelativeTime = (timestamp: number): string => {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  // For older chats, show the actual date
  return new Date(timestamp).toLocaleDateString();
};

export const DashboardNav = memo(function DashboardNav() {
  const pathname = usePathname()
  const router = useRouter()
  const { isExpanded, setIsExpanded } = useSidebar();
  const { canAccessAdmin } = useAdminAuth();
  const [recentChats, setRecentChats] = useState<ChatHistory[]>([])
  const [apiKeyError, setApiKeyError] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Get platform connections for conditional navigation
  const platformConnections = usePlatformConnections();

  // Build nav items based on user permissions and platform connections
  const dynamicNavItems = [
    ...navItems.filter(item => {
      // Filter out items based on connection requirements
      if (item.requiresConnection === 'gmail') {
        return platformConnections.gmail;
      }
      if (item.requiresConnection === 'instagram_or_youtube') {
        return platformConnections.instagram || platformConnections.youtube;
      }
      return true; // Show items without connection requirements
    }),
    // Only show admin to users with admin access
    ...(canAccessAdmin ? [{
      id: 'admin',
      label: 'Admin',
      icon: Shield,
      href: '/admin',
      dataAttr: 'data-admin-link',
    }] : []),
  ];

  // Memoized fetch function to prevent recreation
  const fetchRecentChats = useCallback(async () => {
    try {
      const apiKey = await getApiKey();
      if (!apiKey) {
        // Silently fail if no API key, but track the error
        setApiKeyError(true);
        return;
      }
      
      setApiKeyError(false);
      const response = await fetch('/api/chat/history?limit=5', {
        headers: { 'Authorization': `Bearer ${apiKey}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Chat history API response:', data);
        if (data.conversations) {
          console.log('Recent chats data:', data.conversations);
          setRecentChats(data.conversations);
        }
      }
    } catch (error) {
      console.error('Failed to fetch recent chats:', error);
      setApiKeyError(true);
    }
  }, []);

  // Only fetch when sidebar expands and we don't have an API key error
  useEffect(() => {
    if (isExpanded && !apiKeyError) {
      fetchRecentChats();
    }
  }, [isExpanded, fetchRecentChats, apiKeyError]);

  const handleDeleteChat = useCallback(async (chatId: string) => {
    setIsDeleting(true);
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
      setRecentChats(prev => prev.filter(chat => chat.id !== chatId));
      console.log('Successfully deleted conversation:', chatId);
    } catch (error) {
      console.error('Failed to delete chat:', error);
      // Show error to user - you might want to add a toast notification here
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setChatToDelete(null);
    }
  }, []);

  const openDeleteDialog = useCallback((chatId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setChatToDelete(chatId);
    setDeleteDialogOpen(true);
  }, []);

  const confirmDelete = useCallback(() => {
    if (chatToDelete) {
      handleDeleteChat(chatToDelete);
    }
  }, [chatToDelete, handleDeleteChat]);

  const cancelDelete = useCallback(() => {
    setDeleteDialogOpen(false);
    setChatToDelete(null);
  }, []);

  // Memoize active item calculation
  const isItemActive = useCallback((item: typeof dynamicNavItems[0]) => {
    switch (item.id) {
      case 'living-projects':
        // This tab is active for living projects and project discovery routes
        return pathname.startsWith('/dashboard/living-projects') || pathname.startsWith('/dashboard/project-discovery');
      case 'content-hub':
        // This tab is active for multiple, non-nested routes
        return pathname.startsWith('/dashboard/content') || pathname.startsWith('/dashboard/ai-insights');
      case 'partnerships':
        // This tab is active for all its sub-routes
        return pathname.startsWith('/dashboard/partnerships');
      case 'chat':
      case 'notes':
      case 'admin':
        // These tabs are only active on their exact pages, not sub-pages
        return pathname === item.href;
      default:
        return false;
    }
  }, [pathname]);

  // Memoize the settings link
  const settingsLink = useMemo(() => (
    <Link
      href="/settings"
      onClick={() => setIsExpanded(false)}
      className={`flex items-center w-full h-12 rounded-none transition-all ${
        isExpanded ? 'px-6' : 'justify-center'
      } ${
        pathname === '/settings'
          ? 'bg-muted font-medium'
          : 'hover:bg-muted'
      }`}
    >
      <Settings className="w-6 h-6 text-foreground" />
      {isExpanded && <span className="ml-4 text-sm font-medium">Settings</span>}
    </Link>
  ), [pathname, isExpanded, setIsExpanded]);

  return (
    <div className={`h-screen fixed top-0 left-0 bg-background shadow-lg flex flex-col justify-between transition-all duration-300 z-50 ${isExpanded ? 'w-64 translate-x-0' : 'w-64 -translate-x-full'}`}>
      <div>
        <div className={`flex items-center h-20 ${isExpanded ? 'px-4' : 'justify-center'}`}>
        </div>

        <div className="flex flex-col items-center gap-4 mt-8">
          {dynamicNavItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={() => setIsExpanded(false)}
              className={`flex items-center w-full h-12 rounded-none transition-colors ${
                isExpanded ? 'justify-start px-6' : 'justify-center'
              } ${
                isItemActive(item)
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted/80'
              }`}
              {...{[item.dataAttr]: true}}
            >
              <div className="w-8 h-8 flex-shrink-0 flex items-center justify-center">
                <item.icon className={`w-6 h-6 ${
                  isItemActive(item)
                    ? 'text-white dark:text-black'
                    : 'text-foreground'
                }`} />
              </div>
              {isExpanded && (
                <span className={`ml-4 text-sm font-medium ${isItemActive(item) ? 'dark:text-black' : ''}`}>{isExpanded ? item.label : ''}</span>
              )}
            </Link>
          ))}
        </div>
      </div>
      <div>
        {isExpanded && (
          <div className="px-6 my-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-xs font-semibold text-black dark:text-white uppercase tracking-wider">Recent Chats</h3>
              <Link href="/dashboard/history" onClick={() => setIsExpanded(false)} className="text-xs text-primary hover:underline">
                View All
              </Link>
            </div>
            <div className="space-y-1">
              {recentChats.length > 0 ? (
                recentChats.map((chat) => (
                  <div
                    key={chat.id}
                    className="group flex items-center gap-3 p-2 rounded-md hover:bg-muted"
                  >
                    <Link
                      href={`/dashboard/chat?id=${chat.id}`}
                      onClick={() => setIsExpanded(false)}
                      className="flex items-center gap-3 flex-1 min-w-0"
                      title={chat.topic}
                    >
                      <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="text-sm text-black dark:text-white truncate">{chat.topic}</span>
                        {chat.createdAt ? (
                          <span className="text-xs text-black dark:text-white">
                            {formatRelativeTime(chat.createdAt)}
                          </span>
                        ) : (
                          <span className="text-xs text-red-500">No timestamp</span>
                        )}
                      </div>
                    </Link>
                    <button
                      onClick={(e) => openDeleteDialog(chat.id, e)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-destructive/10 rounded-md transition-all text-destructive/80 hover:text-destructive shrink-0"
                      title="Delete chat"
                      aria-label="Delete chat"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground p-2">No recent chats.</p>
              )}
            </div>
          </div>
        )}
        <div className="flex flex-col items-center gap-2 mb-4">
          {settingsLink}
          <ThemeToggle />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={deleteDialogOpen}
        onClose={cancelDelete}
        onConfirm={confirmDelete}
        title="Delete Conversation"
        description="Are you sure you want to delete this conversation? This action cannot be undone."
        isLoading={isDeleting}
      />
    </div>
  )
});